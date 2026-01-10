import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

interface LapTimerProps {
  currentLapTime: number; // in milliseconds
  lastLapTime: number; // in milliseconds
  bestLapTime: number; // in milliseconds
  currentLap: number;
  totalLaps?: number;
  isRecording: boolean;
  isDarkMode?: boolean;
  onLapComplete?: (lapTime: number, isBest: boolean) => void;
}

export const LapTimer: React.FC<LapTimerProps> = ({
  currentLapTime,
  lastLapTime,
  bestLapTime,
  currentLap,
  totalLaps,
  isRecording,
  isDarkMode = false,
  onLapComplete,
}) => {
  const [delta, setDelta] = useState<number>(0);
  const [showDelta, setShowDelta] = useState(false);
  const deltaAnimation = useRef(new Animated.Value(1)).current;
  const previousLapRef = useRef(currentLap);

  // Colors
  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subtext: isDarkMode ? '#888888' : '#666666',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    positive: '#4CAF50',
    negative: '#F44336',
    neutral: '#2196F3',
    purple: '#9C27B0',
  };

  // Format time as MM:SS.mmm
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '--:--.---';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Format delta time
  const formatDelta = (ms: number): string => {
    const absMs = Math.abs(ms);
    const seconds = Math.floor(absMs / 1000);
    const milliseconds = absMs % 1000;
    const sign = ms >= 0 ? '+' : '-';

    if (seconds > 0) {
      return `${sign}${seconds}.${milliseconds.toString().padStart(3, '0').substring(0, 1)}`;
    }
    return `${sign}0.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Detect lap completion
  useEffect(() => {
    if (currentLap > previousLapRef.current && isRecording) {
      // Lap completed
      const isBest = bestLapTime > 0 && lastLapTime < bestLapTime;

      // Calculate delta
      if (bestLapTime > 0) {
        const lapDelta = lastLapTime - bestLapTime;
        setDelta(lapDelta);
        setShowDelta(true);

        // Haptic feedback
        if (isBest) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Animate delta
        deltaAnimation.setValue(1.2);
        Animated.sequence([
          Animated.timing(deltaAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(3000),
          Animated.timing(deltaAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setShowDelta(false));
      }

      onLapComplete?.(lastLapTime, isBest);
    }

    previousLapRef.current = currentLap;
  }, [currentLap, isRecording, lastLapTime, bestLapTime, onLapComplete, deltaAnimation]);

  // Calculate live delta (comparing to best lap)
  const liveDelta = bestLapTime > 0 ? currentLapTime - bestLapTime : 0;
  const isAhead = liveDelta < 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {/* Lap Counter */}
      <View style={styles.lapCounter}>
        <Text style={[styles.lapLabel, { color: colors.subtext }]}>LAP</Text>
        <Text style={[styles.lapNumber, { color: colors.text }]}>
          {currentLap > 0 ? currentLap : '-'}
          {totalLaps && totalLaps > 0 ? `/${totalLaps}` : ''}
        </Text>
      </View>

      {/* Current Lap Time */}
      <View style={styles.mainTimeContainer}>
        <Text style={[styles.timeLabel, { color: colors.subtext }]}>CURRENT</Text>
        <Text style={[
          styles.mainTime,
          { color: isRecording ? colors.text : colors.subtext }
        ]}>
          {isRecording ? formatTime(currentLapTime) : '--:--.---'}
        </Text>

        {/* Live delta indicator */}
        {isRecording && bestLapTime > 0 && currentLapTime > 0 && (
          <Text style={[
            styles.liveDelta,
            { color: isAhead ? colors.positive : colors.negative }
          ]}>
            {formatDelta(liveDelta)}
          </Text>
        )}
      </View>

      {/* Delta popup on lap completion */}
      {showDelta && (
        <Animated.View
          style={[
            styles.deltaPopup,
            {
              backgroundColor: delta <= 0 ? colors.positive : colors.negative,
              opacity: deltaAnimation,
              transform: [{ scale: deltaAnimation }],
            }
          ]}
        >
          <Text style={styles.deltaPopupText}>
            {formatDelta(delta)}
          </Text>
          {delta <= 0 && bestLapTime === lastLapTime && (
            <Text style={styles.bestLapIndicator}>BEST LAP!</Text>
          )}
        </Animated.View>
      )}

      {/* Last and Best Lap Times */}
      <View style={styles.lapTimesRow}>
        <View style={styles.lapTimeBox}>
          <Text style={[styles.lapTimeLabel, { color: colors.subtext }]}>LAST</Text>
          <Text style={[styles.lapTime, { color: colors.text }]}>
            {lastLapTime > 0 ? formatTime(lastLapTime) : '--:--.---'}
          </Text>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.lapTimeBox}>
          <Text style={[styles.lapTimeLabel, { color: colors.purple }]}>BEST</Text>
          <Text style={[styles.lapTime, { color: colors.purple }]}>
            {bestLapTime > 0 ? formatTime(bestLapTime) : '--:--.---'}
          </Text>
        </View>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      )}
    </View>
  );
};

// Compact lap timer for inline display
interface CompactLapTimerProps {
  currentLapTime: number;
  bestLapTime: number;
  isDarkMode?: boolean;
}

export const CompactLapTimer: React.FC<CompactLapTimerProps> = ({
  currentLapTime,
  bestLapTime,
  isDarkMode = false,
}) => {
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '--:--.---';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const delta = bestLapTime > 0 ? currentLapTime - bestLapTime : 0;
  const isAhead = delta < 0;

  const textColor = isDarkMode ? '#FFFFFF' : '#333333';
  const deltaColor = isAhead ? '#4CAF50' : '#F44336';

  return (
    <View style={compactStyles.container}>
      <Text style={[compactStyles.time, { color: textColor }]}>
        {formatTime(currentLapTime)}
      </Text>
      {bestLapTime > 0 && (
        <Text style={[compactStyles.delta, { color: deltaColor }]}>
          {delta >= 0 ? '+' : ''}{(delta / 1000).toFixed(3)}
        </Text>
      )}
    </View>
  );
};

// Sector times display
interface SectorTimesProps {
  sectors: {
    sector1?: number;
    sector2?: number;
    sector3?: number;
  };
  bestSectors?: {
    sector1?: number;
    sector2?: number;
    sector3?: number;
  };
  currentSector: 1 | 2 | 3;
  isDarkMode?: boolean;
}

export const SectorTimes: React.FC<SectorTimesProps> = ({
  sectors,
  bestSectors,
  currentSector,
  isDarkMode = false,
}) => {
  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subtext: isDarkMode ? '#666666' : '#999999',
    positive: '#4CAF50',
    negative: '#F44336',
    current: '#FFC107',
    border: isDarkMode ? '#333333' : '#E0E0E0',
  };

  const formatSector = (ms?: number): string => {
    if (!ms) return '--.---';
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const getSectorColor = (sectorNum: 1 | 2 | 3) => {
    if (sectorNum === currentSector) return colors.current;

    const current = sectors[`sector${sectorNum}` as keyof typeof sectors];
    const best = bestSectors?.[`sector${sectorNum}` as keyof typeof bestSectors];

    if (!current || !best) return colors.text;

    return current <= best ? colors.positive : colors.negative;
  };

  return (
    <View style={[sectorStyles.container, { borderColor: colors.border }]}>
      {[1, 2, 3].map((num) => {
        const sectorKey = `sector${num}` as keyof typeof sectors;
        return (
          <View
            key={num}
            style={[
              sectorStyles.sector,
              num < 3 && { borderRightWidth: 1, borderRightColor: colors.border }
            ]}
          >
            <Text style={[sectorStyles.sectorLabel, { color: colors.subtext }]}>
              S{num}
            </Text>
            <Text style={[
              sectorStyles.sectorTime,
              { color: getSectorColor(num as 1 | 2 | 3) }
            ]}>
              {formatSector(sectors[sectorKey])}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
  },
  lapCounter: {
    position: 'absolute',
    top: 12,
    left: 16,
    alignItems: 'center',
  },
  lapLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  lapNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  mainTimeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  mainTime: {
    fontSize: 48,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  liveDelta: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  deltaPopup: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: -30,
    alignItems: 'center',
  },
  deltaPopupText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  bestLapIndicator: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  lapTimesRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 12,
    paddingTop: 12,
  },
  lapTimeBox: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    marginHorizontal: 12,
  },
  lapTimeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  lapTime: {
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  recordingIndicator: {
    position: 'absolute',
    top: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    marginRight: 4,
  },
  recordingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F44336',
  },
});

const compactStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  time: {
    fontSize: 24,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  delta: {
    fontSize: 14,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});

const sectorStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sector: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  sectorLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectorTime: {
    fontSize: 14,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});

export default LapTimer;
