'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Skeleton,
  Tooltip,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';

interface Session {
  _id: string;
  trackName: string;
  sessionDate: number;
  bestLapTime: number;
  lapCount: number;
}

interface ActivityCalendarProps {
  sessions: Session[];
  isLoading?: boolean;
}

interface DayData {
  date: string;
  count: number;
  laps: number;
  dayOfWeek: number;
  weekNumber: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getWeekNumber = (date: Date, startDate: Date): number => {
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
};

export default function ActivityCalendar({ sessions, isLoading }: ActivityCalendarProps) {
  const theme = useTheme();

  // Calculate activity data for the last 90 days
  const { activityData, weekCount, monthLabels, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Start from 90 days ago, adjusted to start on Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 90);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Adjust to Sunday
    startDate.setHours(0, 0, 0, 0);

    // Create a map of date -> activity
    const activityMap: Record<string, { count: number; laps: number }> = {};

    sessions.forEach(s => {
      const date = new Date(s.sessionDate);
      const dateKey = date.toISOString().split('T')[0];
      if (!activityMap[dateKey]) {
        activityMap[dateKey] = { count: 0, laps: 0 };
      }
      activityMap[dateKey].count += 1;
      activityMap[dateKey].laps += s.lapCount || 0;
    });

    // Generate all days in the range
    const days: DayData[] = [];
    const current = new Date(startDate);
    let weekNum = 0;

    while (current <= today) {
      const dateKey = current.toISOString().split('T')[0];
      const activity = activityMap[dateKey] || { count: 0, laps: 0 };

      days.push({
        date: dateKey,
        count: activity.count,
        laps: activity.laps,
        dayOfWeek: current.getDay(),
        weekNumber: getWeekNumber(current, startDate),
      });

      current.setDate(current.getDate() + 1);
    }

    // Calculate week count
    const weeks = Math.ceil(days.length / 7);

    // Calculate month labels
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    days.forEach(day => {
      const month = new Date(day.date).getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: MONTHS[month],
          weekIndex: day.weekNumber,
        });
        lastMonth = month;
      }
    });

    // Find max count for color scaling
    const max = Math.max(...days.map(d => d.count), 1);

    return {
      activityData: days,
      weekCount: weeks,
      monthLabels: labels,
      maxCount: max,
    };
  }, [sessions]);

  // Color scale based on activity level
  const getActivityColor = (count: number): string => {
    if (count === 0) {
      return alpha(theme.palette.text.primary, 0.08);
    }

    const intensity = Math.min(count / maxCount, 1);

    if (intensity <= 0.25) {
      return alpha(theme.palette.primary.main, 0.3);
    } else if (intensity <= 0.5) {
      return alpha(theme.palette.primary.main, 0.5);
    } else if (intensity <= 0.75) {
      return alpha(theme.palette.primary.main, 0.7);
    } else {
      return theme.palette.primary.main;
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate streak
  const { currentStreak, longestStreak } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // Sort by date descending
    const sortedDays = [...activityData].sort((a, b) => b.date.localeCompare(a.date));

    // Count current streak (from today backwards)
    for (let i = 0; i < sortedDays.length; i++) {
      if (sortedDays[i].count > 0) {
        current++;
      } else {
        break;
      }
    }

    // Count longest streak
    for (const day of activityData) {
      if (day.count > 0) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak: current, longestStreak: longest };
  }, [activityData]);

  // Total stats
  const totalStats = useMemo(() => {
    const activeDays = activityData.filter(d => d.count > 0).length;
    const totalSessions = activityData.reduce((sum, d) => sum + d.count, 0);
    const totalLaps = activityData.reduce((sum, d) => sum + d.laps, 0);
    return { activeDays, totalSessions, totalLaps };
  }, [activityData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Group days by week for rendering
  const weeks: DayData[][] = [];
  for (let w = 0; w <= weekCount; w++) {
    weeks.push(activityData.filter(d => d.weekNumber === w));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="titleLarge" sx={{ fontWeight: 600 }}>
                Activity Calendar
              </Typography>
              <Typography variant="bodySmall" color="text.secondary">
                {totalStats.totalSessions} sessions, {totalStats.totalLaps} laps in the last 90 days
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="titleMedium" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {currentStreak}
                </Typography>
                <Typography variant="labelSmall" color="text.secondary">
                  Current Streak
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="titleMedium" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {longestStreak}
                </Typography>
                <Typography variant="labelSmall" color="text.secondary">
                  Longest Streak
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="titleMedium" sx={{ fontWeight: 600 }}>
                  {totalStats.activeDays}
                </Typography>
                <Typography variant="labelSmall" color="text.secondary">
                  Active Days
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Month labels */}
          <Box sx={{ display: 'flex', mb: 0.5, ml: '30px' }}>
            {monthLabels.map((label, i) => (
              <Typography
                key={`${label.month}-${i}`}
                variant="labelSmall"
                color="text.secondary"
                sx={{
                  position: 'absolute',
                  left: `calc(30px + ${label.weekIndex * 14}px)`,
                }}
              >
                {label.month}
              </Typography>
            ))}
          </Box>

          {/* Calendar grid */}
          <Box sx={{ display: 'flex', mt: 3 }}>
            {/* Day labels */}
            <Box sx={{ display: 'flex', flexDirection: 'column', mr: 0.5 }}>
              {DAYS.map((day, i) => (
                <Typography
                  key={day}
                  variant="labelSmall"
                  color="text.secondary"
                  sx={{
                    height: 12,
                    lineHeight: '12px',
                    fontSize: '9px',
                    display: i % 2 === 1 ? 'block' : 'none',
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Activity squares */}
            <Box
              sx={{
                display: 'flex',
                gap: '2px',
                overflow: 'auto',
                pb: 1,
              }}
            >
              {weeks.map((week, weekIndex) => (
                <Box
                  key={weekIndex}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                    const day = week.find(d => d.dayOfWeek === dayIndex);
                    if (!day) {
                      return (
                        <Box
                          key={dayIndex}
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '2px',
                          }}
                        />
                      );
                    }

                    return (
                      <Tooltip
                        key={day.date}
                        title={
                          <Box>
                            <Typography variant="bodySmall" sx={{ fontWeight: 600 }}>
                              {formatDate(day.date)}
                            </Typography>
                            {day.count > 0 ? (
                              <Typography variant="labelSmall">
                                {day.count} session{day.count > 1 ? 's' : ''}, {day.laps} laps
                              </Typography>
                            ) : (
                              <Typography variant="labelSmall">No activity</Typography>
                            )}
                          </Box>
                        }
                        arrow
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '2px',
                            bgcolor: getActivityColor(day.count),
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.3)',
                              zIndex: 1,
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Typography variant="labelSmall" color="text.secondary">
              Less
            </Typography>
            {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
              <Box
                key={i}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '2px',
                  bgcolor: getActivityColor(level * maxCount),
                }}
              />
            ))}
            <Typography variant="labelSmall" color="text.secondary">
              More
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
