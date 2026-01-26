import React, { useEffect, useRef } from 'react';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

interface ModalProps extends Omit<DialogProps, 'open' | 'onClose'> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

// Styled Dialog with animation support
const AnimatedDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: '6px', // Enforce 6px max border radius
    animation: 'zoomIn 300ms ease-out forwards',
  },
  '& .MuiBackdrop-root': {
    animation: 'fadeUp 150ms ease-out forwards',
    backdropFilter: 'blur(4px)',
  },
}));

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  ...props
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Map custom sizes to MUI maxWidth
  const getMuiMaxWidth = (): DialogProps['maxWidth'] | false => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'md':
        return 'md';
      case 'lg':
        return 'lg';
      case 'xl':
        return 'xl';
      case 'full':
        return false;
      default:
        return 'md';
    }
  };

  const handleClose = (_event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick' && !closeOnOverlayClick) {
      return;
    }
    onClose();
  };

  // Fix aria-hidden focus issue: blur any focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      // Blur the currently focused element to prevent aria-hidden warning
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [isOpen]);

  return (
    <AnimatedDialog
      open={isOpen}
      onClose={handleClose}
      maxWidth={getMuiMaxWidth()}
      fullWidth={size !== 'full'}
      fullScreen={size === 'full'}
      scroll="paper"
      disableRestoreFocus={false}
      disableEnforceFocus={false}
      disableAutoFocus={false}
      sx={{
        '& .MuiDialog-paper': {
          ...(size === 'full' && {
            margin: 2,
            maxWidth: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
          }),
        },
      }}
      {...props}
    >
      {/* Header */}
      {(title || showCloseButton) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: '1.125rem',
          }}
        >
          {title && <span>{title}</span>}
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                ml: title ? 2 : 0,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {/* Content */}
      <DialogContent
        sx={{
          p: 3,
        }}
      >
        {children}
      </DialogContent>
    </AnimatedDialog>
  );
};

export default Modal;
