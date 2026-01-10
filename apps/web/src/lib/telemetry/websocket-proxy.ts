// WebSocket Proxy Server for GT7 Telemetry
// This runs on the server side to proxy UDP data to WebSocket clients

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import dgram from 'dgram';

export class GT7WebSocketProxy {
  private io: SocketIOServer | null = null;
  private udpSocket: dgram.Socket | null = null;
  private httpServer: any = null;
  private isRunning: boolean = false;
  
  private static readonly GT7_PORT = 33740;
  private static readonly WS_PORT = 8080;
  
  constructor() {}
  
  async start(): Promise<void> {
    try {
      // Create HTTP server for WebSocket
      this.httpServer = createServer();
      
      // Create Socket.IO server
      this.io = new SocketIOServer(this.httpServer, {
        cors: {
          origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });
      
      // Setup WebSocket handlers
      this.setupWebSocketHandlers();
      
      // Setup UDP listener
      await this.setupUDPListener();
      
      // Start HTTP server
      await new Promise<void>((resolve, reject) => {
        this.httpServer.listen(GT7WebSocketProxy.WS_PORT, (error: any) => {
          if (error) {
            reject(error);
          } else {
            console.log(`GT7 WebSocket proxy listening on port ${GT7WebSocketProxy.WS_PORT}`);
            this.isRunning = true;
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.error('Failed to start GT7 WebSocket proxy:', error);
      throw error;
    }
  }
  
  private setupWebSocketHandlers(): void {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      console.log('Client connected to GT7 telemetry stream');
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from GT7 telemetry stream');
      });
      
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      // Send connection status
      socket.emit('status', {
        connected: this.isRunning,
        timestamp: Date.now()
      });
    });
  }
  
  private async setupUDPListener(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.udpSocket = dgram.createSocket('udp4');
      
      this.udpSocket.on('message', (buffer: Buffer, rinfo) => {
        try {
          // Parse GT7 packet
          const telemetryData = this.parseGT7Packet(buffer);
          if (telemetryData && this.io) {
            // Broadcast to all connected WebSocket clients
            this.io.emit('telemetry', telemetryData);
          }
        } catch (error) {
          console.error('Error processing UDP packet:', error);
        }
      });
      
      this.udpSocket.on('error', (error) => {
        console.error('UDP socket error:', error);
        reject(error);
      });
      
      this.udpSocket.bind(GT7WebSocketProxy.GT7_PORT, () => {
        console.log(`Listening for GT7 UDP packets on port ${GT7WebSocketProxy.GT7_PORT}`);
        resolve();
      });
    });
  }
  
  private parseGT7Packet(buffer: Buffer): any {
    // Same parsing logic as in the main telemetry service
    try {
      if (buffer.length < 296) return null;
      
      return {
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
  
  async stop(): Promise<void> {
    this.isRunning = false;
    
    if (this.udpSocket) {
      this.udpSocket.close();
      this.udpSocket = null;
    }
    
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer.close(() => {
          resolve();
        });
      });
      this.httpServer = null;
    }
    
    console.log('GT7 WebSocket proxy stopped');
  }
  
  getStatus(): { running: boolean; clients: number } {
    return {
      running: this.isRunning,
      clients: this.io ? this.io.sockets.sockets.size : 0
    };
  }
}

// Export singleton instance
export const gt7WebSocketProxy = new GT7WebSocketProxy();

export default GT7WebSocketProxy;