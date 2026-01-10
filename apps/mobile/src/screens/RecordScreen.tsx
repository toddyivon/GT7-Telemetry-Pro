import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTelemetry } from '../contexts/TelemetryContext';
import { useTheme } from '../theme';
import { TelemetryGauge, GearIndicator, CompactGauge } from '../components/TelemetryGauge';
import { LapTimer } from '../components/LapTimer';
import { MiniMap, TrackProgress } from '../components/MiniMap';
import { SessionSummary } from '../components/SessionSummary';
import { GT7Session } from '../services/GT7TelemetryService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RecordScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const {
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
    currentTelemetry,
    currentSession,
  } = useTelemetry();

  const [sessionName, setSessionName] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [trackPath, setTrackPath] = useState<Array<{x: number, y: number, z: number}>>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [completedSession, setCompletedSession] = useState<GT7Session | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Recording pulse animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Timer for recording duration
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (isRecording && currentSession) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentSession.startTime) / 1000);
        setElapsedTime(elapsed);
      }, 100);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, currentSession]);

  // Track position history for mini map
  useEffect(() => {
    if (isRecording && currentTelemetry?.position) {
      setTrackPath(prev => {
        const newPath = [...prev, currentTelemetry.position];
        // Keep last 500 points for performance
        if (newPath.length > 500) {
          return newPath.slice(-500);
        }
        return newPath;
      });
    }
  }, [isRecording, currentTelemetry?.position]);

  const handleStartRecording = useCallback(() => {
    if (!isConnected) {
      Alert.alert(
        'Not Connected',
        'Please connect to your PlayStation first from the Home tab.',
        [{ text: 'OK' }]
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTrackPath([]);
    const name = sessionName.trim() || `Session ${new Date().toLocaleString()}`;
    startRecording(name);
  }, [isConnected, sessionName, startRecording]);

  const handleStopRecording = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Stop Recording',
      'Are you sure you want to stop recording this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            const session = await stopRecording();
            if (session) {
              setCompletedSession(session);
              setShowSummary(true);
            }
          },
        },
      ]
    );
  }, [stopRecording]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRecordingView = () => (
    <View style={styles.recordingContainer}>
      {/* Recording header */}
      <View style={[styles.recordingHeader, { backgroundColor: colors.error + '20' }]}>
        <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
        <Text style={[styles.recordingText, { color: colors.error }]}>Recording</Text>
        <Text style={[styles.recordingTimer, { color: colors.text }]}>
          {formatTime(elapsedTime)}
        </Text>
      </View>

      {/* Lap Timer */}
      <LapTimer
        currentLapTime={currentTelemetry?.currentLapTime || 0}
        lastLapTime={currentTelemetry?.lastLapTime || 0}
        bestLapTime={currentTelemetry?.bestLapTime || currentSession?.bestLap?.lapTime || 0}
        currentLap={currentTelemetry?.currentLap || 0}
        totalLaps={currentTelemetry?.totalLaps}
        isRecording={isRecording}
        isDarkMode={theme.dark}
        onLapComplete={(lapTime, isBest) => {
          if (isBest) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }}
      />

      {/* Main Telemetry Display */}
      <View style={styles.telemetryGrid}>
        <View style={styles.gaugesRow}>
          <TelemetryGauge
            value={currentTelemetry?.speed || 0}
            maxValue={350}
            label="Speed"
            unit="km/h"
            size={SCREEN_WIDTH * 0.4}
            colorScheme="speed"
            warningThreshold={280}
            dangerThreshold={320}
            isDarkMode={theme.dark}
          />
          <View style={styles.gearAndRpm}>
            <GearIndicator
              gear={currentTelemetry?.gear || 0}
              suggestedGear={currentTelemetry?.suggestedGear}
              size={80}
              isDarkMode={theme.dark}
            />
            <TelemetryGauge
              value={currentTelemetry?.engineRPM || 0}
              maxValue={currentTelemetry?.maxRPM || 9000}
              label="RPM"
              unit=""
              size={100}
              colorScheme="rpm"
              showTicks={false}
              warningThreshold={(currentTelemetry?.maxRPM || 9000) * 0.85}
              dangerThreshold={(currentTelemetry?.maxRPM || 9000) * 0.95}
              isDarkMode={theme.dark}
            />
          </View>
        </View>

        {/* Throttle/Brake bars */}
        <View style={styles.inputsRow}>
          <View style={[styles.inputBar, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Throttle</Text>
            <View style={styles.inputBarContainer}>
              <View
                style={[
                  styles.inputBarFill,
                  {
                    width: `${(currentTelemetry?.throttle || 0) * 100}%`,
                    backgroundColor: colors.throttle,
                  }
                ]}
              />
            </View>
            <Text style={[styles.inputValue, { color: colors.text }]}>
              {Math.round((currentTelemetry?.throttle || 0) * 100)}%
            </Text>
          </View>
          <View style={[styles.inputBar, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Brake</Text>
            <View style={styles.inputBarContainer}>
              <View
                style={[
                  styles.inputBarFill,
                  {
                    width: `${(currentTelemetry?.brake || 0) * 100}%`,
                    backgroundColor: colors.brake,
                  }
                ]}
              />
            </View>
            <Text style={[styles.inputValue, { color: colors.text }]}>
              {Math.round((currentTelemetry?.brake || 0) * 100)}%
            </Text>
          </View>
        </View>

        {/* Mini map and track progress */}
        <View style={styles.mapRow}>
          <MiniMap
            currentPosition={currentTelemetry?.position || { x: 0, y: 0, z: 0 }}
            trackPath={trackPath}
            size={120}
            showSpeed={false}
            heading={currentTelemetry?.rotation?.yaw || 0}
            isDarkMode={theme.dark}
            trackName={currentSession?.trackName || currentTelemetry?.trackName}
          />
          <View style={styles.trackInfo}>
            <TrackProgress
              progress={currentTelemetry?.lapDistance ? currentTelemetry.lapDistance / 5800 : 0}
              lapNumber={currentTelemetry?.currentLap || 0}
              width={SCREEN_WIDTH - 180}
              isDarkMode={theme.dark}
            />
            <View style={styles.additionalInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="water" size={16} color={colors.fuel} />
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {Math.round(currentTelemetry?.fuel || 0)}%
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="thermometer" size={16} color={colors.temperature} />
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {Math.round(currentTelemetry?.waterTemperature || 0)}C
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="analytics" size={16} color={colors.primary} />
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {(currentSession?.laps.length || 0)} laps
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Stop Button */}
      <TouchableOpacity
        style={[styles.stopButton, { backgroundColor: colors.error }]}
        onPress={handleStopRecording}
      >
        <Ionicons name="stop-circle" size={28} color="#FFFFFF" />
        <Text style={styles.stopButtonText}>Stop Recording</Text>
      </TouchableOpacity>
    </View>
  );

  const renderIdleView = () => (
    <View style={styles.idleContainer}>
      {/* Session Name Input */}
      <View style={[styles.inputSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Session Details</Text>
        <View style={[styles.nameInput, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={sessionName}
            onChangeText={setSessionName}
            placeholder="Session name (optional)"
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Current Status */}
      <View style={[styles.statusSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Status</Text>

        <View style={styles.statusGrid}>
          <View style={[styles.statusItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons
              name={isConnected ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isConnected ? colors.success : colors.error}
            />
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Connection</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>

          <View style={[styles.statusItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="car-sport" size={24} color={colors.primary} />
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Car</Text>
            <Text style={[styles.statusValue, { color: colors.text }]} numberOfLines={1}>
              {currentTelemetry?.carName || 'Not detected'}
            </Text>
          </View>

          <View style={[styles.statusItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="map" size={24} color={colors.info} />
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Track</Text>
            <Text style={[styles.statusValue, { color: colors.text }]} numberOfLines={1}>
              {currentTelemetry?.trackName || 'Not detected'}
            </Text>
          </View>

          <View style={[styles.statusItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="speedometer" size={24} color={colors.success} />
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Speed</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {currentTelemetry ? `${Math.round(currentTelemetry.speed)} km/h` : '-- km/h'}
            </Text>
          </View>
        </View>
      </View>

      {/* Start Recording Button */}
      <TouchableOpacity
        style={[
          styles.startButton,
          { backgroundColor: isConnected ? colors.success : colors.textDisabled }
        ]}
        onPress={handleStartRecording}
        disabled={!isConnected}
      >
        <Ionicons name="radio-button-on" size={28} color="#FFFFFF" />
        <Text style={styles.startButtonText}>Start Recording</Text>
      </TouchableOpacity>

      {!isConnected && (
        <Text style={[styles.warningText, { color: colors.warning }]}>
          Connect to PlayStation from the Home tab to start recording
        </Text>
      )}

      {/* Tips */}
      <View style={[styles.tipsSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips</Text>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={20} color={colors.warning} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Start recording before entering the track for complete lap data
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={20} color={colors.warning} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Recording continues even when the app is in the background
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={20} color={colors.warning} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Sessions are saved locally and can be uploaded later
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isRecording ? colors.error : colors.primary }]}>
        <Text style={styles.title}>
          {isRecording ? 'Recording Session' : 'Record Telemetry'}
        </Text>
        <Text style={styles.subtitle}>
          {isRecording
            ? `${currentSession?.trackName || 'Unknown Track'}`
            : 'Capture your driving data'
          }
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isRecording ? renderRecordingView() : renderIdleView()}
      </ScrollView>

      {/* Session Summary Modal */}
      <Modal
        visible={showSummary && completedSession !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSummary(false)}
      >
        {completedSession && (
          <SessionSummary
            session={completedSession}
            isDarkMode={theme.dark}
            onClose={() => {
              setShowSummary(false);
              setCompletedSession(null);
            }}
            onUpload={() => {
              // Navigate to sessions or trigger upload
            }}
            onViewDetails={() => {
              // Navigate to session details
            }}
          />
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  recordingContainer: {
    flex: 1,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 'auto',
  },
  recordingTimer: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  telemetryGrid: {
    marginTop: 16,
  },
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gearAndRpm: {
    alignItems: 'center',
    gap: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputBar: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  inputBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  inputValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  mapRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  idleContainer: {
    flex: 1,
  },
  inputSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  nameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  statusSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    width: '47%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },
  tipsSection: {
    borderRadius: 12,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default RecordScreen;
