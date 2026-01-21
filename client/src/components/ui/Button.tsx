import React from 'react';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  animate?: boolean;
  animationType?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out';
  animationDuration?: 'very-fast' | 'fast' | 'normal' | 'light-slow' | 'slow' | 'very-slow';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  animate = false,
  animationType = 'zoom-in',
  animationDuration = 'fast',
  disabled,
  className = '',
  sx = {},
  ...props
}) => {
  // Map custom variants to MUI variants and colors
  const getMuiVariantAndColor = (): { variant: MuiButtonProps['variant']; color: MuiButtonProps['color'] } => {
    switch (variant) {
      case 'primary':
        return { variant: 'contained', color: 'primary' };
      case 'secondary':
        return { variant: 'outlined', color: 'primary' };
      case 'success':
        return { variant: 'contained', color: 'success' };
      case 'danger':
        return { variant: 'contained', color: 'error' };
      case 'warning':
        return { variant: 'contained', color: 'warning' };
      case 'ghost':
        return { variant: 'text', color: 'inherit' };
      default:
        return { variant: 'contained', color: 'primary' };
    }
  };

  // Map custom sizes to MUI sizes
  const getMuiSize = (): MuiButtonProps['size'] => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'md':
        return 'medium';
      case 'lg':
      case 'xl':
        return 'large';
      default:
        return 'medium';
    }
  };

  const { variant: muiVariant, color: muiColor } = getMuiVariantAndColor();
  const muiSize = getMuiSize();

  // Build animation class
  const animationClass = animate ? `animate-${animationType} duration-${animationDuration}` : '';

  return (
    <MuiButton
      variant={muiVariant}
      color={muiColor}
      size={muiSize}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      className={`${animationClass} ${className}`}
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        borderRadius: '6px', // Enforce 6px max border radius
        ...(size === 'xl' && {
          padding: '12px 24px',
          fontSize: '1.125rem',
        }),
        ...(variant === 'secondary' && {
          backgroundColor: 'transparent',
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'divider',
          },
        }),
        ...(variant === 'ghost' && {
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }),
        ...sx,
      }}
      startIcon={!loading && icon && iconPosition === 'left' ? icon : undefined}
      endIcon={!loading && icon && iconPosition === 'right' ? icon : undefined}
      {...props}
    >
      {loading ? (
        <>
          <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </MuiButton>
  );
};

export default Button;
