# GT7 Telemetry Pro

A professional telemetry analysis platform for Gran Turismo 7, combining real-time data capture from PlayStation 5 with advanced analytics and social features.

## Features

### Mobile App (React Native/Expo)
- **Real-time UDP Telemetry Capture** - Connect directly to GT7 on PS5 via WiFi
- **Salsa20 Packet Decryption** - Full implementation of GT7's encryption protocol
- **Live Telemetry Display** - Speed, RPM, gear, throttle/brake, tire temps
- **Session Recording** - Record and save complete telemetry sessions
- **Lap Detection** - Automatic lap detection with sector timing
- **Cloud Sync** - Upload sessions to your account for detailed analysis

### Web Dashboard (Next.js 14)
- **Session Analysis** - Detailed lap-by-lap breakdown with telemetry graphs
- **Racing Line Visualization** - 3D track visualization with optimal line comparison
- **Tire Performance Analysis** - Temperature, wear, and grip analysis
- **Fuel Strategy Calculator** - Pit stop planning and fuel management
- **Lap Comparison** - Compare laps side-by-side with delta analysis

### Social Features
- **Leaderboards** - Global and track-specific rankings
- **User Profiles** - Showcase your achievements and stats
- **Social Feed** - Follow other racers, like and comment on sessions
- **Achievements** - Unlock badges and track your progress
- **Session Sharing** - Share sessions to Twitter, Discord, and more

### Subscription Tiers
- **Free** - 5 sessions/month, basic analysis, community access
- **Premium** - Unlimited sessions, advanced analysis, priority support
- **Pro** - All features + racing line overlay, AI coaching, team management

## Tech Stack

- **Frontend**: Next.js 14, React 18, Material-UI v5, D3.js
- **Mobile**: React Native 0.72, Expo SDK 49
- **Backend**: Convex.dev (serverless database)
- **Auth**: JWT with bcrypt
- **Payments**: Stripe
- **State**: Zustand, React Query

## Project Structure

```
GT7_SaaS/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── lib/           # Utilities and services
│   │   │   └── types/         # TypeScript types
│   │   └── convex/            # Convex backend functions
│   └── mobile/                 # React Native mobile app
│       └── src/
│           ├── screens/       # App screens
│           ├── components/    # Mobile components
│           ├── services/      # GT7 telemetry service
│           └── contexts/      # React contexts
└── packages/                   # Shared packages (future)
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account (https://convex.dev)
- Stripe account (for payments)

### 1. Clone and Install

```bash
git clone <repository-url>
cd GT7_SaaS

# Install dependencies
npm install
```

### 2. Environment Setup

#### Web App (.env.local)

Create `apps/web/.env.local`:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Auth
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRATION=7d
SESSION_COOKIE_NAME=gt7_session

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Mobile App (.env)

Create `apps/mobile/.env`:

```env
# PlayStation connection
PS5_IP=192.168.1.XXX

# API
API_URL=http://localhost:3000
CONVEX_URL=https://your-project.convex.cloud

# Telemetry
TELEMETRY_UDP_PORT=33740
TELEMETRY_SAMPLE_RATE=10
```

### 3. Database Setup (Convex)

```bash
# Install Convex CLI
npm install -g convex

# Login to Convex
npx convex login

# Initialize and deploy
cd apps/web
npx convex dev
```

### 4. Run Development

#### Web App

```bash
cd apps/web
npm run dev
# Open http://localhost:3000
```

#### Mobile App

```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go app
```

## GT7 Connection Setup

### Enable GT7 Telemetry

1. In Gran Turismo 7, go to **Settings**
2. Navigate to **Network** settings
3. Enable **Data Output** for telemetry
4. Note your PlayStation 5's IP address

### Mobile App Configuration

1. Open the GT7 Telemetry Pro app
2. Go to **Settings**
3. Enter your PlayStation 5 IP address
4. Tap **Connect**
5. Start a session in GT7 and tap **Record**

### Network Requirements

- Both devices must be on the same WiFi network
- UDP port 33740 must be accessible
- No VPN or firewall blocking UDP traffic

## API Routes

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Sessions
- `GET /api/sessions` - List user sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/[id]` - Get session details
- `POST /api/sessions/[id]/telemetry` - Upload telemetry data

### Stripe
- `POST /api/stripe/create-checkout-session` - Start subscription checkout
- `POST /api/stripe/create-portal-session` - Open billing portal
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/stripe/get-subscription` - Get subscription status

## Convex Functions

### Users
- `users.createUser` - Create new user
- `users.getUserById` - Get user by ID
- `users.updateUser` - Update user profile
- `users.searchUsers` - Search users

### Sessions
- `sessions.createSession` - Create telemetry session
- `sessions.getUserSessions` - Get user's sessions
- `sessions.getPublicSessions` - Get public sessions

### Social
- `social.followUser` / `unfollowUser` - Follow system
- `social.likeSession` - Like sessions
- `social.commentOnSession` - Comments
- `social.getNotifications` - Notifications

### Leaderboard
- `leaderboard.getTrackLeaderboard` - Track rankings
- `leaderboard.getUserRank` - User ranking
- `leaderboard.getAchievements` - User achievements

## Development

### Code Style

The project uses:
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode

```bash
# Lint
npm run lint

# Type check
npm run typecheck
```

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Deployment

### Web App (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Mobile App (Expo)

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Troubleshooting

### "Cannot connect to PlayStation"

1. Verify PS5 IP address is correct
2. Ensure both devices are on same network
3. Check if GT7 Data Output is enabled
4. Try restarting GT7 and the app

### "Telemetry not updating"

1. GT7 only sends data during gameplay (not menus)
2. Start a time trial or race session
3. Check network connectivity

### "Session upload failed"

1. Check internet connection
2. Verify Convex is running
3. Check API URL in mobile settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: Report bugs and feature requests
- Discord: Join our community server
- Email: support@gt7telemetrypro.com
