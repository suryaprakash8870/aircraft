import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF6F00',
      light: '#FFA000',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    warning: {
      main: '#ED6C02',
      light: '#FF9800',
      dark: '#E65100',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    info: {
      main: '#0288D1',
      light: '#03A9F4',
      dark: '#01579B',
    },
    text: {
      primary: '#1A2027',
      secondary: '#637381',
      disabled: '#919EAB',
    },
    divider: '#E8EDF2',
    grey: {
      100: '#F5F7FA',
      200: '#E8EDF2',
      300: '#DFE3E8',
      400: '#C4CDD5',
      500: '#919EAB',
      600: '#637381',
      700: '#454F5B',
      800: '#212B36',
      900: '#161C24',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 500, fontSize: '0.9375rem' },
    subtitle2: { fontWeight: 500, fontSize: '0.875rem' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem', color: '#637381' },
    button: { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(145, 158, 171, 0.16)',
    '0px 3px 8px rgba(145, 158, 171, 0.24)',
    '0px 6px 16px rgba(145, 158, 171, 0.24)',
    '0px 8px 20px rgba(145, 158, 171, 0.24)',
    '0px 12px 24px -4px rgba(145, 158, 171, 0.24)',
    '0px 16px 32px -4px rgba(145, 158, 171, 0.24)',
    '0px 20px 40px -4px rgba(145, 158, 171, 0.24)',
    '0px 24px 48px rgba(145, 158, 171, 0.24)',
    '0px 28px 56px rgba(145, 158, 171, 0.24)',
    '0px 32px 64px rgba(145, 158, 171, 0.24)',
    '0px 36px 72px rgba(145, 158, 171, 0.24)',
    '0px 40px 80px rgba(145, 158, 171, 0.24)',
    '0px 44px 88px rgba(145, 158, 171, 0.24)',
    '0px 48px 96px rgba(145, 158, 171, 0.24)',
    '0px 52px 104px rgba(145, 158, 171, 0.24)',
    '0px 56px 112px rgba(145, 158, 171, 0.24)',
    '0px 60px 120px rgba(145, 158, 171, 0.24)',
    '0px 64px 128px rgba(145, 158, 171, 0.24)',
    '0px 68px 136px rgba(145, 158, 171, 0.24)',
    '0px 72px 144px rgba(145, 158, 171, 0.24)',
    '0px 76px 152px rgba(145, 158, 171, 0.24)',
    '0px 80px 160px rgba(145, 158, 171, 0.24)',
    '0px 84px 168px rgba(145, 158, 171, 0.24)',
    '0px 88px 176px rgba(145, 158, 171, 0.24)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        html: {
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
        },
        body: {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
          backgroundColor: '#F5F7FA',
        },
        '#root': {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
        },
        '::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '::-webkit-scrollbar-track': {
          background: '#F5F7FA',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#C4CDD5',
          borderRadius: '3px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#919EAB',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 3px 8px rgba(145, 158, 171, 0.24)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          padding: '8px 20px',
        },
        contained: {
          boxShadow: '0 4px 6px rgba(21, 101, 192, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 10px rgba(21, 101, 192, 0.35)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#DFE3E8',
            },
            '&:hover fieldset': {
              borderColor: '#1565C0',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F5F7FA',
            fontWeight: 600,
            color: '#637381',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#F5F7FA',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          '&.Mui-selected': {
            backgroundColor: 'rgba(21, 101, 192, 0.08)',
            color: '#1565C0',
            '& .MuiListItemIcon-root': {
              color: '#1565C0',
            },
            '&:hover': {
              backgroundColor: 'rgba(21, 101, 192, 0.12)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 4px rgba(145, 158, 171, 0.16)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E8EDF2',
          boxShadow: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '0.875rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8,
        },
      },
    },
  },
});

export default theme;
