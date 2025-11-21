// ItineraryCard.tsx - Interactive card hiển thị lịch trình có thể chọn activities
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Checkbox,
  Button,
  Divider,
  Chip,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Edit,
  ExpandMore,
  ExpandLess,
  CalendarToday,
  AttachMoney,
  Place,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { gradients, brandColors } from '../../../theme/branding';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  description?: string;
  cost: number;
  duration?: number;
  category?: string;
  selectable: boolean;
  selected: boolean;
}

interface Day {
  day: number;
  date: string;
  activities: Activity[];
  totalCost: number;
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  priceLevel: number;
  rating: number;
  photo?: string;
  selectable: boolean;
  selected: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  location: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  photo?: string;
  selectable: boolean;
  selected: boolean;
}

interface ItineraryData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget: {
    total: number;
    spent: number;
    currency: string;
  };
  destinations: Array<{
    name: string;
    arrivalDate: string;
    departureDate: string;
  }>;
  itinerary: Day[];
  suggestedHotels?: Hotel[];
  suggestedRestaurants?: Restaurant[];
}

interface Props {
  data: ItineraryData;
  summary: string;
}

const ItineraryCard: React.FC<Props> = ({ data, summary }) => {
  const navigate = useNavigate();
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(
    new Set(
      data.itinerary
        .flatMap(day => day.activities)
        .filter(a => a.selected)
        .map(a => a.id)
    )
  );
  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // Mặc định mở ngày 1
  const [showHotels, setShowHotels] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Toggle activity selection
  const handleToggleActivity = (activityId: string) => {
    setSelectedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  // Toggle day expansion
  const handleToggleDay = (dayNumber: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  };

  // Toggle hotel selection
  const handleToggleHotel = (hotelId: string) => {
    setSelectedHotels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hotelId)) {
        newSet.delete(hotelId);
      } else {
        newSet.add(hotelId);
      }
      return newSet;
    });
  };

  // Toggle restaurant selection
  const handleToggleRestaurant = (restaurantId: string) => {
    setSelectedRestaurants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(restaurantId)) {
        newSet.delete(restaurantId);
      } else {
        newSet.add(restaurantId);
      }
      return newSet;
    });
  };

  // Calculate selected cost
  const calculateSelectedCost = () => {
    return data.itinerary.reduce((total, day) => {
      return total + day.activities
        .filter(a => selectedActivities.has(a.id))
        .reduce((sum, a) => sum + a.cost, 0);
    }, 0);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Get category color
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'sightseeing': return brandColors.primary;
      case 'dining': return brandColors.accent;
      case 'entertainment': return brandColors.secondary;
      case 'relaxation': return brandColors.success;
      case 'shopping': return '#9C27B0';
      default: return brandColors.neutral;
    }
  };

  // Get category label
  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'sightseeing': return '🏛️ Tham quan';
      case 'dining': return '🍽️ Ăn uống';
      case 'entertainment': return '🎭 Giải trí';
      case 'relaxation': return '🧘 Thư giãn';
      case 'shopping': return '🛍️ Mua sắm';
      default: return '📍 Hoạt động';
    }
  };

  // Save to trip
  const handleSaveToTrip = async () => {
    try {
      setSaving(true);
      setSaveError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Redirect to login
        setSaveError('Vui lòng đăng nhập để lưu lịch trình');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Prepare data với only selected activities
      const finalItinerary = data.itinerary.map(day => ({
        ...day,
        activities: day.activities
          .filter(a => selectedActivities.has(a.id))
          .map(a => ({ ...a, selected: true }))
      }));

      const itineraryData = {
        ...data,
        itinerary: finalItinerary
      };

      // Call API
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/trips/from-ai`,
        { itineraryData },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSaveSuccess(true);
        
        // Redirect to dashboard sau 2 giây
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error saving trip:', error);
      setSaveError(error.response?.data?.message || 'Không thể lưu lịch trình. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCost = calculateSelectedCost();
  const selectedCount = selectedActivities.size;
  const totalActivities = data.itinerary.flatMap(d => d.activities).length;
  const budgetProgress = data.budget.total > 0 ? (selectedCost / data.budget.total) * 100 : 0;
  const selectedHotelsCount = selectedHotels.size;
  const selectedRestaurantsCount = selectedRestaurants.size;

  return (
    <Card
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '2px solid',
        borderColor: alpha(brandColors.primary, 0.2),
        '&:hover': {
          boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
        },
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: gradients.primary,
          color: '#fff',
          p: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          📅 {data.title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
          {summary}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<CalendarToday />}
            label={`${data.itinerary.length} ngày`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 600,
            }}
          />
          <Chip
            icon={<Place />}
            label={data.destinations[0]?.name || 'N/A'}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 600,
            }}
          />
          <Chip
            icon={<AttachMoney />}
            label={formatCurrency(data.budget.total)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Success/Error Messages */}
        {saveSuccess && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            ✅ Đã lưu lịch trình! Đang chuyển đến Dashboard...
          </Alert>
        )}
        
        {saveError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {saveError}
          </Alert>
        )}

        {/* Budget Summary */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(
              budgetProgress > 100 ? '#f44336' : brandColors.success,
              0.1
            ),
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ✅ {selectedCount}/{totalActivities} hoạt động
              </Typography>
              {(selectedHotelsCount > 0 || selectedRestaurantsCount > 0) && (
                <Typography variant="caption" color="text.secondary">
                  {selectedHotelsCount > 0 && `🏨 ${selectedHotelsCount} khách sạn`}
                  {selectedHotelsCount > 0 && selectedRestaurantsCount > 0 && ' • '}
                  {selectedRestaurantsCount > 0 && `🍽️ ${selectedRestaurantsCount} nhà hàng`}
                </Typography>
              )}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: budgetProgress > 100 ? '#f44336' : brandColors.success,
              }}
            >
              {formatCurrency(selectedCost)} / {formatCurrency(data.budget.total)}
            </Typography>
          </Box>
          <Box
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(brandColors.neutral, 0.1),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${Math.min(budgetProgress, 100)}%`,
                background:
                  budgetProgress > 100
                    ? 'linear-gradient(90deg, #f44336, #e91e63)'
                    : gradients.success,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>

        {/* Days List */}
        {data.itinerary.map((day) => (
          <Box key={day.day} sx={{ mb: 2 }}>
            <Box
              onClick={() => handleToggleDay(day.day)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(brandColors.primary, 0.05),
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha(brandColors.primary, 0.1),
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Ngày {day.day} - {new Date(day.date).toLocaleDateString('vi-VN')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {day.activities.length} hoạt động • {formatCurrency(day.totalCost)}
                </Typography>
              </Box>
              <IconButton size="small">
                {expandedDays.has(day.day) ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={expandedDays.has(day.day)}>
              <Box sx={{ pl: 1, pt: 2 }}>
                {day.activities.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: selectedActivities.has(activity.id)
                        ? brandColors.primary
                        : 'divider',
                      bgcolor: selectedActivities.has(activity.id)
                        ? alpha(brandColors.primary, 0.05)
                        : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {activity.selectable && (
                      <Checkbox
                        checked={selectedActivities.has(activity.id)}
                        onChange={() => handleToggleActivity(activity.id)}
                        sx={{ mt: -0.5 }}
                      />
                    )}
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={activity.time}
                          size="small"
                          icon={<AccessTime sx={{ fontSize: 14 }} />}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        />
                        {activity.category && (
                          <Chip
                            label={getCategoryLabel(activity.category)}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              bgcolor: alpha(getCategoryColor(activity.category), 0.1),
                              color: getCategoryColor(activity.category),
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {activity.title}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        📍 {activity.location}
                      </Typography>
                      
                      {activity.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {activity.description}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" sx={{ fontWeight: 700, color: brandColors.accent }}>
                        💰 {formatCurrency(activity.cost)}
                        {activity.duration && ` • ⏱️ ${activity.duration} phút`}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
            
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}

        {/* Hotels Section */}
        {data.suggestedHotels && data.suggestedHotels.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Box
              onClick={() => setShowHotels(!showHotels)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: alpha('#FF6B6B', 0.1),
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha('#FF6B6B', 0.15),
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF6B6B' }}>
                  🏨 Khách sạn đề xuất
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.suggestedHotels.length} khách sạn • Click để chọn
                </Typography>
              </Box>
              <IconButton size="small">
                {showHotels ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showHotels}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
                {data.suggestedHotels.map((hotel) => (
                  <Box
                    key={hotel.id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: selectedHotels.has(hotel.id) ? '#FF6B6B' : 'divider',
                      bgcolor: selectedHotels.has(hotel.id) ? alpha('#FF6B6B', 0.05) : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#FF6B6B',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(255,107,107,0.2)',
                      },
                    }}
                    onClick={() => handleToggleHotel(hotel.id)}
                  >
                    {hotel.selectable && (
                      <Checkbox
                        checked={selectedHotels.has(hotel.id)}
                        onChange={() => handleToggleHotel(hotel.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {hotel.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        📍 {hotel.location}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={`⭐ ${hotel.rating.toFixed(1)}`}
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem' }}
                        />
                        <Chip
                          label={'💰'.repeat(hotel.priceLevel)}
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Restaurants Section */}
        {data.suggestedRestaurants && data.suggestedRestaurants.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Box
              onClick={() => setShowRestaurants(!showRestaurants)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                bgcolor: alpha('#4ECDC4', 0.1),
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: alpha('#4ECDC4', 0.15),
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#4ECDC4' }}>
                  🍽️ Nhà hàng đề xuất
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.suggestedRestaurants.length} nhà hàng • Click để chọn
                </Typography>
              </Box>
              <IconButton size="small">
                {showRestaurants ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showRestaurants}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
                {data.suggestedRestaurants.map((restaurant) => (
                  <Box
                    key={restaurant.id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: selectedRestaurants.has(restaurant.id) ? '#4ECDC4' : 'divider',
                      bgcolor: selectedRestaurants.has(restaurant.id) ? alpha('#4ECDC4', 0.05) : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#4ECDC4',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(78,205,196,0.2)',
                      },
                    }}
                    onClick={() => handleToggleRestaurant(restaurant.id)}
                  >
                    {restaurant.selectable && (
                      <Checkbox
                        checked={selectedRestaurants.has(restaurant.id)}
                        onChange={() => handleToggleRestaurant(restaurant.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {restaurant.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        📍 {restaurant.location}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip
                          label={restaurant.cuisine}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            bgcolor: alpha('#4ECDC4', 0.1),
                            color: '#4ECDC4',
                          }}
                        />
                        <Chip
                          label={`⭐ ${restaurant.rating.toFixed(1)}`}
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem' }}
                        />
                        <Chip
                          label={restaurant.priceRange}
                          size="small"
                          sx={{ height: 24, fontSize: '0.75rem' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSaveToTrip}
            disabled={saving || selectedCount === 0 || saveSuccess}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            sx={{
              py: 1.5,
              borderRadius: 3,
              background: gradients.primary,
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {saving ? 'Đang lưu...' : saveSuccess ? '✅ Đã lưu!' : `💾 Lưu lịch trình (${selectedCount + selectedHotelsCount + selectedRestaurantsCount} items)`}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              // TODO: Implement edit functionality
              console.log('Edit itinerary');
            }}
            startIcon={<Edit />}
            sx={{
              py: 1.5,
              borderRadius: 3,
              minWidth: 120,
            }}
          >
            Chỉnh sửa
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ItineraryCard;

