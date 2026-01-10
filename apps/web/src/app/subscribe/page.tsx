'use client';

// Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  DataUsage as DataUsageIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  Api as ApiIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PricingTable from '@/components/subscription/PricingTable';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feature-tabpanel-${index}`}
      aria-labelledby={`feature-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const features = [
  {
    icon: SpeedIcon,
    title: 'Advanced Analytics',
    description:
      'Get detailed insights into your racing performance with AI-powered analysis. Track speed, braking points, and racing lines with precision.',
    plans: ['premium', 'pro'],
  },
  {
    icon: TimelineIcon,
    title: 'Racing Line Optimization',
    description:
      'Optimize your racing line with precise corner entry and exit analysis. Compare your lines with the optimal path.',
    plans: ['premium', 'pro'],
  },
  {
    icon: TrendingUpIcon,
    title: 'Performance Tracking',
    description:
      'Track your improvement over time with comprehensive performance metrics. See trends and identify areas for improvement.',
    plans: ['premium', 'pro'],
  },
  {
    icon: DataUsageIcon,
    title: 'Unlimited Storage',
    description:
      'Store unlimited racing sessions and access your complete racing history. Never lose a lap of data.',
    plans: ['premium', 'pro'],
  },
  {
    icon: SecurityIcon,
    title: 'Secure Cloud Sync',
    description:
      'Your data is securely stored and synchronized across all your devices. Access your telemetry anywhere.',
    plans: ['premium', 'pro'],
  },
  {
    icon: SupportIcon,
    title: 'Priority Support',
    description:
      'Get priority access to our support team and exclusive racing insights. 24/7 support for Pro users.',
    plans: ['premium', 'pro'],
  },
  {
    icon: PsychologyIcon,
    title: 'AI Coaching',
    description:
      'Receive personalized coaching insights powered by advanced AI. Get recommendations tailored to your driving style.',
    plans: ['pro'],
  },
  {
    icon: GroupsIcon,
    title: 'Team Collaboration',
    description:
      'Share telemetry data with teammates and coaches. Collaborate on setups and strategy in real-time.',
    plans: ['pro'],
  },
  {
    icon: ApiIcon,
    title: 'API Access',
    description:
      'Integrate GT7 Telemetry with your own tools and workflows. Full API access for custom integrations.',
    plans: ['pro'],
  },
];

const faqs = [
  {
    question: 'Can I cancel anytime?',
    answer:
      "Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.",
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, debit cards, and PayPal through our secure Stripe payment processor.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Pro plans include a 7-day free trial. You can also use our free plan indefinitely with basic features.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "We offer a 7-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      "Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your billing period.",
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'Your data remains accessible in read-only mode for 30 days after cancellation. You can export all your data before it is permanently deleted.',
  },
];

export default function SubscribePage() {
  const theme = useTheme();
  const searchParams = useSearchParams();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [featureTab, setFeatureTab] = useState(0);

  // Handle URL parameters for success/cancel
  useEffect(() => {
    const canceled = searchParams.get('canceled');
    const error = searchParams.get('error');

    if (canceled === 'true') {
      setSnackbar({
        open: true,
        message: 'Checkout was canceled. You can try again when ready.',
        severity: 'info',
      });
    }

    if (error) {
      setSnackbar({
        open: true,
        message: decodeURIComponent(error),
        severity: 'error',
      });
    }
  }, [searchParams]);

  return (
    <Box sx={{ py: 6, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, mb: 2 }}
            >
              Choose Your Racing Plan
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto' }}
            >
              Unlock advanced telemetry analysis and take your racing
              performance to the next level
            </Typography>
          </motion.div>
        </Box>

        {/* Pricing Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <PricingTable />
        </motion.div>

        {/* Features Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Paper sx={{ p: 4, mt: 6 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}
            >
              Premium Features in Detail
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, textAlign: 'center' }}
            >
              Explore what you get with each plan
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={featureTab}
                onChange={(_, v) => setFeatureTab(v)}
                centered
              >
                <Tab label="All Features" />
                <Tab label="Premium" />
                <Tab label="Pro Only" />
              </Tabs>
            </Box>

            <TabPanel value={featureTab} index={0}>
              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <feature.icon
                        sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                      />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel value={featureTab} index={1}>
              <Grid container spacing={3}>
                {features
                  .filter((f) => f.plans.includes('premium'))
                  .map((feature, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <feature.icon
                          sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
              </Grid>
            </TabPanel>

            <TabPanel value={featureTab} index={2}>
              <Grid container spacing={3}>
                {features
                  .filter((f) => f.plans.length === 1 && f.plans[0] === 'pro')
                  .map((feature, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <feature.icon
                          sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }}
                        />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
              </Grid>
            </TabPanel>
          </Paper>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Paper sx={{ p: 4, mt: 4, overflow: 'auto' }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}
            >
              Plan Comparison
            </Typography>

            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                '& th, & td': {
                  p: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  textAlign: 'center',
                },
                '& th': {
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
                '& tbody tr:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.5),
                },
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Feature</th>
                  <th>Free</th>
                  <th>Premium</th>
                  <th>Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left' }}>Sessions per month</td>
                  <td>5</td>
                  <td>Unlimited</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>Basic telemetry</td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>Advanced analysis</td>
                  <td>-</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>Racing line optimization</td>
                  <td>-</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>Cloud storage</td>
                  <td>-</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>Social features</td>
                  <td>-</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>AI coaching</td>
                  <td>-</td>
                  <td>-</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>Team collaboration</td>
                  <td>-</td>
                  <td>-</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>API access</td>
                  <td>-</td>
                  <td>-</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left' }}>Priority support</td>
                  <td>-</td>
                  <td>Email</td>
                  <td>24/7</td>
                </tr>
              </tbody>
            </Box>
          </Paper>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Paper sx={{ p: 4, mt: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}
            >
              Frequently Asked Questions
            </Typography>

            <Grid container spacing={3}>
              {faqs.map((faq, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {faq.question}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </motion.div>

        {/* Trust badges */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Trusted by thousands of racers worldwide
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              flexWrap: 'wrap',
              opacity: 0.7,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                10K+
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Users
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                1M+
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Laps Analyzed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                99.9%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Uptime
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                4.9/5
              </Typography>
              <Typography variant="caption" color="text.secondary">
                User Rating
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
