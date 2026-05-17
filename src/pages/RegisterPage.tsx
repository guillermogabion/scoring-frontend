import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Link as MuiLink,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ name, email, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Card sx={{ maxWidth: 420, width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h5" fontWeight={700} mt={2}>Account Created!</Typography>
            <Typography color="text.secondary" mt={1}>
              We sent a verification link to <strong>{email}</strong>.
              Check your inbox (and spam folder) to activate your account.
            </Typography>
            <Button component={Link} to="/login" variant="contained" fullWidth sx={{ mt: 3 }}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <EmojiEventsIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h5" fontWeight={700} mt={1}>Create Account</Typography>
            <Typography color="text.secondary">Start organizing your events</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField label="Full Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} required sx={{ mb: 2 }} />
            <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="At least 8 characters"
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Box textAlign="center" mt={3}>
            <Typography variant="body2">
              Already have an account?{' '}
              <MuiLink component={Link} to="/login">Sign In</MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}