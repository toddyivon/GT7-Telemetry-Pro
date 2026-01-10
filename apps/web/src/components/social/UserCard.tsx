'use client';

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardActionArea,
  Box,
  Avatar,
  Typography,
  Chip,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Timer as TimerIcon,
  Flag as FlagIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import FollowButton from './FollowButton';
import { SocialUser } from '@/lib/stores/socialStore';

interface UserCardProps {
  user: SocialUser;
  showFollowButton?: boolean;
  showStats?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export default function UserCard({
  user,
  showFollowButton = true,
  showStats = true,
  compact = false,
  onClick,
}: UserCardProps) {
  const theme = useTheme();

  const content = (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={`/profile/${user.id}`}
        sx={{ height: '100%' }}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <CardContent sx={{ p: compact ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{
                width: compact ? 48 : 64,
                height: compact ? 48 : 64,
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant={compact ? 'titleMedium' : 'titleLarge'}
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </Typography>
                {user.isVerified && (
                  <VerifiedIcon
                    sx={{
                      fontSize: compact ? 16 : 20,
                      color: 'primary.main',
                    }}
                  />
                )}
              </Box>

              <Typography
                variant="bodySmall"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                @{user.pilotName}
              </Typography>

              {!compact && user.bio && (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {user.bio}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Typography variant="bodySmall" color="text.secondary">
                  <strong>{user.followersCount}</strong> followers
                </Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  <strong>{user.followingCount}</strong> following
                </Typography>
              </Box>
            </Box>
          </Box>

          {showStats && !compact && (
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<TimerIcon />}
                label={user.stats.bestLapTime}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                icon={<FlagIcon />}
                label={`${user.stats.totalSessions} sessions`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                icon={<TrophyIcon />}
                label={`${user.stats.wins} wins`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Stack>
          )}

          {user.badges && user.badges.length > 0 && !compact && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              {user.badges.slice(0, 3).map((badge, index) => (
                <Chip
                  key={index}
                  label={badge}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{
                    fontSize: '0.65rem',
                    height: 20,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                />
              ))}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>

      {showFollowButton && (
        <Box
          sx={{
            px: compact ? 2 : 3,
            pb: compact ? 2 : 3,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <FollowButton
            userId={user.id}
            isFollowing={user.isFollowing || false}
            size={compact ? 'small' : 'medium'}
            fullWidth
          />
        </Box>
      )}
    </Card>
  );

  return content;
}
