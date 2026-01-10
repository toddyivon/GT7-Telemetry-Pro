'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Avatar,
  Typography,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  DirectionsCar as CarIcon,
  Flag as FlagIcon,
  MoreVert as MoreVertIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SessionWithSocial, useSocialStore, formatLapTime, formatRelativeTime, formatSessionType } from '@/lib/stores/socialStore';

interface SessionCardProps {
  session: SessionWithSocial;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  showUser?: boolean;
  compact?: boolean;
}

export default function SessionCard({
  session,
  onCommentClick,
  onShareClick,
  showUser = true,
  compact = false,
}: SessionCardProps) {
  const theme = useTheme();
  const [isLiking, setIsLiking] = useState(false);
  const { likeSession, unlikeSession } = useSocialStore();

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;

    setIsLiking(true);
    try {
      if (session.isLiked) {
        await unlikeSession(session.id);
      } else {
        await likeSession(session.id);
      }
    } catch (error) {
      console.error('Like action failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const getSessionTypeColor = (type: string) => {
    const colors: Record<string, 'success' | 'warning' | 'info' | 'primary'> = {
      race: 'success',
      qualifying: 'warning',
      practice: 'info',
      time_trial: 'primary',
    };
    return colors[type] || 'default';
  };

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
          transition: 'box-shadow 0.2s ease-in-out',
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* User Header */}
        {showUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box
              component={Link}
              href={`/profile/${session.userId}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': {
                  '& .username': { color: 'primary.main' },
                },
              }}
            >
              <Avatar
                src={session.userAvatar}
                alt={session.userName}
                sx={{ width: 40, height: 40 }}
              >
                {session.userName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  className="username"
                  variant="titleMedium"
                  sx={{ fontWeight: 600, transition: 'color 0.2s' }}
                >
                  {session.userName}
                </Typography>
                <Typography variant="bodySmall" color="text.secondary">
                  {formatRelativeTime(session.sessionDate)}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        )}

        {/* Track and Session Info */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
              {session.trackName}
            </Typography>
            <Chip
              label={formatSessionType(session.sessionType)}
              size="small"
              color={getSessionTypeColor(session.sessionType)}
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          </Box>

          {/* Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon sx={{ color: 'success.main', fontSize: 20 }} />
              <Box>
                <Typography variant="bodySmall" color="text.secondary">
                  Best Lap
                </Typography>
                <Typography variant="titleMedium" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {formatLapTime(session.bestLapTime)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Box>
                <Typography variant="bodySmall" color="text.secondary">
                  Laps
                </Typography>
                <Typography variant="titleMedium" sx={{ fontWeight: 600 }}>
                  {session.lapCount}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CarIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
              <Box>
                <Typography variant="bodySmall" color="text.secondary">
                  Car
                </Typography>
                <Typography
                  variant="titleMedium"
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 120,
                  }}
                >
                  {session.carModel}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tags */}
        {session.tags && session.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
            {session.tags.map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                }}
              />
            ))}
          </Stack>
        )}

        {/* Notes */}
        {session.notes && !compact && (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {session.notes}
          </Typography>
        )}
      </CardContent>

      <Divider />

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={session.isLiked ? 'Unlike' : 'Like'}>
            <IconButton
              onClick={handleLikeClick}
              disabled={isLiking}
              sx={{
                color: session.isLiked ? 'error.main' : 'action.active',
                '&:hover': { color: 'error.main' },
              }}
            >
              {session.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>
          <Typography variant="bodySmall" color="text.secondary">
            {session.likeCount}
          </Typography>

          <Tooltip title="Comments">
            <IconButton onClick={onCommentClick}>
              <CommentIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="bodySmall" color="text.secondary">
            {session.commentCount}
          </Typography>

          <Tooltip title="Share">
            <IconButton onClick={onShareClick}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="bodySmall" color="text.secondary">
            {session.shareCount}
          </Typography>
        </Box>

        <Tooltip title="View Analysis">
          <IconButton
            component={Link}
            href={`/analysis/${session.id}`}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <AnalyticsIcon color="primary" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
