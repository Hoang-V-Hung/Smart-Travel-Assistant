import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardMedia,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Zoom,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ExploreIcon from '@mui/icons-material/Explore';
import StarIcon from '@mui/icons-material/Star';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useNavigate } from 'react-router-dom';
import { gradients, brandColors } from '../theme/branding';

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const destinations = [
    {
      name: 'Paris',
      country: 'France',
      img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80&auto=format&fit=crop',
      tags: ['Lãng mạn', 'Ẩm thực', 'Nghệ thuật'],
      price: '25.000.000 VNĐ',
      rating: 4.8,
    },
    {
      name: 'Tokyo',
      country: 'Japan',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKdfCl4FU3IFsqsl2hjUgLnrPRZlBZYB_mqw&s',
      tags: ['Hiện đại', 'Công nghệ', 'Ẩm thực'],
      price: '30.000.000 VNĐ',
      rating: 4.9,
    },
    {
      name: 'Bali',
      country: 'Indonesia',
      img: 'https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/bali_o_dau_a8f9ebba60.jpg',
      tags: ['Biển', 'Thiên nhiên', 'Nghỉ dưỡng'],
      price: '15.000.000 VNĐ',
      rating: 4.7,
    },
    {
      name: 'New York',
      country: 'USA',
      img: 'https://tourdulichmy.vn/view/admin/Themes/kcfinder/upload/images/new_york.jpg',
      tags: ['Đô thị', 'Năng động', 'Mua sắm'],
      price: '35.000.000 VNĐ',
      rating: 4.6,
    },
  ];

  const features = [
    {
      icon: <ExploreIcon sx={{ fontSize: 48 }} />,
      title: 'Khám phá địa điểm',
      desc: 'Hàng nghìn điểm đến được AI gợi ý phù hợp với sở thích của bạn',
      gradient: gradients.primary,
    },
    {
      icon: <FlightTakeoffIcon sx={{ fontSize: 48 }} />,
      title: 'Lên lịch thông minh',
      desc: 'Tối ưu hóa thời gian và chi phí với AI planning assistant',
      gradient: gradients.accent,
    },
    {
      icon: <StarIcon sx={{ fontSize: 48 }} />,
      title: 'Cá nhân hóa 100%',
      desc: 'Gợi ý dựa trên lịch sử và sở thích cá nhân của bạn',
      gradient: gradients.secondary,
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 48 }} />,
      title: 'Theo dõi chi phí',
      desc: 'Quản lý ngân sách realtime và nhận alerts thông minh',
      gradient: gradients.success,
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: 'Bảo mật tuyệt đối',
      desc: 'Dữ liệu được mã hóa end-to-end, bảo vệ tối đa',
      gradient: gradients.accent,
    },
    {
      icon: <SupportAgentIcon sx={{ fontSize: 48 }} />,
      title: 'Hỗ trợ 24/7',
      desc: 'Đội ngũ support luôn sẵn sàng hỗ trợ mọi lúc, mọi nơi',
      gradient: gradients.secondary,
    },
  ];

  const onSearch = () => {
    const q = query.trim();
    if (!q) {
      navigate('/trip-planner');
    } else {
      navigate(`/destinations?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <Box component="main" sx={{ bgcolor: brandColors.background, minHeight: '100vh', overflow: 'hidden' }}>
      {/* HERO SECTION */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '90vh', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          background: gradients.primary,
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <div className="grid grid-cols-12 items-center gap-8">
            <Fade in timeout={800}>
              <div className="col-span-12 md:col-span-5">
                <Chip
                  label="🚀 AI-Powered Travel Assistant"
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 600,
                    mb: 3,
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Typography
                  variant={isMobile ? 'h3' : 'h1'}
                  sx={{
                    color: '#fff',
                    fontWeight: 900,
                    mb: 2,
                    lineHeight: 1.2,
                    textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  Khám Phá Thế Giới
                  <br />
                  <Box component="span" sx={{ color: brandColors.secondary }}>
                    Theo Cách Của Bạn
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: alpha('#fff', 0.95),
                    mb: 4,
                    lineHeight: 1.6,
                    maxWidth: 500,
                  }}
                >
                  Lên kế hoạch thông minh với AI • Gợi ý cá nhân hóa • Tối ưu ngân sách
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 4,
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                  <TextField
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSearch();
                    }}
                    placeholder="Bạn muốn đi đâu? (VD: Tokyo, Paris, Bali)"
                    variant="outlined"
                    size="medium"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        borderRadius: 3,
                        '&:hover': {
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={onSearch}
                    sx={{
                      px: 5,
                      py: 2,
                      borderRadius: 3,
                      background: gradients.secondary,
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      boxShadow: '0 8px 24px rgba(255,107,107,0.4)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 32px rgba(255,107,107,0.5)',
                      },
                      transition: 'all 0.3s ease',
                      
                      // THÊM DÒNG NÀY VÀO:
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Tìm Ngay
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon sx={{ color: brandColors.secondary }} />
                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                      4.9/5 • 10,000+ đánh giá
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FlightTakeoffIcon sx={{ color: brandColors.secondary }} />
                    <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                      50,000+ chuyến đi
                    </Typography>
                  </Box>
                </Box>
              </div>
            </Fade>

            <Zoom in timeout={1000}>
              <div className="col-span-12 md:col-span-7"> {/* <-- ĐÃ SỬA THÀNH 7 */}
                <Box
                  sx={{
                    position: 'relative',
                    // ĐÃ XÓA maxWidth VÀ margin
                      '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: -20,
                      background: gradients.secondary,
                      borderRadius: 6,
                      opacity: 0.2,
                      filter: 'blur(40px)',
                    },
                  }}
                >
                  <Card
                    sx={{
                      borderRadius: 6,
                      overflow: 'hidden',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                      transform: 'perspective(1000px) rotateY(-5deg)',
                      transition: 'transform 0.6s ease',
                      '&:hover': {
                        transform: 'perspective(1000px) rotateY(0deg) scale(1.02)',
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="350" // <-- GIỮ NGUYÊN CHIỀU CAO CỐ ĐỊNH
                      image="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&auto-format&fit-crop"
                      alt="travel"
                      sx={{
                        objectFit: 'cover' // <-- GIỮ NGUYÊN ĐỂ ẢNH KHÔNG MÉO
                      }}
                    />
                  </Card>
                </Box>
              </div>
            </Zoom>
          </div>
        </Container>
      </Box>

      {/* FEATURES SECTION */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            label="✨ Tính năng nổi bật"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              fontWeight: 600,
              mb: 2,
            }}
          />
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
            Tại Sao Chọn Chúng Tôi?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Công nghệ AI tiên tiến kết hợp trải nghiệm người dùng tuyệt vời
          </Typography>
        </Box>

        <div className="grid grid-cols-12 gap-6">
          {features.map((feature, idx) => (
            <Fade in timeout={800 + idx * 100} key={idx}>
              <div className="col-span-12 sm:col-span-6 md:col-span-4">
                <Card
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    height: '100%',
                    background: '#fff',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
                      '& .feature-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                      },
                      '&::before': {
                        transform: 'scale(1.5)',
                        opacity: 0.15,
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      background: feature.gradient,
                      borderRadius: '50%',
                      opacity: 0.08,
                      transition: 'all 0.6s ease',
                    },
                  }}
                >
                  <Box
                    className="feature-icon"
                    sx={{
                      background: feature.gradient,
                      color: '#fff',
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      transition: 'transform 0.4s ease',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.desc}
                  </Typography>
                </Card>
              </div>
            </Fade>
          ))}
        </div>
      </Container>

      {/* DESTINATIONS SECTION */}
      <Box sx={{ bgcolor: '#f8f9fa', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              label="🌍 Điểm đến hot"
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: 'success.main',
                fontWeight: 600,
                mb: 2,
              }}
            />
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
              Điểm Đến Yêu Thích
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Những địa điểm được yêu thích nhất bởi cộng đồng
            </Typography>
          </Box>

          <div className="grid grid-cols-12 gap-6">
            {destinations.map((dest, idx) => (
              <Zoom in timeout={600 + idx * 100} key={idx}>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Card
                    sx={{
                      borderRadius: 4,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.16)',
                        '& .dest-image': {
                          transform: 'scale(1.1)',
                        },
                      },
                    }}
                    onClick={() => navigate(`/destinations/${encodeURIComponent(dest.name.toLowerCase())}`)}
                  >
                    <Box sx={{ position: 'relative', overflow: 'hidden', height: 180 }}>
                      <CardMedia
                        className="dest-image"
                        component="img"
                        image={dest.img}
                        alt={dest.name}
                        height="180"
                        sx={{
                          transition: 'transform 0.6s ease',
                          // aspectRatio: '4/3'
                          objectFit: 'cover'
                        }}
                      />
                    <Chip
                      icon={<StarIcon sx={{ color: `${brandColors.secondary} !important` }} />}
                        label={dest.rating}
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          fontWeight: 700,
                          backdropFilter: 'blur(10px)',
                        }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                        {dest.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        📍 {dest.country}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 700,
                          mb: 2,
                        }}
                      >
                        {dest.price}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {dest.tags.map((tag, i) => (
                          <Chip
                            key={i}
                            label={tag}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </div>
              </Zoom>
            ))}
          </div>
        </Container>
      </Box>

      {/* CTA SECTION */}
      <Box
        sx={{
          py: 12,
          background: gradients.primary,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              mb: 2,
              color: '#fff',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            Sẵn Sàng Cho Chuyến Đi Tuyệt Vời?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              color: alpha('#fff', 0.95),
              lineHeight: 1.6,
            }}
          >
            Hãy để AI giúp bạn tạo lịch trình hoàn hảo trong vài giây.
            <br />
            Miễn phí • Không cần thẻ tín dụng • Hủy bất cứ lúc nào
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/trip-planner')}
            sx={{
              px: 6,
              py: 2.5,
              fontSize: '1.2rem',
              fontWeight: 700,
              borderRadius: 3,
              background: gradients.secondary,
              boxShadow: '0 12px 32px rgba(255,107,107,0.4)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 40px rgba(255,107,107,0.5)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            🚀 Bắt Đầu Ngay - Miễn Phí
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;