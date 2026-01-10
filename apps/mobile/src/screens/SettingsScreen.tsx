import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { useTelemetryStore } from '../stores/telemetryStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const colors = theme.colors;

  const { playStationIp, mockMode, setPlayStationIp, setMockMode } = useTelemetryStore();

  const [tempPlayStationIp, setTempPlayStationIp] = useState(playStationIp);
  const [tempMockMode, setTempMockMode] = useState(mockMode);
  const [webApiUrl, setWebApiUrl] = useState('https://gt7-analysis-api.example.com');
  const [sampleRate, setSampleRate] = useState('10');
  const [autoDetectLaps, setAutoDetectLaps] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [syncOnWifiOnly, setSyncOnWifiOnly] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [dataStorageSize, setDataStorageSize] = useState('0 MB');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [apiUrl, rate, autoDetect, autoSyncValue, wifiOnly, haptics, email] = await Promise.all([
          AsyncStorage.getItem('@web_api_url'),
          AsyncStorage.getItem('@sample_rate'),
          AsyncStorage.getItem('@auto_detect_laps'),
          AsyncStorage.getItem('@auto_sync'),
          AsyncStorage.getItem('@sync_wifi_only'),
          AsyncStorage.getItem('@haptic_feedback'),
          AsyncStorage.getItem('@user_email'),
        ]);

        if (apiUrl) setWebApiUrl(apiUrl);
        if (rate) setSampleRate(rate);
        if (autoDetect !== null) setAutoDetectLaps(autoDetect !== 'false');
        if (autoSyncValue !== null) setAutoSync(autoSyncValue !== 'false');
        if (wifiOnly !== null) setSyncOnWifiOnly(wifiOnly !== 'false');
        if (haptics !== null) setHapticFeedback(haptics !== 'false');
        if (email) {
          setUserEmail(email);
          setIsLoggedIn(true);
        }

        const size = await calculateStorageSize();
        setDataStorageSize(size);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const calculateStorageSize = async (): Promise<string> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionCount = keys.filter((key: string) => key.startsWith('@session_')).length;
      const telemetryChunks = keys.filter((key: string) => key.startsWith('@telemetry_')).length;

      const avgSessionSize = 0.1; // MB
      const avgChunkSize = 0.5; // MB
      const totalSize = sessionCount * avgSessionSize + telemetryChunks * avgChunkSize;

      return `${totalSize.toFixed(1)} MB`;
    } catch (error) {
      console.error('Failed to calculate storage:', error);
      return '0 MB';
    }
  };

  const saveSettings = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setPlayStationIp(tempPlayStationIp);
      setMockMode(tempMockMode);

      await Promise.all([
        AsyncStorage.setItem('@web_api_url', webApiUrl),
        AsyncStorage.setItem('@sample_rate', sampleRate),
        AsyncStorage.setItem('@auto_detect_laps', autoDetectLaps.toString()),
        AsyncStorage.setItem('@auto_sync', autoSync.toString()),
        AsyncStorage.setItem('@sync_wifi_only', syncOnWifiOnly.toString()),
        AsyncStorage.setItem('@haptic_feedback', hapticFeedback.toString()),
      ]);

      Alert.alert('Settings Saved', 'Your settings have been updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error('Failed to save settings:', error);
    }
  };

  const handleLogin = () => {
    // In a real app, this would open an OAuth flow or login modal
    Alert.alert(
      'Login',
      'Enter your email to connect to the web platform',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Login with Demo Account',
          onPress: async () => {
            const demoEmail = 'demo@gt7telemetry.com';
            await AsyncStorage.setItem('@user_email', demoEmail);
            setUserEmail(demoEmail);
            setIsLoggedIn(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Your local sessions will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@user_email');
            setUserEmail('');
            setIsLoggedIn(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const clearAllData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all telemetry sessions and settings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(keys);

              setTempPlayStationIp('192.168.1.100');
              setPlayStationIp('192.168.1.100');
              setTempMockMode(true);
              setMockMode(true);
              setWebApiUrl('https://gt7-analysis-api.example.com');
              setSampleRate('10');
              setAutoDetectLaps(true);
              setAutoSync(true);
              setSyncOnWifiOnly(true);
              setDataStorageSize('0 MB');
              setIsLoggedIn(false);
              setUserEmail('');

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Data Cleared', 'All data has been deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
              console.error('Failed to clear data:', error);
            }
          },
        },
      ]
    );
  };

  const openWebPlatform = () => {
    Linking.openURL('https://gt7-data-analysis.example.com');
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingRow = (
    label: string,
    description: string | undefined,
    control: React.ReactNode
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      {control}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        {renderSection('Account', (
          <>
            {isLoggedIn ? (
              <>
                <View style={[styles.accountCard, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {userEmail.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountEmail, { color: colors.text }]}>{userEmail}</Text>
                    <Text style={[styles.accountStatus, { color: colors.success }]}>
                      Connected
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.linkButton, { borderColor: colors.border }]}
                  onPress={openWebPlatform}
                >
                  <Ionicons name="globe-outline" size={20} color={colors.primary} />
                  <Text style={[styles.linkButtonText, { color: colors.primary }]}>
                    Open Web Platform
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: colors.error }]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                  <Text style={[styles.outlineButtonText, { color: colors.error }]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.accountMessage, { color: colors.textSecondary }]}>
                  Sign in to sync your sessions with the web platform and access advanced analytics.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleLogin}
                >
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ))}

        {/* Connection Settings */}
        {renderSection('Connection', (
          <>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>PlayStation IP Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                value={tempPlayStationIp}
                onChangeText={setTempPlayStationIp}
                placeholder="e.g., 192.168.1.100"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
              />
            </View>

            {renderSettingRow(
              'Demo Mode',
              'Generate simulated data without PS5',
              <Switch
                value={tempMockMode}
                onValueChange={setTempMockMode}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={tempMockMode ? colors.primary : colors.surfaceVariant}
              />
            )}

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Web API URL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                value={webApiUrl}
                onChangeText={setWebApiUrl}
                placeholder="https://api.example.com"
                placeholderTextColor={colors.textDisabled}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </>
        ))}

        {/* Recording Options */}
        {renderSection('Recording', (
          <>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Sample Rate (Hz)</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Data points per second (1-60). Higher values use more storage.
              </Text>
              <View style={styles.sampleRateContainer}>
                {['5', '10', '20', '30', '60'].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.sampleRateButton,
                      {
                        backgroundColor: sampleRate === rate ? colors.primary : colors.surfaceVariant,
                      }
                    ]}
                    onPress={() => setSampleRate(rate)}
                  >
                    <Text style={[
                      styles.sampleRateText,
                      { color: sampleRate === rate ? '#FFFFFF' : colors.text }
                    ]}>
                      {rate}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderSettingRow(
              'Auto Detect Laps',
              'Use advanced position-based lap detection',
              <Switch
                value={autoDetectLaps}
                onValueChange={setAutoDetectLaps}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={autoDetectLaps ? colors.primary : colors.surfaceVariant}
              />
            )}
          </>
        ))}

        {/* Sync Settings */}
        {renderSection('Sync', (
          <>
            {renderSettingRow(
              'Auto Sync',
              'Automatically upload sessions when complete',
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={autoSync ? colors.primary : colors.surfaceVariant}
              />
            )}

            {renderSettingRow(
              'WiFi Only',
              'Only sync when connected to WiFi',
              <Switch
                value={syncOnWifiOnly}
                onValueChange={setSyncOnWifiOnly}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={syncOnWifiOnly ? colors.primary : colors.surfaceVariant}
              />
            )}
          </>
        ))}

        {/* Appearance */}
        {renderSection('Appearance', (
          <>
            {renderSettingRow(
              'Dark Mode',
              'Use dark theme throughout the app',
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isDark ? colors.primary : colors.surfaceVariant}
              />
            )}

            {renderSettingRow(
              'Haptic Feedback',
              'Vibrate on actions and events',
              <Switch
                value={hapticFeedback}
                onValueChange={(value) => {
                  setHapticFeedback(value);
                  if (value) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={hapticFeedback ? colors.primary : colors.surfaceVariant}
              />
            )}
          </>
        ))}

        {/* Storage */}
        {renderSection('Storage', (
          <>
            <View style={styles.storageRow}>
              <View style={styles.storageInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Data Usage</Text>
                <Text style={[styles.storageValue, { color: colors.primary }]}>{dataStorageSize}</Text>
              </View>
              <TouchableOpacity
                style={[styles.refreshButton, { backgroundColor: colors.surfaceVariant }]}
                onPress={async () => {
                  const size = await calculateStorageSize();
                  setDataStorageSize(size);
                }}
              >
                <Ionicons name="refresh" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.dangerButton, { backgroundColor: colors.error }]}
              onPress={clearAllData}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.dangerButtonText}>Clear All Data</Text>
            </TouchableOpacity>
          </>
        ))}

        {/* About */}
        {renderSection('About', (
          <>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Build</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>2024.01.09</Text>
            </View>

            <TouchableOpacity
              style={[styles.linkButton, { borderColor: colors.border }]}
              onPress={() => Linking.openURL('https://gt7-data-analysis.example.com')}
            >
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkButtonText, { color: colors.primary }]}>Visit Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkButton, { borderColor: colors.border }]}
              onPress={() => Linking.openURL('mailto:support@gt7telemetry.com')}
            >
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkButtonText, { color: colors.primary }]}>Contact Support</Text>
            </TouchableOpacity>
          </>
        ))}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.success }]}
          onPress={saveSettings}
        >
          <Ionicons name="save-outline" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginTop: 8,
  },
  sampleRateContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  sampleRateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sampleRateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  accountMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  storageInfo: {
    flex: 1,
  },
  storageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SettingsScreen;
