import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { gradients } from '../theme/branding';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <Box
      sx={{
        background: gradients.primary,
        color: 'white',
        py: { xs: 4, md: 6 },
        mb: 3,
      }}
   >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: subtitle ? 1 : 0 }}>
          {icon && (
            <Box sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              {icon}
            </Box>
          )}
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        {subtitle && (
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {subtitle}
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default PageHeader;


