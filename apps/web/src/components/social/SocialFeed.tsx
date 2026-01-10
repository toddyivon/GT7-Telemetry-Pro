'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  NewReleases as NewIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import SessionCard from './SessionCard';
import ShareModal from './ShareModal';
import CommentSection from './CommentSection';
import { SessionWithSocial, useSocialStore } from '@/lib/stores/socialStore';

interface SocialFeedProps {
  userId?: string; // If provided, show only this user's sessions
  showTabs?: boolean;
}

type FeedTab = 'following' | 'trending' | 'latest';

// Mock feed data
const mockFeedData: SessionWithSocial[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    userName: 'SpeedDemon',
    userAvatar: undefined,
    trackName: 'Nurburgring GP',
    carModel: 'Porsche 911 GT3 RS',
    sessionDate: Date.now() - 3600000,
    sessionType: 'time_trial',
    bestLapTime: 82456,
    lapCount: 15,
    isPublic: true,
    likeCount: 42,
    commentCount: 8,
    shareCount: 5,
    isLiked: false,
    tags: ['personal best', 'clean lap'],
    notes: 'Finally broke the 1:23 barrier! Perfect weather conditions and got into a great rhythm.',
  },
  {
    id: 'session-2',
    userId: 'user-2',
    userName: 'RacingQueen',
    userAvatar: undefined,
    trackName: 'Suzuka Circuit',
    carModel: 'McLaren 720S GT3',
    sessionDate: Date.now() - 7200000,
    sessionType: 'qualifying',
    bestLapTime: 95234,
    lapCount: 8,
    isPublic: true,
    likeCount: 28,
    commentCount: 12,
    shareCount: 3,
    isLiked: true,
    tags: ['qualifying', 'sector improvement'],
  },
  {
    id: 'session-3',
    userId: 'user-3',
    userName: 'ApexHunter',
    userAvatar: undefined,
    trackName: 'Spa-Francorchamps',
    carModel: 'Ferrari 488 GT3',
    sessionDate: Date.now() - 14400000,
    sessionType: 'race',
    bestLapTime: 138567,
    lapCount: 24,
    isPublic: true,
    likeCount: 67,
    commentCount: 23,
    shareCount: 12,
    isLiked: false,
    tags: ['race win', 'wet conditions'],
    notes: 'Intense race in changing conditions. Made the right tire call at the right time!',
  },
  {
    id: 'session-4',
    userId: 'user-4',
    userName: 'DriftMaster',
    userAvatar: undefined,
    trackName: 'Laguna Seca',
    carModel: 'Nissan GT-R GT3',
    sessionDate: Date.now() - 28800000,
    sessionType: 'practice',
    bestLapTime: 78234,
    lapCount: 32,
    isPublic: true,
    likeCount: 19,
    commentCount: 5,
    shareCount: 2,
    isLiked: false,
    tags: ['practice', 'learning track'],
  },
];

export default function SocialFeed({ userId, showTabs = true }: SocialFeedProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<FeedTab>('following');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessions, setSessions] = useState<SessionWithSocial[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Modal states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithSocial | null>(null);
  const [commentSessionId, setCommentSessionId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { loadFeed, loadMoreFeed, refreshFeed, feedItems, feedLoading, feedHasMore } = useSocialStore();

  // Load initial data
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSessions(mockFeedData);
      setIsLoading(false);
    }, 800);
  }, [activeTab, userId]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          handleLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, isLoading]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Simulate loading more
    setTimeout(() => {
      // In real app, would load more from API
      setIsLoadingMore(false);
      setHasMore(false); // No more items in mock
    }, 1000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setSessions(mockFeedData);
      setIsRefreshing(false);
    }, 1000);
  };

  const handleShareClick = (session: SessionWithSocial) => {
    setSelectedSession(session);
    setShareModalOpen(true);
  };

  const handleCommentClick = (sessionId: string) => {
    setCommentSessionId(commentSessionId === sessionId ? null : sessionId);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: FeedTab) => {
    setActiveTab(newValue);
    setSessions([]);
  };

  return (
    <Box>
      {/* Tabs */}
      {showTabs && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            <Tab
              value="following"
              label="Following"
              icon={<PeopleIcon />}
              iconPosition="start"
            />
            <Tab
              value="trending"
              label="Trending"
              icon={<TrendingIcon />}
              iconPosition="start"
            />
            <Tab
              value="latest"
              label="Latest"
              icon={<NewIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
      )}

      {/* Refresh Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          size="small"
          startIcon={
            isRefreshing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={handleRefresh}
          disabled={isRefreshing}
          sx={{ textTransform: 'none' }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Feed Items */}
      {isLoading ? (
        // Loading skeletons
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="40%" />
                  <Skeleton width="20%" />
                </Box>
              </Box>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      ) : sessions.length === 0 ? (
        // Empty state
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Typography variant="headlineMedium" color="text.secondary" sx={{ mb: 2 }}>
            {activeTab === 'following'
              ? 'No sessions from people you follow'
              : 'No sessions to display'}
          </Typography>
          <Typography variant="bodyLarge" color="text.secondary">
            {activeTab === 'following'
              ? 'Follow more racers to see their sessions here!'
              : 'Be the first to share a session.'}
          </Typography>
          {activeTab === 'following' && (
            <Button variant="contained" sx={{ mt: 3 }} href="/discover">
              Discover Racers
            </Button>
          )}
        </Box>
      ) : (
        <AnimatePresence mode="popLayout">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                layout
              >
                <SessionCard
                  session={session}
                  onShareClick={() => handleShareClick(session)}
                  onCommentClick={() => handleCommentClick(session.id)}
                />

                {/* Inline Comments */}
                {commentSessionId === session.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      sx={{
                        mt: 2,
                        p: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }}
                    >
                      <CommentSection sessionId={session.id} />
                    </Box>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </Box>
        </AnimatePresence>
      )}

      {/* Load More Trigger */}
      <Box ref={loadMoreRef} sx={{ py: 4, textAlign: 'center' }}>
        {isLoadingMore && <CircularProgress size={32} />}
        {!hasMore && sessions.length > 0 && (
          <Typography variant="bodyMedium" color="text.secondary">
            You have reached the end of the feed
          </Typography>
        )}
      </Box>

      {/* Share Modal */}
      {selectedSession && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
        />
      )}
    </Box>
  );
}
