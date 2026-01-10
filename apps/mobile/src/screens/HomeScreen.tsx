import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTelemetry } from '../contexts/TelemetryContext';
import { useTheme } from '../theme';
import { ConnectionWizard } from '../components/ConnectionWizard';
import { TelemetryGauge, GearIndicator, CompactGauge } from '../components/TelemetryGauge';
import * as Haptics from 'expo-haptics';

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const {
    isConnected,
    connectToPlayStation,
    disconnectFromPlayStation,
    connectionError,
    currentTelemetry,
    connectionState,
  } = useTelemetry();

  const [showWizard, setShowWizard] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const success = await connectToPlayStation();
      if (!success && connectionError) {
        Alert.alert('Connection Failed', connectionError);
      } else if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to PlayStation');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from PlayStation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            disconnectFromPlayStation();
          },
        },
      ]
    );
  };

  const handleWizardComplete = async (ip: string, mockMode: boolean) => {
    setShowWizard(false);
    // Settings will be saved by the wizard, now connect
    await handleConnect();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh connection state
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const renderConnectionStatus = () => {
    const statusConfig = {
      connected: {
        icon: 'checkmark-circle',
        color: colors.success,
        text: 'Connected to PlayStation',
        subtext: `Receiving telemetry data`,
      },
      connecting: {
        icon: 'sync',
        color: colors.warning,
        text: 'Connecting...',
        subtext: 'Establishing connection',
      },
      disconnected: {
        icon: 'close-circle',
        color: colors.textSecondary,
        text: 'Not Connected',
        subtext: 'Tap to connect to PlayStation',
      },
      error: {
        icon: 'warning',
        color: colors.error,
        text: 'Connection Error',
        subtext: connectionState?.lastError || 'Unable to connect',
      },
    };

    const status = connectionState?.status || 'disconnected';
    const config = statusConfig[status];

    return (
      <TouchableOpacity
        style={[styles.statusCard, { backgroundColor: colors.surface }]}
        onPress={() => !isConnected && setShowWizard(true)}
        disabled={isConnected}
      >
        <View style={[styles.statusIconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={32} color={config.color} />
        </View>
        <View style={styles.statusContent}>
          <Text style={[styles.statusText, { color: colors.text }]}>{config.text}</Text>
          <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
            {config.subtext}
          </Text>
          {connectionState?.packetCount > 0 && (
            <Text style={[styles.packetCount, { color: colors.textSecondary }]}>
              {connectionState.packetCount.toLocaleString()} packets received
            </Text>
          )}
        </View>
        {!isConnected && (
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderTelemetryPreview = () => {
    if (!currentTelemetry) {
      return (
        <View style={[styles.noDataCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="speedometer-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            Waiting for telemetry data...
          </Text>
          <Text style={[styles.noDataSubtext, { color: colors.textDisabled }]}>
            Start a race or time trial in GT7
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.telemetryPreview}>
        {/* Main gauges row */}
        <View style={styles.gaugesRow}>
          <TelemetryGauge
            value={currentTelemetry.speed}
            maxValue={350}
            label="Speed"
            unit="km/h"
            size={140}
            colorScheme="speed"
            warningThreshold={280}
            dangerThreshold={320}
            isDarkMode={theme.dark}
          />
          <GearIndicator
            gear={currentTelemetry.gear}
            suggestedGear={currentTelemetry.suggestedGear}
            size={70}
            isDarkMode={theme.dark}
          />
          <TelemetryGauge
            value={currentTelemetry.engineRPM}
            maxValue={currentTelemetry.maxRPM || 9000}
            label="RPM"
            unit=""
            size={140}
            colorScheme="rpm"
            warningThreshold={(currentTelemetry.maxRPM || 9000) * 0.85}
            dangerThreshold={(currentTelemetry.maxRPM || 9000) * 0.95}
            isDarkMode={theme.dark}
          />
        </View>

        {/* Input bars */}
        <View style={styles.inputBars}>
          <CompactGauge
            value={currentTelemetry.throttle * 100}
            maxValue={100}
            label="Throttle"
            unit="%"
            colorScheme="throttle"
            isDarkMode={theme.dark}
          />
          <CompactGauge
            value={currentTelemetry.brake * 100}
            maxValue={100}
            label="Brake"
            unit="%"
            colorScheme="brake"
            isDarkMode={theme.dark}
          />
        </View>

        {/* Car and track info */}
        <View style={[styles.vehicleInfo, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.infoRow}>
            <Ionicons name="car-sport" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={1}>
              {currentTelemetry.carName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="map" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={1}>
              {currentTelemetry.trackName || 'Unknown Track'}
            </Text>
          </View>
        </View>

        {/* Additional telemetry */}
        <View style={styles.additionalTelemetry}>
          <View style={[styles.telemetryItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="water" size={20} color={colors.fuel} />
            <Text style={[styles.telemetryValue, { color: colors.text }]}>
              {Math.round(currentTelemetry.fuel)}%
            </Text>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Fuel</Text>
          </View>
          <View style={[styles.telemetryItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="thermometer" size={20} color={colors.temperature} />
            <Text style={[styles.telemetryValue, { color: colors.text }]}>
              {Math.round(currentTelemetry.waterTemperature)}C
            </Text>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Water</Text>
          </View>
          <View style={[styles.telemetryItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="flag" size={20} color={colors.primary} />
            <Text style={[styles.telemetryValue, { color: colors.text }]}>
              {currentTelemetry.currentLap || 0}
            </Text>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Lap</Text>
          </View>
          <View style={[styles.telemetryItem, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="trophy" size={20} color={colors.warning} />
            <Text style={[styles.telemetryValue, { color: colors.text }]}>
              P{currentTelemetry.racePosition || '-'}
            </Text>
            <Text style={[styles.telemetryLabel, { color: colors.textSecondary }]}>Pos</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>GT7 Telemetry</Text>
          <Text style={styles.subtitle}>
            {isConnected ? 'Live Data' : 'Ready to Connect'}
          </Text>
        </View>
        {isConnected && (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Ionicons name="power" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Connection Status */}
        {renderConnectionStatus()}

        {/* Telemetry Preview or Empty State */}
        {isConnected ? (
          renderTelemetryPreview()
        ) : (
          <View style={[styles.getStartedCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.getStartedTitle, { color: colors.text }]}>
              Get Started
            </Text>
            <Text style={[styles.getStartedText, { color: colors.textSecondary }]}>
              Connect your phone to the same WiFi as your PlayStation and enable
              telemetry in GT7 settings.
            </Text>

            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowWizard(true)}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="game-controller" size={24} color="#FFFFFF" />
                  <Text style={styles.connectButtonText}>Setup Connection</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Ionicons name="analytics" size={24} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Real-time telemetry capture
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="timer" size={24} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Lap times and delta tracking
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="cloud-upload" size={24} color={colors.info} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Upload to web for analysis
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {isConnected && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.success }]}
            >
              <Ionicons name="radio-button-on" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Start Recording</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Connection Wizard Modal */}
      <Modal
        visible={showWizard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWizard(false)}
      >
        <ConnectionWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
          isDarkMode={theme.dark}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  disconnectButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  packetCount: {
    fontSize: 12,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  noDataCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  noDataSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  telemetryPreview: {
    marginBottom: 16,
  },
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputBars: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  vehicleInfo: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  additionalTelemetry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  telemetryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  telemetryLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  getStartedCard: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  getStartedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  getStartedText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    marginLeft: 16,
  },
  quickActions: {
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default HomeScreen;
