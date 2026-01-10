import { GT7TelemetryData } from './GT7TelemetryService';

/**
 * LapDetectionService
 * 
 * This service provides sophisticated lap detection for GT7 telemetry data.
 * It uses multiple strategies to determine lap completion:
 * 1. Native game lap counter changes
 * 2. Position-based detection (crossing start/finish line)
 * 3. Distance-based detection (accumulated distance matches track length)
 */
export class LapDetectionService {
  // Track properties
  private trackLength: number = 0;  // Length of track in meters
  private startFinishPosition: { x: number; z: number } | null = null;
  private startFinishThreshold: number = 20; // Distance threshold in meters
  private trackName: string = '';
  
  // Detection state
  private lastPosition: { x: number; z: number } = { x: 0, z: 0 };
  private lastLapNumber: number = 0;
  private accumulatedDistance: number = 0;
  private isFirstLap: boolean = true;
  private lapInProgress: boolean = false;
  
  // Lap statistics
  private currentLapStartTime: number = 0;
  private lastLapTime: number = 0;
  private bestLapTime: number = 0;
  private currentLapData: GT7TelemetryData[] = [];
  
  // Track recognition
  private readonly knownTracks: Record<string, number> = {
    'Tokyo Expressway - Central Outer Loop': 4200,
    'Nürburgring Nordschleife': 20800,
    'Suzuka Circuit': 5800,
    'Monza Circuit': 5793,
    'Circuit de Spa-Francorchamps': 7004,
    'Mount Panorama Motor Racing Circuit': 6213,
    'Autodromo Nazionale Monza': 5793,
    'Circuit de la Sarthe': 13626,
    // Add more tracks as needed
  };
  
  constructor() {}
  
  /**
   * Reset the lap detection service for a new session
   */
  public reset(): void {
    this.trackLength = 0;
    this.startFinishPosition = null;
    this.lastPosition = { x: 0, z: 0 };
    this.lastLapNumber = 0;
    this.accumulatedDistance = 0;
    this.isFirstLap = true;
    this.lapInProgress = false;
    this.currentLapStartTime = 0;
    this.lastLapTime = 0;
    this.bestLapTime = 0;
    this.currentLapData = [];
  }
  
  /**
   * Process new telemetry data to detect laps
   * @param data Current telemetry data packet
   * @returns Object containing lap detection events
   */
  public processTelemetryData(data: GT7TelemetryData): {
    lapCompleted: boolean;
    lapTime?: number;
    isBestLap?: boolean;
    lapNumber?: number;
    lapData?: GT7TelemetryData[];
  } {
    // Store the data for the current lap
    this.currentLapData.push(data);
    
    // If this is the first data packet, initialize with this track
    if (!this.trackName && data.trackName) {
      this.initializeTrack(data.trackName);
    }

    // Track the current position
    const currentPosition = {
      x: data.position?.x || 0,
      z: data.position?.z || 0,
    };
    
    // Calculate distance moved since last data point (if not the first point)
    if (this.lastPosition.x !== 0 || this.lastPosition.z !== 0) {
      const distanceMoved = this.calculateDistance(
        this.lastPosition.x, this.lastPosition.z,
        currentPosition.x, currentPosition.z
      );
      
      // Add to accumulated distance if the car is moving (filter out pits/stationary)
      if (distanceMoved < 100 && data.speed > 5) { // Max 100m between points, min 5km/h
        this.accumulatedDistance += distanceMoved;
      }
    }
    
    // Update last position
    this.lastPosition = {...currentPosition};
    
    // Detect lap using game's native lap counter
    const lapCompletedByGameCounter = this.detectLapByGameCounter(data);
    
    // Detect lap by position (crossing start/finish line)
    const lapCompletedByPosition = this.detectLapByPosition(currentPosition);
    
    // Detect lap by accumulated distance
    const lapCompletedByDistance = this.detectLapByDistance();
    
    // Check if lap completed by any method
    const lapCompleted = lapCompletedByGameCounter || lapCompletedByPosition || lapCompletedByDistance;
    
    if (lapCompleted) {
      // Calculate lap time
      const now = Date.now();
      this.lastLapTime = this.currentLapStartTime > 0 
        ? (now - this.currentLapStartTime) / 1000 
        : 0;
      
      // Check for best lap
      const isBestLap = this.bestLapTime === 0 || (this.lastLapTime < this.bestLapTime && this.lastLapTime > 0);
      if (isBestLap && this.lastLapTime > 0) {
        this.bestLapTime = this.lastLapTime;
      }
      
      // Prepare result
      const result = {
        lapCompleted: true,
        lapTime: this.lastLapTime,
        isBestLap: isBestLap,
        lapNumber: data.currentLap || this.lastLapNumber + 1,
        lapData: [...this.currentLapData]
      };
      
      // Reset for next lap
      this.resetForNextLap(data);
      
      return result;
    }

    // No lap completed
    return {
      lapCompleted: false
    };
  }
  
  /**
   * Initialize track settings based on track name
   */
  private initializeTrack(trackName: string): void {
    this.trackName = trackName;
    
    // Set track length from known tracks
    Object.entries(this.knownTracks).forEach(([knownName, length]) => {
      if (trackName.includes(knownName) || knownName.includes(trackName)) {
        this.trackLength = length;
      }
    });
    
    // If track not in database, use default length
    if (this.trackLength === 0) {
      this.trackLength = 4000; // Default 4km if unknown
    }
    
    console.log(`Track initialized: ${trackName}, length: ${this.trackLength}m`);
  }
  
  /**
   * Detect lap completion based on the game's lap counter
   */
  private detectLapByGameCounter(data: GT7TelemetryData): boolean {
    if (!data.currentLap) return false;
    
    const lapCompleted = data.currentLap > this.lastLapNumber && this.lastLapNumber > 0;
    
    if (data.currentLap !== this.lastLapNumber) {
      this.lastLapNumber = data.currentLap;
      
      // First lap recognition
      if (this.isFirstLap) {
        this.isFirstLap = false;
        return false; // Don't count first lap crossing as completed lap
      }
    }
    
    return lapCompleted;
  }
  
  /**
   * Detect lap completion based on position (crossing start/finish line)
   */
  private detectLapByPosition(currentPosition: { x: number; z: number }): boolean {
    // If we don't have start/finish position yet, try to establish it
    if (!this.startFinishPosition && !this.isFirstLap) {
      // If this is lap 2+ according to game, this position is likely the start/finish line
      this.startFinishPosition = {...currentPosition};
      return false;
    }
    
    // Can't detect by position if we don't know the start/finish line
    if (!this.startFinishPosition) return false;
    
    // Calculate distance to start/finish line
    const distanceToStart = this.calculateDistance(
      currentPosition.x, currentPosition.z,
      this.startFinishPosition.x, this.startFinishPosition.z
    );
    
    // Check if we're crossing the start/finish line
    if (distanceToStart < this.startFinishThreshold && this.lapInProgress) {
      // Need minimum distance traveled to count as a lap
      if (this.accumulatedDistance > this.trackLength * 0.9) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detect lap completion based on accumulated distance
   */
  private detectLapByDistance(): boolean {
    if (this.trackLength <= 0) return false;
    
    // If accumulated distance exceeds track length, a lap is completed
    if (this.accumulatedDistance > this.trackLength && !this.isFirstLap && this.lapInProgress) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Reset detection state for the next lap
   */
  private resetForNextLap(data: GT7TelemetryData): void {
    this.currentLapStartTime = Date.now();
    this.accumulatedDistance = 0;
    this.isFirstLap = false;
    this.lapInProgress = true;
    this.currentLapData = [];
    
    // Store the first position of the lap as the new start/finish if we don't have one yet
    if (!this.startFinishPosition) {
      this.startFinishPosition = {
        x: data.position?.x || 0,
        z: data.position?.z || 0,
      };
    }
  }
  
  /**
   * Calculate distance between two points
   */
  private calculateDistance(x1: number, z1: number, x2: number, z2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
  }
  
  /**
   * Get the current lap time in seconds
   */
  public getCurrentLapTime(): number {
    if (!this.currentLapStartTime) return 0;
    return (Date.now() - this.currentLapStartTime) / 1000;
  }
  
  /**
   * Get the last completed lap time in seconds
   */
  public getLastLapTime(): number {
    return this.lastLapTime;
  }
  
  /**
   * Get the best lap time in seconds
   */
  public getBestLapTime(): number {
    return this.bestLapTime;
  }
  
  /**
   * Get the current lap number
   */
  public getCurrentLapNumber(): number {
    return this.lastLapNumber;
  }
  
  /**
   * Manually set start/finish line position
   */
  public setStartFinishPosition(position: { x: number; z: number }): void {
    this.startFinishPosition = position;
  }
  
  /**
   * Manually set track length
   */
  public setTrackLength(lengthInMeters: number): void {
    this.trackLength = lengthInMeters;
  }
}
