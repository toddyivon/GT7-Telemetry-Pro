# GT7 Data Analysis Platform

A comprehensive platform for capturing and analyzing telemetry data from Gran Turismo 7. The solution consists of two main components:

1. **Mobile App** - Captures real-time telemetry data from PlayStation via UDP, detects laps, and stores sessions locally
2. **Web Platform** - Provides advanced analysis of telemetry data, including lap comparisons, fuel efficiency analysis, and performance insights

## Project Overview

### Objective
- Capture real-time telemetry data from Gran Turismo 7 on PlayStation 5
- Detect and analyze laps for detailed performance insights
- Provide an easy-to-use mobile interface for recording sessions
- Offer comprehensive analysis tools on the web platform
- Support multiple cars and tracks with specialized analytics

### Core Features

#### Mobile App
- Real-time UDP telemetry capture from PlayStation
- Automatic lap detection using multiple algorithms
- Local storage of telemetry sessions
- Session management and upload to web platform
- Works in demo mode without PlayStation connection

#### Web Platform
- Detailed session and lap analysis
- Lap comparison with visual telemetry overlays
- Fuel efficiency and consumption analysis
- Performance insights and improvement suggestions
- Track maps and position visualization

## Technologies Used

### Mobile App
- **Framework**: React Native with Expo
- **State Management**: Zustand
- **Storage**: AsyncStorage
- **Networking**: react-native-udp
- **Navigation**: React Navigation

### Web Platform
- **Frontend**: Next.js 14 with TypeScript and React
- **UI**: Material-UI (MUI)
- **Database**: Convex.dev
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Visualization**: D3.js
- **Authentication**: NextAuth.js

## Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Expo CLI for mobile app development
- PlayStation 5 with Gran Turismo 7 (for real telemetry capture)

### Web Platform Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gt7-data-analysis.git
   cd gt7-data-analysis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration values
   ```

4. **Set up Convex database**
   ```bash
   npm install convex
   npx convex dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Mobile App Setup

1. **Navigate to the mobile app directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Expo development server**
   ```bash
   npx expo start
   ```

4. **Run on a device or emulator**
   - Scan the QR code with Expo Go app on your device, or
   - Press 'a' for Android emulator
   - Press 'i' for iOS simulator

### PlayStation 5 Setup

1. **Enable UDP Broadcasting in Gran Turismo 7**
   - Navigate to GT7 Settings
   - Find 'Display & Sound' settings
   - Enable 'Broadcast GT7 Telemetry Data'
   - Note down your PlayStation IP address from network settings

2. **Configure Mobile App**
   - Launch the GT7 Data Analysis mobile app
   - Go to the Settings tab
   - Enter your PlayStation IP address
   - Set any preferred options (sample rate, etc.)
   - Turn off Demo Mode to connect to real PlayStation data

## Project Structure

```
gt7-data-analysis/
├── src/                  # Web platform source code
│   ├── app/             # Next.js app directory
│   │   ├── api/         # API routes
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── analysis/    # Analysis pages
│   │   └── layout.tsx   # Root layout
│   ├── components/      # Shared components
│   │   ├── common/      # General UI components
│   │   ├── dashboard/   # Dashboard components
│   │   └── analysis/    # Analysis components
│   └── lib/             # Shared utilities
│       ├── api/         # API clients
│       ├── telemetry/   # Telemetry processing
│       └── stores/      # State management
├── mobile/              # Mobile app code
│   ├── src/             # Mobile app source
│   │   ├── contexts/    # React contexts
│   │   ├── screens/     # Screen components
│   │   ├── services/    # Business logic
│   │   └── stores/      # State management
│   ├── App.tsx          # Main app component
│   └── package.json     # Mobile dependencies
├── convex/              # Convex database
│   ├── schema.ts        # Database schema
│   ├── telemetry.ts     # Telemetry functions
│   └── analysis.ts      # Analysis functions
├── public/              # Static assets
├── .env.example         # Environment variables template
├── package.json         # Web dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

## Usage Guide

### Mobile App

1. **Connect to PlayStation**
   - Ensure your phone and PlayStation are on the same WiFi network
   - Launch the app and enter the PlayStation IP address
   - Tap Connect

2. **Record a Session**
   - Navigate to the Record tab
   - Enter an optional session name
   - Tap Start Recording
   - Complete laps in Gran Turismo 7
   - Tap Stop Recording when finished

3. **Manage Sessions**
   - Go to the Sessions tab to see recorded sessions
   - Upload sessions to the web platform for analysis
   - Delete unwanted sessions

### Web Platform

1. **View Dashboard**
   - See an overview of all your sessions
   - Quick stats on lap times, tracks, and cars

2. **Analyze Sessions**
   - Select a session for detailed analysis
   - View lap comparison charts
   - Analyze fuel efficiency
   - See track maps with racing lines

3. **Compare Laps**
   - Select multiple laps to compare
   - See telemetry data overlaid for direct comparison
   - Get insights on areas for improvement

## Advanced Features

### Lap Detection

The system uses multiple methods to detect laps:

- Native game lap counter changes
- Position-based detection (crossing start/finish line)
- Distance-based detection (accumulated distance matches track length)

### Telemetry Data

The following telemetry data points are captured:

- Position (x, y, z coordinates)
- Speed, gear, RPM
- Throttle and brake inputs
- Tire temperatures and wear
- Fuel level
- G-forces

## Integrations

This project integrates code and functionality from:
- [gt7dashboard](https://github.com/snipem/gt7dashboard)
- [gran-turismo-telemetry-app](https://github.com/BluesJiang/gran-turismo-telemetry-app)
- NenKai's API tools
- [pdtools](https://github.com/Nenkai/PDTools)

## License
MIT
