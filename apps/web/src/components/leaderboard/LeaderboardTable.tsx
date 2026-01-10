'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  alpha,
  TablePagination,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import RankBadge, { getTierColor, getTierFromPoints } from './RankBadge';

interface LeaderboardRecord {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  lapTime?: number;
  carModel?: string;
  points?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  sessionId?: string;
  recordedAt?: number;
  isPersonalBest?: boolean;
  isTrackRecord?: boolean;
  delta?: number;
  rankChange?: number;
}

interface LeaderboardTableProps {
  records: LeaderboardRecord[];
  loading?: boolean;
  type: 'track' | 'global';
  currentUserId?: string;
  showPagination?: boolean;
  rowsPerPage?: number;
  emptyMessage?: string;
}

const formatTime = (milliseconds: number): string => {
  if (!milliseconds) return '--:--:---';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor(milliseconds % 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const formatDelta = (delta: number): string => {
  if (!delta || delta === 0) return '-';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${(delta / 1000).toFixed(3)}`;
};

const RankPosition = ({ rank, isTrackRecord }: { rank: number; isTrackRecord?: boolean }) => {
  const theme = useTheme();

  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return {
          bgcolor: '#FFD700',
          color: '#000',
          icon: <TrophyIcon sx={{ fontSize: 16 }} />,
        };
      case 2:
        return {
          bgcolor: '#C0C0C0',
          color: '#000',
          icon: null,
        };
      case 3:
        return {
          bgcolor: '#CD7F32',
          color: '#fff',
          icon: null,
        };
      default:
        return {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'text.primary',
          icon: null,
        };
    }
  };

  const style = getRankStyle();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        bgcolor: style.bgcolor,
        color: style.color,
        fontWeight: 700,
        fontSize: rank <= 3 ? '1rem' : '0.875rem',
        position: 'relative',
      }}
    >
      {style.icon || rank}
      {isTrackRecord && (
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StarIcon sx={{ fontSize: 10, color: '#fff' }} />
        </Box>
      )}
    </Box>
  );
};

export default function LeaderboardTable({
  records,
  loading = false,
  type,
  currentUserId,
  showPagination = true,
  rowsPerPage: initialRowsPerPage = 10,
  emptyMessage = 'No records found',
}: LeaderboardTableProps) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRecords = showPagination
    ? records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : records;

  if (loading) {
    return (
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>Rank</TableCell>
                <TableCell>Driver</TableCell>
                {type === 'track' && <TableCell>Car</TableCell>}
                <TableCell align="right">{type === 'track' ? 'Lap Time' : 'Points'}</TableCell>
                {type === 'track' && <TableCell align="right">Delta</TableCell>}
                <TableCell width={80} />
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton variant="circular" width={40} height={40} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="text" width={120} />
                    </Box>
                  </TableCell>
                  {type === 'track' && (
                    <TableCell>
                      <Skeleton variant="text" width={100} />
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Skeleton variant="text" width={80} />
                  </TableCell>
                  {type === 'track' && (
                    <TableCell align="right">
                      <Skeleton variant="text" width={60} />
                    </TableCell>
                  )}
                  <TableCell>
                    <Skeleton variant="circular" width={32} height={32} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <TrophyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Be the first to set a record!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={80} sx={{ fontWeight: 600 }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
              {type === 'track' && <TableCell sx={{ fontWeight: 600 }}>Car</TableCell>}
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {type === 'track' ? 'Lap Time' : 'Points'}
              </TableCell>
              {type === 'track' && (
                <TableCell align="right" sx={{ fontWeight: 600 }}>Delta</TableCell>
              )}
              {type === 'global' && (
                <TableCell align="center" sx={{ fontWeight: 600 }}>Tier</TableCell>
              )}
              <TableCell width={80} />
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {paginatedRecords.map((record, index) => {
                const isCurrentUser = currentUserId && record.userId === currentUserId;
                const tier = record.tier || (record.points ? getTierFromPoints(record.points) : 'bronze');

                return (
                  <motion.tr
                    key={record.userId + record.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    style={{
                      backgroundColor: isCurrentUser
                        ? alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                    }}
                  >
                    <TableCell>
                      <RankPosition rank={record.rank} isTrackRecord={record.isTrackRecord} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={record.userAvatar}
                          sx={{
                            width: 36,
                            height: 36,
                            border: isCurrentUser
                              ? `2px solid ${theme.palette.primary.main}`
                              : 'none',
                          }}
                        >
                          {record.userName?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isCurrentUser ? 700 : 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {record.userName}
                            {isCurrentUser && (
                              <Chip
                                label="You"
                                size="small"
                                color="primary"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Typography>
                          {record.rankChange !== undefined && record.rankChange !== 0 && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.25,
                                color: record.rankChange > 0 ? 'success.main' : 'error.main',
                              }}
                            >
                              {record.rankChange > 0 ? (
                                <TrendingUpIcon sx={{ fontSize: 14 }} />
                              ) : (
                                <TrendingDownIcon sx={{ fontSize: 14 }} />
                              )}
                              <Typography variant="caption">
                                {Math.abs(record.rankChange)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    {type === 'track' && (
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {record.carModel || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          color: record.rank === 1 ? 'warning.main' : 'text.primary',
                        }}
                      >
                        {type === 'track'
                          ? formatTime(record.lapTime || 0)
                          : (record.points || 0).toLocaleString()}
                      </Typography>
                      {record.isPersonalBest && (
                        <Chip
                          label="PB"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.6rem', ml: 1 }}
                        />
                      )}
                    </TableCell>
                    {type === 'track' && (
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            color: record.delta && record.delta > 0 ? 'error.main' : 'text.secondary',
                          }}
                        >
                          {formatDelta(record.delta || 0)}
                        </Typography>
                      </TableCell>
                    )}
                    {type === 'global' && (
                      <TableCell align="center">
                        <RankBadge tier={tier} size="small" showLabel={false} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Tooltip title="View Profile">
                        <IconButton
                          component={Link}
                          href={`/profile/${record.userId}`}
                          size="small"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>
      {showPagination && records.length > rowsPerPage && (
        <TablePagination
          component="div"
          count={records.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </Card>
  );
}
