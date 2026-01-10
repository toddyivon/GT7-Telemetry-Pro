// GT7 Telemetry Service - Based on gt7dashboard implementation
// https://github.com/snipem/gt7dashboard

import { EventEmitter } from 'events';

export interface GT7TelemetryData {
  // Basic vehicle data
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  
  // Performance metrics
  speed: number; // km/h
  engineRPM: number;
  gear: number;
  throttle: number; // 0-1
  brake: number; // 0-1
  clutch: number; // 0-1
  
  // Lap data
  currentLap: number;
  lastLapTime: number;
  bestLapTime: number;
  currentLapTime: number;
  
  // Tire data
  tires: {
    frontLeft: {
      temperature: number;
      pressure: number;
      wear: number;
    };
    frontRight: {
      temperature: number;
      pressure: number;
      wear: number;
    };
    rearLeft: {
      temperature: number;
      pressure: number;
      wear: number;
    };
    rearRight: {
      temperature: number;
      pressure: number;
      wear: number;
    };
  };
  
  // Engine data
  fuel: number; // Remaining fuel percentage
  fuelCapacity: number;
  oilTemperature: number;
  waterTemperature: number;
  
  // Track data
  trackName: string;
  carName: string;
  
  // Flags and states
  isInRace: boolean;
  isPaused: boolean;
  isOnTrack: boolean;
  
  // Timestamp
  timestamp: number;
}

export interface GT7LapData {
  lapNumber: number;
  lapTime: number;
  isValid: boolean;
  sectors: {
    sector1: number;
    sector2: number;
    sector3: number;
  };
  topSpeed: number;
  averageSpeed: number;
  fuelUsed: number;
  timestamp: number;
}

export class GT7TelemetryService extends EventEmitter {
  private isConnected: boolean = false;
  private isRecording: boolean = false;
  private socket: any = null;
  private currentSession: string | null = null;
  private telemetryData: GT7TelemetryData[] = [];
  private currentLapData: Partial<GT7LapData> = {};
  private lastLapNumber: number = 0;
  
  // GT7 UDP packet structure constants
  private static readonly GT7_PORT = 33740;
  private static readonly PACKET_SIZE = 296; // GT7 packet size
  
  constructor() {
    super();
  }
  
  // Connect to GT7 via UDP
  async connect(ps5IP: string = '192.168.1.100'): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        // Browser environment - use WebSocket proxy
        return this.connectWebSocket();
      } else {
        // Node.js environment - use UDP directly
        return this.connectUDP(ps5IP);
      }
    } catch (error) {
      console.error('Failed to connect to GT7:', error);
      this.emit('error', error);
      return false;
    }
  }
  
  private async connectWebSocket(): Promise<boolean> {
    // For demo purposes, simulate connection without actual WebSocket
    try {
      console.log('Simulating GT7 WebSocket connection...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      this.emit('connected');
      console.log('GT7 WebSocket connection simulated successfully');
      
      // For demo, you can generate mock telemetry data here
      this.startMockTelemetry();
      
      return true;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.emit('error', new Error('WebSocket connection failed'));
      return false;
    }
  }
  
  private startMockTelemetry(): void {
    // Generate mock telemetry data for demo purposes
    if (this.isRecording) {
      const mockData: GT7TelemetryData = {
        position: { x: Math.random() * 1000, y: Math.random() * 100, z: Math.random() * 1000 },
        velocity: { x: Math.random() * 50, y: Math.random() * 10, z: Math.random() * 50 },
        rotation: { pitch: Math.random() * 0.1, yaw: Math.random() * 0.5, roll: Math.random() * 0.1 },
        speed: 120 + Math.random() * 80,
        engineRPM: 4000 + Math.random() * 3000,
        gear: Math.floor(Math.random() * 6) + 1,
        throttle: Math.random(),
        brake: Math.random() * 0.3,
        clutch: Math.random() * 0.1,
        currentLap: 1,
        lastLapTime: 0,
        bestLapTime: 0,
        currentLapTime: Date.now() - (this.currentSession ? Date.now() : 0),
        tires: {
          frontLeft: { temperature: 80 + Math.random() * 20, pressure: 2.0 + Math.random() * 0.5, wear: Math.random() },
          frontRight: { temperature: 80 + Math.random() * 20, pressure: 2.0 + Math.random() * 0.5, wear: Math.random() },
          rearLeft: { temperature: 80 + Math.random() * 20, pressure: 2.0 + Math.random() * 0.5, wear: Math.random() },
          rearRight: { temperature: 80 + Math.random() * 20, pressure: 2.0 + Math.random() * 0.5, wear: Math.random() },
        },
        fuel: 50 + Math.random() * 50,
        fuelCapacity: 100,
        oilTemperature: 90 + Math.random() * 20,
        waterTemperature: 85 + Math.random() * 15,
        trackName: 'Demo Track',
        carName: 'Demo Car',
        isInRace: true,
        isPaused: false,
        isOnTrack: true,
        timestamp: Date.now(),
      };
      
      this.processTelemetryData(mockData);
      
      // Continue generating mock data
      setTimeout(() => this.startMockTelemetry(), 100);
    }
  }
  
  private async connectUDP(_ps5IP: string): Promise<boolean> {
    // UDP is only available in Node.js environment
    if (typeof window !== 'undefined') {
      console.warn('UDP connection not supported in browser environment');
      return false;
    }
    
    try {
      // Dynamic import for Node.js only
      const { createSocket } = await import('dgram');
      const socket = createSocket('udp4');
      
      socket.on('message', (buffer: Buffer) => {
        const data = this.parseGT7Packet(buffer);
        if (data) {
          this.processTelemetryData(data);
        }
      });
      
      socket.on('error', (error: Error) => {
        console.error('UDP socket error:', error);
        this.emit('error', error);
      });
      
      await new Promise<void>((resolve, reject) => {
        socket.bind(GT7TelemetryService.GT7_PORT, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            this.isConnected = true;
            this.socket = socket;
            this.emit('connected');
            console.log(`Listening for GT7 telemetry on port ${GT7TelemetryService.GT7_PORT}`);
            resolve();
          }
        });
      });
      
      return true;
    } catch (error) {
      console.error('UDP connection failed:', error);
      return false;
    }
  }
  
  // Parse GT7 UDP packet - based on gt7dashboard packet structure
  private parseGT7Packet(buffer: Buffer): GT7TelemetryData | null {
    try {
      if (buffer.length < GT7TelemetryService.PACKET_SIZE) {
        return null;
      }
      
      // GT7 packet structure (simplified - based on reverse engineering)
      const data: GT7TelemetryData = {
        position: {
          x: buffer.readFloatLE(4),
          y: buffer.readFloatLE(8),
          z: buffer.readFloatLE(12),
        },
        velocity: {
          x: buffer.readFloatLE(16),
          y: buffer.readFloatLE(20),
          z: buffer.readFloatLE(24),
        },
        rotation: {
          pitch: buffer.readFloatLE(28),
          yaw: buffer.readFloatLE(32),
          roll: buffer.readFloatLE(36),
        },
        speed: buffer.readFloatLE(40) * 3.6, // Convert m/s to km/h
        engineRPM: buffer.readFloatLE(44),
        gear: buffer.readInt8(52),
        throttle: buffer.readFloatLE(56),
        brake: buffer.readFloatLE(60),
        clutch: buffer.readFloatLE(64),
        currentLap: buffer.readInt32LE(68),
        lastLapTime: buffer.readFloatLE(72),
        bestLapTime: buffer.readFloatLE(76),
        currentLapTime: buffer.readFloatLE(80),
        tires: {
          frontLeft: {
            temperature: buffer.readFloatLE(84),
            pressure: buffer.readFloatLE(88),
            wear: buffer.readFloatLE(92),
          },
          frontRight: {
            temperature: buffer.readFloatLE(96),
            pressure: buffer.readFloatLE(100),
            wear: buffer.readFloatLE(104),
          },
          rearLeft: {
            temperature: buffer.readFloatLE(108),
            pressure: buffer.readFloatLE(112),
            wear: buffer.readFloatLE(116),
          },
          rearRight: {
            temperature: buffer.readFloatLE(120),
            pressure: buffer.readFloatLE(124),
            wear: buffer.readFloatLE(128),
          },
        },
        fuel: buffer.readFloatLE(132),
        fuelCapacity: buffer.readFloatLE(136),
        oilTemperature: buffer.readFloatLE(140),
        waterTemperature: buffer.readFloatLE(144),
        trackName: this.parseString(buffer, 148, 64),
        carName: this.parseString(buffer, 212, 64),
        isInRace: buffer.readInt8(276) > 0,
        isPaused: buffer.readInt8(277) > 0,
        isOnTrack: buffer.readInt8(278) > 0,
        timestamp: Date.now(),
      };
      
      return data;
    } catch (error) {
      console.error('Error parsing GT7 packet:', error);
      return null;
    }
  }
  
  private parseString(buffer: Buffer, offset: number, length: number): string {
    const end = buffer.indexOf(0, offset);
    const actualEnd = end === -1 ? offset + length : end;
    return buffer.toString('utf8', offset, actualEnd);
  }
  
  private processTelemetryData(data: GT7TelemetryData): void {
    if (!this.isRecording) return;
    
    // Store telemetry data
    this.telemetryData.push(data);
    
    // Detect new lap
    if (data.currentLap > this.lastLapNumber && this.lastLapNumber > 0) {
      this.finalizeLap();
    }
    this.lastLapNumber = data.currentLap;
    
    // Update current lap data
    this.updateCurrentLapData(data);
    
    // Emit telemetry data to listeners
    this.emit('telemetry', data);
  }
  
  private updateCurrentLapData(data: GT7TelemetryData): void {
    if (!this.currentLapData.topSpeed || data.speed > this.currentLapData.topSpeed) {
      this.currentLapData.topSpeed = data.speed;
    }
    
    // Calculate average speed (simplified)
    if (!this.currentLapData.averageSpeed) {
      this.currentLapData.averageSpeed = data.speed;
    } else {
      this.currentLapData.averageSpeed = (this.currentLapData.averageSpeed + data.speed) / 2;
    }
    
    this.currentLapData.lapNumber = data.currentLap;
    this.currentLapData.timestamp = data.timestamp;
  }
  
  private finalizeLap(): void {
    if (this.currentLapData.lapNumber) {
      const lapData: GT7LapData = {
        lapNumber: this.currentLapData.lapNumber,
        lapTime: this.currentLapData.lapTime || 0,
        isValid: true, // Implement validation logic
        sectors: {
          sector1: 0, // Calculate from telemetry
          sector2: 0,
          sector3: 0,
        },
        topSpeed: this.currentLapData.topSpeed || 0,
        averageSpeed: this.currentLapData.averageSpeed || 0,
        fuelUsed: 0, // Calculate fuel consumption
        timestamp: this.currentLapData.timestamp || Date.now(),
      };
      
      this.emit('lapCompleted', lapData);
      this.currentLapData = {};
    }
  }
  
  // Start recording telemetry
  startRecording(sessionName?: string): void {
    if (!this.isConnected) {
      throw new Error('Not connected to GT7');
    }
    
    this.isRecording = true;
    this.currentSession = sessionName || `session_${Date.now()}`;
    this.telemetryData = [];
    this.currentLapData = {};
    this.lastLapNumber = 0;
    
    this.emit('recordingStarted', this.currentSession);
    console.log('Started recording telemetry session:', this.currentSession);
  }
  
  // Stop recording telemetry
  stopRecording(): GT7TelemetryData[] {
    this.isRecording = false;
    const data = [...this.telemetryData];
    
    // Finalize current lap if exists
    if (this.currentLapData.lapNumber) {
      this.finalizeLap();
    }
    
    this.emit('recordingStopped', {
      sessionName: this.currentSession,
      dataPoints: data.length,
      duration: data.length > 0 ? data[data.length - 1].timestamp - data[0].timestamp : 0,
    });
    
    console.log('Stopped recording telemetry session:', this.currentSession);
    return data;
  }
  
  // Disconnect from GT7
  disconnect(): void {
    if (this.socket) {
      if (typeof this.socket.close === 'function') {
        this.socket.close();
      } else if (typeof this.socket.destroy === 'function') {
        this.socket.destroy();
      }
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isRecording = false;
    this.emit('disconnected');
  }
  
  // Getters
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  getRecordingStatus(): boolean {
    return this.isRecording;
  }
  
  getCurrentSession(): string | null {
    return this.currentSession;
  }
  
  getTelemetryData(): GT7TelemetryData[] {
    return [...this.telemetryData];
  }
}

// Create singleton instance
export const gt7TelemetryService = new GT7TelemetryService();

// Default export
export default GT7TelemetryService;