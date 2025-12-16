import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material';

export default function ConfirmationModal({ 
    open, 
    onClose, 
    title, 
    message, 
    onConfirm, 
    isConfirmation = false, 
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isLoading = false
}) {
    const COR_LARANJA = 'var(--orange)';
    
    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        if (!isConfirmation) {
            onClose(); 
        }
    };

    const handleCancel = () => {
        onClose();
    };

    const mainButtonText = isConfirmation ? confirmText : (confirmText || "OK");

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-color)',
                    border: `1px solid ${COR_LARANJA}`,
                }
            }}
        >
            <DialogTitle sx={{ color: COR_LARANJA }}>{title}</DialogTitle>
            <DialogContent>
                <Typography sx={{ color: 'var(--text-primary)' }}>{message}</Typography>
                {isLoading && (
                    <CircularProgress size={24} sx={{ color: COR_LARANJA, mt: 2 }} />
                )}
            </DialogContent>
            <DialogActions>
                
                {(isConfirmation && cancelText) && (
                    <Button 
                        onClick={handleCancel}
                        sx={{ color: 'var(--secondary-text-color)' }}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                )}
                
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                        backgroundColor: COR_LARANJA,
                        '&:hover': { backgroundColor: 'var(--darker-orange)' },
                        color: 'white',
                    }}
                >
                    {mainButtonText}
                </Button>

            </DialogActions>
        </Dialog>
    );
}