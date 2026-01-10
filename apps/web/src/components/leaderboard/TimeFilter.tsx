'use client';

import React from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Today as TodayIcon,
  DateRange as WeekIcon,
  CalendarMonth as MonthIcon,
  AllInclusive as AllTimeIcon,
} from '@mui/icons-material';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface TimeFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  showIcons?: boolean;
  size?: 'small' | 'medium';
}

const timePeriods: { id: TimePeriod; label: string; icon: React.ReactElement; description: string }[] = [
  {
    id: 'daily',
    label: 'Today',
    icon: <TodayIcon />,
    description: 'Last 24 hours',
  },
  {
    id: 'weekly',
    label: 'Week',
    icon: <WeekIcon />,
    description: 'Last 7 days',
  },
  {
    id: 'monthly',
    label: 'Month',
    icon: <MonthIcon />,
    description: 'Last 30 days',
  },
  {
    id: 'all_time',
    label: 'All Time',
    icon: <AllTimeIcon />,
    description: 'All records',
  },
];

export default function TimeFilter({
  selectedPeriod,
  onPeriodChange,
  showIcons = true,
  size = 'medium',
}: TimeFilterProps) {
  const theme = useTheme();

  const handleChange = (_: React.MouseEvent<HTMLElement>, newPeriod: TimePeriod | null) => {
    if (newPeriod !== null) {
      onPeriodChange(newPeriod);
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        value={selectedPeriod}
        exclusive
        onChange={handleChange}
        size={size}
        sx={{
          '& .MuiToggleButton-root': {
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            borderRadius: '8px !important',
            px: size === 'small' ? 1.5 : 2,
            py: size === 'small' ? 0.5 : 1,
            gap: 0.5,
            transition: 'all 0.2s ease',
            '&:not(:first-of-type)': {
              marginLeft: '4px',
            },
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderColor: alpha(theme.palette.primary.main, 0.3),
            },
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderColor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        {timePeriods.map((period) => (
          <ToggleButton key={period.id} value={period.id}>
            {showIcons && React.cloneElement(period.icon, {
              sx: { fontSize: size === 'small' ? 16 : 20 },
            })}
            <Typography
              variant={size === 'small' ? 'caption' : 'body2'}
              sx={{ fontWeight: 500 }}
            >
              {period.label}
            </Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
