// Type declarations for Convex

declare module 'convex/react' {
  export function useQuery<T = any>(
    query: string,
    args?: Record<string, any>,
    options?: {
      enabled?: boolean;
      initialData?: T;
    }
  ): { data: T | undefined; isLoading: boolean; error: Error | null };

  export function useMutation<T = any>(
    mutation: string
  ): [(args: Record<string, any>) => Promise<T>, { isLoading: boolean; error: Error | null }];

  export function ConvexProvider(props: {
    client: any;
    children: React.ReactNode;
  }): JSX.Element;
}

declare module 'convex/browser' {
  export function ConvexReactClient(options: { address: string }): any;
}

// Telemetry session types
interface TelemetrySession {
  _id: string;
  _creationTime: number;
  userId: string;
  trackName: string;
  carName: string;
  sessionDate: string;
  laps: Lap[];
  bestLapTime: number;
  averageLapTime: number;
  totalSessionTime: number;
}

interface Lap {
  lapNumber: number;
  lapTime: number; // in milliseconds
  sectors: number[];
  tireData: TireData;
  positionData: PositionPoint[];
  valid: boolean;
}

interface TireData {
  tireWear: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  temperature?: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
}

interface PositionPoint {
  x: number;
  y: number;
  speed: number;
  throttle: number;
  brake: number;
}
