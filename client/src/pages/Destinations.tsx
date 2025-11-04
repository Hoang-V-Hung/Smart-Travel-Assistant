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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import Grid from '../components/Grid';
import PageHeader from '../components/PageHeader';
import {
  Search,
  Place,
  AttachMoney,
  AccessTime,
  Star,
  FilterList,
  ViewList,
  GridView,
  Info,
  Directions,
  Hotel,
  Restaurant,
} from '@mui/icons-material';
import axios from 'axios';

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

  const categories = [
    { value: '', label: 'Tất cả' },
    { value: 'city', label: 'Thành phố' },
    { value: 'beach', label: 'Biển' },
    { value: 'mountain', label: 'Núi' },
    { value: 'cultural', label: 'Văn hóa' },
    { value: 'adventure', label: 'Phiêu lưu' },
    { value: 'nature', label: 'Thiên nhiên' },
    { value: 'historical', label: 'Lịch sử' },
  ];

  const budgetRanges = [
    { value: '', label: 'Tất cả' },
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
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBudget) params.append('budget', selectedBudget);

      const response = await axios.get(`http://localhost:5000/api/destinations/search?${params}`);
      setDestinations(response.data.destinations);
    } catch (err: any) {
      setError('Không thể tải danh sách điểm đến');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: any) => {
    setSelectedCategory(e.target.value);
  };

  const handleBudgetChange = (e: any) => {
    setSelectedBudget(e.target.value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getBudgetLabel = (budget: { min: number; max: number }) => {
    if (budget.max >= 20000000) {
      return `Trên ${formatCurrency(budget.min)}`;
    }
    return `${formatCurrency(budget.min)} - ${formatCurrency(budget.max)}`;
  };

  const renderDestinationCard = (destination: Destination) => (
    <Card
      key={destination._id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 8,
          transform: 'translateY(-4px)',
          transition: 'all 0.3s ease-in-out',
        },
      }}
      onClick={() => setSelectedDestination(destination)}
    >
      {destination.images && destination.images.length > 0 && (
        <CardMedia
          component="img"
          height="200"
          image={destination.images[0]}
          alt={destination.name}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {destination.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {destination.city}, {destination.country}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {destination.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={destination.rating.average} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({destination.rating.count})
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {destination.recommendedDuration} ngày
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {getBudgetLabel(destination.budgetRange)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={getCategoryLabel(destination.category)}
            size="small"
            color="primary"
            variant="outlined"
          />
          {destination.tags.slice(0, 2).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const renderDestinationList = (destination: Destination) => (
    <Card
      key={destination._id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
        },
      }}
      onClick={() => setSelectedDestination(destination)}
    >
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            {destination.images && destination.images.length > 0 && (
              <CardMedia
                component="img"
                height="120"
                image={destination.images[0]}
                alt={destination.name}
                sx={{ borderRadius: 1 }}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="h6" component="h3" gutterBottom>
              {destination.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {destination.city}, {destination.country}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {destination.description}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating value={destination.rating.average} readOnly size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({destination.rating.count})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {destination.recommendedDuration} ngày
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {getBudgetLabel(destination.budgetRange)}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={getCategoryLabel(destination.category)}
                size="small"
                color="primary"
                variant="outlined"
              />
              {destination.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải danh sách điểm đến...</Typography>
      </Container>
    );
  }

  return (
    <>
      <PageHeader
        title="Khám phá điểm đến"
        subtitle="Tìm kiếm và khám phá những điểm đến tuyệt vời trên thế giới"
      />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm điểm đến..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Danh mục"
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Ngân sách</InputLabel>
              <Select
                value={selectedBudget}
                onChange={handleBudgetChange}
                label="Ngân sách"
              >
                {budgetRanges.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                startIcon={<GridView />}
              >
                Lưới
              </Button>
              <Button
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('list')}
                startIcon={<ViewList />}
              >
                Danh sách
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {destinations.length} điểm đến được tìm thấy
        </Typography>
      </Box>

      {destinations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không tìm thấy điểm đến nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {destinations.map((destination) => (
            <Grid
              item
              xs={12}
              sm={viewMode === 'grid' ? 6 : 12}
              md={viewMode === 'grid' ? 4 : 12}
              key={destination._id}
            >
              {viewMode === 'grid' ? renderDestinationCard(destination) : renderDestinationList(destination)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Destination Detail Dialog */}
      <Dialog
        open={Boolean(selectedDestination)}
        onClose={() => setSelectedDestination(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedDestination && (
          <>
            <DialogTitle>
              <Typography variant="h5" component="div">
                {selectedDestination.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDestination.city}, {selectedDestination.country}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Tổng quan" />
                <Tab label="Thông tin chi tiết" />
                <Tab label="Hình ảnh" />
              </Tabs>
              
              {tabValue === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" paragraph>
                    {selectedDestination.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={selectedDestination.rating.average} readOnly />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({selectedDestination.rating.count} đánh giá)
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {selectedDestination.recommendedDuration} ngày
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AttachMoney sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {getBudgetLabel(selectedDestination.budgetRange)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Danh mục:
                    </Typography>
                    <Chip
                      label={getCategoryLabel(selectedDestination.category)}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  {selectedDestination.tags.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Tags:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {selectedDestination.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box sx={{ mt: 2 }}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Place />
                      </ListItemIcon>
                      <ListItemText
                        primary="Vị trí"
                        secondary={`${selectedDestination.city}, ${selectedDestination.country}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AccessTime />
                      </ListItemIcon>
                      <ListItemText
                        primary="Thời gian khuyến nghị"
                        secondary={`${selectedDestination.recommendedDuration} ngày`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AttachMoney />
                      </ListItemIcon>
                      <ListItemText
                        primary="Ngân sách"
                        secondary={getBudgetLabel(selectedDestination.budgetRange)}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
              
              {tabValue === 2 && selectedDestination.images && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    {selectedDestination.images.map((image, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={image}
                          alt={`${selectedDestination.name} ${index + 1}`}
                          sx={{ borderRadius: 1 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedDestination(null)}>
                Đóng
              </Button>
              <Button variant="contained" startIcon={<Directions />}>
                Thêm vào kế hoạch
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
    </>
  );
};

export default Destinations;
