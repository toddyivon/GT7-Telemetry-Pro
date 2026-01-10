'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Divider,
  Chip,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  PersonAdd as PersonAddIcon,
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  Leaderboard as LeaderboardIcon,
  AlternateEmail as MentionIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification, useSocialStore, formatRelativeTime } from '@/lib/stores/socialStore';

interface NotificationBellProps {
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
}

export default function NotificationBell({ color = 'inherit' }: NotificationBellProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const {
    notifications,
    unreadNotificationCount,
    notificationsLoading,
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useSocialStore();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification.id);
    }
    handleClose();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const icons: Record<Notification['type'], React.ReactElement> = {
      follow: <PersonAddIcon sx={{ color: 'primary.main' }} />,
      like: <FavoriteIcon sx={{ color: 'error.main' }} />,
      comment: <CommentIcon sx={{ color: 'info.main' }} />,
      reply: <CommentIcon sx={{ color: 'info.main' }} />,
      mention: <MentionIcon sx={{ color: 'secondary.main' }} />,
      session_shared: <ShareIcon sx={{ color: 'success.main' }} />,
      achievement: <TrophyIcon sx={{ color: 'warning.main' }} />,
      leaderboard_update: <LeaderboardIcon sx={{ color: 'primary.main' }} />,
    };
    return icons[type] || <NotificationsIcon />;
  };

  const getNotificationLink = (notification: Notification): string => {
    switch (notification.relatedType) {
      case 'user':
        return `/profile/${notification.relatedId}`;
      case 'session':
        return `/analysis/${notification.metadata?.sessionId || notification.relatedId}`;
      case 'comment':
        return `/analysis/${notification.metadata?.sessionId}#comments`;
      default:
        return '#';
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color={color} onClick={handleClick}>
        <Badge
          badgeContent={unreadNotificationCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.65rem',
              height: 18,
              minWidth: 18,
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 480,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadNotificationCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllRead}
              sx={{ textTransform: 'none' }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ overflow: 'auto', maxHeight: 400 }}>
          {notificationsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="bodyLarge" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="bodySmall" color="text.secondary">
                When you get notifications, they will appear here
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <ListItem
                      component={Link}
                      href={getNotificationLink(notification)}
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        textDecoration: 'none',
                        color: 'inherit',
                        bgcolor: notification.isRead
                          ? 'transparent'
                          : alpha(theme.palette.primary.main, 0.05),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={notification.actorAvatar}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="bodyMedium"
                              sx={{
                                fontWeight: notification.isRead ? 400 : 600,
                                flex: 1,
                              }}
                            >
                              {notification.content}
                            </Typography>
                            {!notification.isRead && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="bodySmall" color="text.secondary">
                              {formatRelativeTime(notification.timestamp)}
                            </Typography>
                            {notification.metadata?.trackName && (
                              <Chip
                                label={notification.metadata.trackName}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1.5, textAlign: 'center' }}>
              <Button
                component={Link}
                href="/notifications"
                fullWidth
                onClick={handleClose}
                sx={{ textTransform: 'none' }}
              >
                View all notifications
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
}
