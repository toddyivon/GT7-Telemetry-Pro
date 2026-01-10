'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Timeline,
  Analytics,
  Settings,
  ExitToApp,
  Person,
  RssFeed,
  Explore,
  Leaderboard,
} from '@mui/icons-material';
import NotificationBell from '@/components/social/NotificationBell';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function MaterialNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Dashboard },
    { name: 'Feed', href: '/feed', icon: RssFeed },
    { name: 'Telemetry', href: '/telemetry', icon: Timeline },
    { name: 'Analysis', href: '/analysis', icon: Analytics },
    { name: 'Leaderboard', href: '/leaderboard', icon: Leaderboard },
    { name: 'Discover', href: '/discover', icon: Explore },
  ];

  useEffect(() => {
    // Check if user is logged in by checking cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        // User not logged in
      }
    };
    checkAuth();
  }, []);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleUserMenuClose();
  };

  const getCurrentTabValue = () => {
    const currentNav = navigation.find(nav => pathname.startsWith(nav.href));
    return currentNav ? currentNav.href : false;
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: isMobile ? 1 : 0,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            mr: 4,
          }}
        >
          GT7 Data Analysis
        </Typography>

        {!isMobile && user && (
          <Box sx={{ flexGrow: 1 }}>
            <Tabs
              value={getCurrentTabValue()}
              textColor="inherit"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: 'white',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'white',
                },
              }}
            >
              {navigation.map((item) => (
                <Tab
                  key={item.href}
                  label={item.name}
                  value={item.href}
                  component={Link}
                  href={item.href}
                  icon={<item.icon />}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>
        )}

        <Box sx={{ flexGrow: isMobile && !user ? 1 : 0 }} />

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationBell color="inherit" />
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => router.push(`/profile/${user.id}`)}>
                <Person sx={{ mr: 1 }} />
                My Profile
              </MenuItem>
              <MenuItem onClick={() => router.push('/feed')}>
                <RssFeed sx={{ mr: 1 }} />
                Social Feed
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => router.push('/settings')}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button
              color="inherit"
              component={Link}
              href="/login"
              startIcon={<Person />}
              sx={{ mr: 1 }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              component={Link}
              href="/register"
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}