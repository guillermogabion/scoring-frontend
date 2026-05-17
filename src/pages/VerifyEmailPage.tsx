import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Button } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }
    authApi.verifyEmail(token)
      .then(() => { setStatus('success'); setMessage('Your email has been verified!'); })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Verification failed. Token may be invalid or expired.');
      });
  }, [searchParams]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {status === 'loading' && <><CircularProgress sx={{ mb: 2 }} /><Typography>Verifying your email...</Typography></>}
          {status === 'success' && (
            <>
              <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
              <Typography variant="h5" fontWeight={700} mt={2}>Email Verified!</Typography>
              <Typography color="text.secondary" mt={1}>{message}</Typography>
              <Button component={Link} to="/login" variant="contained" fullWidth sx={{ mt: 3 }}>Sign In</Button>
            </>
          )}
          {status === 'error' && (
            <>
              <ErrorIcon color="error" sx={{ fontSize: 64 }} />
              <Typography variant="h5" fontWeight={700} mt={2}>Verification Failed</Typography>
              <Typography color="text.secondary" mt={1}>{message}</Typography>
              <Button component={Link} to="/register" variant="outlined" fullWidth sx={{ mt: 3 }}>Back to Register</Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}