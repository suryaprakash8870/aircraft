import React from 'react';
import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  action,
  secondaryAction,
  breadcrumbs,
  badge,
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography
                key={index}
                variant="caption"
                color="text.primary"
                fontWeight={500}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={index}
                variant="caption"
                color="text.secondary"
                underline="hover"
                sx={{ cursor: 'pointer' }}
                onClick={() => crumb.href && navigate(crumb.href)}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h5"
              fontWeight={700}
              color="text.primary"
              sx={{ lineHeight: 1.3 }}
            >
              {title}
            </Typography>
            {badge && (
              <Chip
                label={badge.label}
                size="small"
                color={badge.color || 'primary'}
                sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {(action || secondaryAction) && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {secondaryAction && (
              <Button
                variant="outlined"
                color={secondaryAction.color || 'inherit'}
                startIcon={secondaryAction.icon}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                size={secondaryAction.size || 'medium'}
                sx={{ borderColor: 'divider', color: 'text.secondary' }}
              >
                {secondaryAction.label}
              </Button>
            )}
            {action && (
              <Button
                variant="contained"
                color={action.color || 'primary'}
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
                size={action.size || 'medium'}
              >
                {action.label}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
