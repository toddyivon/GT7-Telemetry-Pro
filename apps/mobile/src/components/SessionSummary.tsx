import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GT7Session, GT7LapData } from '../services/GT7TelemetryService';

interface SessionSummaryProps {
  session: GT7Session;
  isDarkMode?: boolean;
  onUpload?: () => void;
  onShare?: () => void;
  onViewDetails?: () => void;
  onClose?: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  isDarkMode = false,
  onUpload,
  onShare,
  onViewDetails,
  onClose,
}) => {
  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    card: isDarkMode ? '#2A2A2A' : '#F5F5F5',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subtext: isDarkMode ? '#888888' : '#666666',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    primary: '#1976D2',
    success: '#4CAF50',
    warning: '#FF9800',
    purple: '#9C27B0',
  };

  // Format time
  const formatLapTime = (ms: number): string => {
    if (ms <= 0) return '--:--.---';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Calculate statistics
  const sessionDuration = (session.endTime || Date.now()) - session.startTime;
  const averageLapTime = session.laps.length > 0
    ? session.laps.reduce((sum, lap) => sum + lap.lapTime, 0) / session.laps.length
    : 0;
  const validLaps = session.laps.filter(lap => lap.isValid);
  const topSpeed = Math.max(...session.laps.map(lap => lap.topSpeed), 0);
  const avgSpeed = session.laps.length > 0
    ? session.laps.reduce((sum, lap) => sum + lap.averageSpeed, 0) / session.laps.length
    : 0;

  const handleShare = async () => {
    try {
      const message = `GT7 Session Summary
Track: ${session.trackName}
Car: ${session.carName}
Laps: ${session.laps.length}
Best Lap: ${session.bestLap ? formatLapTime(session.bestLap.lapTime) : 'N/A'}
Top Speed: ${Math.round(topSpeed)} km/h
Duration: ${formatDuration(sessionDuration)}`;

      await Share.share({ message });
      onShare?.();
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Session Complete</Text>
          <Text style={[styles.trackName, { color: colors.subtext }]}>{session.trackName}</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="flag" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{session.laps.length}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Total Laps</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="timer" size={24} color={colors.purple} />
            <Text style={[styles.statValue, { color: colors.purple }]}>
              {session.bestLap ? formatLapTime(session.bestLap.lapTime) : '--:--.---'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Best Lap</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="speedometer" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(topSpeed)}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Top Speed (km/h)</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="time" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(sessionDuration)}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Duration</Text>
          </View>
        </View>

        {/* Car Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Ionicons name="car-sport" size={20} color={colors.subtext} />
            <Text style={[styles.infoText, { color: colors.text }]}>{session.carName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="analytics" size={20} color={colors.subtext} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {session.totalDataPoints.toLocaleString()} telemetry points @ {session.telemetryDataSampleRate}Hz
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={colors.subtext} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Lap Times */}
        {session.laps.length > 0 && (
          <View style={[styles.lapSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Lap Times</Text>

            {session.laps.slice(0, 5).map((lap, index) => (
              <LapTimeRow
                key={index}
                lap={lap}
                isBest={session.bestLap?.lapNumber === lap.lapNumber}
                colors={colors}
              />
            ))}

            {session.laps.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton} onPress={onViewDetails}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View all {session.laps.length} laps
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Session Statistics */}
        <View style={[styles.statsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>

          <StatRow
            label="Average Lap Time"
            value={formatLapTime(averageLapTime)}
            colors={colors}
          />
          <StatRow
            label="Average Speed"
            value={`${Math.round(avgSpeed)} km/h`}
            colors={colors}
          />
          <StatRow
            label="Valid Laps"
            value={`${validLaps.length} / ${session.laps.length}`}
            colors={colors}
          />
          <StatRow
            label="Consistency"
            value={calculateConsistency(session.laps)}
            colors={colors}
          />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={onUpload}
        >
          <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={onViewDetails}
        >
          <Ionicons name="analytics" size={20} color={colors.text} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Lap time row component
interface LapTimeRowProps {
  lap: GT7LapData;
  isBest: boolean;
  colors: any;
}

const LapTimeRow: React.FC<LapTimeRowProps> = ({ lap, isBest, colors }) => {
  const formatLapTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  return (
    <View style={[lapStyles.row, isBest && { backgroundColor: colors.purple + '20' }]}>
      <View style={lapStyles.lapInfo}>
        <Text style={[lapStyles.lapNumber, { color: colors.subtext }]}>Lap {lap.lapNumber}</Text>
        {isBest && (
          <View style={[lapStyles.bestBadge, { backgroundColor: colors.purple }]}>
            <Text style={lapStyles.bestText}>BEST</Text>
          </View>
        )}
      </View>
      <Text style={[lapStyles.lapTime, { color: isBest ? colors.purple : colors.text }]}>
        {formatLapTime(lap.lapTime)}
      </Text>
    </View>
  );
};

// Stat row component
interface StatRowProps {
  label: string;
  value: string;
  colors: any;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, colors }) => (
  <View style={statStyles.row}>
    <Text style={[statStyles.label, { color: colors.subtext }]}>{label}</Text>
    <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
  </View>
);

// Calculate lap time consistency (standard deviation as percentage)
const calculateConsistency = (laps: GT7LapData[]): string => {
  if (laps.length < 2) return 'N/A';

  const times = laps.map(l => l.lapTime);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  const consistencyPercent = 100 - (stdDev / avg * 100);

  if (consistencyPercent >= 98) return 'Excellent';
  if (consistencyPercent >= 95) return 'Very Good';
  if (consistencyPercent >= 90) return 'Good';
  if (consistencyPercent >= 85) return 'Fair';
  return 'Needs Work';
};

// Compact summary card for session list
interface CompactSessionCardProps {
  session: GT7Session;
  isDarkMode?: boolean;
  onPress?: () => void;
}

export const CompactSessionCard: React.FC<CompactSessionCardProps> = ({
  session,
  isDarkMode = false,
  onPress,
}) => {
  const colors = {
    background: isDarkMode ? '#2A2A2A' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subtext: isDarkMode ? '#888888' : '#666666',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    purple: '#9C27B0',
    success: '#4CAF50',
  };

  const formatLapTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const getSyncStatusColor = () => {
    switch (session.syncStatus) {
      case 'uploaded': return colors.success;
      case 'uploading': return '#FF9800';
      case 'failed': return '#F44336';
      default: return colors.subtext;
    }
  };

  return (
    <TouchableOpacity
      style={[compactStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={compactStyles.header}>
        <Text style={[compactStyles.trackName, { color: colors.text }]} numberOfLines={1}>
          {session.trackName}
        </Text>
        <View style={[compactStyles.syncBadge, { backgroundColor: getSyncStatusColor() }]}>
          <Ionicons
            name={session.syncStatus === 'uploaded' ? 'cloud-done' : 'cloud-outline'}
            size={12}
            color="#FFFFFF"
          />
        </View>
      </View>

      <Text style={[compactStyles.carName, { color: colors.subtext }]} numberOfLines={1}>
        {session.carName}
      </Text>

      <View style={compactStyles.stats}>
        <View style={compactStyles.stat}>
          <Text style={[compactStyles.statValue, { color: colors.purple }]}>
            {session.bestLap ? formatLapTime(session.bestLap.lapTime) : '--:--.---'}
          </Text>
          <Text style={[compactStyles.statLabel, { color: colors.subtext }]}>Best</Text>
        </View>
        <View style={compactStyles.stat}>
          <Text style={[compactStyles.statValue, { color: colors.text }]}>{session.laps.length}</Text>
          <Text style={[compactStyles.statLabel, { color: colors.subtext }]}>Laps</Text>
        </View>
        <View style={compactStyles.stat}>
          <Text style={[compactStyles.statValue, { color: colors.text }]}>
            {new Date(session.startTime).toLocaleDateString()}
          </Text>
          <Text style={[compactStyles.statLabel, { color: colors.subtext }]}>Date</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trackName: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  lapSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  statsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

const lapStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  lapInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lapNumber: {
    fontSize: 14,
  },
  bestBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lapTime: {
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

const compactStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carName: {
    fontSize: 12,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default SessionSummary;
