'use client';

import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useSocialStore } from '@/lib/stores/socialStore';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  showIcon?: boolean;
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  showIcon = true,
}: FollowButtonProps) {
  const theme = useTheme();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { followUser, unfollowUser } = useSocialStore();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (isLoading) return '';
    if (isFollowing) {
      return isHovered ? 'Unfollow' : 'Following';
    }
    return 'Follow';
  };

  const getButtonColor = () => {
    if (isFollowing) {
      return isHovered ? 'error' : 'success';
    }
    return 'primary';
  };

  const getButtonIcon = () => {
    if (isFollowing) {
      return isHovered ? <PersonRemoveIcon /> : <CheckIcon />;
    }
    return <PersonAddIcon />;
  };

  return (
    <Button
      variant={variant}
      size={size}
      color={getButtonColor()}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      fullWidth={fullWidth}
      startIcon={showIcon && !isLoading ? getButtonIcon() : undefined}
      sx={{
        minWidth: 100,
        transition: 'all 0.2s ease-in-out',
        ...(isFollowing && {
          '&:hover': {
            backgroundColor: alpha(theme.palette.error.main, 0.1),
            borderColor: theme.palette.error.main,
            color: theme.palette.error.main,
          },
        }),
      }}
    >
      {isLoading ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        getButtonLabel()
      )}
    </Button>
  );
}
