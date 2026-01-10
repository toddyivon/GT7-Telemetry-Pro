'use client';

import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Shield as ShieldIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  WorkspacePremium as PremiumIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface RankBadgeProps {
  tier: RankTier;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showPoints?: boolean;
  points?: number;
  animated?: boolean;
}

const tierConfig: Record<RankTier, {
  label: string;
  color: string;
  gradient: string;
  icon: React.ReactElement;
  minPoints: number;
  maxPoints: number;
}> = {
  bronze: {
    label: 'Bronze',
    color: '#CD7F32',
    gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    icon: <ShieldIcon />,
    minPoints: 0,
    maxPoints: 999,
  },
  silver: {
    label: 'Silver',
    color: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #E8E8E8 0%, #A0A0A0 100%)',
    icon: <ShieldIcon />,
    minPoints: 1000,
    maxPoints: 4999,
  },
  gold: {
    label: 'Gold',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    icon: <TrophyIcon />,
    minPoints: 5000,
    maxPoints: 9999,
  },
  platinum: {
    label: 'Platinum',
    color: '#E5E4E2',
    gradient: 'linear-gradient(135deg, #E5E4E2 0%, #B8B8B8 50%, #E5E4E2 100%)',
    icon: <StarIcon />,
    minPoints: 10000,
    maxPoints: 24999,
  },
  diamond: {
    label: 'Diamond',
    color: '#B9F2FF',
    gradient: 'linear-gradient(135deg, #B9F2FF 0%, #89CFF0 50%, #00BFFF 100%)',
    icon: <DiamondIcon />,
    minPoints: 25000,
    maxPoints: Infinity,
  },
};

const sizeConfig = {
  small: {
    iconSize: 16,
    padding: '2px 8px',
    fontSize: '0.75rem',
    badgeSize: 24,
  },
  medium: {
    iconSize: 20,
    padding: '4px 12px',
    fontSize: '0.875rem',
    badgeSize: 36,
  },
  large: {
    iconSize: 28,
    padding: '6px 16px',
    fontSize: '1rem',
    badgeSize: 48,
  },
};

export default function RankBadge({
  tier,
  size = 'medium',
  showLabel = true,
  showPoints = false,
  points,
  animated = true,
}: RankBadgeProps) {
  const theme = useTheme();
  const config = tierConfig[tier];
  const sizeConf = sizeConfig[size];

  const BadgeWrapper = animated ? motion.div : 'div';
  const animationProps = animated
    ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
        whileHover: { scale: 1.05 },
      }
    : {};

  const tooltipContent = (
    <Box sx={{ p: 1, textAlign: 'center' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {config.label} Tier
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {config.maxPoints === Infinity
          ? `${config.minPoints.toLocaleString()}+ points`
          : `${config.minPoints.toLocaleString()} - ${config.maxPoints.toLocaleString()} points`}
      </Typography>
      {showPoints && points !== undefined && (
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
          Your points: {points.toLocaleString()}
        </Typography>
      )}
    </Box>
  );

  if (!showLabel) {
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <BadgeWrapper {...animationProps}>
          <Box
            sx={{
              width: sizeConf.badgeSize,
              height: sizeConf.badgeSize,
              borderRadius: '50%',
              background: config.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${alpha(config.color, 0.4)}`,
              border: `2px solid ${alpha(config.color, 0.6)}`,
              '& svg': {
                fontSize: sizeConf.iconSize,
                color: tier === 'bronze' || tier === 'gold' ? '#fff' : '#333',
              },
            }}
          >
            {React.cloneElement(config.icon)}
          </Box>
        </BadgeWrapper>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <BadgeWrapper {...animationProps}>
        <Chip
          icon={React.cloneElement(config.icon, {
            sx: {
              fontSize: sizeConf.iconSize,
              color: tier === 'bronze' || tier === 'gold' ? '#fff !important' : '#333 !important',
            },
          })}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <span>{config.label}</span>
              {showPoints && points !== undefined && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.75em',
                    opacity: 0.8,
                  }}
                >
                  ({points.toLocaleString()})
                </Typography>
              )}
            </Box>
          }
          sx={{
            background: config.gradient,
            color: tier === 'bronze' || tier === 'gold' ? '#fff' : '#333',
            fontWeight: 600,
            fontSize: sizeConf.fontSize,
            padding: sizeConf.padding,
            height: 'auto',
            boxShadow: `0 2px 8px ${alpha(config.color, 0.4)}`,
            border: `1px solid ${alpha(config.color, 0.3)}`,
            '& .MuiChip-icon': {
              marginLeft: '4px',
            },
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(config.color, 0.5)}`,
            },
          }}
        />
      </BadgeWrapper>
    </Tooltip>
  );
}

// Export tier colors for use in other components
export const getTierColor = (tier: RankTier): string => tierConfig[tier].color;
export const getTierGradient = (tier: RankTier): string => tierConfig[tier].gradient;
export const getTierLabel = (tier: RankTier): string => tierConfig[tier].label;
export const getTierFromPoints = (points: number): RankTier => {
  if (points >= 25000) return 'diamond';
  if (points >= 10000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
};
