// src/theme.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { brandColors } from './theme/branding';

let theme = createTheme({
  palette: {
    primary: {
      main: brandColors.primary,
      light: '#8C8FFF',
      dark: brandColors.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary,
      light: '#FFB59F',
      dark: '#FF7043',
      contrastText: '#2F1300',
    },
    success: {
      main: brandColors.success,
    },
    warning: {
      main: brandColors.warning,
    },
    background: {
      default: brandColors.background,
      paper: brandColors.surface,
    },
    text: {
      primary: brandColors.neutral,
      secondary: '#475467',
    },
    divider: brandColors.border,
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '"Helvetica"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '2.5rem', fontWeight: 800 },
    h2: { fontSize: '2rem', fontWeight: 800 },
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          fontWeight: 600,
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: `1px solid ${brandColors.border}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: brandColors.surface,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

// Tự động điều chỉnh kích cỡ font cho hợp lý
theme = responsiveFontSizes(theme);

export default theme;