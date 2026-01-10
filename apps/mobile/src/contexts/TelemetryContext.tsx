import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback } from 'react';
import { GT7TelemetryData, GT7Session } from '../services/GT7TelemetryService';
import { useTelemetryStore } from '../stores/telemetryStore';

// Connection state for detailed status tracking
export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
  packetCount: number;
  lastPacketTime: Date | null;
  latency: number; // ms
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
}

interface TelemetryContextType {
  // Connection
  isConnected: boolean;
  connectionState: ConnectionState;
  connectionError: string | null;
  connectToPlayStation: () => Promise<boolean>;
  disconnectFromPlayStation: () => void;

  // Recording
  isRecording: boolean;
  currentSession: GT7Session | null;
  startRecording: (sessionName?: string) => void;
  stopRecording: () => Promise<GT7Session | null>;

  // Data
  currentTelemetry: GT7TelemetryData | null;
  sessions: GT7Session[];

  // Session management
  uploadSession: (sessionId: string, endpoint: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  loadSessions: () => Promise<void>;

  // Settings
  playStationIp: string;
  mockMode: boolean;
  setPlayStationIp: (ip: string) => void;
  setMockMode: (mode: boolean) => void;
}

const defaultConnectionState: ConnectionState = {
  status: 'disconnected',
  lastError: null,
  packetCount: 0,
  lastPacketTime: null,
  latency: 0,
  signalStrength: 'none',
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

interface TelemetryContextProviderProps {
  children: ReactNode;
}

export const TelemetryContextProvider: React.FC<TelemetryContextProviderProps> = ({ children }) => {
  // Use our global store
  const {
    isConnected,
    isRecording,
    currentTelemetry,
    currentSession,
    sessions,
    connectionError,
    playStationIp,
    mockMode,
    connectToPlayStation: storeConnect,
    disconnectFromPlayStation: storeDisconnect,
    startRecording: storeStartRecording,
    stopRecording: storeStopRecording,
    loadSessions,
    uploadSession,
    deleteSession,
    setPlayStationIp,
    setMockMode,
  } = useTelemetryStore();

  // Connection state management
  const [connectionState, setConnectionState] = useState<ConnectionState>(defaultConnectionState);
  const [packetCount, setPacketCount] = useState(0);

  // Update connection state based on store state
  useEffect(() => {
    if (isConnected) {
      setConnectionState(prev => ({
        ...prev,
        status: 'connected',
        lastError: null,
      }));
    } else if (connectionError) {
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        lastError: connectionError,
      }));
    } else {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
      }));
    }
  }, [isConnected, connectionError]);

  // Track packets when telemetry updates
  useEffect(() => {
    if (currentTelemetry) {
      setPacketCount(prev => prev + 1);
      setConnectionState(prev => ({
        ...prev,
        packetCount: prev.packetCount + 1,
        lastPacketTime: new Date(),
        signalStrength: calculateSignalStrength(prev.latency),
      }));
    }
  }, [currentTelemetry]);

  // Calculate signal strength based on latency
  const calculateSignalStrength = (latency: number): ConnectionState['signalStrength'] => {
    if (latency < 16) return 'excellent'; // 60fps
    if (latency < 33) return 'good'; // 30fps
    if (latency < 100) return 'fair';
    if (latency < 500) return 'poor';
    return 'none';
  };

  // Enhanced connect function
  const connectToPlayStation = useCallback(async (): Promise<boolean> => {
    setConnectionState(prev => ({
      ...prev,
      status: 'connecting',
      lastError: null,
    }));

    try {
      const success = await storeConnect();

      if (success) {
        setConnectionState(prev => ({
          ...prev,
          status: 'connected',
          packetCount: 0,
          lastPacketTime: new Date(),
        }));
      } else {
        setConnectionState(prev => ({
          ...prev,
          status: 'error',
          lastError: connectionError || 'Failed to connect',
        }));
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        lastError: errorMessage,
      }));
      return false;
    }
  }, [storeConnect, connectionError]);

  // Enhanced disconnect function
  const disconnectFromPlayStation = useCallback(() => {
    storeDisconnect();
    setConnectionState({
      ...defaultConnectionState,
      status: 'disconnected',
    });
    setPacketCount(0);
  }, [storeDisconnect]);

  // Load sessions on first render
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const value: TelemetryContextType = {
    // Connection
    isConnected,
    connectionState,
    connectionError,
    connectToPlayStation,
    disconnectFromPlayStation,

    // Recording
    isRecording,
    currentSession,
    startRecording: storeStartRecording,
    stopRecording: storeStopRecording,

    // Data
    currentTelemetry,
    sessions,

    // Session management
    uploadSession,
    deleteSession,
    loadSessions,

    // Settings
    playStationIp,
    mockMode,
    setPlayStationIp,
    setMockMode,
  };

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetry must be used within a TelemetryContextProvider');
  }
  return context;
};

export default TelemetryContextProvider;
