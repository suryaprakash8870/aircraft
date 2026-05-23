import React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { hideSnackbar } from '../../store/slices/uiSlice';

const SlideTransition = (props) => <Slide {...props} direction="up" />;

const SnackbarAlert = () => {
  const dispatch = useDispatch();
  const { open, message, severity, duration } = useSelector((state) => state.ui.snackbar);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    dispatch(hideSnackbar());
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        elevation={6}
        sx={{
          width: '100%',
          minWidth: 300,
          fontWeight: 500,
          '& .MuiAlert-icon': { fontSize: 22 },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarAlert;
