import { createTheme } from '@mui/material/styles';

// MUI Theme configuration following design rules:
// - Maximum border radius: 6px for all elements
// - Dark mode support
// - Custom color palette matching Tailwind config

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6', // blue-500
      light: '#60a5fa', // blue-400
      dark: '#2563eb', // blue-600
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1', // indigo-500
      light: '#818cf8', // indigo-400
      dark: '#4f46e5', // indigo-600
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // green-500
      light: '#34d399', // green-400
      dark: '#059669', // green-600
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24', // amber-400
      dark: '#d97706', // amber-600
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // red-500
      light: '#f87171', // red-400
      dark: '#dc2626', // red-600
      contrastText: '#ffffff',
    },
    info: {
      main: '#3b82f6', // blue-500
      light: '#60a5fa', // blue-400
      dark: '#2563eb', // blue-600
      contrastText: '#ffffff',
    },
    background: {
      default: '#f9fafb', // gray-50
      paper: '#ffffff',
    },
    text: {
      primary: '#111827', // gray-900
      secondary: '#6b7280', // gray-500
      disabled: '#9ca3af', // gray-400
    },
  },
  shape: {
    borderRadius: 6, // CRITICAL: Maximum 6px border radius per design rules
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none', // Disable uppercase transformation
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6, // Enforce 6px max border radius
          },
        },
      },
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
        },
        input: {
          padding: '10px 12px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
          '& fieldset': {
            borderColor: '#d1d5db', // gray-300
          },
          '&:hover fieldset': {
            borderColor: '#9ca3af', // gray-400
          },
          '&.Mui-focused fieldset': {
            borderColor: '#3b82f6', // blue-500
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 6, // Enforce 6px max border radius
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
        },
        rounded: {
          borderRadius: 6, // Enforce 6px max border radius
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius (for rectangular chips)
          fontWeight: 500,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 6, // Enforce 6px max border radius
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 4, // Slightly smaller for menu items
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: '#f3f4f6', // gray-100
          },
          '&.Mui-selected': {
            backgroundColor: '#dbeafe', // blue-100
            '&:hover': {
              backgroundColor: '#bfdbfe', // blue-200
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 4, // Slightly smaller for tooltips
          backgroundColor: '#1f2937', // gray-800
          fontSize: '0.75rem',
          padding: '6px 12px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Enforce 6px max border radius
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            borderRadius: 6, // Enforce 6px max border radius
          },
        },
      },
    },
  },
});

// Dark mode theme variant
export const darkMuiTheme = createTheme({
  ...muiTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa', // blue-400
      light: '#93c5fd', // blue-300
      dark: '#3b82f6', // blue-500
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#818cf8', // indigo-400
      light: '#a5b4fc', // indigo-300
      dark: '#6366f1', // indigo-500
      contrastText: '#ffffff',
    },
    success: {
      main: '#34d399', // green-400
      light: '#6ee7b7', // green-300
      dark: '#10b981', // green-500
      contrastText: '#000000',
    },
    warning: {
      main: '#fbbf24', // amber-400
      light: '#fcd34d', // amber-300
      dark: '#f59e0b', // amber-500
      contrastText: '#000000',
    },
    error: {
      main: '#f87171', // red-400
      light: '#fca5a5', // red-300
      dark: '#ef4444', // red-500
      contrastText: '#ffffff',
    },
    info: {
      main: '#60a5fa', // blue-400
      light: '#93c5fd', // blue-300
      dark: '#3b82f6', // blue-500
      contrastText: '#ffffff',
    },
    background: {
      default: '#111827', // gray-900
      paper: '#1f2937', // gray-800
    },
    text: {
      primary: '#f9fafb', // gray-50
      secondary: '#9ca3af', // gray-400
      disabled: '#6b7280', // gray-500
    },
  },
});

export default muiTheme;
