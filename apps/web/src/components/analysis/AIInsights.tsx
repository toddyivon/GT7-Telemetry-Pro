'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Psychology as AIIcon,
  Lightbulb as IdeaIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  DirectionsCar as CarIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useQuery } from 'convex/react';
import { AIInsight, ProgressMetrics, PerformanceTrend } from '@/lib/analysis/types';
import { detectCorners, rateCornerExecution } from '@/lib/analysis/cornerDetector';
import { detectBrakeZones } from '@/lib/analysis/cornerDetector';
import { formatLapTime } from '@/lib/analysis/lapComparisonEngine';

// Try to import the generated API
let api: any;
let useConvexQuery = true;

try {
  const convexApi = require('@/convex/_generated/api');
  api = convexApi.api;
} catch (error) {
  api = null;
  useConvexQuery = false;
}

interface AIInsightsProps {
  session: any;
  laps: any[];
  sessionId: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ session, laps, sessionId }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Get telemetry data for the best lap
  const bestLap = laps?.reduce(
    (fastest: any, lap: any) => (!fastest || lap.lapTime < fastest.lapTime ? lap : fastest),
    laps[0]
  );

  const telemetryData = useConvexQuery && api && bestLap
    ? useQuery(api.telemetry.getTelemetryForLaps, {
        sessionId: sessionId as any,
        lapNumbers: [bestLap.lapNumber],
      })
    : null;

  // Generate AI insights based on telemetry analysis
  const insights = useMemo<AIInsight[]>(() => {
    if (!telemetryData || telemetryData.length === 0 || !laps || laps.length === 0) return [];

    const generatedInsights: AIInsight[] = [];

    // Analyze corners
    const corners = detectCorners(telemetryData);
    const ratings = corners.map((c) => rateCornerExecution(c));

    // Find problematic corners
    const poorCorners = ratings
      .map((r, i) => ({ rating: r, corner: corners[i], index: i }))
      .filter((c) => c.rating.rating === 'poor' || c.rating.rating === 'bad');

    if (poorCorners.length > 0) {
      const totalTimeLoss = poorCorners.reduce((sum, c) => sum + c.rating.timeLoss, 0);
      generatedInsights.push({
        id: 'corner-issues',
        category: 'cornering',
        severity: totalTimeLoss > 1 ? 'warning' : 'suggestion',
        title: `${poorCorners.length} Corner${poorCorners.length > 1 ? 's' : ''} Need Improvement`,
        description: `You have ${poorCorners.length} corner(s) rated as poor or bad. This accounts for approximately ${totalTimeLoss.toFixed(2)}s of potential time loss.`,
        improvement: poorCorners[0].rating.suggestions.join('. '),
        potentialTimeSave: totalTimeLoss,
        confidence: 0.85,
        relatedCorners: poorCorners.map((c) => c.corner.id),
      });
    }

    // Check for excellent corners
    const excellentCorners = ratings.filter((r) => r.rating === 'excellent').length;
    if (excellentCorners > corners.length * 0.5) {
      generatedInsights.push({
        id: 'corner-strength',
        category: 'cornering',
        severity: 'info',
        title: 'Strong Cornering Performance',
        description: `${excellentCorners} out of ${corners.length} corners rated as excellent. Your cornering technique is a strength.`,
        improvement: 'Maintain consistency in these corners while focusing on weaker areas.',
        potentialTimeSave: 0,
        confidence: 0.9,
      });
    }

    // Analyze braking
    const brakeZones = detectBrakeZones(telemetryData);
    const trailBrakingCount = brakeZones.filter((z) => z.trailBrakingDetected).length;
    const trailBrakingPercentage = brakeZones.length > 0
      ? (trailBrakingCount / brakeZones.length) * 100
      : 0;

    if (trailBrakingPercentage < 30) {
      generatedInsights.push({
        id: 'trail-braking',
        category: 'braking',
        severity: 'suggestion',
        title: 'Trail Braking Opportunity',
        description: `Trail braking detected in only ${trailBrakingPercentage.toFixed(0)}% of brake zones. This technique can significantly improve corner entry.`,
        improvement: 'Practice releasing brake pressure gradually while turning in. This helps with weight transfer and rotation.',
        potentialTimeSave: 0.3,
        confidence: 0.75,
      });
    }

    // Analyze consistency
    if (laps.length >= 3) {
      const lapTimes = laps.filter((l: any) => l.isValid !== false).map((l: any) => l.lapTime);
      const avgTime = lapTimes.reduce((a: number, b: number) => a + b, 0) / lapTimes.length;
      const variance = lapTimes.reduce((sum: number, t: number) => sum + Math.pow(t - avgTime, 2), 0) / lapTimes.length;
      const stdDev = Math.sqrt(variance);
      const consistencyScore = Math.max(0, 100 - (stdDev / avgTime) * 1000);

      if (consistencyScore < 80) {
        generatedInsights.push({
          id: 'consistency',
          category: 'consistency',
          severity: 'warning',
          title: 'Lap Time Consistency Needs Work',
          description: `Your lap time variance is ${(stdDev / 1000).toFixed(2)}s. Consistent lap times indicate better car control.`,
          improvement: 'Focus on hitting the same marks every lap. Avoid over-driving and maintain a rhythm.',
          potentialTimeSave: stdDev / 2000,
          confidence: 0.8,
        });
      } else if (consistencyScore > 90) {
        generatedInsights.push({
          id: 'consistency-good',
          category: 'consistency',
          severity: 'info',
          title: 'Excellent Consistency',
          description: `Your consistency score is ${consistencyScore.toFixed(0)}%. You are maintaining very consistent lap times.`,
          improvement: 'Now that consistency is established, look for areas to push harder safely.',
          potentialTimeSave: 0,
          confidence: 0.9,
        });
      }
    }

    // Analyze throttle application
    const fullThrottlePoints = telemetryData.filter((p: any) => p.throttle > 240).length;
    const fullThrottlePercentage = (fullThrottlePoints / telemetryData.length) * 100;

    if (fullThrottlePercentage < 40) {
      generatedInsights.push({
        id: 'throttle',
        category: 'acceleration',
        severity: 'suggestion',
        title: 'Throttle Application Could Be Earlier',
        description: `Full throttle is only applied for ${fullThrottlePercentage.toFixed(0)}% of the lap. Earlier throttle application can improve exit speeds.`,
        improvement: 'Try to get on throttle earlier at corner exits. Even partial throttle helps with weight transfer.',
        potentialTimeSave: 0.2,
        confidence: 0.7,
      });
    }

    // Add general performance insight
    const bestLapTime = Math.min(...laps.map((l: any) => l.lapTime));
    const theoreticalBest = laps.reduce((sum: number, lap: any) => {
      const s1 = lap.sector1Time || lap.lapTime / 3;
      const s2 = lap.sector2Time || lap.lapTime / 3;
      const s3 = lap.sector3Time || lap.lapTime / 3;
      return Math.min(sum, s1) + Math.min(sum === Infinity ? Infinity : 0, s2) + Math.min(sum === Infinity ? Infinity : 0, s3);
    }, Infinity);

    if (theoreticalBest < bestLapTime && theoreticalBest !== Infinity) {
      const potentialGain = (bestLapTime - theoreticalBest) / 1000;
      if (potentialGain > 0.1) {
        generatedInsights.push({
          id: 'theoretical-best',
          category: 'general',
          severity: 'info',
          title: 'Theoretical Best Lap Potential',
          description: `Based on your best sectors, your theoretical best lap is ${formatLapTime(theoreticalBest)}. You have ${potentialGain.toFixed(3)}s of potential improvement.`,
          improvement: 'String together your best sectors in a single lap for a new personal best.',
          potentialTimeSave: potentialGain,
          confidence: 0.95,
        });
      }
    }

    return generatedInsights.sort((a, b) => b.potentialTimeSave - a.potentialTimeSave);
  }, [telemetryData, laps]);

  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    if (!laps || laps.length === 0) return null;

    const validLaps = laps.filter((l: any) => l.isValid !== false);
    const lapTimes = validLaps.map((l: any) => l.lapTime);

    return {
      bestLapTime: Math.min(...lapTimes),
      avgLapTime: lapTimes.reduce((a: number, b: number) => a + b, 0) / lapTimes.length,
      worstLapTime: Math.max(...lapTimes),
      totalLaps: laps.length,
      validLaps: validLaps.length,
      improvement: lapTimes.length >= 2
        ? ((lapTimes[0] - lapTimes[lapTimes.length - 1]) / lapTimes[0]) * 100
        : 0,
    };
  }, [laps]);

  const getSeverityIcon = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return <WarningIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'suggestion':
        return <IdeaIcon color="info" />;
      case 'info':
        return <InfoIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'suggestion':
        return 'info';
      case 'info':
        return 'success';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: AIInsight['category']) => {
    switch (category) {
      case 'braking':
        return <SpeedIcon />;
      case 'acceleration':
        return <TrendingUpIcon />;
      case 'cornering':
        return <TimelineIcon />;
      case 'consistency':
        return <TimerIcon />;
      case 'strategy':
        return <CarIcon />;
      default:
        return <AIIcon />;
    }
  };

  const getTotalPotentialTimeSave = () => {
    return insights.reduce((sum, i) => sum + i.potentialTimeSave, 0);
  };

  if (!session || !laps || laps.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          AI Performance Insights
        </Typography>
        <Alert severity="info">No session data available for AI analysis</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <AIIcon />
        </Avatar>
        <Box>
          <Typography variant="h5">AI Performance Insights</Typography>
          <Typography variant="body2" color="text.secondary">
            Personalized recommendations based on your telemetry data
          </Typography>
        </Box>
      </Box>

      {/* Progress Summary */}
      {progressMetrics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6">{formatLapTime(progressMetrics.bestLapTime)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Best Lap
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, textAlign: 'center' }}>
                <TimerIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                <Typography variant="h6">{formatLapTime(progressMetrics.avgLapTime)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Average Lap
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, textAlign: 'center' }}>
                <CheckIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                <Typography variant="h6">
                  {progressMetrics.validLaps}/{progressMetrics.totalLaps}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Valid Laps
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, textAlign: 'center' }}>
                {getTotalPotentialTimeSave() > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                ) : (
                  <CheckIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                )}
                <Typography variant="h6">{getTotalPotentialTimeSave().toFixed(2)}s</Typography>
                <Typography variant="caption" color="text.secondary">
                  Potential Gain
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Insights List */}
      {insights.length > 0 ? (
        <>
          <Typography variant="h6" gutterBottom>
            Analysis Results ({insights.length} insights)
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {insights.map((insight) => (
              <Accordion
                key={insight.id}
                expanded={expandedInsight === insight.id}
                onChange={() =>
                  setExpandedInsight(expandedInsight === insight.id ? null : insight.id)
                }
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor:
                          insight.severity === 'critical'
                            ? 'error.main'
                            : insight.severity === 'warning'
                              ? 'warning.main'
                              : insight.severity === 'suggestion'
                                ? 'info.main'
                                : 'success.main',
                      }}
                    >
                      {getCategoryIcon(insight.category)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{insight.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          size="small"
                          label={insight.category}
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                        {insight.potentialTimeSave > 0 && (
                          <Chip
                            size="small"
                            label={`-${insight.potentialTimeSave.toFixed(2)}s`}
                            color="success"
                          />
                        )}
                      </Box>
                    </Box>
                    <Tooltip title={`${(insight.confidence * 100).toFixed(0)}% confidence`}>
                      <Box sx={{ width: 50 }}>
                        <CircularProgress
                          variant="determinate"
                          value={insight.confidence * 100}
                          size={30}
                          sx={{
                            color:
                              insight.confidence > 0.8
                                ? 'success.main'
                                : insight.confidence > 0.6
                                  ? 'warning.main'
                                  : 'error.main',
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    {insight.description}
                  </Typography>
                  <Alert severity="info" icon={<IdeaIcon />}>
                    <Typography variant="subtitle2">How to Improve</Typography>
                    <Typography variant="body2">{insight.improvement}</Typography>
                  </Alert>
                  {insight.relatedCorners && insight.relatedCorners.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Related corners: {insight.relatedCorners.map((c) => `Turn ${c}`).join(', ')}
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </>
      ) : (
        <Alert severity="success" icon={<CheckIcon />}>
          <Typography variant="subtitle1">No Critical Issues Found</Typography>
          <Typography variant="body2">
            Your driving looks solid! Continue to focus on consistency and gradual improvement.
          </Typography>
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Quick Tips */}
      <Typography variant="h6" gutterBottom>
        Quick Tips for This Session
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SpeedIcon color="error" />
                <Typography variant="subtitle2">Braking</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Brake in a straight line, then gradually release as you turn in for better rotation.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimelineIcon color="info" />
                <Typography variant="subtitle2">Racing Line</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Use all available track width. Enter wide, apex tight, exit wide for maximum speed.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="subtitle2">Throttle</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Be patient with throttle application. Smooth inputs prevent oversteer and improve traction.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          AI insights are generated based on pattern analysis of your telemetry data. Results improve
          with more data points. Confidence scores indicate the reliability of each suggestion.
        </Typography>
      </Box>
    </Paper>
  );
};

export default AIInsights;
