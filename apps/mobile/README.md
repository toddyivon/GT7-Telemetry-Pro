# GT7 Telemetry Mobile App

This is the mobile companion app for the GT7 Data Analysis platform. The app connects to your PlayStation over the local network to capture telemetry data during gameplay sessions.

## Features

- Connect to PS5/PS4 running Gran Turismo 7 via UDP
- Real-time telemetry data display
- Automatic lap detection and recording
- Local storage of telemetry sessions
- Upload data to web platform for advanced analysis
- Basic lap time and performance analysis on device
- Compare current lap with your best lap

## Setup

1. Make sure your PlayStation is on the same network as your mobile device
2. Enable UDP output in GT7 settings
3. Install and run the app
4. Enter the IP address of your PlayStation
5. Start recording!

## Development

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Troubleshooting TypeScript Errors

If you encounter type declaration errors during development, you may need to install additional type definitions:

```bash
# Install required type declarations
npm install --save-dev @types/expo @types/expo-network
npm install --save-dev @types/react-native-async-storage
npm install --save-dev @types/react-native-vector-icons @types/react-navigation
```

For modules that don't have official type declarations, you can create custom type declarations in a `declarations.d.ts` file in the project root:

```typescript
// declarations.d.ts
declare module 'expo-network';
declare module '@react-native-async-storage/async-storage';
declare module '@expo/vector-icons';
```
