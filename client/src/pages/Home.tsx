import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Grid from '../components/Grid';
import {
  FlightTakeoff,
  Place,
  SmartToy,
  Map,
  Restaurant,
  Hotel,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Chỉ hiển thị 4 tính năng API chính
  const features = [
    {
      icon: <SmartToy sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'OpenAI/GPT API',
      description: 'Lên lịch trình du lịch thông minh và sinh nội dung du lịch với AI',
      path: '/ai-assistant',
      apiProvider: 'OpenAI',
    },
    {
      icon: <Map sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Google Maps API',
      description: 'Tìm địa điểm, chỉ đường, bản đồ và tìm kiếm nhà hàng, khách sạn',
      path: '/ai-assistant',
      apiProvider: 'Google Maps',
    },
    {
      icon: <FlightTakeoff sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Skyscanner API',
      description: 'Tìm kiếm và so sánh giá vé máy bay từ nhiều hãng hàng không',
      path: '/ai-assistant',
      apiProvider: 'Skyscanner',
    },
    {
      icon: <Restaurant sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'TripAdvisor API',
      description: 'Điểm tham quan, nhà hàng, khách sạn và đánh giá từ cộng đồng',
      path: '/ai-assistant',
      apiProvider: 'TripAdvisor',
    },
  ];

  const popularDestinations = [
    {
      name: 'Hà Nội',
      country: 'Việt Nam',
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
      tags: ['Văn hóa', 'Lịch sử', 'Ẩm thực'],
      path: '/destinations',
    },
    {
      name: 'Tokyo',
      country: 'Nhật Bản',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      tags: ['Hiện đại', 'Văn hóa', 'Công nghệ'],
      path: '/destinations',
    },
    {
      name: 'Paris',
      country: 'Pháp',
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400',
      tags: ['Lãng mạn', 'Nghệ thuật', 'Thời trang'],
      path: '/destinations',
    },
    {
      name: 'New York',
      country: 'Mỹ',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
      tags: ['Hiện đại', 'Kinh doanh', 'Giải trí'],
      path: '/destinations',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant={isMobile ? 'h3' : 'h2'}
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: 3 }}
          >
            🌍 Smart Travel Assistant
          </Typography>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component="p"
            sx={{ mb: 4, opacity: 0.9 }}
          >
            Trợ lý du lịch thông minh giúp bạn khám phá thế giới một cách dễ dàng và thú vị
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/trip-planner')}
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Bắt đầu lập kế hoạch
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/destinations')}
              sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Khám phá điểm đến
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Tính năng nổi bật
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                onClick={() => navigate(feature.path)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'center',
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s ease-in-out',
                  },
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" component="h3">
                      {feature.title}
                    </Typography>
                    {feature.apiProvider && (
                      <Chip
                        label={feature.apiProvider}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Popular Destinations */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
            Điểm đến phổ biến
          </Typography>
          <Grid container spacing={4}>
            {popularDestinations.map((destination, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease-in-out',
                    },
                  }}
                  onClick={() => navigate(destination.path)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={destination.image}
                    alt={destination.name}
                  />
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {destination.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {destination.country}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {destination.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          label={tag}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
            Sẵn sàng khám phá thế giới?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Hãy để AI Travel Assistant giúp bạn tạo ra những chuyến du lịch đáng nhớ
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
          >
            Đăng ký ngay
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
