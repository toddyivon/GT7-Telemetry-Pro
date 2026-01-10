'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Stack,
  Divider,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Timer as TimerIcon,
  Flag as FlagIcon,
  EmojiEvents as TrophyIcon,
  DirectionsCar as CarIcon,
  Route as RouteIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import FollowButton from './FollowButton';
import SessionCard from './SessionCard';
import ShareModal from './ShareModal';
import { SocialUser, SessionWithSocial, useSocialStore, formatLapTime } from '@/lib/stores/socialStore';

interface UserProfileProps {
  userId: string;
  isOwnProfile?: boolean;
}

type ProfileTab = 'sessions' | 'stats' | 'achievements';

// Mock user data
const mockUserProfile: SocialUser = {
  id: 'user-1',
  name: 'Alex Rodriguez',
  pilotName: 'SpeedDemon_GT7',
  avatar: undefined,
  isFollowing: false,
  followersCount: 1247,
  followingCount: 89,
  stats: {
    totalSessions: 342,
    bestLapTime: '1:22.456',
    favoriteTrack: 'Nurburgring GP',
    totalLaps: 4892,
    totalDistance: 24560,
    podiums: 87,
    wins: 34,
  },
  bio: 'Passionate sim racer since 2018. Always chasing the perfect lap. GT3 class specialist with a love for endurance racing.',
  joinDate: 'March 2024',
  isVerified: true,
  badges: ['Track Master', 'Endurance Specialist', 'Clean Racer', 'Top 100'],
};

const mockSessions: SessionWithSocial[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    userName: 'SpeedDemon',
    trackName: 'Nurburgring GP',
    carModel: 'Porsche 911 GT3 RS',
    sessionDate: Date.now() - 3600000,
    sessionType: 'time_trial',
    bestLapTime: 82456,
    lapCount: 15,
    isPublic: true,
    likeCount: 42,
    commentCount: 8,
    shareCount: 5,
    isLiked: false,
    tags: ['personal best', 'clean lap'],
  },
  {
    id: 'session-2',
    userId: 'user-1',
    userName: 'SpeedDemon',
    trackName: 'Suzuka Circuit',
    carModel: 'McLaren 720S GT3',
    sessionDate: Date.now() - 86400000,
    sessionType: 'qualifying',
    bestLapTime: 95234,
    lapCount: 8,
    isPublic: true,
    likeCount: 28,
    commentCount: 12,
    shareCount: 3,
    isLiked: true,
    tags: ['qualifying'],
  },
];

interface StatBoxProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  color?: string;
}

function StatBox({ icon, label, value, color }: StatBoxProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: color || 'primary.main', mb: 1 }}>{icon}</Box>
      <Typography variant="headlineSmall" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="bodySmall" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function UserProfile({ userId, isOwnProfile = false }: UserProfileProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>('sessions');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SocialUser | null>(null);
  const [sessions, setSessions] = useState<SessionWithSocial[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithSocial | null>(null);

  const { loadProfile, loadProfileSessions, viewingProfile, profileSessions } = useSocialStore();

  useEffect(() => {
    // Simulate loading profile
    setIsLoading(true);
    setTimeout(() => {
      setUser(mockUserProfile);
      setSessions(mockSessions);
      setIsLoading(false);
    }, 800);
  }, [userId]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: ProfileTab) => {
    setActiveTab(newValue);
  };

  const handleShareClick = (session: SessionWithSocial) => {
    setSelectedSession(session);
    setShareModalOpen(true);
  };

  if (isLoading) {
    return (
      <Box>
        {/* Profile Header Skeleton */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Skeleton variant="circular" width={120} height={120} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="40%" height={40} />
                <Skeleton width="20%" />
                <Skeleton width="60%" />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Stats Skeleton */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="headlineMedium" color="text.secondary">
          User not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Profile Header */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{ mb: 3 }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: { xs: 'center', sm: 'flex-start' } }}>
            {/* Avatar */}
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{
                width: 120,
                height: 120,
                border: `4px solid ${theme.palette.primary.main}`,
                boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>

            {/* User Info */}
            <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, mb: 0.5 }}>
                <Typography variant="headlineMedium" sx={{ fontWeight: 700 }}>
                  {user.name}
                </Typography>
                {user.isVerified && (
                  <VerifiedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                )}
              </Box>

              <Typography variant="titleMedium" color="text.secondary" sx={{ mb: 1 }}>
                @{user.pilotName}
              </Typography>

              {user.bio && (
                <Typography variant="bodyMedium" color="text.secondary" sx={{ mb: 2, maxWidth: 500 }}>
                  {user.bio}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 3, mb: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="titleLarge" sx={{ fontWeight: 700 }}>
                    {user.followersCount.toLocaleString()}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary">
                    Followers
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="titleLarge" sx={{ fontWeight: 700 }}>
                    {user.followingCount.toLocaleString()}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary">
                    Following
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="titleLarge" sx={{ fontWeight: 700 }}>
                    {user.stats.totalSessions}
                  </Typography>
                  <Typography variant="bodySmall" color="text.secondary">
                    Sessions
                  </Typography>
                </Box>
              </Box>

              {/* Badges */}
              {user.badges && user.badges.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  {user.badges.map((badge, index) => (
                    <Chip
                      key={index}
                      label={badge}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    component={Link}
                    href="/settings/profile"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<SettingsIcon />}
                    component={Link}
                    href="/settings"
                  >
                    Settings
                  </Button>
                </>
              ) : (
                <FollowButton
                  userId={user.id}
                  isFollowing={user.isFollowing || false}
                  size="large"
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatBox
              icon={<TimerIcon />}
              label="Best Lap"
              value={user.stats.bestLapTime}
              color={theme.palette.success.main}
            />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <StatBox
              icon={<FlagIcon />}
              label="Total Laps"
              value={user.stats.totalLaps.toLocaleString()}
            />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <StatBox
              icon={<RouteIcon />}
              label="Distance (km)"
              value={user.stats.totalDistance.toLocaleString()}
            />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <StatBox
              icon={<TrophyIcon />}
              label="Wins"
              value={user.stats.wins}
              color={theme.palette.warning.main}
            />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <StatBox
              icon={<TrophyIcon />}
              label="Podiums"
              value={user.stats.podiums}
              color={theme.palette.info.main}
            />
          </motion.div>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <StatBox
              icon={<CarIcon />}
              label="Favorite Track"
              value={user.stats.favoriteTrack}
            />
          </motion.div>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            <Tab value="sessions" label="Sessions" />
            <Tab value="stats" label="Detailed Stats" />
            <Tab value="achievements" label="Achievements" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {activeTab === 'sessions' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {sessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="bodyLarge" color="text.secondary">
                    No public sessions yet
                  </Typography>
                </Box>
              ) : (
                sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    showUser={false}
                    onShareClick={() => handleShareClick(session)}
                  />
                ))
              )}
            </Box>
          )}

          {activeTab === 'stats' && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="bodyLarge" color="text.secondary">
                Detailed statistics coming soon...
              </Typography>
            </Box>
          )}

          {activeTab === 'achievements' && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="bodyLarge" color="text.secondary">
                Achievements coming soon...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      {selectedSession && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
        />
      )}
    </Box>
  );
}
