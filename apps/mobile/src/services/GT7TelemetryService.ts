import { EventEmitter } from 'events';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LapDetectionService } from './LapDetectionService';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';

// Salsa20 implementation for GT7 packet decryption
class Salsa20Cipher {
  private state: Uint32Array;

  constructor(key: Uint8Array, nonce: Uint8Array) {
    this.state = new Uint32Array(16);
    this.initialize(key, nonce);
  }

  private initialize(key: Uint8Array, nonce: Uint8Array): void {
    // Salsa20 constants: "expand 32-byte k"
    const sigma = new Uint8Array([
      101, 120, 112, 97, 110, 100, 32, 51,
      50, 45, 98, 121, 116, 101, 32, 107
    ]);

    this.state[0] = this.littleEndian(sigma, 0);
    this.state[1] = this.littleEndian(key, 0);
    this.state[2] = this.littleEndian(key, 4);
    this.state[3] = this.littleEndian(key, 8);
    this.state[4] = this.littleEndian(key, 12);
    this.state[5] = this.littleEndian(sigma, 4);
    this.state[6] = this.littleEndian(nonce, 0);
    this.state[7] = this.littleEndian(nonce, 4);
    this.state[8] = 0; // Counter
    this.state[9] = 0; // Counter
    this.state[10] = this.littleEndian(sigma, 8);
    this.state[11] = this.littleEndian(key, 16);
    this.state[12] = this.littleEndian(key, 20);
    this.state[13] = this.littleEndian(key, 24);
    this.state[14] = this.littleEndian(key, 28);
    this.state[15] = this.littleEndian(sigma, 12);
  }

  private littleEndian(arr: Uint8Array, offset: number): number {
    return (
      (arr[offset] & 0xff) |
      ((arr[offset + 1] & 0xff) << 8) |
      ((arr[offset + 2] & 0xff) << 16) |
      ((arr[offset + 3] & 0xff) << 24)
    ) >>> 0;
  }

  private quarterRound(x: Uint32Array, a: number, b: number, c: number, d: number): void {
    x[b] ^= this.rotl32(x[a] + x[d], 7);
    x[c] ^= this.rotl32(x[b] + x[a], 9);
    x[d] ^= this.rotl32(x[c] + x[b], 13);
    x[a] ^= this.rotl32(x[d] + x[c], 18);
  }

  private rotl32(v: number, c: number): number {
    return ((v << c) | (v >>> (32 - c))) >>> 0;
  }

  private salsa20Core(output: Uint32Array, input: Uint32Array): void {
    const x = new Uint32Array(input);

    for (let i = 0; i < 10; i++) {
      // Column rounds
      this.quarterRound(x, 0, 4, 8, 12);
      this.quarterRound(x, 5, 9, 13, 1);
      this.quarterRound(x, 10, 14, 2, 6);
      this.quarterRound(x, 15, 3, 7, 11);
      // Row rounds
      this.quarterRound(x, 0, 1, 2, 3);
      this.quarterRound(x, 5, 6, 7, 4);
      this.quarterRound(x, 10, 11, 8, 9);
      this.quarterRound(x, 15, 12, 13, 14);
    }

    for (let i = 0; i < 16; i++) {
      output[i] = (x[i] + input[i]) >>> 0;
    }
  }

  public decrypt(ciphertext: Uint8Array): Uint8Array {
    const output = new Uint8Array(ciphertext.length);
    const block = new Uint32Array(16);
    const blockBytes = new Uint8Array(64);

    for (let i = 0; i < ciphertext.length; i += 64) {
      this.salsa20Core(block, this.state);

      // Convert block to bytes
      for (let j = 0; j < 16; j++) {
        blockBytes[j * 4] = block[j] & 0xff;
        blockBytes[j * 4 + 1] = (block[j] >>> 8) & 0xff;
        blockBytes[j * 4 + 2] = (block[j] >>> 16) & 0xff;
        blockBytes[j * 4 + 3] = (block[j] >>> 24) & 0xff;
      }

      // XOR with ciphertext
      const remaining = Math.min(64, ciphertext.length - i);
      for (let j = 0; j < remaining; j++) {
        output[i + j] = ciphertext[i + j] ^ blockBytes[j];
      }

      // Increment counter
      this.state[8]++;
      if (this.state[8] === 0) {
        this.state[9]++;
      }
    }

    return output;
  }
}

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
  angularVelocity: {
    x: number;
    y: number;
    z: number;
  };

  // Performance metrics
  speed: number; // km/h
  engineRPM: number;
  maxRPM: number;
  idleRPM: number;
  gear: number;
  suggestedGear: number;
  throttle: number; // 0-1
  brake: number; // 0-1
  clutch: number; // 0-1
  steering: number; // -1 to 1

  // Lap data
  currentLap: number;
  totalLaps: number;
  lastLapTime: number; // milliseconds
  bestLapTime: number; // milliseconds
  currentLapTime: number; // milliseconds

  // Tire data
  tires: {
    frontLeft: {
      surfaceTemperature: number;
      slipRatio: number;
      slipAngle: number;
      suspensionHeight: number;
    };
    frontRight: {
      surfaceTemperature: number;
      slipRatio: number;
      slipAngle: number;
      suspensionHeight: number;
    };
    rearLeft: {
      surfaceTemperature: number;
      slipRatio: number;
      slipAngle: number;
      suspensionHeight: number;
    };
    rearRight: {
      surfaceTemperature: number;
      slipRatio: number;
      slipAngle: number;
      suspensionHeight: number;
    };
  };

  // Engine data
  fuel: number; // Remaining fuel percentage
  fuelCapacity: number;
  oilTemperature: number;
  waterTemperature: number;
  oilPressure: number;
  turboBoost: number;

  // Track data
  trackName: string;
  carId: number;
  carName: string;

  // Flags and states
  flags: {
    inRace: boolean;
    paused: boolean;
    loading: boolean;
    inGear: boolean;
    hasTurbo: boolean;
    revLimiterAlert: boolean;
    handBrake: boolean;
    lightsOn: boolean;
    lowBeamOn: boolean;
    highBeamOn: boolean;
    asm: boolean;
    tcs: boolean;
  };

  // Position on track
  racePosition: number;
  totalPositions: number;
  lapDistance: number; // Distance traveled in current lap

  // Timestamp
  timestamp: number;
  packetId: number;
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
  telemetryPoints?: number;
}

export interface GT7Session {
  id: string;
  trackName: string;
  carName: string;
  carId: number;
  startTime: number;
  endTime?: number;
  laps: GT7LapData[];
  bestLap?: GT7LapData;
  telemetryDataSampleRate: number;
  uploaded: boolean;
  syncStatus: 'pending' | 'uploading' | 'uploaded' | 'failed';
  totalDataPoints: number;
  trackCondition?: string;
  weather?: string;
}

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastHeartbeat: number;
  packetCount: number;
  errorCount: number;
  lastError?: string;
}

export class GT7TelemetryService extends EventEmitter {
  private connectionState: ConnectionState = {
    status: 'disconnected',
    lastHeartbeat: 0,
    packetCount: 0,
    errorCount: 0
  };
  private isRecording: boolean = false;
  private socket: any = null;
  private currentSession: GT7Session | null = null;
  private telemetryData: GT7TelemetryData[] = [];
  private currentLapData: Partial<GT7LapData> = {};
  private lastLapNumber: number = 0;
  private playStationIp: string = '';
  private mockMode: boolean = false;
  private lapDetectionService: LapDetectionService;
  private useAutoLapDetection: boolean = true;
  private sampleRate: number = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private userId: string = '';
  private convexUrl: string = '';

  // GT7 UDP packet structure constants
  private static readonly GT7_SEND_PORT = 33739;
  private static readonly GT7_RECEIVE_PORT = 33740;
  private static readonly PACKET_SIZE = 296;
  private static readonly HEARTBEAT_MAGIC = Buffer.from('A');
  private static readonly DECRYPTION_KEY = Buffer.from('Simulator Interface Packet GT7 ver 0.0');

  // Car name database (partial - can be expanded)
  private static readonly CAR_DATABASE: Record<number, string> = {
    1: 'Mazda Roadster S (ND) \'15',
    2: 'Toyota 86 GT \'15',
    3: 'Subaru BRZ S \'15',
    47: 'Porsche 911 GT3 (991) \'17',
    836: 'Porsche 911 GT3 RS (991) \'16',
    // Add more as needed
  };

  constructor() {
    super();
    this.lapDetectionService = new LapDetectionService();
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const [ip, mockMode, autoLapDetection, sampleRate, userId, convexUrl] = await Promise.all([
        AsyncStorage.getItem('@playstation_ip'),
        AsyncStorage.getItem('@mock_mode'),
        AsyncStorage.getItem('@auto_lap_detection'),
        AsyncStorage.getItem('@sample_rate'),
        AsyncStorage.getItem('@user_id'),
        AsyncStorage.getItem('@convex_url')
      ]);

      if (ip) this.playStationIp = ip;
      if (mockMode === 'true') this.mockMode = true;
      if (autoLapDetection === 'false') this.useAutoLapDetection = false;
      if (sampleRate) this.sampleRate = parseInt(sampleRate, 10);
      if (userId) this.userId = userId;
      if (convexUrl) this.convexUrl = convexUrl;
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  public async saveSettings(
    playStationIp: string,
    mockMode: boolean,
    useAutoLapDetection: boolean = true,
    sampleRate: number = 10
  ): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('@playstation_ip', playStationIp),
        AsyncStorage.setItem('@mock_mode', mockMode.toString()),
        AsyncStorage.setItem('@auto_lap_detection', useAutoLapDetection.toString()),
        AsyncStorage.setItem('@sample_rate', sampleRate.toString())
      ]);

      this.playStationIp = playStationIp;
      this.mockMode = mockMode;
      this.useAutoLapDetection = useAutoLapDetection;
      this.sampleRate = sampleRate;
    } catch (e) {
      console.error('Failed to save settings:', e);
      throw new Error('Failed to save settings');
    }
  }

  public async saveAuthSettings(userId: string, convexUrl: string): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('@user_id', userId),
        AsyncStorage.setItem('@convex_url', convexUrl)
      ]);
      this.userId = userId;
      this.convexUrl = convexUrl;
    } catch (e) {
      console.error('Failed to save auth settings:', e);
      throw new Error('Failed to save auth settings');
    }
  }

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return !!(networkState.isConnected && networkState.isInternetReachable);
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  }

  async connect(): Promise<boolean> {
    try {
      if (this.mockMode) {
        return this.connectMock();
      }

      if (!this.playStationIp) {
        throw new Error('PlayStation IP not set. Please configure in settings.');
      }

      const isNetworkConnected = await this.checkNetworkConnectivity();
      if (!isNetworkConnected) {
        throw new Error('Network not connected. Please check your WiFi connection.');
      }

      this.connectionState = {
        status: 'connecting',
        lastHeartbeat: Date.now(),
        packetCount: 0,
        errorCount: 0
      };
      this.emit('connectionStateChange', this.connectionState);

      return new Promise((resolve, reject) => {
        try {
          this.socket = dgram.createSocket({ type: 'udp4' });

          this.socket.once('listening', () => {
            console.log('UDP Socket listening on port', GT7TelemetryService.GT7_RECEIVE_PORT);

            // Send initial heartbeat to start receiving data
            this.sendHeartbeat();

            // Start heartbeat interval (GT7 requires heartbeat every second)
            this.startHeartbeat();

            this.connectionState.status = 'connected';
            this.connectionState.lastHeartbeat = Date.now();
            this.emit('connectionStateChange', this.connectionState);
            this.emit('connected');

            resolve(true);
          });

          this.socket.on('message', (msg: string, rinfo: any) => {
            try {
              // react-native-udp returns base64 encoded string
              const data = Buffer.from(msg, 'base64');

              if (data.length >= GT7TelemetryService.PACKET_SIZE) {
                this.connectionState.lastHeartbeat = Date.now();
                this.connectionState.packetCount++;

                const decrypted = this.decryptPacket(data);
                if (decrypted) {
                  const telemetry = this.parsePacket(decrypted);
                  if (telemetry) {
                    this.processTelemetryData(telemetry);
                  }
                }
              }
            } catch (err) {
              this.connectionState.errorCount++;
              console.error('Error processing packet:', err);
            }
          });

          this.socket.on('error', (err: any) => {
            console.error('UDP Socket error:', err);
            this.connectionState.status = 'error';
            this.connectionState.lastError = err.message;
            this.emit('connectionStateChange', this.connectionState);
            this.emit('error', new Error(`UDP connection error: ${err.message}`));
          });

          this.socket.on('close', () => {
            console.log('UDP Socket closed');
            this.handleDisconnect();
          });

          this.socket.bind(GT7TelemetryService.GT7_RECEIVE_PORT);
        } catch (err: any) {
          this.connectionState.status = 'error';
          this.connectionState.lastError = err.message;
          reject(err);
        }
      });
    } catch (error: any) {
      console.error('Failed to connect to GT7:', error);
      this.connectionState.status = 'error';
      this.connectionState.lastError = error.message;
      this.emit('connectionStateChange', this.connectionState);
      this.emit('error', error);
      return false;
    }
  }

  private sendHeartbeat(): void {
    if (this.socket && this.playStationIp) {
      try {
        const heartbeat = GT7TelemetryService.HEARTBEAT_MAGIC.toString('base64');
        this.socket.send(
          heartbeat,
          0,
          heartbeat.length,
          GT7TelemetryService.GT7_SEND_PORT,
          this.playStationIp,
          (err: any) => {
            if (err) {
              console.error('Failed to send heartbeat:', err);
            }
          }
        );
      } catch (err) {
        console.error('Error sending heartbeat:', err);
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();

      // Check for connection timeout (no packets for 5 seconds)
      const timeSinceLastPacket = Date.now() - this.connectionState.lastHeartbeat;
      if (timeSinceLastPacket > 5000 && this.connectionState.status === 'connected') {
        console.warn('Connection timeout - no packets received for 5 seconds');
        this.emit('warning', 'Connection unstable - no data received');
      }
    }, 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private decryptPacket(data: Buffer): Buffer | null {
    try {
      // Extract IV from packet at offset 0x40
      const oiv = data.subarray(0x40, 0x44);
      const iv1 = oiv.readInt32LE(0);
      const iv2 = iv1 ^ 0xDEADBEAF; // GT7's magic XOR value

      // Construct 8-byte nonce for Salsa20
      const nonce = new Uint8Array(8);
      const nonceView = new DataView(nonce.buffer);
      nonceView.setInt32(0, iv2, true);
      nonceView.setInt32(4, iv1, true);

      // Use first 32 bytes of the key
      const key = new Uint8Array(GT7TelemetryService.DECRYPTION_KEY.subarray(0, 32));

      // Create Salsa20 cipher and decrypt
      const cipher = new Salsa20Cipher(key, nonce);
      const decrypted = cipher.decrypt(new Uint8Array(data));

      const decryptedBuffer = Buffer.from(decrypted);

      // Verify magic number: '0S7G' (0x47375330 in little-endian)
      const magic = decryptedBuffer.readInt32LE(0);
      if (magic !== 0x47375330) {
        console.warn('Invalid magic number after decryption:', magic.toString(16));
        return null;
      }

      return decryptedBuffer;
    } catch (err) {
      console.error('Error decrypting packet:', err);
      return null;
    }
  }

  private parsePacket(data: Buffer): GT7TelemetryData | null {
    try {
      // Parse packet based on GT7 telemetry structure
      const packetId = data.readInt32LE(0x70);

      // Extract flags
      const flagsByte = data.readUInt16LE(0x8E);
      const flags = {
        inRace: (flagsByte & 0x01) !== 0,
        paused: (flagsByte & 0x02) !== 0,
        loading: (flagsByte & 0x04) !== 0,
        inGear: (flagsByte & 0x08) !== 0,
        hasTurbo: (flagsByte & 0x10) !== 0,
        revLimiterAlert: (flagsByte & 0x20) !== 0,
        handBrake: (flagsByte & 0x40) !== 0,
        lightsOn: (flagsByte & 0x80) !== 0,
        lowBeamOn: ((flagsByte >> 8) & 0x01) !== 0,
        highBeamOn: ((flagsByte >> 8) & 0x02) !== 0,
        asm: ((flagsByte >> 8) & 0x04) !== 0,
        tcs: ((flagsByte >> 8) & 0x08) !== 0,
      };

      // Get car ID and name
      const carId = data.readInt32LE(0x124);
      const carName = GT7TelemetryService.CAR_DATABASE[carId] || `Car ID: ${carId}`;

      const telemetry: GT7TelemetryData = {
        position: {
          x: data.readFloatLE(0x04),
          y: data.readFloatLE(0x08),
          z: data.readFloatLE(0x0C)
        },
        velocity: {
          x: data.readFloatLE(0x10),
          y: data.readFloatLE(0x14),
          z: data.readFloatLE(0x18)
        },
        rotation: {
          pitch: data.readFloatLE(0x1C),
          yaw: data.readFloatLE(0x20),
          roll: data.readFloatLE(0x24)
        },
        angularVelocity: {
          x: data.readFloatLE(0x2C),
          y: data.readFloatLE(0x30),
          z: data.readFloatLE(0x34)
        },

        // Speed: m/s to km/h
        speed: data.readFloatLE(0x4C) * 3.6,

        // Engine
        engineRPM: data.readFloatLE(0x3C),
        maxRPM: data.readFloatLE(0xE8),
        idleRPM: data.readFloatLE(0xE4),
        turboBoost: data.readFloatLE(0x50) - 1.0, // Convert to bar relative to atmosphere

        // Transmission
        gear: data.readUInt8(0x90) & 0x0F,
        suggestedGear: (data.readUInt8(0x90) >> 4) & 0x0F,

        // Inputs (0-255 to 0-1)
        throttle: data.readUInt8(0x91) / 255,
        brake: data.readUInt8(0x92) / 255,
        clutch: data.readFloatLE(0xF4),
        steering: 0, // Will calculate from wheel rotation if needed

        // Lap info
        currentLap: data.readInt16LE(0x74),
        totalLaps: data.readInt16LE(0x76),
        lastLapTime: data.readInt32LE(0x7C),
        bestLapTime: data.readInt32LE(0x78),
        currentLapTime: data.readInt32LE(0x80),

        // Tire temperatures
        tires: {
          frontLeft: {
            surfaceTemperature: data.readFloatLE(0x60),
            slipRatio: data.readFloatLE(0xD4),
            slipAngle: 0,
            suspensionHeight: data.readFloatLE(0xC4)
          },
          frontRight: {
            surfaceTemperature: data.readFloatLE(0x64),
            slipRatio: data.readFloatLE(0xD8),
            slipAngle: 0,
            suspensionHeight: data.readFloatLE(0xC8)
          },
          rearLeft: {
            surfaceTemperature: data.readFloatLE(0x68),
            slipRatio: data.readFloatLE(0xDC),
            slipAngle: 0,
            suspensionHeight: data.readFloatLE(0xCC)
          },
          rearRight: {
            surfaceTemperature: data.readFloatLE(0x6C),
            slipRatio: data.readFloatLE(0xE0),
            slipAngle: 0,
            suspensionHeight: data.readFloatLE(0xD0)
          }
        },

        // Engine temps and fuel
        fuel: data.readFloatLE(0x44),
        fuelCapacity: data.readFloatLE(0x48),
        oilTemperature: data.readFloatLE(0x5C),
        waterTemperature: data.readFloatLE(0x58),
        oilPressure: data.readFloatLE(0x54),

        // Track and car info
        trackName: 'Unknown', // Not in packet, detected separately
        carId: carId,
        carName: carName,

        // Flags
        flags: flags,

        // Race position
        racePosition: data.readInt16LE(0x84),
        totalPositions: data.readInt16LE(0x86),
        lapDistance: data.readFloatLE(0x88),

        // Metadata
        timestamp: Date.now(),
        packetId: packetId
      };

      return telemetry;
    } catch (error) {
      console.error('Error parsing packet:', error);
      return null;
    }
  }

  private async connectMock(): Promise<boolean> {
    try {
      console.log('Starting mock GT7 connection...');

      this.connectionState = {
        status: 'connecting',
        lastHeartbeat: Date.now(),
        packetCount: 0,
        errorCount: 0
      };
      this.emit('connectionStateChange', this.connectionState);

      await new Promise(resolve => setTimeout(resolve, 1000));

      this.connectionState.status = 'connected';
      this.emit('connectionStateChange', this.connectionState);
      this.emit('connected');

      console.log('Mock GT7 connection established');

      if (this.isRecording) {
        this.startMockTelemetry();
      }

      return true;
    } catch (error) {
      console.error('Mock connection failed:', error);
      this.connectionState.status = 'error';
      this.emit('connectionStateChange', this.connectionState);
      this.emit('error', new Error('Mock connection failed'));
      return false;
    }
  }

  private mockTelemetryTimer: ReturnType<typeof setTimeout> | null = null;
  private mockLapStartTime: number = 0;
  private mockTrackPosition: number = 0;

  private startMockTelemetry(): void {
    if (!this.isRecording) return;

    this.mockLapStartTime = this.mockLapStartTime || Date.now();
    this.mockTrackPosition = (this.mockTrackPosition + 0.001) % 1;

    const baseSpeed = 150;
    const speedVariation = Math.sin(this.mockTrackPosition * Math.PI * 2) * 50;
    const currentSpeed = baseSpeed + speedVariation + (Math.random() - 0.5) * 10;

    const rpmBase = 5000;
    const rpmVariation = (currentSpeed / 200) * 3000;
    const currentRPM = rpmBase + rpmVariation + (Math.random() - 0.5) * 500;

    const mockData: GT7TelemetryData = {
      position: {
        x: Math.cos(this.mockTrackPosition * Math.PI * 2) * 500,
        y: 0,
        z: Math.sin(this.mockTrackPosition * Math.PI * 2) * 300
      },
      velocity: {
        x: currentSpeed * Math.cos(this.mockTrackPosition * Math.PI * 2) / 3.6,
        y: 0,
        z: currentSpeed * Math.sin(this.mockTrackPosition * Math.PI * 2) / 3.6
      },
      rotation: {
        pitch: Math.random() * 0.02 - 0.01,
        yaw: this.mockTrackPosition * Math.PI * 2,
        roll: Math.random() * 0.01 - 0.005
      },
      angularVelocity: { x: 0, y: 0, z: 0 },
      speed: currentSpeed,
      engineRPM: currentRPM,
      maxRPM: 9000,
      idleRPM: 850,
      gear: Math.min(6, Math.floor(currentSpeed / 35) + 1),
      suggestedGear: Math.min(6, Math.floor(currentSpeed / 35) + 1),
      throttle: 0.5 + Math.sin(this.mockTrackPosition * Math.PI * 4) * 0.3,
      brake: Math.max(0, -Math.sin(this.mockTrackPosition * Math.PI * 4) * 0.5),
      clutch: 0,
      steering: Math.sin(this.mockTrackPosition * Math.PI * 8) * 0.3,
      currentLap: this.lastLapNumber > 0 ? this.lastLapNumber : 1,
      totalLaps: 0,
      lastLapTime: 92500, // 1:32.500
      bestLapTime: 91200, // 1:31.200
      currentLapTime: Date.now() - this.mockLapStartTime,
      tires: {
        frontLeft: { surfaceTemperature: 85 + Math.random() * 5, slipRatio: 0.02, slipAngle: 0, suspensionHeight: 0.1 },
        frontRight: { surfaceTemperature: 87 + Math.random() * 5, slipRatio: 0.02, slipAngle: 0, suspensionHeight: 0.1 },
        rearLeft: { surfaceTemperature: 82 + Math.random() * 5, slipRatio: 0.03, slipAngle: 0, suspensionHeight: 0.1 },
        rearRight: { surfaceTemperature: 84 + Math.random() * 5, slipRatio: 0.03, slipAngle: 0, suspensionHeight: 0.1 }
      },
      fuel: 65 - (this.telemetryData.length * 0.01),
      fuelCapacity: 100,
      oilTemperature: 95 + Math.random() * 5,
      waterTemperature: 88 + Math.random() * 3,
      oilPressure: 5.2 + Math.random() * 0.3,
      turboBoost: 0.8 + Math.random() * 0.2,
      trackName: 'Suzuka Circuit',
      carId: 836,
      carName: 'Porsche 911 GT3 RS (991) \'16',
      flags: {
        inRace: true,
        paused: false,
        loading: false,
        inGear: true,
        hasTurbo: true,
        revLimiterAlert: currentRPM > 8500,
        handBrake: false,
        lightsOn: false,
        lowBeamOn: false,
        highBeamOn: false,
        asm: false,
        tcs: true
      },
      racePosition: 1,
      totalPositions: 1,
      lapDistance: this.mockTrackPosition * 5800,
      timestamp: Date.now(),
      packetId: this.connectionState.packetCount++
    };

    this.processTelemetryData(mockData);

    // Simulate lap completion every ~90 seconds
    if (Date.now() - this.mockLapStartTime > 90000) {
      this.lastLapNumber++;
      this.mockLapStartTime = Date.now();
      mockData.currentLap = this.lastLapNumber;
      mockData.lastLapTime = 90000 + Math.random() * 5000;
    }

    // Continue generating mock data at ~60Hz
    this.mockTelemetryTimer = setTimeout(() => this.startMockTelemetry(), 1000 / 60);
  }

  private stopMockTelemetry(): void {
    if (this.mockTelemetryTimer) {
      clearTimeout(this.mockTelemetryTimer);
      this.mockTelemetryTimer = null;
    }
  }

  private processTelemetryData(data: GT7TelemetryData): void {
    if (!this.isRecording) return;

    // Sample rate limiting
    const lastDataPoint = this.telemetryData[this.telemetryData.length - 1];
    const shouldStore = !lastDataPoint ||
      (data.timestamp - lastDataPoint.timestamp) >= (1000 / this.sampleRate);

    if (shouldStore) {
      this.telemetryData.push(data);
    }

    // Lap detection
    if (this.useAutoLapDetection) {
      const lapResult = this.lapDetectionService.processTelemetryData(data);
      if (lapResult.lapCompleted) {
        this.finalizeLap(lapResult.lapTime || data.lastLapTime, lapResult.lapData);
      }
    } else if (data.currentLap > this.lastLapNumber && this.lastLapNumber > 0) {
      this.finalizeLap(data.lastLapTime);
    }

    this.lastLapNumber = data.currentLap;
    this.updateCurrentLapData(data);
    this.emit('telemetry', data);
  }

  private updateCurrentLapData(data: GT7TelemetryData): void {
    if (!this.currentLapData.topSpeed || data.speed > this.currentLapData.topSpeed) {
      this.currentLapData.topSpeed = data.speed;
    }

    const count = this.currentLapData.telemetryPoints || 0;
    const currentAvg = this.currentLapData.averageSpeed || 0;
    this.currentLapData.averageSpeed = (currentAvg * count + data.speed) / (count + 1);
    this.currentLapData.telemetryPoints = count + 1;
    this.currentLapData.lapNumber = data.currentLap;
    this.currentLapData.timestamp = data.timestamp;
  }

  private finalizeLap(lapTime: number, telemetryData?: GT7TelemetryData[]): void {
    if (!this.currentLapData.lapNumber) return;

    const lapData: GT7LapData = {
      lapNumber: this.currentLapData.lapNumber,
      lapTime: lapTime,
      isValid: true,
      sectors: {
        sector1: lapTime / 3,
        sector2: lapTime / 3,
        sector3: lapTime / 3,
      },
      topSpeed: this.currentLapData.topSpeed || 0,
      averageSpeed: this.currentLapData.averageSpeed || 0,
      fuelUsed: this.calculateFuelUsage(),
      timestamp: this.currentLapData.timestamp || Date.now(),
      telemetryPoints: this.currentLapData.telemetryPoints || 0
    };

    if (this.currentSession) {
      this.currentSession.laps.push(lapData);

      if (!this.currentSession.bestLap || lapData.lapTime < this.currentSession.bestLap.lapTime) {
        this.currentSession.bestLap = lapData;
      }

      this.saveCurrentSession();
    }

    this.emit('lapCompleted', lapData);
    this.currentLapData = {};
  }

  private async saveCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.currentSession.totalDataPoints = this.telemetryData.length;

      await AsyncStorage.setItem(
        `@session_${this.currentSession.id}`,
        JSON.stringify(this.currentSession)
      );

      // Also save telemetry data in chunks for large datasets
      const chunkSize = 1000;
      const chunks = Math.ceil(this.telemetryData.length / chunkSize);

      for (let i = 0; i < chunks; i++) {
        const chunk = this.telemetryData.slice(i * chunkSize, (i + 1) * chunkSize);
        await AsyncStorage.setItem(
          `@telemetry_${this.currentSession.id}_${i}`,
          JSON.stringify(chunk)
        );
      }

      await AsyncStorage.setItem(
        `@telemetry_${this.currentSession.id}_chunks`,
        chunks.toString()
      );
    } catch (e) {
      console.error('Failed to save session:', e);
      this.emit('error', new Error('Failed to save session data'));
    }
  }

  startRecording(sessionName?: string): void {
    if (this.connectionState.status !== 'connected') {
      throw new Error('Not connected to GT7');
    }

    const sessionId = `session_${Date.now()}`;
    this.isRecording = true;
    this.currentSession = {
      id: sessionId,
      trackName: sessionName || 'Unknown Track',
      carName: 'Unknown Car',
      carId: 0,
      startTime: Date.now(),
      laps: [],
      telemetryDataSampleRate: this.sampleRate,
      uploaded: false,
      syncStatus: 'pending',
      totalDataPoints: 0
    };

    this.telemetryData = [];
    this.currentLapData = {};
    this.lastLapNumber = 0;
    this.mockLapStartTime = 0;
    this.mockTrackPosition = 0;
    this.lapDetectionService.reset();

    this.emit('recordingStarted', this.currentSession);
    console.log('Started recording telemetry session:', sessionId);

    if (this.mockMode) {
      this.startMockTelemetry();
    }
  }

  async stopRecording(): Promise<GT7Session | null> {
    if (!this.isRecording || !this.currentSession) {
      return null;
    }

    this.isRecording = false;
    this.stopMockTelemetry();

    this.currentSession.endTime = Date.now();

    if (this.currentLapData.lapNumber) {
      const estimatedLapTime = (this.currentSession.endTime - this.currentSession.startTime) / 1000 % 120;
      this.finalizeLap(estimatedLapTime);
    }

    await this.saveCurrentSession();

    const sessionResult = { ...this.currentSession };

    this.emit('recordingStopped', {
      session: sessionResult,
      dataPoints: this.telemetryData.length,
      duration: (sessionResult.endTime || Date.now()) - sessionResult.startTime,
    });

    console.log('Stopped recording telemetry session:', this.currentSession.id);
    return sessionResult;
  }

  async uploadSession(sessionId: string, apiEndpoint: string): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.getItem(`@session_${sessionId}`);
      if (!sessionData) {
        throw new Error('Session not found');
      }

      const session: GT7Session = JSON.parse(sessionData);

      // Update sync status
      session.syncStatus = 'uploading';
      await AsyncStorage.setItem(`@session_${sessionId}`, JSON.stringify(session));
      this.emit('syncStatusChange', { sessionId, status: 'uploading' });

      // Load telemetry data chunks
      const chunksStr = await AsyncStorage.getItem(`@telemetry_${sessionId}_chunks`);
      const chunks = chunksStr ? parseInt(chunksStr, 10) : 0;

      let allTelemetryData: GT7TelemetryData[] = [];
      for (let i = 0; i < chunks; i++) {
        const chunkData = await AsyncStorage.getItem(`@telemetry_${sessionId}_${i}`);
        if (chunkData) {
          allTelemetryData = allTelemetryData.concat(JSON.parse(chunkData));
        }
      }

      // Prepare upload payload
      const uploadPayload = {
        session: {
          localId: session.id,
          trackName: session.trackName,
          carModel: session.carName,
          carId: session.carId,
          sessionType: 'practice',
          startTime: session.startTime,
          endTime: session.endTime,
          lapCount: session.laps.length,
          bestLapTime: session.bestLap?.lapTime || 0,
          totalDataPoints: allTelemetryData.length,
          sampleRate: session.telemetryDataSampleRate,
          metadata: {
            platform: 'PS5',
            recordingDevice: 'Mobile',
            gameVersion: 'GT7',
            appVersion: '1.0.0'
          }
        },
        laps: session.laps.map(lap => ({
          lapNumber: lap.lapNumber,
          lapTime: lap.lapTime,
          sector1Time: lap.sectors.sector1,
          sector2Time: lap.sectors.sector2,
          sector3Time: lap.sectors.sector3,
          topSpeed: lap.topSpeed,
          averageSpeed: lap.averageSpeed,
          fuelUsed: lap.fuelUsed,
          isValid: lap.isValid,
          telemetryPoints: lap.telemetryPoints
        })),
        telemetryPointsCount: allTelemetryData.length
      };

      // Upload session metadata first
      const response = await fetch(`${apiEndpoint}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userId}`
        },
        body: JSON.stringify(uploadPayload)
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      const remoteSessionId = result.sessionId;

      // Upload telemetry data in batches
      const batchSize = 500;
      for (let i = 0; i < allTelemetryData.length; i += batchSize) {
        const batch = allTelemetryData.slice(i, i + batchSize);

        const telemetryPoints = batch.map(p => ({
          timestamp: p.timestamp,
          packetId: p.packetId,
          position: p.position,
          velocity: p.velocity,
          rotation: p.rotation,
          speed: p.speed,
          engineRPM: p.engineRPM,
          gear: p.gear,
          throttle: p.throttle,
          brake: p.brake,
          steering: p.steering,
          fuel: p.fuel,
          tireTemps: {
            fl: p.tires.frontLeft.surfaceTemperature,
            fr: p.tires.frontRight.surfaceTemperature,
            rl: p.tires.rearLeft.surfaceTemperature,
            rr: p.tires.rearRight.surfaceTemperature
          },
          lapNumber: p.currentLap,
          lapDistance: p.lapDistance,
          flags: p.flags
        }));

        await fetch(`${apiEndpoint}/api/sessions/${remoteSessionId}/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.userId}`
          },
          body: JSON.stringify({ points: telemetryPoints })
        });

        // Emit progress
        const progress = Math.min(100, Math.round(((i + batchSize) / allTelemetryData.length) * 100));
        this.emit('uploadProgress', { sessionId, progress });
      }

      // Mark as uploaded
      session.uploaded = true;
      session.syncStatus = 'uploaded';
      await AsyncStorage.setItem(`@session_${sessionId}`, JSON.stringify(session));

      this.emit('sessionUploaded', sessionId);
      this.emit('syncStatusChange', { sessionId, status: 'uploaded' });

      return true;
    } catch (e) {
      console.error('Failed to upload session:', e);

      // Update sync status to failed
      try {
        const sessionData = await AsyncStorage.getItem(`@session_${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.syncStatus = 'failed';
          await AsyncStorage.setItem(`@session_${sessionId}`, JSON.stringify(session));
        }
      } catch {}

      this.emit('syncStatusChange', { sessionId, status: 'failed' });
      this.emit('error', new Error(`Failed to upload session: ${e instanceof Error ? e.message : 'Unknown error'}`));
      return false;
    }
  }

  async getSavedSessions(): Promise<GT7Session[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter((key: string) => key.startsWith('@session_'));

      const sessions = await Promise.all(
        sessionKeys.map(async (key: string) => {
          const data = await AsyncStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        })
      );

      return sessions.filter(Boolean) as GT7Session[];
    } catch (e) {
      console.error('Failed to get saved sessions:', e);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Delete session metadata
      await AsyncStorage.removeItem(`@session_${sessionId}`);

      // Delete telemetry chunks
      const chunksStr = await AsyncStorage.getItem(`@telemetry_${sessionId}_chunks`);
      if (chunksStr) {
        const chunks = parseInt(chunksStr, 10);
        for (let i = 0; i < chunks; i++) {
          await AsyncStorage.removeItem(`@telemetry_${sessionId}_${i}`);
        }
        await AsyncStorage.removeItem(`@telemetry_${sessionId}_chunks`);
      }

      this.emit('sessionDeleted', sessionId);
      return true;
    } catch (e) {
      console.error('Failed to delete session:', e);
      return false;
    }
  }

  private handleDisconnect(): void {
    this.stopHeartbeat();
    this.stopMockTelemetry();

    if (this.isRecording) {
      this.stopRecording();
    }

    this.connectionState.status = 'disconnected';
    this.emit('connectionStateChange', this.connectionState);
    this.emit('disconnected');
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.stopMockTelemetry();

    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('Error closing socket:', e);
      }
      this.socket = null;
    }

    this.connectionState = {
      status: 'disconnected',
      lastHeartbeat: 0,
      packetCount: 0,
      errorCount: 0
    };

    this.emit('connectionStateChange', this.connectionState);
    this.emit('disconnected');
  }

  // Getters
  getConnectionStatus(): boolean {
    return this.connectionState.status === 'connected';
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  getCurrentSession(): GT7Session | null {
    return this.currentSession;
  }

  private calculateFuelUsage(): number {
    if (this.telemetryData.length < 2) return 0;

    const firstData = this.telemetryData[0];
    const lastData = this.telemetryData[this.telemetryData.length - 1];

    if (!firstData.fuel || !lastData.fuel) return 0;

    return firstData.fuel - lastData.fuel;
  }

  getCurrentLapTime(): number {
    return this.lapDetectionService.getCurrentLapTime();
  }

  getBestLapTime(): number {
    return this.lapDetectionService.getBestLapTime();
  }

  getPlayStationIp(): string {
    return this.playStationIp;
  }

  getMockMode(): boolean {
    return this.mockMode;
  }
}

// Create singleton instance
export const gt7TelemetryService = new GT7TelemetryService();

export default GT7TelemetryService;
