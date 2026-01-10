'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Badge,
  Tooltip,
  Fab,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Speed as SpeedIcon,
  DirectionsCar as CarIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  ExitToApp,
  Person,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme as useCustomTheme } from '@/components/providers/ThemeProvider';
import Link from 'next/link';

const drawerWidth = 280;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  href: string;
  badge?: number;
  chip?: string;
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Home',
    icon: <HomeIcon />,
    href: '/',
  },
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    href: '/dashboard',
    badge: 3,
  },
  {
    text: 'Record Lap',
    icon: <TimelineIcon />,
    href: '/record-lap',
    chip: 'Live',
  },
  {
    text: 'Telemetry',
    icon: <AnalyticsIcon />,
    href: '/telemetry',
  },
  {
    text: 'Analysis',
    icon: <TrendingUpIcon />,
    href: '/analysis',
  },
  {
    text: 'Upload Data',
    icon: <UploadIcon />,
    href: '/telemetry/upload',
  },
  {
    text: 'Subscribe',
    icon: <StarIcon />,
    href: '/subscribe',
    chip: 'Premium',
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    href: '/settings',
  },
];

const quickAccessItems = [
  {
    text: 'Racing Line',
    icon: <FlagIcon />,
    href: '/analysis/racing-line',
  },
  {
    text: 'Performance',
    icon: <TrendingUpIcon />,
    href: '/analysis/performance',
  },
  {
    text: 'Lap Times',
    icon: <SpeedIcon />,
    href: '/analysis/lap-times',
  },
];

interface MaterialLayoutProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function MaterialLayout({ children }: MaterialLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { mode, toggleTheme } = useCustomTheme();

  useEffect(() => {
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
  }, [pathname]);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const navigateToPage = (href: string) => {
    router.push(href);
    if (mobileOpen) {
      handleDrawerClose();
    }
  };

  const isActivePage = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

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

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header Section */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
            }}
          >
            <CarIcon />
          </Avatar>
          <Box>
            <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
              GT7 Analysis
            </Typography>
            <Typography variant="bodySmall" color="text.secondary">
              Professional Racing Data
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Main Navigation */}
      <Box sx={{ px: 1, py: 2, flexGrow: 1 }}>
        <Typography
          variant="labelMedium"
          sx={{
            px: 2,
            py: 1,
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Main Navigation
        </Typography>
        <List>
          {navigationItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActivePage(item.href)}
                onClick={() => navigateToPage(item.href)}
                sx={{
                  borderRadius: 3,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActivePage(item.href) ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    variant: 'bodyMedium',
                    fontWeight: isActivePage(item.href) ? 600 : 400,
                  }}
                />
                {item.badge && (
                  <Badge
                    badgeContent={item.badge}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        right: 8,
                        fontSize: '0.75rem',
                      },
                    }}
                  />
                )}
                {item.chip && (
                  <Chip
                    label={item.chip}
                    size="small"
                    color="success"
                    variant="filled"
                    sx={{
                      height: 20,
                      fontSize: '0.6875rem',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: 'success.main',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Quick Access Section */}
        <Typography
          variant="labelMedium"
          sx={{
            px: 2,
            py: 1,
            mt: 3,
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Quick Access
        </Typography>
        <List>
          {quickAccessItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActivePage(item.href)}
                onClick={() => navigateToPage(item.href)}
                sx={{
                  borderRadius: 3,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                    color: 'secondary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'secondary.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActivePage(item.href) ? 'secondary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    variant: 'bodySmall',
                    fontWeight: isActivePage(item.href) ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer Section */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="bodySmall" color="text.secondary">
            v2.1.0
          </Typography>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton onClick={toggleTheme} size="small">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Search */}
          <Tooltip title="Search">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <SearchIcon />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ mr: 2 }}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Section */}
          {user ? (
            <>
              <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                {user.name}
              </Typography>
              <Avatar
                onClick={handleUserMenuOpen}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  cursor: 'pointer',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
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
                <MenuItem onClick={() => { navigateToPage('/settings'); handleUserMenuClose(); }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
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

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{ height: 'calc(100vh - 64px)' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: theme.zIndex.speedDial,
        }}
        onClick={() => navigateToPage('/telemetry/upload')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}