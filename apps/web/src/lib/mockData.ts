// Mock data for demo mode
export const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@gt7telemetry.com',
  name: 'Demo Racer',
  avatar: null,
  subscription: {
    plan: 'pro',
    status: 'active',
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  },
  stats: {
    totalSessions: 47,
    totalLaps: 1283,
    totalDistance: 4521.5,
    bestLapTime: 81234, // 1:21.234
    favoriteTrack: 'Spa-Francorchamps',
    favoriteCar: 'Porsche 911 GT3 RS',
  },
};

export const DEMO_SESSIONS = [
  {
    _id: 'session-1',
    userId: DEMO_USER.id,
    trackName: 'Spa-Francorchamps',
    carModel: 'Porsche 911 GT3 RS',
    sessionType: 'practice',
    sessionDate: Date.now() - 2 * 60 * 60 * 1000,
    bestLapTime: 142567, // 2:22.567
    lapCount: 15,
    trackCondition: 'dry',
    isPublic: true,
    likes: 24,
    comments: 5,
  },
  {
    _id: 'session-2',
    userId: DEMO_USER.id,
    trackName: 'Nürburgring Nordschleife',
    carModel: 'BMW M4 GT3',
    sessionType: 'hotlap',
    sessionDate: Date.now() - 24 * 60 * 60 * 1000,
    bestLapTime: 425890, // 7:05.890
    lapCount: 8,
    trackCondition: 'dry',
    isPublic: true,
    likes: 156,
    comments: 23,
  },
  {
    _id: 'session-3',
    userId: DEMO_USER.id,
    trackName: 'Suzuka Circuit',
    carModel: 'Honda NSX GT3',
    sessionType: 'race',
    sessionDate: Date.now() - 3 * 24 * 60 * 60 * 1000,
    bestLapTime: 118432, // 1:58.432
    lapCount: 22,
    trackCondition: 'wet',
    isPublic: true,
    likes: 45,
    comments: 8,
  },
  {
    _id: 'session-4',
    userId: DEMO_USER.id,
    trackName: 'Monza',
    carModel: 'Ferrari 488 GT3',
    sessionType: 'qualifying',
    sessionDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
    bestLapTime: 105234, // 1:45.234
    lapCount: 12,
    trackCondition: 'dry',
    isPublic: true,
    likes: 89,
    comments: 12,
  },
  {
    _id: 'session-5',
    userId: DEMO_USER.id,
    trackName: 'Mount Panorama',
    carModel: 'Aston Martin Vantage GT3',
    sessionType: 'practice',
    sessionDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    bestLapTime: 121567, // 2:01.567
    lapCount: 18,
    trackCondition: 'dry',
    isPublic: true,
    likes: 67,
    comments: 9,
  },
];

export const DEMO_LAPS = [
  { lapNumber: 1, lapTime: 148234, sector1: 42123, sector2: 58234, sector3: 47877, isValid: true },
  { lapNumber: 2, lapTime: 145678, sector1: 41234, sector2: 57123, sector3: 47321, isValid: true },
  { lapNumber: 3, lapTime: 143890, sector1: 40890, sector2: 56500, sector3: 46500, isValid: true },
  { lapNumber: 4, lapTime: 142567, sector1: 40234, sector2: 55890, sector3: 46443, isValid: true, isBest: true },
  { lapNumber: 5, lapTime: 144123, sector1: 40567, sector2: 56789, sector3: 46767, isValid: true },
  { lapNumber: 6, lapTime: 0, sector1: 41234, sector2: 0, sector3: 0, isValid: false }, // Invalid lap
  { lapNumber: 7, lapTime: 143456, sector1: 40678, sector2: 56234, sector3: 46544, isValid: true },
  { lapNumber: 8, lapTime: 142890, sector1: 40345, sector2: 56012, sector3: 46533, isValid: true },
];

export const DEMO_TELEMETRY = generateTelemetryData();

function generateTelemetryData() {
  const data = [];
  const lapLength = 7004; // meters (Spa)
  const points = 500;

  for (let i = 0; i < points; i++) {
    const progress = i / points;
    const distance = progress * lapLength;

    // Simulate varying speed through corners
    const baseSpeed = 200;
    const speedVariation = Math.sin(progress * Math.PI * 8) * 80;
    const speed = Math.max(60, baseSpeed + speedVariation + Math.random() * 10);

    // Simulate throttle and brake
    const isCorner = Math.sin(progress * Math.PI * 8) < -0.3;
    const throttle = isCorner ? Math.random() * 30 : 80 + Math.random() * 20;
    const brake = isCorner ? 60 + Math.random() * 40 : Math.random() * 5;

    // Simulate steering
    const steering = Math.sin(progress * Math.PI * 8) * 0.5 + Math.random() * 0.1;

    // Simulate RPM
    const rpm = 4000 + (speed / 350) * 5000 + Math.random() * 500;

    // Simulate gear
    const gear = Math.min(6, Math.max(1, Math.floor(speed / 50) + 1));

    // Simulate position (rough track shape)
    const posX = Math.sin(progress * Math.PI * 4) * 500 + progress * 2000;
    const posY = Math.cos(progress * Math.PI * 6) * 300 + progress * 1500;
    const posZ = Math.sin(progress * Math.PI * 2) * 50; // elevation

    // Tire temps (FL, FR, RL, RR)
    const baseTireTemp = 85;
    const tireTemps = [
      baseTireTemp + Math.random() * 10 + (isCorner ? 5 : 0),
      baseTireTemp + Math.random() * 10 + (isCorner ? 3 : 0),
      baseTireTemp + Math.random() * 8,
      baseTireTemp + Math.random() * 8,
    ];

    // Fuel
    const fuelCapacity = 110;
    const fuelRemaining = fuelCapacity * (1 - progress * 0.03);

    data.push({
      timestamp: i * 50, // 50ms intervals
      distance,
      speed,
      throttle,
      brake,
      steering,
      rpm,
      gear,
      positionX: posX,
      positionY: posY,
      positionZ: posZ,
      tireTempFL: tireTemps[0],
      tireTempFR: tireTemps[1],
      tireTempRL: tireTemps[2],
      tireTempRR: tireTemps[3],
      fuelRemaining,
      lapProgress: progress,
    });
  }

  return data;
}

export const DEMO_LEADERBOARD = [
  { rank: 1, userName: 'SpeedDemon_X', lapTime: 140234, carModel: 'Porsche 911 GT3 RS', delta: 0 },
  { rank: 2, userName: 'TurboTommy', lapTime: 140567, carModel: 'BMW M4 GT3', delta: 333 },
  { rank: 3, userName: 'RacingQueen', lapTime: 141023, carModel: 'Ferrari 488 GT3', delta: 789 },
  { rank: 4, userName: 'Demo Racer', lapTime: 142567, carModel: 'Porsche 911 GT3 RS', delta: 2333, isCurrentUser: true },
  { rank: 5, userName: 'NightRider99', lapTime: 142890, carModel: 'Lamborghini Huracan GT3', delta: 2656 },
  { rank: 6, userName: 'ApexHunter', lapTime: 143234, carModel: 'McLaren 720S GT3', delta: 3000 },
  { rank: 7, userName: 'DriftKing_JP', lapTime: 143567, carModel: 'Nissan GT-R GT3', delta: 3333 },
  { rank: 8, userName: 'PetrolHead', lapTime: 144012, carModel: 'Audi R8 LMS GT3', delta: 3778 },
  { rank: 9, userName: 'TrackDay_Pro', lapTime: 144345, carModel: 'Mercedes-AMG GT3', delta: 4111 },
  { rank: 10, userName: 'CircuitMaster', lapTime: 144890, carModel: 'Bentley Continental GT3', delta: 4656 },
];

export const DEMO_ANALYSIS = {
  racingLine: {
    optimalPoints: generateOptimalLine(),
    actualPoints: generateActualLine(),
    deviations: [
      { corner: 'La Source', deviation: 0.8, timeLoss: 0.234 },
      { corner: 'Eau Rouge', deviation: 0.3, timeLoss: 0.089 },
      { corner: 'Raidillon', deviation: 0.5, timeLoss: 0.156 },
      { corner: 'Les Combes', deviation: 1.2, timeLoss: 0.345 },
      { corner: 'Stavelot', deviation: 0.6, timeLoss: 0.178 },
      { corner: 'Bus Stop', deviation: 0.4, timeLoss: 0.123 },
    ],
  },
  braking: {
    zones: [
      { name: 'La Source', brakePoint: 150, optimalBrakePoint: 145, peakPressure: 92, timeLoss: 0.15 },
      { name: 'Les Combes', brakePoint: 180, optimalBrakePoint: 175, peakPressure: 88, timeLoss: 0.12 },
      { name: 'Stavelot', brakePoint: 120, optimalBrakePoint: 115, peakPressure: 95, timeLoss: 0.18 },
      { name: 'Bus Stop', brakePoint: 200, optimalBrakePoint: 190, peakPressure: 98, timeLoss: 0.25 },
    ],
  },
  tires: {
    degradation: [
      { lap: 1, fl: 100, fr: 100, rl: 100, rr: 100 },
      { lap: 5, fl: 95, fr: 94, rl: 97, rr: 96 },
      { lap: 10, fl: 88, fr: 86, rl: 92, rr: 91 },
      { lap: 15, fl: 80, fr: 77, rl: 86, rr: 84 },
    ],
    optimalTemp: { min: 80, max: 95 },
    currentAvgTemp: 87,
  },
  fuel: {
    startFuel: 110,
    currentFuel: 85.5,
    consumption: 2.45, // liters per lap
    estimatedLaps: 34,
    recommendation: 'Consider fuel saving mode in last 5 laps',
  },
  corners: [
    { name: 'La Source', rating: 'good', score: 82, avgSpeed: 65, optimalSpeed: 68 },
    { name: 'Eau Rouge/Raidillon', rating: 'excellent', score: 94, avgSpeed: 245, optimalSpeed: 248 },
    { name: 'Les Combes', rating: 'needs_improvement', score: 68, avgSpeed: 142, optimalSpeed: 155 },
    { name: 'Malmedy', rating: 'good', score: 78, avgSpeed: 178, optimalSpeed: 185 },
    { name: 'Rivage', rating: 'good', score: 81, avgSpeed: 95, optimalSpeed: 98 },
    { name: 'Pouhon', rating: 'excellent', score: 91, avgSpeed: 225, optimalSpeed: 228 },
    { name: 'Stavelot', rating: 'needs_improvement', score: 72, avgSpeed: 165, optimalSpeed: 178 },
    { name: 'Bus Stop', rating: 'good', score: 85, avgSpeed: 88, optimalSpeed: 92 },
  ],
  aiInsights: [
    {
      type: 'improvement',
      priority: 'high',
      title: 'Brake Later at Les Combes',
      description: 'You\'re braking 5m too early at Les Combes. Try braking at the 175m board instead of 180m to gain 0.12s per lap.',
      potentialGain: 0.12,
    },
    {
      type: 'improvement',
      priority: 'medium',
      title: 'Carry More Speed Through Stavelot',
      description: 'Your minimum speed through Stavelot is 13 km/h slower than optimal. Focus on a later apex to maintain momentum.',
      potentialGain: 0.18,
    },
    {
      type: 'positive',
      priority: 'low',
      title: 'Excellent Eau Rouge Execution',
      description: 'Your Eau Rouge/Raidillon complex is nearly perfect. You\'re only 3 km/h off optimal speed while maintaining excellent consistency.',
      potentialGain: 0,
    },
    {
      type: 'warning',
      priority: 'medium',
      title: 'Front Tire Wear Higher Than Expected',
      description: 'Front tires are wearing 15% faster than rears. Consider adjusting driving style or setup to balance wear.',
      potentialGain: 0,
    },
  ],
};

function generateOptimalLine() {
  const points = [];
  for (let i = 0; i < 100; i++) {
    const progress = i / 100;
    points.push({
      x: Math.sin(progress * Math.PI * 4) * 400 + progress * 2000,
      y: Math.cos(progress * Math.PI * 6) * 250 + progress * 1500,
    });
  }
  return points;
}

function generateActualLine() {
  const optimal = generateOptimalLine();
  return optimal.map((p, i) => ({
    x: p.x + (Math.random() - 0.5) * 20,
    y: p.y + (Math.random() - 0.5) * 20,
  }));
}

// Demo mode utilities
export const DEMO_MODE_KEY = 'gt7_demo_mode';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
}

export function enableDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    localStorage.setItem('gt7_demo_user', JSON.stringify(DEMO_USER));
  }
}

export function disableDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem('gt7_demo_user');
  }
}

export function getDemoUser() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('gt7_demo_user');
  return stored ? JSON.parse(stored) : DEMO_USER;
}
