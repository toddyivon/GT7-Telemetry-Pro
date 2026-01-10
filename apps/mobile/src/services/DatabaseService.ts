import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { GT7Session, GT7TelemetryData, GT7LapData } from './GT7TelemetryService';

// Database configuration
const DATABASE_NAME = 'gt7_telemetry.db';
const SCHEMA_VERSION = 1;

// Batch upload configuration
const BATCH_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

// Upload queue item status
export enum UploadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRY = 'retry',
}

export interface UploadQueueItem {
  id: string;
  sessionId: string;
  status: UploadStatus;
  attempts: number;
  lastAttempt: Date | null;
  error: string | null;
  createdAt: Date;
}

export interface StorageStats {
  totalSessions: number;
  totalTelemetryPoints: number;
  pendingUploads: number;
  failedUploads: number;
  storageUsedMB: number;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private uploadInProgress = false;
  private autoSyncEnabled = true;
  private wifiOnlySync = true;
  private apiEndpoint = '';

  // Initialize database
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await this.createTables();
      await this.loadSettings();
      this.isInitialized = true;

      // Start auto-sync if enabled
      if (this.autoSyncEnabled) {
        this.startAutoSync();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      return false;
    }
  }

  // Create database tables
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Sessions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        track_name TEXT,
        car_name TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        total_laps INTEGER DEFAULT 0,
        best_lap_time INTEGER,
        total_distance REAL DEFAULT 0,
        max_speed REAL DEFAULT 0,
        uploaded INTEGER DEFAULT 0,
        upload_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Telemetry data table - partitioned by session for efficient queries
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS telemetry_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        packet_id INTEGER,
        speed REAL,
        rpm REAL,
        gear INTEGER,
        throttle REAL,
        brake REAL,
        position_x REAL,
        position_y REAL,
        position_z REAL,
        velocity_x REAL,
        velocity_y REAL,
        velocity_z REAL,
        rotation_pitch REAL,
        rotation_yaw REAL,
        rotation_roll REAL,
        tire_temp_fl REAL,
        tire_temp_fr REAL,
        tire_temp_rl REAL,
        tire_temp_rr REAL,
        oil_temp REAL,
        water_temp REAL,
        fuel_level REAL,
        current_lap INTEGER,
        current_lap_time INTEGER,
        best_lap_time INTEGER,
        lap_progress REAL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_session ON telemetry_data(session_id);
      CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_data(timestamp);
    `);

    // Laps table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS laps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        lap_number INTEGER NOT NULL,
        lap_time INTEGER NOT NULL,
        is_best INTEGER DEFAULT 0,
        sector1_time INTEGER,
        sector2_time INTEGER,
        sector3_time INTEGER,
        max_speed REAL,
        avg_speed REAL,
        distance REAL,
        valid INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);

    // Upload queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS upload_queue (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_attempt TEXT,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);

    // Settings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    console.log('Database tables created successfully');
  }

  // Load settings
  private async loadSettings(): Promise<void> {
    try {
      const autoSync = await AsyncStorage.getItem('settings_auto_sync');
      const wifiOnly = await AsyncStorage.getItem('settings_wifi_only');
      const apiUrl = await AsyncStorage.getItem('settings_api_url');

      this.autoSyncEnabled = autoSync !== 'false';
      this.wifiOnlySync = wifiOnly !== 'false';
      this.apiEndpoint = apiUrl || '';
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  // Save session to database
  async saveSession(session: GT7Session): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO sessions
         (id, name, track_name, car_name, start_time, end_time, total_laps,
          best_lap_time, total_distance, max_speed, uploaded, upload_status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          session.id,
          session.name,
          session.trackName || null,
          session.carName || null,
          session.startTime.toISOString(),
          session.endTime?.toISOString() || null,
          session.laps.length,
          session.bestLapTime || null,
          session.totalDistance || 0,
          session.maxSpeed || 0,
          session.uploaded ? 1 : 0,
          session.uploaded ? 'completed' : 'pending',
        ]
      );

      // Add to upload queue if not uploaded
      if (!session.uploaded) {
        await this.addToUploadQueue(session.id);
      }

      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  // Save telemetry data in batches
  async saveTelemetryBatch(sessionId: string, telemetryData: GT7TelemetryData[]): Promise<boolean> {
    if (!this.db || telemetryData.length === 0) return false;

    try {
      // Use transactions for better performance
      await this.db.execAsync('BEGIN TRANSACTION');

      for (const data of telemetryData) {
        await this.db.runAsync(
          `INSERT INTO telemetry_data
           (session_id, timestamp, packet_id, speed, rpm, gear, throttle, brake,
            position_x, position_y, position_z, velocity_x, velocity_y, velocity_z,
            rotation_pitch, rotation_yaw, rotation_roll,
            tire_temp_fl, tire_temp_fr, tire_temp_rl, tire_temp_rr,
            oil_temp, water_temp, fuel_level,
            current_lap, current_lap_time, best_lap_time, lap_progress)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionId,
            data.timestamp.toISOString(),
            data.packetId || 0,
            data.speed,
            data.rpm,
            data.gear,
            data.throttle,
            data.brake,
            data.position.x,
            data.position.y,
            data.position.z,
            data.velocity.x,
            data.velocity.y,
            data.velocity.z,
            data.rotation.pitch,
            data.rotation.yaw,
            data.rotation.roll,
            data.tireTemperature.frontLeft,
            data.tireTemperature.frontRight,
            data.tireTemperature.rearLeft,
            data.tireTemperature.rearRight,
            data.oilTemperature,
            data.waterTemperature,
            data.fuelLevel,
            data.currentLap,
            data.currentLapTime,
            data.bestLapTime,
            data.lapProgress || 0,
          ]
        );
      }

      await this.db.execAsync('COMMIT');
      return true;
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      console.error('Failed to save telemetry batch:', error);
      return false;
    }
  }

  // Save lap data
  async saveLap(sessionId: string, lap: GT7LapData): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.runAsync(
        `INSERT INTO laps
         (session_id, lap_number, lap_time, is_best, sector1_time, sector2_time,
          sector3_time, max_speed, avg_speed, distance, valid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          lap.lapNumber,
          lap.lapTime,
          lap.isBest ? 1 : 0,
          lap.sector1 || null,
          lap.sector2 || null,
          lap.sector3 || null,
          lap.maxSpeed || null,
          lap.avgSpeed || null,
          lap.distance || null,
          lap.valid !== false ? 1 : 0,
        ]
      );

      return true;
    } catch (error) {
      console.error('Failed to save lap:', error);
      return false;
    }
  }

  // Get all sessions
  async getSessions(): Promise<GT7Session[]> {
    if (!this.db) return [];

    try {
      const rows = await this.db.getAllAsync<any>(
        `SELECT * FROM sessions ORDER BY start_time DESC`
      );

      return Promise.all(rows.map(async (row) => {
        const laps = await this.getSessionLaps(row.id);
        return {
          id: row.id,
          name: row.name,
          trackName: row.track_name,
          carName: row.car_name,
          startTime: new Date(row.start_time),
          endTime: row.end_time ? new Date(row.end_time) : undefined,
          laps,
          bestLapTime: row.best_lap_time,
          totalDistance: row.total_distance,
          maxSpeed: row.max_speed,
          uploaded: row.uploaded === 1,
          telemetryData: [], // Load on demand
        };
      }));
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  // Get session by ID
  async getSession(sessionId: string): Promise<GT7Session | null> {
    if (!this.db) return null;

    try {
      const row = await this.db.getFirstAsync<any>(
        `SELECT * FROM sessions WHERE id = ?`,
        [sessionId]
      );

      if (!row) return null;

      const laps = await this.getSessionLaps(sessionId);

      return {
        id: row.id,
        name: row.name,
        trackName: row.track_name,
        carName: row.car_name,
        startTime: new Date(row.start_time),
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        laps,
        bestLapTime: row.best_lap_time,
        totalDistance: row.total_distance,
        maxSpeed: row.max_speed,
        uploaded: row.uploaded === 1,
        telemetryData: [], // Load on demand
      };
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  // Get laps for a session
  async getSessionLaps(sessionId: string): Promise<GT7LapData[]> {
    if (!this.db) return [];

    try {
      const rows = await this.db.getAllAsync<any>(
        `SELECT * FROM laps WHERE session_id = ? ORDER BY lap_number`,
        [sessionId]
      );

      return rows.map(row => ({
        lapNumber: row.lap_number,
        lapTime: row.lap_time,
        isBest: row.is_best === 1,
        sector1: row.sector1_time,
        sector2: row.sector2_time,
        sector3: row.sector3_time,
        maxSpeed: row.max_speed,
        avgSpeed: row.avg_speed,
        distance: row.distance,
        valid: row.valid === 1,
      }));
    } catch (error) {
      console.error('Failed to get session laps:', error);
      return [];
    }
  }

  // Get telemetry data for a session (with pagination)
  async getSessionTelemetry(
    sessionId: string,
    offset: number = 0,
    limit: number = 1000
  ): Promise<GT7TelemetryData[]> {
    if (!this.db) return [];

    try {
      const rows = await this.db.getAllAsync<any>(
        `SELECT * FROM telemetry_data
         WHERE session_id = ?
         ORDER BY timestamp
         LIMIT ? OFFSET ?`,
        [sessionId, limit, offset]
      );

      return rows.map(row => ({
        timestamp: new Date(row.timestamp),
        packetId: row.packet_id,
        speed: row.speed,
        rpm: row.rpm,
        gear: row.gear,
        throttle: row.throttle,
        brake: row.brake,
        position: { x: row.position_x, y: row.position_y, z: row.position_z },
        velocity: { x: row.velocity_x, y: row.velocity_y, z: row.velocity_z },
        rotation: { pitch: row.rotation_pitch, yaw: row.rotation_yaw, roll: row.rotation_roll },
        tireTemperature: {
          frontLeft: row.tire_temp_fl,
          frontRight: row.tire_temp_fr,
          rearLeft: row.tire_temp_rl,
          rearRight: row.tire_temp_rr,
        },
        oilTemperature: row.oil_temp,
        waterTemperature: row.water_temp,
        fuelLevel: row.fuel_level,
        currentLap: row.current_lap,
        currentLapTime: row.current_lap_time,
        bestLapTime: row.best_lap_time,
        lapProgress: row.lap_progress,
      }));
    } catch (error) {
      console.error('Failed to get session telemetry:', error);
      return [];
    }
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.runAsync(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  // Upload Queue Management
  async addToUploadQueue(sessionId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const id = `upload-${sessionId}-${Date.now()}`;
      await this.db.runAsync(
        `INSERT OR IGNORE INTO upload_queue (id, session_id, status, attempts)
         VALUES (?, ?, 'pending', 0)`,
        [id, sessionId]
      );
      return true;
    } catch (error) {
      console.error('Failed to add to upload queue:', error);
      return false;
    }
  }

  async getUploadQueue(): Promise<UploadQueueItem[]> {
    if (!this.db) return [];

    try {
      const rows = await this.db.getAllAsync<any>(
        `SELECT * FROM upload_queue
         WHERE status IN ('pending', 'retry')
         ORDER BY created_at`
      );

      return rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        status: row.status as UploadStatus,
        attempts: row.attempts,
        lastAttempt: row.last_attempt ? new Date(row.last_attempt) : null,
        error: row.error,
        createdAt: new Date(row.created_at),
      }));
    } catch (error) {
      console.error('Failed to get upload queue:', error);
      return [];
    }
  }

  async updateUploadStatus(
    queueId: string,
    status: UploadStatus,
    error?: string
  ): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.runAsync(
        `UPDATE upload_queue
         SET status = ?, attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP, error = ?
         WHERE id = ?`,
        [status, error || null, queueId]
      );

      // If completed, update session
      if (status === UploadStatus.COMPLETED) {
        const item = await this.db.getFirstAsync<any>(
          `SELECT session_id FROM upload_queue WHERE id = ?`,
          [queueId]
        );

        if (item) {
          await this.db.runAsync(
            `UPDATE sessions SET uploaded = 1, upload_status = 'completed' WHERE id = ?`,
            [item.session_id]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update upload status:', error);
      return false;
    }
  }

  // Process upload queue
  async processUploadQueue(): Promise<{ success: number; failed: number }> {
    if (this.uploadInProgress) {
      return { success: 0, failed: 0 };
    }

    if (!this.apiEndpoint) {
      console.log('API endpoint not configured, skipping upload');
      return { success: 0, failed: 0 };
    }

    // Check network connectivity
    if (this.wifiOnlySync) {
      const netInfo = await NetInfo.fetch();
      if (netInfo.type !== 'wifi') {
        console.log('WiFi only sync enabled, skipping upload on mobile data');
        return { success: 0, failed: 0 };
      }
    }

    this.uploadInProgress = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const queue = await this.getUploadQueue();

      for (const item of queue) {
        if (item.attempts >= MAX_RETRY_ATTEMPTS) {
          await this.updateUploadStatus(item.id, UploadStatus.FAILED, 'Max retry attempts exceeded');
          failedCount++;
          continue;
        }

        try {
          await this.updateUploadStatus(item.id, UploadStatus.IN_PROGRESS);

          const success = await this.uploadSessionToApi(item.sessionId);

          if (success) {
            await this.updateUploadStatus(item.id, UploadStatus.COMPLETED);
            successCount++;
          } else {
            await this.updateUploadStatus(item.id, UploadStatus.RETRY, 'Upload failed');
          }
        } catch (error) {
          await this.updateUploadStatus(
            item.id,
            UploadStatus.RETRY,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      this.uploadInProgress = false;
    }

    return { success: successCount, failed: failedCount };
  }

  // Upload session to API
  private async uploadSessionToApi(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    // Get telemetry data in batches
    let offset = 0;
    let hasMore = true;

    try {
      // First, create the session on the server
      const sessionResponse = await fetch(`${this.apiEndpoint}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          name: session.name,
          trackName: session.trackName,
          carName: session.carName,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime?.toISOString(),
          laps: session.laps,
          bestLapTime: session.bestLapTime,
          totalDistance: session.totalDistance,
          maxSpeed: session.maxSpeed,
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error(`Failed to create session: ${sessionResponse.status}`);
      }

      // Upload telemetry in batches
      while (hasMore) {
        const telemetry = await this.getSessionTelemetry(sessionId, offset, BATCH_SIZE);

        if (telemetry.length === 0) {
          hasMore = false;
          continue;
        }

        const telemetryResponse = await fetch(
          `${this.apiEndpoint}/api/sessions/${sessionId}/telemetry`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch: telemetry }),
          }
        );

        if (!telemetryResponse.ok) {
          throw new Error(`Failed to upload telemetry batch: ${telemetryResponse.status}`);
        }

        offset += BATCH_SIZE;
        hasMore = telemetry.length === BATCH_SIZE;
      }

      return true;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  }

  // Auto-sync management
  private syncInterval: NodeJS.Timeout | null = null;

  startAutoSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.processUploadQueue();
    }, intervalMs);

    // Initial sync
    this.processUploadQueue();
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  setAutoSyncEnabled(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    AsyncStorage.setItem('settings_auto_sync', enabled.toString());

    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  setWifiOnlySync(wifiOnly: boolean): void {
    this.wifiOnlySync = wifiOnly;
    AsyncStorage.setItem('settings_wifi_only', wifiOnly.toString());
  }

  setApiEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
    AsyncStorage.setItem('settings_api_url', endpoint);
  }

  // Storage statistics
  async getStorageStats(): Promise<StorageStats> {
    if (!this.db) {
      return {
        totalSessions: 0,
        totalTelemetryPoints: 0,
        pendingUploads: 0,
        failedUploads: 0,
        storageUsedMB: 0,
      };
    }

    try {
      const [sessions, telemetry, pending, failed] = await Promise.all([
        this.db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM sessions`),
        this.db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM telemetry_data`),
        this.db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM upload_queue WHERE status IN ('pending', 'retry')`
        ),
        this.db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM upload_queue WHERE status = 'failed'`
        ),
      ]);

      // Estimate storage size (rough calculation)
      const telemetryPoints = telemetry?.count || 0;
      const estimatedBytes = telemetryPoints * 200; // ~200 bytes per telemetry point
      const storageUsedMB = estimatedBytes / (1024 * 1024);

      return {
        totalSessions: sessions?.count || 0,
        totalTelemetryPoints: telemetryPoints,
        pendingUploads: pending?.count || 0,
        failedUploads: failed?.count || 0,
        storageUsedMB: Math.round(storageUsedMB * 100) / 100,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalSessions: 0,
        totalTelemetryPoints: 0,
        pendingUploads: 0,
        failedUploads: 0,
        storageUsedMB: 0,
      };
    }
  }

  // Clear all data
  async clearAllData(): Promise<boolean> {
    if (!this.db) return false;

    try {
      await this.db.execAsync(`
        DELETE FROM telemetry_data;
        DELETE FROM laps;
        DELETE FROM upload_queue;
        DELETE FROM sessions;
      `);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // Close database
  async close(): Promise<void> {
    this.stopAutoSync();
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
