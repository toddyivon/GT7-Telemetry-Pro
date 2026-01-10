'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Flag as FlagIcon,
  Repeat as RepeatIcon,
  Star as StarIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Lock as LockIcon,
  Speed as SpeedIcon,
  NightlightRound as NightIcon,
  PlayCircle as PlayCircleIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
type AchievementCategory = 'laps' | 'tracks' | 'consistency' | 'improvement' | 'social' | 'analysis' | 'special';

interface AchievementBadgeProps {
  achievementId: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  tier: AchievementTier;
  points: number;
  isUnlocked?: boolean;
  unlockedAt?: number;
  progress?: {
    current: number;
    target: number;
  };
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

const tierColors: Record<AchievementTier, { primary: string; secondary: string; glow: string }> = {
  bronze: {
    primary: '#CD7F32',
    secondary: '#8B4513',
    glow: 'rgba(205, 127, 50, 0.3)',
  },
  silver: {
    primary: '#C0C0C0',
    secondary: '#A0A0A0',
    glow: 'rgba(192, 192, 192, 0.3)',
  },
  gold: {
    primary: '#FFD700',
    secondary: '#FFA500',
    glow: 'rgba(255, 215, 0, 0.4)',
  },
  platinum: {
    primary: '#E5E4E2',
    secondary: '#B8B8B8',
    glow: 'rgba(229, 228, 226, 0.5)',
  },
};

const iconMap: Record<string, React.ReactElement> = {
  flag: <FlagIcon />,
  repeat: <RepeatIcon />,
  star: <StarIcon />,
  map: <MapIcon />,
  timeline: <TimelineIcon />,
  trending_up: <TrendingUpIcon />,
  people: <PeopleIcon />,
  analytics: <AnalyticsIcon />,
  speed: <SpeedIcon />,
  nightlight: <NightIcon />,
  play_circle: <PlayCircleIcon />,
  local_fire_department: <FireIcon />,
};

const sizeConfig = {
  small: {
    badgeSize: 48,
    iconSize: 20,
    fontSize: '0.75rem',
  },
  medium: {
    badgeSize: 64,
    iconSize: 28,
    fontSize: '0.875rem',
  },
  large: {
    badgeSize: 80,
    iconSize: 36,
    fontSize: '1rem',
  },
};

export default function AchievementBadge({
  achievementId,
  name,
  description,
  category,
  icon,
  tier,
  points,
  isUnlocked = false,
  unlockedAt,
  progress,
  size = 'medium',
  showDetails = true,
}: AchievementBadgeProps) {
  const theme = useTheme();
  const colors = tierColors[tier];
  const sizeConf = sizeConfig[size];
  const IconComponent = iconMap[icon] || <StarIcon />;

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const progressPercentage = progress
    ? Math.min(100, (progress.current / progress.target) * 100)
    : 0;

  const tooltipContent = (
    <Box sx={{ p: 1, textAlign: 'center', maxWidth: 200 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {description}
      </Typography>
      <Typography variant="caption" sx={{ color: colors.primary, fontWeight: 600 }}>
        +{points} points
      </Typography>
      {isUnlocked && unlockedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Unlocked: {formatDate(unlockedAt)}
        </Typography>
      )}
      {!isUnlocked && progress && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Progress: {progress.current}/{progress.target}
        </Typography>
      )}
    </Box>
  );

  const BadgeContent = (
    <motion.div
      initial={false}
      animate={isUnlocked ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          position: 'relative',
          width: sizeConf.badgeSize,
          height: sizeConf.badgeSize,
          borderRadius: '50%',
          background: isUnlocked
            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.3)} 0%, ${alpha(theme.palette.grey[600], 0.3)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isUnlocked
            ? `0 4px 12px ${colors.glow}, inset 0 2px 4px rgba(255,255,255,0.2)`
            : 'none',
          border: isUnlocked
            ? `2px solid ${alpha(colors.primary, 0.5)}`
            : `2px solid ${alpha(theme.palette.grey[400], 0.3)}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: isUnlocked
              ? `0 6px 16px ${colors.glow}`
              : `0 2px 8px rgba(0,0,0,0.1)`,
          },
        }}
      >
        {isUnlocked ? (
          React.cloneElement(IconComponent, {
            sx: {
              fontSize: sizeConf.iconSize,
              color: tier === 'bronze' || tier === 'gold' ? '#fff' : '#333',
            },
          })
        ) : (
          <LockIcon
            sx={{
              fontSize: sizeConf.iconSize * 0.8,
              color: alpha(theme.palette.grey[500], 0.5),
            }}
          />
        )}

        {/* Progress ring for locked achievements */}
        {!isUnlocked && progress && progressPercentage > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: '50%',
              background: `conic-gradient(${theme.palette.primary.main} ${progressPercentage}%, transparent ${progressPercentage}%)`,
              opacity: 0.5,
              zIndex: -1,
            }}
          />
        )}
      </Box>
    </motion.div>
  );

  if (!showDetails) {
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        {BadgeContent}
      </Tooltip>
    );
  }

  return (
    <Tooltip title={!isUnlocked ? tooltipContent : ''} arrow placement="top">
      <Card
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: isUnlocked
            ? alpha(colors.primary, 0.05)
            : alpha(theme.palette.grey[500], 0.05),
          border: `1px solid ${isUnlocked ? alpha(colors.primary, 0.2) : alpha(theme.palette.divider, 0.5)}`,
          opacity: isUnlocked ? 1 : 0.7,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        {BadgeContent}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: isUnlocked ? 'text.primary' : 'text.secondary',
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {description}
          </Typography>
          {!isUnlocked && progress && (
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.grey[500], 0.2),
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    bgcolor: 'primary.main',
                    borderRadius: 2,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {progress.current}/{progress.target}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{
              color: isUnlocked ? colors.primary : 'text.disabled',
              fontWeight: 600,
            }}
          >
            +{points}
          </Typography>
          {isUnlocked && unlockedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {formatDate(unlockedAt)}
            </Typography>
          )}
        </Box>
      </Card>
    </Tooltip>
  );
}
