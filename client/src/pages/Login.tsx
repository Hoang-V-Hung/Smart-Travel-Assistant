import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  alpha,
  Avatar,
  Fade,
  Zoom,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Google,
  Facebook,
  Apple,
  FlightTakeoff,
} from '@mui/icons-material';
import { gradients, brandColors } from '../theme/branding';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: gradients.primary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={600}>
          <Box>
            {/* Logo/Brand */}
            <Zoom in timeout={800}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    margin: '0 auto',
                    mb: 2,
                    background: gradients.secondary,
                    boxShadow: '0 8px 24px rgba(255,107,107,0.4)',
                  }}
                >
                  <FlightTakeoff sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography
                  variant="h4"
                  sx={{
                    color: '#fff',
                    fontWeight: 900,
                    mb: 1,
                    textShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  Travel Planner
                </Typography>
                <Typography variant="body1" sx={{ color: alpha('#fff', 0.9) }}>
                  Khám phá thế giới theo cách của bạn
                </Typography>
              </Box>
            </Zoom>

            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Đăng Nhập
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chào mừng bạn quay trở lại!
                </Typography>
              </Box>

              {error && (
                <Zoom in timeout={400}>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                </Zoom>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    },
                  }}
                />

                {/* <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Quên mật khẩu?
                  </Link>
                </Box> */}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 2,
                    mb: 3,
                    py: 1.5,
                    borderRadius: 3,
                    background: gradients.primary,
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(102,126,234,0.5)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : (
                    <>
                      <LoginIcon sx={{ mr: 1 }} />
                      Đăng nhập
                    </>
                  )}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có tài khoản?{' '}
                    <Link
                      component={RouterLink}
                      to="/register"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 700,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Đăng ký ngay
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                Bằng việc đăng nhập, bạn đồng ý với{' '}
                <Link href="#" sx={{ color: '#fff', fontWeight: 600 }}>
                  Điều khoản
                </Link>{' '}
                và{' '}
                <Link href="#" sx={{ color: '#fff', fontWeight: 600 }}>
                  Chính sách bảo mật
                </Link>
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;