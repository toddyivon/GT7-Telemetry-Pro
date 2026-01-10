'use client';

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Breadcrumbs,
  Link as MuiLink,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  RssFeed as FeedIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SocialFeed from '@/components/social/SocialFeed';
import LeaderboardWidget from '@/components/social/LeaderboardWidget';
import UserCard from '@/components/social/UserCard';
import { SocialUser } from '@/lib/stores/socialStore';

// Mock suggested users
const suggestedUsers: SocialUser[] = [
  {
    id: 'user-5',
    name: 'FastLane Pro',
    pilotName: 'FastLane_Pro',
    followersCount: 2341,
    followingCount: 156,
    isFollowing: false,
    stats: {
      totalSessions: 567,
      bestLapTime: '1:18.234',
      favoriteTrack: 'Spa-Francorchamps',
      totalLaps: 7823,
      totalDistance: 39115,
      podiums: 123,
      wins: 67,
    },
    joinDate: 'January 2024',
    isVerified: true,
    badges: ['Track Master'],
  },
  {
    id: 'user-6',
    name: 'RacingRookie',
    pilotName: 'Racing_Rookie_21',
    followersCount: 234,
    followingCount: 89,
    isFollowing: false,
    stats: {
      totalSessions: 45,
      bestLapTime: '1:32.456',
      favoriteTrack: 'Suzuka Circuit',
      totalLaps: 456,
      totalDistance: 2280,
      podiums: 5,
      wins: 1,
    },
    joinDate: 'December 2024',
    badges: ['Rising Star'],
  },
  {
    id: 'user-7',
    name: 'EnduranceKing',
    pilotName: 'Endurance_King',
    followersCount: 1567,
    followingCount: 234,
    isFollowing: false,
    stats: {
      totalSessions: 234,
      bestLapTime: '1:25.789',
      favoriteTrack: 'Le Mans Circuit',
      totalLaps: 12456,
      totalDistance: 74736,
      podiums: 89,
      wins: 23,
    },
    joinDate: 'June 2024',
    isVerified: true,
    badges: ['Endurance Specialist', 'Marathon Runner'],
  },
];

export default function FeedPage() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3 }}
        >
          <MuiLink
            component={Link}
            href="/dashboard"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <HomeIcon fontSize="small" />
            Dashboard
          </MuiLink>
          <Typography color="text.primary">Feed</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FeedIcon color="primary" />
            <Typography variant="headlineLarge" sx={{ fontWeight: 600 }}>
              Social Feed
            </Typography>
          </Box>
          <Typography variant="bodyLarge" color="text.secondary">
            See what the racing community is up to
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Main Feed */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SocialFeed showTabs />
            </motion.div>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              {/* Leaderboard Widget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Box sx={{ mb: 3 }}>
                  <LeaderboardWidget limit={5} compact />
                </Box>
              </motion.div>

              {/* Suggested Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="titleLarge" sx={{ fontWeight: 600, mb: 2 }}>
                      Suggested Racers
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {suggestedUsers.map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                        >
                          <UserCard user={user} compact showStats={false} />
                        </motion.div>
                      ))}
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <MuiLink
                        component={Link}
                        href="/discover"
                        sx={{
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Discover more racers
                      </MuiLink>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
