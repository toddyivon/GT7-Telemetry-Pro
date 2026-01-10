import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTelemetry } from '../contexts/TelemetryContext';
import { useTheme } from '../theme';
import { GT7Session } from '../services/GT7TelemetryService';
import { CompactSessionCard, SessionSummary } from '../components/SessionSummary';
import * as Haptics from 'expo-haptics';

type FilterType = 'all' | 'uploaded' | 'pending' | 'failed';
type SortType = 'newest' | 'oldest' | 'fastest' | 'most_laps';

const SessionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const { sessions, loadSessions, uploadSession, deleteSession } = useTelemetry();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GT7Session | null>(null);
  const [showSessionDetail, setShowSessionDetail] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      await loadSessions();
      setLoading(false);
    };

    fetchSessions();
  }, [loadSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        session =>
          session.trackName.toLowerCase().includes(query) ||
          session.carName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filterType) {
      case 'uploaded':
        result = result.filter(s => s.syncStatus === 'uploaded');
        break;
      case 'pending':
        result = result.filter(s => s.syncStatus === 'pending');
        break;
      case 'failed':
        result = result.filter(s => s.syncStatus === 'failed');
        break;
    }

    // Apply sorting
    switch (sortType) {
      case 'newest':
        result.sort((a, b) => b.startTime - a.startTime);
        break;
      case 'oldest':
        result.sort((a, b) => a.startTime - b.startTime);
        break;
      case 'fastest':
        result.sort((a, b) => {
          const aTime = a.bestLap?.lapTime || Infinity;
          const bTime = b.bestLap?.lapTime || Infinity;
          return aTime - bTime;
        });
        break;
      case 'most_laps':
        result.sort((a, b) => b.laps.length - a.laps.length);
        break;
    }

    return result;
  }, [sessions, searchQuery, filterType, sortType]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: { [key: string]: GT7Session[] } = {};

    filteredSessions.forEach(session => {
      const date = new Date(session.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });

    return Object.entries(groups).map(([date, sessions]) => ({
      date,
      sessions,
    }));
  }, [filteredSessions]);

  const handleUpload = async (session: GT7Session) => {
    setUploading(session.id);
    setUploadProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const apiEndpoint = 'https://gt7-analysis-api.example.com';
      const success = await uploadSession(session.id, apiEndpoint);

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Upload Successful',
          'Your session has been uploaded to the web platform for analysis.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Upload Failed',
        'Could not upload session. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const handleDelete = (session: GT7Session) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${session.trackName}" from ${new Date(session.startTime).toLocaleDateString()}?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSession(session.id);
            if (!success) {
              Alert.alert('Error', 'Failed to delete session');
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleUploadAll = () => {
    const pendingSessions = sessions.filter(s => s.syncStatus === 'pending' || s.syncStatus === 'failed');

    if (pendingSessions.length === 0) {
      Alert.alert('No Sessions', 'All sessions have been uploaded.');
      return;
    }

    Alert.alert(
      'Upload All Sessions',
      `Upload ${pendingSessions.length} session${pendingSessions.length > 1 ? 's' : ''} to the web platform?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload All',
          onPress: async () => {
            for (const session of pendingSessions) {
              await handleUpload(session);
            }
          },
        },
      ]
    );
  };

  const renderSessionItem = ({ item }: { item: GT7Session }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedSession(item);
        setShowSessionDetail(true);
      }}
      onLongPress={() => handleDelete(item)}
    >
      <CompactSessionCard
        session={item}
        isDarkMode={theme.dark}
      />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: { date: string } }) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {section.date}
    </Text>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Status</Text>
      <View style={styles.filterOptions}>
        {(['all', 'pending', 'uploaded', 'failed'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterType === filter ? colors.primary : colors.surfaceVariant,
              }
            ]}
            onPress={() => setFilterType(filter)}
          >
            <Text style={[
              styles.filterChipText,
              { color: filterType === filter ? '#FFFFFF' : colors.text }
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.filterTitle, { color: colors.text, marginTop: 16 }]}>Sort by</Text>
      <View style={styles.filterOptions}>
        {([
          { value: 'newest', label: 'Newest' },
          { value: 'oldest', label: 'Oldest' },
          { value: 'fastest', label: 'Fastest Lap' },
          { value: 'most_laps', label: 'Most Laps' },
        ] as { value: SortType; label: string }[]).map((sort) => (
          <TouchableOpacity
            key={sort.value}
            style={[
              styles.filterChip,
              {
                backgroundColor: sortType === sort.value ? colors.primary : colors.surfaceVariant,
              }
            ]}
            onPress={() => setSortType(sort.value)}
          >
            <Text style={[
              styles.filterChipText,
              { color: sortType === sort.value ? '#FFFFFF' : colors.text }
            ]}>
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.applyButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowFilters(false)}
      >
        <Text style={styles.applyButtonText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const totalLaps = sessions.reduce((sum, s) => sum + s.laps.length, 0);
    const uploadedCount = sessions.filter(s => s.syncStatus === 'uploaded').length;
    const pendingCount = sessions.filter(s => s.syncStatus === 'pending' || s.syncStatus === 'failed').length;

    return (
      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{sessions.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalLaps}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Laps</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{uploadedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Uploaded</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Sessions</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="filter" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleUploadAll}
            >
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tracks or cars..."
            placeholderTextColor="rgba(255,255,255,0.6)"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      {!loading && sessions.length > 0 && renderStats()}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading sessions...
          </Text>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={searchQuery ? 'search-outline' : 'folder-open-outline'}
            size={64}
            color={colors.textDisabled}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'No matching sessions found' : 'No sessions recorded yet'}
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textDisabled }]}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Go to the Record tab to start recording telemetry data'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={item => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.sessionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            {renderFilters()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Session Detail Modal */}
      <Modal
        visible={showSessionDetail && selectedSession !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSessionDetail(false)}
      >
        {selectedSession && (
          <SessionSummary
            session={selectedSession}
            isDarkMode={theme.dark}
            onClose={() => {
              setShowSessionDetail(false);
              setSelectedSession(null);
            }}
            onUpload={() => handleUpload(selectedSession)}
          />
        )}
      </Modal>

      {/* Upload Progress Overlay */}
      {uploading && (
        <View style={styles.uploadOverlay}>
          <View style={[styles.uploadCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.text }]}>
              Uploading session...
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${uploadProgress}%`,
                    backgroundColor: colors.primary,
                  }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {uploadProgress}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  sessionsList: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filtersContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  applyButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});

export default SessionsScreen;
