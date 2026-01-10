'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Snackbar,
  Alert,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  Reddit as RedditIcon,
  Link as LinkIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSocialStore, formatLapTime } from '@/lib/stores/socialStore';

// Discord icon component
const DiscordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  session: {
    id: string;
    trackName: string;
    carModel: string;
    bestLapTime: number;
    userName?: string;
  };
}

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactElement;
  color: string;
  shareUrl: (url: string, text: string) => string;
}

export default function ShareModal({ open, onClose, session }: ShareModalProps) {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { shareSession } = useSocialStore();

  const sessionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/analysis/${session.id}`
    : '';

  const defaultShareText = `Check out my ${formatLapTime(session.bestLapTime)} lap at ${session.trackName} in my ${session.carModel}!`;

  const shareText = message || defaultShareText;

  const platforms: SharePlatform[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <TwitterIcon />,
      color: '#1DA1F2',
      shareUrl: (url, text) =>
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <FacebookIcon />,
      color: '#4267B2',
      shareUrl: (url, text) =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: <RedditIcon />,
      color: '#FF4500',
      shareUrl: (url, text) =>
        `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: <DiscordIcon />,
      color: '#5865F2',
      shareUrl: (url, text) => url, // Discord doesn't have a direct share URL
    },
  ];

  const handleShare = async (platform: SharePlatform) => {
    try {
      await shareSession(session.id, platform.id, message);

      if (platform.id === 'discord') {
        // For Discord, copy the message with URL
        await navigator.clipboard.writeText(`${shareText}\n${sessionUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Open share URL in new window
        window.open(platform.shareUrl(sessionUrl, shareText), '_blank', 'width=600,height=400');
      }

      setShowSuccess(true);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      await shareSession(session.id, 'link', message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowSuccess(true);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
            Share Session
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Session Preview */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Typography variant="titleMedium" sx={{ fontWeight: 600, mb: 1 }}>
              {session.trackName}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="bodySmall" color="text.secondary">
                Car: <strong>{session.carModel}</strong>
              </Typography>
              <Typography variant="bodySmall" color="success.main">
                Best Lap: <strong>{formatLapTime(session.bestLapTime)}</strong>
              </Typography>
            </Box>
          </Box>

          {/* Custom Message */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Add a message (optional)"
            placeholder={defaultShareText}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* Share Platforms */}
          <Typography variant="titleSmall" sx={{ mb: 2, fontWeight: 600 }}>
            Share to
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {platforms.map((platform) => (
              <Grid item xs={3} key={platform.id}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleShare(platform)}
                    sx={{
                      flexDirection: 'column',
                      py: 2,
                      borderColor: alpha(platform.color, 0.3),
                      '&:hover': {
                        borderColor: platform.color,
                        bgcolor: alpha(platform.color, 0.1),
                      },
                    }}
                  >
                    <Box sx={{ color: platform.color, mb: 1 }}>{platform.icon}</Box>
                    <Typography variant="bodySmall">{platform.name}</Typography>
                  </Button>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Copy Link */}
          <Typography variant="titleSmall" sx={{ mb: 2, fontWeight: 600 }}>
            Or copy link
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              value={sessionUrl}
              InputProps={{
                readOnly: true,
                startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <Button
              variant="contained"
              onClick={handleCopyLink}
              startIcon={copied ? <CheckIcon /> : <CopyIcon />}
              color={copied ? 'success' : 'primary'}
              sx={{ minWidth: 120 }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Session shared successfully!
        </Alert>
      </Snackbar>
    </>
  );
}
