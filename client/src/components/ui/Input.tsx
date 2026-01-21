import React, { forwardRef } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

interface InputProps extends Omit<TextFieldProps, 'variant' | 'size' | 'error' | 'helperText'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animate?: boolean;
  animationType?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in';
  animationDuration?: 'very-fast' | 'fast' | 'normal' | 'light-slow' | 'slow' | 'very-slow';
  size?: 'sm' | 'md' | 'lg';
  // Explicitly include common HTML input attributes that might be missing from TextFieldProps
  min?: string | number;
  max?: string | number;
  step?: string | number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      animate = false,
      animationType = 'fade-up',
      animationDuration = 'fast',
      size = 'md',
      className = '',
      sx = {},
      min,
      max,
      step,
      maxLength,
      minLength,
      pattern,
      inputMode,
      ...props
    },
    ref
  ) => {
    // Build animation class
    const animationClass = animate ? `animate-${animationType} duration-${animationDuration}` : '';

    // Map custom size to MUI size
    const getMuiSize = (): 'small' | 'medium' => {
      return size === 'sm' ? 'small' : 'medium';
    };

    return (
      <div className={`${animationClass} ${className}`}>
        <TextField
          inputRef={ref}
          label={label}
          error={!!error}
          helperText={error || helperText}
          fullWidth={fullWidth}
          size={getMuiSize()}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '6px', // Enforce 6px max border radius
              backgroundColor: 'background.paper',
              ...(size === 'lg' && {
                '& input': {
                  padding: '14px 16px',
                  fontSize: '1rem',
                },
              }),
            },
            '& .MuiInputLabel-root': {
              fontWeight: 500,
            },
            '& .MuiFormHelperText-root': {
              marginLeft: 0,
              marginTop: '4px',
              ...(error && {
                animation: 'fadeDown 200ms ease-out forwards',
              }),
            },
            ...sx,
          }}
          slotProps={{
            input: {
              ...(leftIcon && {
                startAdornment: (
                  <InputAdornment position="start">
                    {leftIcon}
                  </InputAdornment>
                ),
              }),
              ...(rightIcon && {
                endAdornment: (
                  <InputAdornment position="end">
                    {rightIcon}
                  </InputAdornment>
                ),
              }),
              ...props.slotProps?.input,
            },
            htmlInput: {
              min,
              max,
              step,
              maxLength,
              minLength,
              pattern,
              inputMode,
            },
          }}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
