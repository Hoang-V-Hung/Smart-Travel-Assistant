import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Rating,
  InputAdornment,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  alpha,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import {
  Search,
  Place,
  AttachMoney,
  AccessTime,
  ViewList,
  GridView,
  Directions,
  Favorite,
  FavoriteBorder,
  CalendarToday,
} from '@mui/icons-material';
import axios from 'axios';
import { gradients, brandColors } from '../theme/branding';
import { useNavigate } from 'react-router-dom';

interface Destination {
  _id: string;
  name: string;
  description: string;
  country: string;
  city: string;
  category: string;
  budgetRange: {
    min: number;
    max: number;
  };
  recommendedDuration: number;
  images: string[];
  rating: {
    average: number;
    count: number;
  };
  tags: string[];
}

const Destinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const categories = [
    { value: '', label: 'Tất cả', icon: '💠 ' },
    { value: 'city', label: 'Thành phố', icon: '🏙️ ' },
    { value: 'beach', label: 'Biển', icon: '🌊 ' },
    { value: 'mountain', label: 'Núi', icon: '🗻 ' },
    { value: 'cultural', label: 'Văn hóa', icon: '🎭 ' },
    { value: 'adventure', label: 'Phiêu lưu', icon: '🎢 ' },
    { value: 'nature', label: 'Thiên nhiên', icon: '🌿 ' },
    { value: 'historical', label: 'Lịch sử', icon: '🏛️ ' },
  ];

  const budgetRanges = [
    { value: '', label: 'Tất cả ngân sách' },
    { value: '0-1000000', label: 'Dưới 1 triệu' },
    { value: '1000000-5000000', label: '1-5 triệu' },
    { value: '5000000-10000000', label: '5-10 triệu' },
    { value: '10000000-20000000', label: '10-20 triệu' },
    { value: '20000000-', label: 'Trên 20 triệu' },
  ];

  useEffect(() => {
    fetchDestinations();
  }, [searchQuery, selectedCategory, selectedBudget]);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBudget) params.append('budget', selectedBudget);

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/destinations/search?${params}`);
      setDestinations(response.data.destinations);
    } catch (err: any) {
      setError('Không thể tải danh sách điểm đến. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.icon : '📍 ';
  };

  const getBudgetLabel = (budget: { min: number; max: number }) => {
    if (!budget) return 'Không xác định';
    if (budget.min >= 20000000) {
      return `Từ ${formatCurrency(budget.min)}`;
    }
    return `${formatCurrency(budget.min)} - ${formatCurrency(budget.max)}`;
  };

  const formatTag = (tag: string) => {
    const parts = tag.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  };

const renderDestinationCard = (destination: Destination) => (
  <Card
    key={destination._id}
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      borderRadius: 4,
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-12px)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.16)',
        '& .destination-image': {
          transform: 'scale(1.15)',
        },
        '& .favorite-btn': {
          opacity: 1,
        },
      },
    }}
    onClick={() => setSelectedDestination(destination)}
  >
    <Box sx={{ position: 'relative', overflow: 'hidden', height: 240 }}>
      {destination.images && destination.images.length > 0 && (
        <CardMedia
          className="destination-image"
          component="img"
          height="240"
          image={destination.images[0]}
          alt={destination.name}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.6s ease',
          }}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      <Chip
        label={getCategoryIcon(destination.category) + ' ' + getCategoryLabel(destination.category)}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          bgcolor: 'rgba(255,255,255,0.95)',
          fontWeight: 700,
          backdropFilter: 'blur(10px)',
        }}
      />
      <IconButton
        className="favorite-btn"
        onClick={(e) => toggleFavorite(destination._id, e)}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'rgba(255,255,255,0.95)',
          opacity: 0.7,
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: 'rgba(255,255,255,1)',
            transform: 'scale(1.1)',
          },
        }}
      >
        {favorites.has(destination._id) ? (
          <Favorite sx={{ color: '#ff6b6b' }} />
        ) : (
          <FavoriteBorder sx={{ color: 'text.secondary' }} />
        )}
      </IconButton>
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
        }}
      >
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>
          {destination.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Place sx={{ fontSize: 16, color: '#fff' }} />
          <Typography variant="body2" sx={{ color: '#fff' }}>
            {destination.city}, {destination.country}
          </Typography>
        </Box>
      </Box>
    </Box>

    <CardContent sx={{ flexGrow: 1, p: 3 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.6,
        }}
      >
        {destination.description}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating value={destination.rating.average} readOnly size="small" precision={0.5} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {destination.rating.average.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          ({destination.rating.count} đánh giá)
        </Typography>
      </Box>

      {/* =================================== */}
      {/* BẮT ĐẦU SỬA MÀU SẮC */}
      {/* =================================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(brandColors.accent, 0.05),
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
          <AccessTime sx={{ fontSize: 18, color: brandColors.accent }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Thời gian
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {destination.recommendedDuration} ngày
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
          <AttachMoney sx={{ fontSize: 18, color: 'success.main' }} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Ngân sách
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
              {getBudgetLabel(destination.budgetRange)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {destination.tags.slice(0, 3).map((tag, index) => (
          <Chip
            key={index}
            label={formatTag(tag)}
            size="small"
            sx={{
              bgcolor: alpha(brandColors.secondary, 0.1),
              color: brandColors.secondary,
              fontWeight: 600,
            }}
          />
        ))}
      </Box>
      {/* =================================== */}
      {/* KẾT THÚC SỬA MÀU SẮC */}
      {/* =================================== */}
    </CardContent>
  </Card>
);

const renderDestinationList = (destination: Destination) => (
  <Card
    key={destination._id}
    sx={{
      mb: 2,
      cursor: 'pointer',
      borderRadius: 4,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        transform: 'translateX(8px)',
      },
    }}
    onClick={() => setSelectedDestination(destination)}
  >
    <CardContent sx={{ p: 3 }}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-4">
          {destination.images && destination.images.length > 0 && (
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
              <CardMedia
                component="img"
                height="180"
                image={destination.images[0]}
                alt={destination.name}
                sx={{ borderRadius: 2, objectFit: 'cover' }}
              />
              <Chip
                label={getCategoryIcon(destination.category)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(255,255,255,0.95)',
                  fontWeight: 700,
                }}
              />
            </Box>
          )}
        </div>
        <div className="col-span-12 sm:col-span-8">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                {destination.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Place sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {destination.city}, {destination.country}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={(e) => toggleFavorite(destination._id, e)}>
              {favorites.has(destination._id) ? (
                <Favorite sx={{ color: '#ff6b6b' }} />
              ) : (
                <FavoriteBorder sx={{ color: 'text.secondary' }} />
              )}
            </IconButton>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {destination.description}
          </Typography>

          {/* =================================== */}
          {/* BẮT ĐẦU SỬA MÀU SẮC */}
          {/* =================================== */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={destination.rating.average} readOnly size="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {destination.rating.average.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({destination.rating.count})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 18, color: brandColors.accent }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {destination.recommendedDuration} ngày
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AttachMoney sx={{ fontSize: 18, color: 'success.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                {getBudgetLabel(destination.budgetRange)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={getCategoryLabel(destination.category)}
              size="small"
              sx={{
                bgcolor: alpha(brandColors.accent, 0.1),
                color: brandColors.accent,
                fontWeight: 600,
              }}
            />
            {destination.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={formatTag(tag)}
                size="small"
                sx={{
                  bgcolor: alpha(brandColors.secondary, 0.1),
                  color: brandColors.secondary,
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
          {/* =================================== */}
          {/* KẾT THÚC SỬA MÀU SẮC */}
          {/* =================================== */}
        </div>
      </div>
    </CardContent>
  </Card>
);

const renderContent = () => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Đang tìm kiếm điểm đến tuyệt vời...
        </Typography>
      </Box>
    );
  }

  if (destinations.length === 0) {
    return (
      <Paper
        sx={{
          p: 8,
          textAlign: 'center',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Place sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Không tìm thấy điểm đến nào
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
        </Typography>
      </Paper>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {destinations.map((destination, idx) => (
        <Zoom in timeout={400 + idx * 50} key={destination._id}>
          <div className={`col-span-12 ${viewMode === 'grid' ? 'sm:col-span-6 lg:col-span-4' : ''}`}>
            {viewMode === 'grid' ? renderDestinationCard(destination) : renderDestinationList(destination)}
          </div>
        </Zoom>
      ))}
    </div>
  );
};

return (
  <Box sx={{ bgcolor: brandColors.background, minHeight: '100vh', pb: 6 }}>
    
    {/* =================================== */}
    {/* BẮT ĐẦU SỬA HEADER */}
    {/* =================================== */}
    <Box
      sx={{
        background: gradients.primary, // 1. Chỉ giữ lại gradient
        pt: 4,
        pb: 8,
        position: 'relative', // 2. Thêm position relative
        overflow: 'hidden', // 3. Thêm overflow hidden
      }}
    >
      {/* 4. Thêm Box con chứa pattern mờ */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1, // 5. Đặt độ mờ 10%
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* 6. Thêm zIndex để Container (chứa chữ) nổi lên trên */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>
            Khám Phá Điểm Đến
          </Typography>
          <Typography variant="h6" sx={{ color: alpha('#fff', 0.9) }}>
            Tìm kiếm và khám phá những điểm đến tuyệt vời trên thế giới
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 3, bgcolor: alpha('#fff', 0.95), backdropFilter: 'blur(10px)' }}
          >
            {error}
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            <Box sx={{ width: '100%', flex: '1 1 40%' }}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm điểm đến... (Tokyo, Paris, Bali)"
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
            <Box sx={{ width: '100%', flex: '1 1 25%' }}>
              <FormControl fullWidth>
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Danh mục"
                  sx={{ borderRadius: 3 }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%', flex: '1 1 25%' }}>
              <FormControl fullWidth>
                <InputLabel>Ngân sách</InputLabel>
                <Select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  label="Ngân sách"
                  sx={{ borderRadius: 3 }}
                >
                  {budgetRanges.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Các nút chuyển chế độ */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Chế độ danh sách">
                <IconButton
                  onClick={() => setViewMode('grid')}
                  sx={{
                    bgcolor: viewMode === 'grid' ? 'primary.main' : 'background.paper',
                    color: viewMode === 'grid' ? '#fff' : 'text.secondary',
                    '&:hover': {
                      bgcolor: viewMode === 'grid' ? 'primary.dark' : alpha(brandColors.primary, 0.1),
                    },
                  }}
                >
                  <GridView />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
    {/* =================================== */}
    {/* KẾT THÚC SỬA HEADER */}
    {/* =================================== */}


    <Container maxWidth="lg" sx={{ mt: -4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 800, 
              color: '#fff' 
            }}
          >
            {loading ? 'Đang tìm kiếm...' : `${destinations.length} điểm đến được tìm thấy`}
          </Typography>
        </Box>
      </Box>

      {renderContent()}
    </Container>

    {/* Detail Dialog */}
    <Dialog
      open={Boolean(selectedDestination)}
      onClose={() => setSelectedDestination(null)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
        },
      }}
    >
      {selectedDestination && (
        <>
          <Box
            sx={{
              position: 'relative',
              height: 300,
              overflow: 'hidden',
            }}
          >
            {selectedDestination.images && selectedDestination.images.length > 0 && (
              <CardMedia
                component="img"
                height="300"
                image={selectedDestination.images[0]}
                alt={selectedDestination.name}
                sx={{ objectFit: 'cover' }}
              />
            )}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                p: 3,
              }}
            >
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>
                {selectedDestination.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Place sx={{ color: '#fff', fontSize: 20 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {selectedDestination.city}, {selectedDestination.country}
                </Typography>
              </Box>
            </Box>
          </Box>

          <DialogContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Tổng quan
              </Typography>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                {selectedDestination.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating value={selectedDestination.rating.average} readOnly precision={0.5} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedDestination.rating.average.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({selectedDestination.rating.count} đánh giá)
                </Typography>
              </Box>
            </Box>

            <div className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-12 sm:col-span-4">
                <Card
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderRadius: 3,
                  bgcolor: alpha(brandColors.primary, 0.05),
                  }}
                >
                  <AccessTime sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Thời gian đề xuất
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedDestination.recommendedDuration} ngày
                  </Typography>
                </Card>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <Card
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderRadius: 3,
                  bgcolor: alpha(brandColors.success, 0.05),
                  }}
                >
                  <AttachMoney sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Ngân sách
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {getBudgetLabel(selectedDestination.budgetRange)}
                  </Typography>
                </Card>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <Card
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderRadius: 3,
                  bgcolor: alpha(brandColors.secondary, 0.05),
                  }}
                >
                  <Place sx={{ fontSize: 32, color: brandColors.secondary, mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Danh mục
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {getCategoryIcon(selectedDestination.category)} {getCategoryLabel(selectedDestination.category)}
                  </Typography>
                </Card>
              </div>
            </div>

            {/* =================================== */}
            {/* BẮT ĐẦU SỬA MÀU SẮC */}
            {/* =================================== */}
            {selectedDestination.tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedDestination.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={formatTag(tag)}
                      sx={{
                        bgcolor: alpha(brandColors.accent, 0.1),
                        color: brandColors.accent,
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {/* =================================== */}
            {/* KẾT THÚC SỬA MÀU SẮC */}
            {/* =================================== */}

            {selectedDestination.images && selectedDestination.images.length > 1 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Thư viện ảnh
                </Typography>
                <div className="grid grid-cols-12 gap-4">
                  {selectedDestination.images.slice(1).map((image, index) => (
                    <div className="col-span-12 sm:col-span-6" key={index}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={image}
                        alt={`${selectedDestination.name} ${index + 2}`}
                        sx={{ borderRadius: 3, objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </Box>
            )}
          </DialogContent>
          {/* =================================== */}
          {/* BẮT ĐẦU SỬA MÀU SẮC */}
          {/* =================================== */}
          <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setSelectedDestination(null)} sx={{ borderRadius: 2 }}>
              Đóng
            </Button>
            {/* <Button
              variant="contained"
              startIcon={<Directions />}
              onClick={() => {
                navigate('/trip-planner', { 
                  state: { initialDestination: selectedDestination } 
                });
              }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                background: gradients.accent,
                fontWeight: 700,
              }}
            >
              Thêm vào kế hoạch
            </Button> */}
          </DialogActions>
          {/* =================================== */}
          {/* KẾT THÚC SỬA MÀU SẮC */}
          {/* =================================== */}
        </>
      )}
    </Dialog>
  </Box>
);
};

export default Destinations;