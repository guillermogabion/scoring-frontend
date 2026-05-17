import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Container,
  IconButton, Menu, MenuItem, Avatar, Chip,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function Layout({ children, maxWidth = 'lg' }: LayoutProps) {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main', textDecoration: 'none' }}
          >
            ScoreFlow
          </Typography>

          {user && (
            <>
              {isSuperAdmin && (
                <Button
                  component={Link}
                  to="/admin"
                  startIcon={<AdminPanelSettingsIcon />}
                  color="error"
                  variant="outlined"
                  size="small"
                  sx={{ mr: 2, fontWeight: 700 }}
                >
                  Admin Panel
                </Button>
              )}
              <Chip
                label={isSuperAdmin ? '⚡ Super Admin' : user.name}
                variant="outlined"
                size="small"
                color={isSuperAdmin ? 'error' : 'default'}
                sx={{ mr: 1 }}
              />
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                <Avatar sx={{ width: 32, height: 32, bgcolor: isSuperAdmin ? 'error.main' : 'primary.main', fontSize: 14 }}>
                  {user.name[0].toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem disabled>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    {isSuperAdmin && <Chip label="SUPER ADMIN" color="error" size="small" sx={{ display: 'block', mt: 0.5 }} />}
                  </Box>
                </MenuItem>
                {isSuperAdmin && (
                  <MenuItem onClick={() => { navigate('/admin'); setAnchorEl(null); }}>
                    <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} /> Admin Panel
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth={maxWidth} sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}