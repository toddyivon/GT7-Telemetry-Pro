import { create } from 'zustand';
import { GT7TelemetryData, GT7LapData, GT7Session, gt7TelemetryService } from '../services/GT7TelemetryService';

interface TelemetryState {
  // Connection state
  isConnected: boolean;
  isRecording: boolean;
  playStationIp: string;
  mockMode: boolean;
  connectionError: string | null;
  
  // Current data
  currentTelemetry: GT7TelemetryData | null;
  currentSession: GT7Session | null;
  
  // Session data
  sessions: GT7Session[];
  
  // Actions
  setPlayStationIp: (ip: string) => void;
  setMockMode: (mode: boolean) => void;
  connectToPlayStation: () => Promise<boolean>;
  disconnectFromPlayStation: () => void;
  startRecording: (sessionName?: string) => void;
  stopRecording: () => Promise<GT7Session | null>;
  loadSessions: () => Promise<void>;
  uploadSession: (sessionId: string, endpoint: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  // Initial state
  isConnected: false,
  isRecording: false,
  playStationIp: '192.168.1.100',
  mockMode: true, // Default to mock mode for demo purposes
  connectionError: null,
  currentTelemetry: null,
  currentSession: null,
  sessions: [],
  
  // Actions
  setPlayStationIp: (ip: string) => {
    set({ playStationIp: ip });
    gt7TelemetryService.saveSettings(ip, get().mockMode);
  },
  
  setMockMode: (mode: boolean) => {
    set({ mockMode: mode });
    gt7TelemetryService.saveSettings(get().playStationIp, mode);
  },
  
  connectToPlayStation: async () => {
    try {
      set({ connectionError: null });
      const success = await gt7TelemetryService.connect();
      
      if (success) {
        set({ isConnected: true });
        
        // Setup listeners
        gt7TelemetryService.on('telemetry', (data: GT7TelemetryData) => {
          set({ currentTelemetry: data });
        });
        
        gt7TelemetryService.on('error', (error: Error) => {
          set({ connectionError: error.message });
        });
        
        gt7TelemetryService.on('disconnected', () => {
          set({ isConnected: false, isRecording: false });
        });
        
        return true;
      } else {
        set({ connectionError: 'Failed to connect to PlayStation' });
        return false;
      }
    } catch (error) {
      set({ connectionError: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  },
  
  disconnectFromPlayStation: () => {
    gt7TelemetryService.disconnect();
    set({ 
      isConnected: false, 
      isRecording: false,
      currentTelemetry: null,
      currentSession: null,
      connectionError: null
    });
  },
  
  startRecording: (sessionName?: string) => {
    try {
      gt7TelemetryService.startRecording(sessionName);
      set({ 
        isRecording: true,
        currentSession: gt7TelemetryService.getCurrentSession()
      });
    } catch (error) {
      set({ connectionError: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
  
  stopRecording: async () => {
    try {
      const session = await gt7TelemetryService.stopRecording();
      set({ 
        isRecording: false,
        currentSession: null
      });
      
      // Refresh sessions list
      get().loadSessions();
      
      return session;
    } catch (error) {
      set({ connectionError: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  },
  
  loadSessions: async () => {
    try {
      const sessions = await gt7TelemetryService.getSavedSessions();
      set({ sessions });
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  },
  
  uploadSession: async (sessionId: string, endpoint: string) => {
    try {
      const success = await gt7TelemetryService.uploadSession(sessionId, endpoint);
      
      if (success) {
        // Refresh sessions to update uploaded status
        get().loadSessions();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to upload session:', error);
      return false;
    }
  },
  
  deleteSession: async (sessionId: string) => {
    try {
      const success = await gt7TelemetryService.deleteSession(sessionId);
      
      if (success) {
        // Remove from state
        set((state) => ({
          sessions: state.sessions.filter(session => session.id !== sessionId)
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }
}));
