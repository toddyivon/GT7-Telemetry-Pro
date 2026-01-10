'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  LinearProgress,
  Chip,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import AchievementBadge from './AchievementBadge';

type AchievementCategory = 'laps' | 'tracks' | 'consistency' | 'improvement' | 'social' | 'analysis' | 'special';
type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  tier: AchievementTier;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  progress?: {
    current: number;
    target: number;
  };
}

interface AchievementsListProps {
  achievements: Achievement[];
  stats?: {
    unlocked: number;
    total: number;
    percentage: number;
    totalPoints: number;
  };
  loading?: boolean;
  showFilters?: boolean;
}

const categoryLabels: Record<AchievementCategory | 'all', string> = {
  all: 'All',
  laps: 'Laps',
  tracks: 'Tracks',
  consistency: 'Consistency',
  improvement: 'Improvement',
  social: 'Social',
  analysis: 'Analysis',
  special: 'Special',
};

export default function AchievementsList({
  achievements,
  stats,
  loading = false,
  showFilters = true,
}: AchievementsListProps) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: AchievementCategory | 'all') => {
    setSelectedCategory(newValue);
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    if (showUnlockedOnly && !achievement.isUnlocked) {
      return false;
    }
    return true;
  });

  // Sort: unlocked first, then by tier (platinum > gold > silver > bronze)
  const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) {
      return a.isUnlocked ? -1 : 1;
    }
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
          </Box>
          <Grid container spacing={2}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Stats Header */}
        {stats && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrophyIcon sx={{ color: 'warning.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Achievements
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={<CheckIcon />}
                  label={`${stats.unlocked}/${stats.total} Unlocked`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${stats.totalPoints.toLocaleString()} Points`}
                  color="warning"
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress
                variant="determinate"
                value={stats.percentage}
                sx={{
                  flex: 1,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.warning.main} 100%)`,
                  },
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 50 }}>
                {stats.percentage}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Category Filters */}
        {showFilters && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Tabs
              value={selectedCategory}
              onChange={handleCategoryChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                flex: 1,
                minHeight: 40,
                '& .MuiTab-root': {
                  minHeight: 40,
                  py: 0.5,
                  textTransform: 'capitalize',
                },
              }}
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Tab key={key} value={key} label={label} />
              ))}
            </Tabs>
            <Chip
              icon={showUnlockedOnly ? <CheckIcon /> : <LockIcon />}
              label={showUnlockedOnly ? 'Unlocked Only' : 'Show All'}
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              color={showUnlockedOnly ? 'primary' : 'default'}
              variant={showUnlockedOnly ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}

        {/* Achievements Grid */}
        {sortedAchievements.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No achievements found
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {showUnlockedOnly
                ? 'No achievements unlocked yet in this category'
                : 'Keep racing to unlock achievements!'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            <AnimatePresence mode="popLayout">
              {sortedAchievements.map((achievement, index) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.achievementId}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <AchievementBadge
                      achievementId={achievement.achievementId}
                      name={achievement.name}
                      description={achievement.description}
                      category={achievement.category}
                      icon={achievement.icon}
                      tier={achievement.tier}
                      points={achievement.points}
                      isUnlocked={achievement.isUnlocked}
                      unlockedAt={achievement.unlockedAt}
                      progress={achievement.progress}
                      size="medium"
                      showDetails
                    />
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}

        {/* Tier Legend */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          {[
            { tier: 'bronze', color: '#CD7F32', label: 'Bronze' },
            { tier: 'silver', color: '#C0C0C0', label: 'Silver' },
            { tier: 'gold', color: '#FFD700', label: 'Gold' },
            { tier: 'platinum', color: '#E5E4E2', label: 'Platinum' },
          ].map(({ tier, color, label }) => (
            <Box key={tier} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: color,
                  border: `1px solid ${alpha(color, 0.5)}`,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
