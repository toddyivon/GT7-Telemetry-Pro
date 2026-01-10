'use client';

import React from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import { DirectionsCar as CarIcon } from '@mui/icons-material';

type CarClass =
  | 'all'
  | 'gr1'
  | 'gr2'
  | 'gr3'
  | 'gr4'
  | 'grb'
  | 'n100'
  | 'n200'
  | 'n300'
  | 'n400'
  | 'n500'
  | 'n600'
  | 'n700'
  | 'n800'
  | 'n1000';

interface CarClassFilterProps {
  selectedClass: CarClass;
  onClassChange: (carClass: CarClass) => void;
  compact?: boolean;
}

const carClasses: { id: CarClass; label: string; description: string; color: string }[] = [
  { id: 'all', label: 'All', description: 'All car classes', color: '#666' },
  { id: 'gr1', label: 'Gr.1', description: 'Group 1 - LMP1/Hypercar', color: '#E53935' },
  { id: 'gr2', label: 'Gr.2', description: 'Group 2 - Super GT', color: '#FB8C00' },
  { id: 'gr3', label: 'Gr.3', description: 'Group 3 - GT3', color: '#FDD835' },
  { id: 'gr4', label: 'Gr.4', description: 'Group 4 - GT4', color: '#43A047' },
  { id: 'grb', label: 'Gr.B', description: 'Group B Rally', color: '#00ACC1' },
  { id: 'n100', label: 'N100', description: 'N100 Class', color: '#546E7A' },
  { id: 'n200', label: 'N200', description: 'N200 Class', color: '#607D8B' },
  { id: 'n300', label: 'N300', description: 'N300 Class', color: '#78909C' },
  { id: 'n400', label: 'N400', description: 'N400 Class', color: '#8D6E63' },
  { id: 'n500', label: 'N500', description: 'N500 Class', color: '#A1887F' },
  { id: 'n600', label: 'N600', description: 'N600 Class', color: '#7E57C2' },
  { id: 'n700', label: 'N700', description: 'N700 Class', color: '#5C6BC0' },
  { id: 'n800', label: 'N800', description: 'N800 Class', color: '#42A5F5' },
  { id: 'n1000', label: 'N1000', description: 'N1000 Class', color: '#26C6DA' },
];

const grClasses = carClasses.filter(c => c.id === 'all' || c.id.startsWith('gr'));
const nClasses = carClasses.filter(c => c.id.startsWith('n'));

export default function CarClassFilter({
  selectedClass,
  onClassChange,
  compact = false,
}: CarClassFilterProps) {
  const theme = useTheme();

  const handleChange = (_: React.MouseEvent<HTMLElement>, newClass: CarClass | null) => {
    if (newClass !== null) {
      onClassChange(newClass);
    }
  };

  if (compact) {
    return (
      <ToggleButtonGroup
        value={selectedClass}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{
          flexWrap: 'wrap',
          gap: 0.5,
          '& .MuiToggleButton-root': {
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            borderRadius: '4px !important',
            px: 1.5,
            py: 0.5,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        {carClasses.slice(0, 6).map((carClass) => (
          <ToggleButton key={carClass.id} value={carClass.id}>
            {carClass.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  return (
    <Box>
      {/* Group Classes */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Group Classes
        </Typography>
        <ToggleButtonGroup
          value={selectedClass}
          exclusive
          onChange={handleChange}
          sx={{
            flexWrap: 'wrap',
            gap: 0.5,
            '& .MuiToggleButton-root': {
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '8px !important',
              px: 2,
              py: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            },
          }}
        >
          {grClasses.map((carClass) => (
            <Tooltip key={carClass.id} title={carClass.description} arrow>
              <ToggleButton value={carClass.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: carClass.color,
                    }}
                  />
                  {carClass.label}
                </Box>
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* N Classes */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          N Classes (Road Cars)
        </Typography>
        <ToggleButtonGroup
          value={selectedClass}
          exclusive
          onChange={handleChange}
          sx={{
            flexWrap: 'wrap',
            gap: 0.5,
            '& .MuiToggleButton-root': {
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: '8px !important',
              px: 1.5,
              py: 0.75,
              fontSize: '0.75rem',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            },
          }}
        >
          {nClasses.map((carClass) => (
            <Tooltip key={carClass.id} title={carClass.description} arrow>
              <ToggleButton value={carClass.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: carClass.color,
                    }}
                  />
                  {carClass.label}
                </Box>
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
