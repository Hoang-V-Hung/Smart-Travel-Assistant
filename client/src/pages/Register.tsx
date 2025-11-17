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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Person,
  Email,
  Lock,
  Phone,
  Visibility,
  VisibilityOff,
  Google,
  Facebook,
  Apple,
  FlightTakeoff,
  CheckCircle,
} from '@mui/icons-material';
import { gradients, brandColors } from '../theme/branding';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('Vui lòng đồng ý với điều khoản và chính sách');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
    const colors = ['#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];
    return { strength: (strength / 5) * 100, label: labels[strength - 1] || '', color: colors[strength - 1] || '' };
  };

  const pwStrength = passwordStrength(formData.password);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 4,
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

      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
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
                  Bắt đầu hành trình khám phá của bạn
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
                  Đăng Ký Tài Khoản
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tạo tài khoản trong vài bước đơn giản
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
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <TextField
                      required
                      fullWidth
                      id="name"
                      label="Họ và tên"
                      name="name"
                      autoComplete="name"
                      autoFocus
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                        },
                      }}
                    />
                  </div>

                  <div className="col-span-12">
                    <TextField
                      required
                      fullWidth
                      id="email"
                      label="Email"
                      name="email"
                      autoComplete="email"
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
                  </div>

                  <div className="col-span-12">
                    <TextField
                      fullWidth
                      id="phone"
                      label="Số điện thoại"
                      name="phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={{ color: 'primary.main' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                        },
                      }}
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Mật khẩu"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
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
                  </div>

                  <div className="col-span-12 sm:col-span-6">
                    <TextField
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Xác nhận mật khẩu"
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CheckCircle
                              sx={{
                                color:
                                  formData.confirmPassword &&
                                  formData.password === formData.confirmPassword
                                    ? 'success.main'
                                    : 'text.secondary',
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
                  </div>
                </div>

                {/* Password Strength */}
                {formData.password && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Độ mạnh mật khẩu
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: pwStrength.color, fontWeight: 600 }}
                      >
                        {pwStrength.label}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 6,
                        bgcolor: alpha('#000', 0.1),
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${pwStrength.strength}%`,
                          height: '100%',
                          bgcolor: pwStrength.color,
                          transition: 'all 0.3s ease',
                          borderRadius: 3,
                        }}
                      />
                    </Box>
                  </Box>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      sx={{ color: 'primary.main' }}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      Tôi đồng ý với{' '}
                      <Link href="#" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Điều khoản dịch vụ
                      </Link>{' '}
                      và{' '}
                      <Link href="#" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Chính sách bảo mật
                      </Link>
                    </Typography>
                  }
                  sx={{ mt: 2, mb: 2 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !agreedToTerms}
                  sx={{
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
                    '&:disabled': {
                      opacity: 0.6,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : (
                    'Đăng ký'
                  )}
                </Button>

                {/* <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Hoặc đăng ký với
                  </Typography>
                </Divider>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: '#DB4437',
                        bgcolor: alpha('#DB4437', 0.05),
                      },
                    }}
                  >
                    <Google />
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: '#1877F2',
                        bgcolor: alpha('#1877F2', 0.05),
                      },
                    }}
                  >
                    <Facebook />
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      borderColor: 'divider',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: '#000',
                        bgcolor: alpha('#000', 0.05),
                      },
                    }}
                  >
                    <Apple />
                  </Button>
                </Box> */}

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Đã có tài khoản?{' '}
                    <Link
                      component={RouterLink}
                      to="/login"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 700,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Đăng nhập ngay
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                Bằng việc đăng ký, bạn đồng ý với{' '}
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

export default Register;