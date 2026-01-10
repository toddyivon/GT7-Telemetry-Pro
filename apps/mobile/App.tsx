import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import RecordScreen from './src/screens/RecordScreen';
import SessionsScreen from './src/screens/SessionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen, { User } from './src/screens/LoginScreen';
import TelemetryContextProvider from './src/contexts/TelemetryContext';
import { useTelemetryStore } from './src/stores/telemetryStore';
import { ThemeContext, lightTheme, darkTheme, Theme } from './src/theme';
import { databaseService } from './src/services/DatabaseService';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom navigation themes
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976D2',
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#333333',
    border: '#E0E0E0',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#42A5F5',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
  },
};

// Auth context for managing user state
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

// Main tab navigator
function MainTabs() {
  const isConnected = useTelemetryStore((state) => state.isConnected);
  const { theme, isDark } = React.useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Record') {
            iconName = focused ? 'radio-button-on' : 'radio-button-off';
          } else if (route.name === 'Sessions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? '#888888' : '#999999',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'GT7 Telemetry',
          tabBarBadge: isConnected ? undefined : undefined,
          tabBarBadgeStyle: isConnected ? { backgroundColor: '#4CAF50' } : undefined,
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          title: 'Record Session',
        }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{
          title: 'My Sessions',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

// Loading screen component
function LoadingScreen({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={[
        styles.loadingContainer,
        { backgroundColor: isDark ? '#121212' : '#F5F5F5' },
      ]}
    >
      <ActivityIndicator size="large" color={isDark ? '#42A5F5' : '#1976D2'} />
    </View>
  );
}

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<Theme>(lightTheme);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hasSkippedLogin, setHasSkippedLogin] = useState(false);

  // App initialization state
  const [isAppReady, setIsAppReady] = useState(false);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      AsyncStorage.setItem('theme_dark_mode', newValue.toString());
      setTheme(newValue ? darkTheme : lightTheme);
      return newValue;
    });
  }, []);

  // Set dark mode explicitly
  const setDarkMode = useCallback((dark: boolean) => {
    setIsDark(dark);
    AsyncStorage.setItem('theme_dark_mode', dark.toString());
    setTheme(dark ? darkTheme : lightTheme);
  }, []);

  // Auth functions
  const signIn = useCallback(async (newUser: User) => {
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    await AsyncStorage.setItem('has_skipped_login', 'false');
    setHasSkippedLogin(false);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('auth_token');
  }, []);

  // Skip login
  const handleSkipLogin = useCallback(async () => {
    setHasSkippedLogin(true);
    await AsyncStorage.setItem('has_skipped_login', 'true');
  }, []);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load theme preference
        const savedTheme = await AsyncStorage.getItem('theme_dark_mode');
        if (savedTheme === 'true') {
          setIsDark(true);
          setTheme(darkTheme);
        }

        // Load user data
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Check if user has skipped login before
        const skippedLogin = await AsyncStorage.getItem('has_skipped_login');
        if (skippedLogin === 'true') {
          setHasSkippedLogin(true);
        }

        // Initialize database
        await databaseService.initialize();

        setIsAuthLoading(false);
        setIsAppReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsAuthLoading(false);
        setIsAppReady(true);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      databaseService.close();
    };
  }, []);

  // Theme context value
  const themeContextValue = React.useMemo(
    () => ({
      theme,
      isDark,
      toggleTheme,
      setDarkMode,
    }),
    [theme, isDark, toggleTheme, setDarkMode]
  );

  // Auth context value
  const authContextValue = React.useMemo(
    () => ({
      user,
      isLoading: isAuthLoading,
      signIn,
      signOut,
    }),
    [user, isAuthLoading, signIn, signOut]
  );

  // Show loading screen while initializing
  if (!isAppReady) {
    return <LoadingScreen isDark={isDark} />;
  }

  // Show login screen if not authenticated and hasn't skipped
  const showLogin = !user && !hasSkippedLogin;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={themeContextValue}>
        <AuthContext.Provider value={authContextValue}>
          <TelemetryContextProvider>
            <NavigationContainer theme={isDark ? CustomDarkTheme : CustomLightTheme}>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              {showLogin ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Login">
                    {(props) => (
                      <LoginScreen
                        {...props}
                        onLoginSuccess={signIn}
                        onSkip={handleSkipLogin}
                      />
                    )}
                  </Stack.Screen>
                </Stack.Navigator>
              ) : (
                <MainTabs />
              )}
            </NavigationContainer>
          </TelemetryContextProvider>
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
