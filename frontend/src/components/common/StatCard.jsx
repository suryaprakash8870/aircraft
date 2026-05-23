import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Skeleton,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
  subtitle,
  loading = false,
}) => {
  const colorMap = {
    primary: { bg: 'rgba(21, 101, 192, 0.08)', text: '#1565C0', border: '#1565C0' },
    secondary: { bg: 'rgba(255, 111, 0, 0.08)', text: '#FF6F00', border: '#FF6F00' },
    success: { bg: 'rgba(46, 125, 50, 0.08)', text: '#2E7D32', border: '#2E7D32' },
    warning: { bg: 'rgba(237, 108, 2, 0.08)', text: '#ED6C02', border: '#ED6C02' },
    error: { bg: 'rgba(211, 47, 47, 0.08)', text: '#D32F2F', border: '#D32F2F' },
    info: { bg: 'rgba(2, 136, 209, 0.08)', text: '#0288D1', border: '#0288D1' },
  };

  const colors = colorMap[color] || colorMap.primary;

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUpIcon sx={{ fontSize: 14 }} />;
    if (trend < 0) return <TrendingDownIcon sx={{ fontSize: 14 }} />;
    return <TrendingFlatIcon sx={{ fontSize: 14 }} />;
  };

  const getTrendColor = () => {
    if (!trend) return 'default';
    if (trend > 0) return 'success';
    if (trend < 0) return 'error';
    return 'default';
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', borderLeft: `4px solid`, borderColor: 'grey.200' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="40%" height={18} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderLeft: `4px solid ${colors.border}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0px 8px 20px rgba(145, 158, 171, 0.24)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              color="text.primary"
              sx={{ mt: 0.75, mb: 0.5, lineHeight: 1.2 }}
            >
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {trend !== undefined && trend !== null && (
                <Chip
                  icon={getTrendIcon()}
                  label={`${trend > 0 ? '+' : ''}${trend}%`}
                  size="small"
                  color={getTrendColor()}
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    '& .MuiChip-icon': { ml: 0.5 },
                  }}
                />
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {Icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ml: 2,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 24, color: colors.text }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
