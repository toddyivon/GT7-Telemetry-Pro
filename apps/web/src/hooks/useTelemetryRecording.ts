import { useState, useCallback, useEffect } from 'react';
import { useMutation } from 'convex/react';

// Try to import the generated API, fallback if not available
let api: any;
let useConvexMutations = true;

try {
  api = require('@/convex/_generated/api').api;
} catch (error) {
  // Fallback for development when Convex is not available
  api = null;
  useConvexMutations = false;
}
import { gt7TelemetryService, GT7TelemetryData, GT7LapData } from '@/lib/telemetry/gt7-telemetry';

// Mock ID type for fallback
type MockId = string;

interface SessionConfig {
  userId: string; // Using string instead of Id for now
  trackName: string;
  carModel: string;
  sessionType: 'practice' | 'qualifying' | 'race' | 'time_trial';
  weatherConditions: string;
  trackCondition: 'dry' | 'wet' | 'damp';
  tyreFront: string;
  tyreRear: string;
  isPublic?: boolean;
}

interface TelemetryRecordingState {
  isConnected: boolean;
  isRecording: boolean;
  currentSession: string | null; // Using string instead of Id for now
  telemetryData: GT7TelemetryData | null;
  completedLaps: GT7LapData[];
  sessionStats: {
    lapCount: number;
    telemetryPointsCount: number;
    bestLapTime: number;
    sessionDuration: number;
  } | null;
}

export function useTelemetryRecording() {
  const [state, setState] = useState<TelemetryRecordingState>({
    isConnected: false,
    isRecording: false,
    currentSession: null,
    telemetryData: null,
    completedLaps: [],
    sessionStats: null,
  });

  const [telemetryBuffer, setTelemetryBuffer] = useState<GT7TelemetryData[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  // Convex mutations - always call hooks but only use them if API is available
  const createSessionMutation = useMutation(api?.telemetry?.createSession || (() => Promise.resolve(null)));
  const completeSessionMutation = useMutation(api?.telemetry?.completeSession || (() => Promise.resolve(null))); 
  const addLapMutation = useMutation(api?.telemetry?.addLap || (() => Promise.resolve(null)));
  const addTelemetryPointsMutation = useMutation(api?.telemetry?.addTelemetryPoints || (() => Promise.resolve(null)));

  // Connect to GT7
  const connect = useCallback(async (ps5IP: string = '192.168.1.184'): Promise<boolean> => {
    try {
      const success = await gt7TelemetryService.connect(ps5IP);
      if (success) {
        setState(prev => ({ ...prev, isConnected: true }));
      }
      return success;
    } catch (error) {
      console.error('Failed to connect to GT7:', error);
      return false;
    }
  }, []);

  // Disconnect from GT7
  const disconnect = useCallback(() => {
    gt7TelemetryService.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      isRecording: false,
      currentSession: null,
      telemetryData: null,
    }));
  }, []);

  // Start recording session
  const startRecording = useCallback(async (config: SessionConfig): Promise<string | null> => {
    if (!state.isConnected) {
      throw new Error('Not connected to GT7');
    }

    try {
      let sessionId: string;

      if (useConvexMutations && api && createSessionMutation) {
        // Create session in database
        sessionId = await (createSessionMutation as any)({
          userId: config.userId,
          trackName: config.trackName,
          carModel: config.carModel,
          sessionType: config.sessionType,
          weatherConditions: config.weatherConditions,
          trackCondition: config.trackCondition,
          tyreFront: config.tyreFront,
          tyreRear: config.tyreRear,
          isPublic: config.isPublic || false,
          metadata: {
            gameVersion: 'GT7',
            platform: 'PS5',
            recordingDevice: 'UDP Telemetry',
            dataQuality: 1.0,
            packetLoss: 0,
          },
        });
      } else {
        // Fallback - create mock session ID
        sessionId = `mock_session_${Date.now()}`;
        console.log('Using mock session ID:', sessionId);
      }

      // Start GT7 telemetry recording
      gt7TelemetryService.startRecording(`session_${sessionId}`);

      const startTime = Date.now();
      setSessionStartTime(startTime);
      setTelemetryBuffer([]);
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        currentSession: sessionId,
        completedLaps: [],
        sessionStats: {
          lapCount: 0,
          telemetryPointsCount: 0,
          bestLapTime: 0,
          sessionDuration: 0,
        },
      }));

      return sessionId;
    } catch (error) {
      console.error('Failed to start recording session:', error);
      return null;
    }
  }, [state.isConnected, createSessionMutation]);

  // Save telemetry data in batches
  const saveTelemetryBatch = useCallback(async (data: GT7TelemetryData[], sessionId: string) => {
    if (data.length === 0 || !useConvexMutations || !api || !addTelemetryPointsMutation) return;

    try {
      const points = data.map(point => ({
        lapNumber: point.currentLap,
        timestamp: point.timestamp,
        gameTimestamp: point.timestamp,
        position: point.position,
        velocity: point.velocity,
        rotation: point.rotation,
        speed: point.speed,
        engineRPM: point.engineRPM,
        gear: point.gear,
        throttle: point.throttle,
        brake: point.brake,
        clutch: point.clutch,
        steering: 0, // Not available in current telemetry
        fuel: point.fuel,
        tyrePressures: {
          frontLeft: point.tires.frontLeft.pressure,
          frontRight: point.tires.frontRight.pressure,
          rearLeft: point.tires.rearLeft.pressure,
          rearRight: point.tires.rearRight.pressure,
        },
        tyreTemperatures: {
          frontLeft: point.tires.frontLeft.temperature,
          frontRight: point.tires.frontRight.temperature,
          rearLeft: point.tires.rearLeft.temperature,
          rearRight: point.tires.rearRight.temperature,
        },
        engineTemperature: 0, // Not available in current telemetry
        oilTemperature: point.oilTemperature,
        waterTemperature: point.waterTemperature,
        flags: [],
        isOnTrack: point.isOnTrack,
        isInPits: !point.isOnTrack,
      }));

      await (addTelemetryPointsMutation as any)({
        sessionId,
        points,
      });
    } catch (error) {
      console.error('Failed to save telemetry batch:', error);
    }
  }, [addTelemetryPointsMutation, useConvexMutations, api]);

  // Stop recording session
  const stopRecording = useCallback(async (): Promise<void> => {
    if (!state.isRecording || !state.currentSession) {
      return;
    }

    try {
      // Stop GT7 telemetry recording
      const telemetryData = gt7TelemetryService.stopRecording();

      // Save any remaining telemetry data
      if (telemetryBuffer.length > 0) {
        await saveTelemetryBatch(telemetryBuffer, state.currentSession);
      }

      // Calculate session statistics
      const laps = state.completedLaps;
      const lapTimes = laps.map(lap => lap.lapTime).filter(time => time > 0);
      
      const sessionStats = {
        lapCount: laps.length,
        bestLapTime: lapTimes.length > 0 ? Math.min(...lapTimes) : 0,
        averageLapTime: lapTimes.length > 0 ? lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length : 0,
        totalSessionTime: Date.now() - sessionStartTime,
        fuelUsed: laps.reduce((sum, lap) => sum + lap.fuelUsed, 0),
        topSpeed: laps.length > 0 ? Math.max(...laps.map(lap => lap.topSpeed)) : 0,
        averageSpeed: laps.length > 0 ? laps.reduce((sum, lap) => sum + lap.averageSpeed, 0) / laps.length : 0,
      };

      // Complete session in database
      if (useConvexMutations && api && completeSessionMutation) {
        await (completeSessionMutation as any)({
          sessionId: state.currentSession,
          ...sessionStats,
        });
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        currentSession: null,
        telemetryData: null,
      }));

      setTelemetryBuffer([]);
    } catch (error) {
      console.error('Failed to stop recording session:', error);
    }
  }, [state.isRecording, state.currentSession, state.completedLaps, telemetryBuffer, sessionStartTime, completeSessionMutation, useConvexMutations, api, saveTelemetryBatch]);

  // Add completed lap to database
  const saveLapData = useCallback(async (lapData: GT7LapData, sessionId: string) => {
    if (!useConvexMutations || !api || !addLapMutation) return;

    try {
      await (addLapMutation as any)({
        sessionId,
        lapNumber: lapData.lapNumber,
        lapTime: lapData.lapTime,
        sector1Time: lapData.sectors.sector1,
        sector2Time: lapData.sectors.sector2,
        sector3Time: lapData.sectors.sector3,
        topSpeed: lapData.topSpeed,
        averageSpeed: lapData.averageSpeed,
        fuelRemaining: 100 - lapData.fuelUsed, // Convert fuel used to remaining
        tyreFrontLeft: 100, // Placeholder - would come from telemetry
        tyreFrontRight: 100,
        tyreRearLeft: 100,
        tyreRearRight: 100,
        isValid: lapData.isValid,
        position: 1, // Placeholder
      });
    } catch (error) {
      console.error('Failed to save lap data:', error);
    }
  }, [addLapMutation, useConvexMutations, api]);

  // Setup event listeners for GT7 telemetry service
  useEffect(() => {
    const handleTelemetry = (data: GT7TelemetryData) => {
      setState(prev => ({ ...prev, telemetryData: data }));
      
      if (state.isRecording && state.currentSession) {
        // Buffer telemetry data
        setTelemetryBuffer(prev => {
          const newBuffer = [...prev, data];
          
          // Save in batches of 50 points
          if (newBuffer.length >= 50) {
            saveTelemetryBatch(newBuffer, state.currentSession!);
            return [];
          }
          
          return newBuffer;
        });

        // Update session stats
        setState(prev => ({
          ...prev,
          sessionStats: prev.sessionStats ? {
            ...prev.sessionStats,
            telemetryPointsCount: prev.sessionStats.telemetryPointsCount + 1,
            sessionDuration: Date.now() - sessionStartTime,
          } : null,
        }));
      }
    };

    const handleLapCompleted = (lapData: GT7LapData) => {
      setState(prev => ({
        ...prev,
        completedLaps: [...prev.completedLaps, lapData],
        sessionStats: prev.sessionStats ? {
          ...prev.sessionStats,
          lapCount: prev.completedLaps.length + 1,
          bestLapTime: prev.sessionStats.bestLapTime === 0 
            ? lapData.lapTime 
            : Math.min(prev.sessionStats.bestLapTime, lapData.lapTime),
        } : null,
      }));

      if (state.isRecording && state.currentSession) {
        saveLapData(lapData, state.currentSession);
      }
    };

    const handleConnected = () => {
      setState(prev => ({ ...prev, isConnected: true }));
    };

    const handleDisconnected = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isRecording: false,
        currentSession: null,
        telemetryData: null,
      }));
    };

    // Add event listeners
    gt7TelemetryService.on('telemetry', handleTelemetry);
    gt7TelemetryService.on('lapCompleted', handleLapCompleted);
    gt7TelemetryService.on('connected', handleConnected);
    gt7TelemetryService.on('disconnected', handleDisconnected);

    // Cleanup
    return () => {
      gt7TelemetryService.off('telemetry', handleTelemetry);
      gt7TelemetryService.off('lapCompleted', handleLapCompleted);
      gt7TelemetryService.off('connected', handleConnected);
      gt7TelemetryService.off('disconnected', handleDisconnected);
    };
  }, [state.isRecording, state.currentSession, sessionStartTime, saveTelemetryBatch, saveLapData]);

  return {
    ...state,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  };
}