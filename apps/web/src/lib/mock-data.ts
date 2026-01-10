export interface MockTelemetrySession {
  _id: string;
  userId: string;
  trackName: string;
  carModel: string;
  sessionDate: string;
  sessionType: 'practice' | 'qualifying' | 'race';
  lapCount: number;
  bestLapTime: number;
  averageLapTime: number;
  totalSessionTime: number;
  weatherConditions: string;
  trackCondition: 'dry' | 'wet' | 'damp';
  tyreFront: string;
  tyreRear: string;
  fuelUsed: number;
  topSpeed: number;
  averageSpeed: number;
}

export interface MockLapData {
  _id: string;
  sessionId: string;
  lapNumber: number;
  lapTime: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  topSpeed: number;
  averageSpeed: number;
  fuelRemaining: number;
  tyreFrontLeft: number;
  tyreFrontRight: number;
  tyreRearLeft: number;
  tyreRearRight: number;
  isValid: boolean;
  position: number;
}

export interface MockAnalysisResult {
  _id: string;
  sessionId: string;
  analysisType: 'racing_line' | 'tire_performance' | 'lap_comparison';
  result: any;
  createdAt: string;
}

export const mockTelemetrySessions: MockTelemetrySession[] = [
  {
    _id: 'session_1',
    userId: 'user_1',
    trackName: 'Suzuka Circuit',
    carModel: 'BMW M4 GT3',
    sessionDate: '2024-01-15T14:30:00Z',
    sessionType: 'race',
    lapCount: 25,
    bestLapTime: 125.42,
    averageLapTime: 127.8,
    totalSessionTime: 3245,
    weatherConditions: 'Clear',
    trackCondition: 'dry',
    tyreFront: 'Racing Hard',
    tyreRear: 'Racing Hard',
    fuelUsed: 45.2,
    topSpeed: 287.5,
    averageSpeed: 185.3
  },
  {
    _id: 'session_2',
    userId: 'user_1',
    trackName: 'Brands Hatch GP',
    carModel: 'Porsche 911 GT3 RS',
    sessionDate: '2024-01-14T16:45:00Z',
    sessionType: 'qualifying',
    lapCount: 12,
    bestLapTime: 78.95,
    averageLapTime: 80.2,
    totalSessionTime: 1020,
    weatherConditions: 'Partly Cloudy',
    trackCondition: 'dry',
    tyreFront: 'Racing Soft',
    tyreRear: 'Racing Soft',
    fuelUsed: 18.7,
    topSpeed: 245.8,
    averageSpeed: 167.4
  },
  {
    _id: 'session_3',
    userId: 'user_1',
    trackName: 'Nürburgring GP',
    carModel: 'Mercedes-AMG GT3',
    sessionDate: '2024-01-13T11:20:00Z',
    sessionType: 'practice',
    lapCount: 18,
    bestLapTime: 102.34,
    averageLapTime: 104.7,
    totalSessionTime: 1890,
    weatherConditions: 'Overcast',
    trackCondition: 'damp',
    tyreFront: 'Racing Medium',
    tyreRear: 'Racing Medium',
    fuelUsed: 32.1,
    topSpeed: 278.2,
    averageSpeed: 178.9
  }
];

export const mockLapData: MockLapData[] = [
  {
    _id: 'lap_1_1',
    sessionId: 'session_1',
    lapNumber: 1,
    lapTime: 130.25,
    sector1Time: 42.1,
    sector2Time: 45.3,
    sector3Time: 42.85,
    topSpeed: 285.2,
    averageSpeed: 182.4,
    fuelRemaining: 98.5,
    tyreFrontLeft: 100,
    tyreFrontRight: 100,
    tyreRearLeft: 100,
    tyreRearRight: 100,
    isValid: true,
    position: 1
  },
  {
    _id: 'lap_1_2',
    sessionId: 'session_1',
    lapNumber: 2,
    lapTime: 127.89,
    sector1Time: 41.5,
    sector2Time: 44.2,
    sector3Time: 42.19,
    topSpeed: 287.1,
    averageSpeed: 184.7,
    fuelRemaining: 96.8,
    tyreFrontLeft: 98,
    tyreFrontRight: 98,
    tyreRearLeft: 97,
    tyreRearRight: 97,
    isValid: true,
    position: 1
  },
  {
    _id: 'lap_1_3',
    sessionId: 'session_1',
    lapNumber: 3,
    lapTime: 125.42,
    sector1Time: 40.8,
    sector2Time: 43.1,
    sector3Time: 41.52,
    topSpeed: 287.5,
    averageSpeed: 186.2,
    fuelRemaining: 95.1,
    tyreFrontLeft: 96,
    tyreFrontRight: 96,
    tyreRearLeft: 95,
    tyreRearRight: 95,
    isValid: true,
    position: 1
  }
];

export const mockAnalysisResults: MockAnalysisResult[] = [
  {
    _id: 'analysis_1',
    sessionId: 'session_1',
    analysisType: 'racing_line',
    result: {
      optimalLine: [
        { x: 100, y: 200, speed: 120, throttle: 0.8 },
        { x: 150, y: 180, speed: 115, throttle: 0.6 },
        { x: 200, y: 160, speed: 110, throttle: 0.4 },
        { x: 250, y: 140, speed: 125, throttle: 0.9 }
      ],
      actualLine: [
        { x: 105, y: 205, speed: 118, throttle: 0.7 },
        { x: 155, y: 185, speed: 112, throttle: 0.5 },
        { x: 205, y: 165, speed: 108, throttle: 0.3 },
        { x: 255, y: 145, speed: 122, throttle: 0.8 }
      ],
      timeGain: 0.85,
      efficiency: 92.3
    },
    createdAt: '2024-01-15T15:00:00Z'
  },
  {
    _id: 'analysis_2',
    sessionId: 'session_1',
    analysisType: 'tire_performance',
    result: {
      degradation: {
        frontLeft: 15.2,
        frontRight: 16.1,
        rearLeft: 12.8,
        rearRight: 13.4
      },
      optimalPressure: {
        frontLeft: 27.5,
        frontRight: 27.8,
        rearLeft: 26.2,
        rearRight: 26.5
      },
      temperatureRange: {
        optimal: [85, 95],
        actual: [88, 102]
      },
      recommendations: [
        'Reduce rear tire pressure by 0.5 PSI',
        'Consider harder compound for longer stints',
        'Monitor front tire temperatures in high-speed corners'
      ]
    },
    createdAt: '2024-01-15T15:05:00Z'
  }
];

export const mockPerformanceMetrics = {
  totalSessions: mockTelemetrySessions.length,
  totalLaps: mockLapData.length,
  averageLapTime: mockLapData.reduce((sum, lap) => sum + lap.lapTime, 0) / mockLapData.length,
  bestLapTime: Math.min(...mockLapData.map(lap => lap.lapTime)),
  improvementTrend: '+2.3%',
  consistencyScore: 87.5
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(3);
  return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};