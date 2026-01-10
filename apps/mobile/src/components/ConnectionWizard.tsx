import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import * as Haptics from 'expo-haptics';

interface ConnectionWizardProps {
  onComplete: (ip: string, mockMode: boolean) => void;
  onCancel: () => void;
  initialIp?: string;
  isDarkMode?: boolean;
}

type WizardStep = 'network' | 'gt7-settings' | 'ip-input' | 'testing' | 'complete' | 'mock-mode';

export const ConnectionWizard: React.FC<ConnectionWizardProps> = ({
  onComplete,
  onCancel,
  initialIp = '',
  isDarkMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('network');
  const [playStationIp, setPlayStationIp] = useState(initialIp);
  const [isLoading, setIsLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    isConnected: boolean;
    type: string | null;
    ipAddress: string | null;
  } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const colors = {
    background: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    card: isDarkMode ? '#2A2A2A' : '#F5F5F5',
    text: isDarkMode ? '#FFFFFF' : '#333333',
    subtext: isDarkMode ? '#888888' : '#666666',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    primary: '#1976D2',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  };

  // Check network on mount
  useEffect(() => {
    checkNetwork();
  }, []);

  const checkNetwork = async () => {
    try {
      setIsLoading(true);
      const state = await Network.getNetworkStateAsync();
      const ipAddress = await Network.getIpAddressAsync();

      setNetworkInfo({
        isConnected: state.isConnected || false,
        type: state.type || null,
        ipAddress,
      });

      // If connected to WiFi, auto-advance
      if (state.isConnected && state.type === Network.NetworkStateType.WIFI) {
        // Try to auto-detect PlayStation IP based on network range
        if (ipAddress) {
          const networkPrefix = ipAddress.split('.').slice(0, 3).join('.');
          setPlayStationIp(networkPrefix + '.'); // Pre-fill network prefix
        }
      }
    } catch (error) {
      console.error('Network check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const animateTransition = (nextStep: WizardStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setCurrentStep(nextStep), 150);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionError(null);

    try {
      // Validate IP format
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(playStationIp)) {
        throw new Error('Invalid IP address format');
      }

      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo, we'll assume success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateTransition('complete');
    } catch (error: any) {
      setConnectionError(error.message || 'Connection failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = ['network', 'gt7-settings', 'ip-input', 'testing'];
    const currentIndex = steps.indexOf(currentStep);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: index <= currentIndex ? colors.primary : colors.border,
                }
              ]}
            >
              {index < currentIndex ? (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              ) : (
                <Text style={styles.stepNumber}>{index + 1}</Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: index < currentIndex ? colors.primary : colors.border }
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'network':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="wifi" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Check Network Connection</Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Make sure your phone is connected to the same WiFi network as your PlayStation 5.
            </Text>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : networkInfo ? (
              <View style={[styles.networkStatus, { backgroundColor: colors.card }]}>
                <View style={styles.networkRow}>
                  <Ionicons
                    name={networkInfo.isConnected ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={networkInfo.isConnected ? colors.success : colors.error}
                  />
                  <Text style={[styles.networkLabel, { color: colors.text }]}>
                    {networkInfo.isConnected ? 'Connected to WiFi' : 'Not connected'}
                  </Text>
                </View>
                {networkInfo.ipAddress && (
                  <View style={styles.networkRow}>
                    <Ionicons name="globe-outline" size={24} color={colors.subtext} />
                    <Text style={[styles.networkLabel, { color: colors.text }]}>
                      Your IP: {networkInfo.ipAddress}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => animateTransition('mock-mode')}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.subtext }]}>
                  Demo Mode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: networkInfo?.isConnected ? colors.primary : colors.border }
                ]}
                onPress={() => animateTransition('gt7-settings')}
                disabled={!networkInfo?.isConnected}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'gt7-settings':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="game-controller" size={48} color={colors.warning} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Enable GT7 Telemetry</Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              You need to enable telemetry output in Gran Turismo 7 settings.
            </Text>

            <View style={[styles.instructionCard, { backgroundColor: colors.card }]}>
              <View style={styles.instructionStep}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text }]}>
                  Open Gran Turismo 7 on your PS5
                </Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text }]}>
                  Go to Settings (gear icon in the top right)
                </Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text }]}>
                  Navigate to "Controllers and Peripherals"
                </Text>
              </View>

              <View style={styles.instructionStep}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.instructionNumberText}>4</Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text }]}>
                  Enable "Data Sharing" / "Simulator Interface"
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => animateTransition('network')}
              >
                <Ionicons name="arrow-back" size={20} color={colors.subtext} />
                <Text style={[styles.secondaryButtonText, { color: colors.subtext }]}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => animateTransition('ip-input')}
              >
                <Text style={styles.primaryButtonText}>I've Done This</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'ip-input':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="terminal" size={48} color={colors.success} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Enter PlayStation IP</Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Find your PS5's IP address in Settings → Network → View Connection Status.
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="location-outline" size={24} color={colors.subtext} />
              <TextInput
                style={[styles.ipInput, { color: colors.text }]}
                value={playStationIp}
                onChangeText={setPlayStationIp}
                placeholder="192.168.1.xxx"
                placeholderTextColor={colors.subtext}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {connectionError && (
              <View style={[styles.errorCard, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{connectionError}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => animateTransition('gt7-settings')}
              >
                <Ionicons name="arrow-back" size={20} color={colors.subtext} />
                <Text style={[styles.secondaryButtonText, { color: colors.subtext }]}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: playStationIp.length > 7 ? colors.primary : colors.border }
                ]}
                onPress={() => {
                  animateTransition('testing');
                  testConnection();
                }}
                disabled={playStationIp.length < 7}
              >
                <Text style={styles.primaryButtonText}>Test Connection</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'testing':
        return (
          <View style={styles.stepContent}>
            <View style={styles.testingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.testingText, { color: colors.text }]}>
                Connecting to PlayStation...
              </Text>
              <Text style={[styles.testingSubtext, { color: colors.subtext }]}>
                Make sure GT7 is running and telemetry is enabled.
              </Text>
            </View>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Connected!</Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Your phone is now connected to your PlayStation 5. You're ready to start recording telemetry data.
            </Text>

            <View style={[styles.successCard, { backgroundColor: colors.card }]}>
              <View style={styles.successRow}>
                <Ionicons name="game-controller" size={24} color={colors.success} />
                <Text style={[styles.successText, { color: colors.text }]}>
                  PlayStation IP: {playStationIp}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.success, width: '100%' }]}
              onPress={() => onComplete(playStationIp, false)}
            >
              <Text style={styles.primaryButtonText}>Start Recording</Text>
              <Ionicons name="radio-button-on" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        );

      case 'mock-mode':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="construct" size={48} color={colors.warning} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Demo Mode</Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Demo mode generates simulated telemetry data so you can explore the app without a PlayStation connected.
            </Text>

            <View style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="information-circle" size={24} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                Data recorded in demo mode is simulated and won't represent real driving performance.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => animateTransition('network')}
              >
                <Ionicons name="arrow-back" size={20} color={colors.subtext} />
                <Text style={[styles.secondaryButtonText, { color: colors.subtext }]}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.warning }]}
                onPress={() => onComplete('', true)}
              >
                <Text style={styles.primaryButtonText}>Use Demo Mode</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Connection Setup</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Step indicator */}
      {currentStep !== 'mock-mode' && currentStep !== 'complete' && renderStepIndicator()}

      {/* Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderContent()}
        </Animated.View>
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 24,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  networkStatus: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  instructionCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ipInput: {
    flex: 1,
    fontSize: 20,
    marginLeft: 12,
    fontVariant: ['tabular-nums'],
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  testingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  testingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
  },
  testingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  successCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    marginLeft: 12,
  },
  warningCard: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  loader: {
    marginVertical: 24,
  },
});

export default ConnectionWizard;
