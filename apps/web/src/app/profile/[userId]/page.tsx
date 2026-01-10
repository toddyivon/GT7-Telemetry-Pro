'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Breadcrumbs,
  Link as MuiLink,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import UserProfile from '@/components/social/UserProfile';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  // In a real app, you would check if this is the current user's profile
  // For now, we'll check against a mock current user ID
  const currentUserId = 'current-user-id';
  const isOwnProfile = userId === currentUserId;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="lg">
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
          <MuiLink
            component={Link}
            href="/discover"
            sx={{
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            Discover
          </MuiLink>
          <Typography color="text.primary">Profile</Typography>
        </Breadcrumbs>

        {/* Profile Content */}
        <UserProfile userId={userId} isOwnProfile={isOwnProfile} />
      </Container>
    </Box>
  );
}
