// fileName: src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  IconButton,
  alpha,
  LinearProgress,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  InputAdornment,
  Tab,
  Tabs,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  FlightTakeoff,
  Place,
  AttachMoney,
  People,
  Delete,
  Edit,
  TrendingUp,
  CalendarToday,
  WarningAmber, 
  Save, 
  Email, 
  Phone, 
  Close, 
  PersonAdd,
  LocationOn,
  Hotel,
  Restaurant,
  Attractions,
  AccessTime,
  AutoAwesome // <--- MỚI: Icon giờ giấc
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gradients, brandColors } from '../theme/branding';

// === INTERFACES ===

// 1. Interface cho API Gợi ý
interface Destination {
  _id: string;
  name: string;
  country: string;
  city: string;
}

// 2. Interface cho Traveler và Destination
interface EditTraveler {
  name: string;
  email?: string;
  phone?: string;
}

interface EditDestination {
  name: string;
  arrivalDate: string;
  departureDate: string;
  hotel?: string | string[];   
  hotels?: string[];    
  restaurants?: string | string[];
  attractions?: string | string[];
}

// 3. Interface cho Lịch trình chi tiết
interface Activity {
  time: string;
  title: string;
  description: string;
  type: string;
  cost: number;
  location?: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
}

// 4. Interface Trip
interface Trip {
  _id: string;
  title: string;
  description: string;
  tripDetails?: string;
  startDate: string;
  endDate: string;
  status: string;
  budget: {
    total: number;
    spent: number;
    currency: string;
  };
  destinations: Array<EditDestination>;
  travelers: Array<EditTraveler>;
  itinerary?: ItineraryDay[];
}

// 5. Interface cho Form Sửa
interface EditFormState {
  title: string;
  description: string;
  tripDetails: string;
  startDate: string;
  endDate: string;
  budget: {
    total: number;
    spent: number;
  };
  travelers: Array<EditTraveler>;
  destinations: Array<EditDestination>;
  itinerary: ItineraryDay[]; // <--- MỚI: Thêm trường lịch trình
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// Helper: Format ngày cho input type="date"
const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    console.error("Lỗi format ngày:", e);
    return '';
  }
};

const Dashboard: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  const [tripToProcess, setTripToProcess] = useState<Trip | null>(null);
  
  // Edit form states
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editTabValue, setEditTabValue] = useState('1');
  
  // Details modal state
  const [detailsTabValue, setDetailsTabValue] = useState('1');
  
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Autocomplete states
  const [destOptions, setDestOptions] = useState<Destination[]>([]);
  const [destLoading, setDestLoading] = useState(false);
  const [currentDestSearch, setCurrentDestSearch] = useState(""); 

  useEffect(() => {
    fetchTrips();
  }, []);

  // Autocomplete Search Logic
  useEffect(() => {
    if (currentDestSearch.trim() === '') {
      setDestOptions([]);
      return;
    }

    setDestLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.append('q', currentDestSearch);
        
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/destinations/search?${params}`);
        
        if (response.data && response.data.destinations) {
          setDestOptions(response.data.destinations);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm điểm đến:", err);
        setDestOptions([]);
      } finally {
        setDestLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [currentDestSearch]);

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(response.data.trips);
    } catch (err: any) { 
      setError('Không thể tải danh sách chuyến du lịch');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
    setSnackbar({ open: true, message, severity });
  };

  // === Handlers: DELETE ===
  const handleOpenDeleteConfirm = (trip: Trip) => {
    setTripToProcess(trip);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setTripToProcess(null);
    setDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!tripToProcess) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL}/trips/${tripToProcess._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips((prev) => prev.filter((t) => t._id !== tripToProcess._id));
      showSnackbar('Xóa chuyến đi thành công!', 'success');
    } catch (err: any) {
      showSnackbar('Không thể xóa chuyến du lịch. Vui lòng thử lại.', 'error');
    } finally {
      handleCloseDeleteConfirm();
    }
  };

  // === Handlers: EDIT ===
  const handleOpenEditModal = (trip: Trip) => {
    setTripToProcess(trip);
    setEditForm({
      title: trip.title,
      description: trip.description || '',
      tripDetails: trip.tripDetails || '',
      startDate: formatDateForInput(trip.startDate),
      endDate: formatDateForInput(trip.endDate),
      budget: {
        total: trip.budget.total || 0,
        spent: trip.budget.spent || 0,
      },
      travelers: trip.travelers.map(t => ({...t})),
      destinations: trip.destinations.map(d => ({
        ...d,
        arrivalDate: formatDateForInput(d.arrivalDate),
        departureDate: formatDateForInput(d.departureDate),
        hotel: d.hotel || '',
        restaurants: d.restaurants || '',
        attractions: d.attractions || '',
      })),
      // === MỚI: Load dữ liệu lịch trình vào form sửa ===
      itinerary: trip.itinerary ? JSON.parse(JSON.stringify(trip.itinerary)) : []
    });
    setEditTabValue('1');
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setTripToProcess(null);
    setEditModalOpen(false);
    setEditForm(null);
    setIsSaving(false);
  };

  // === Handlers: DETAILS ===
  const handleOpenDetailsModal = (trip: Trip) => {
    setTripToProcess(trip);
    setDetailsTabValue('1'); // Reset về tab đầu tiên
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setTripToProcess(null);
    setDetailsModalOpen(false);
  };

  // === Form Change Handlers ===
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!editForm) return;

    if (name === 'total' || name === 'spent') {
      setEditForm({
        ...editForm,
        budget: { ...editForm.budget, [name]: parseFloat(value) || 0 },
      });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };
  
  const handleTravelerChange = (index: number, field: keyof EditTraveler, value: string) => {
    if (!editForm) return;
    const updatedTravelers = [...editForm.travelers];
    updatedTravelers[index] = { ...updatedTravelers[index], [field]: value };
    setEditForm({ ...editForm, travelers: updatedTravelers });
  };
  
  const handleAddTraveler = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      travelers: [...editForm.travelers, { name: '', email: '', phone: '' }],
    });
  };

  const handleRemoveTraveler = (index: number) => {
    if (!editForm) return;
    const updatedTravelers = editForm.travelers.filter((_, i) => i !== index);
    setEditForm({ ...editForm, travelers: updatedTravelers });
  };

  const handleDestinationChange = (index: number, field: keyof EditDestination, value: string) => {
    if (!editForm) return;
    const updatedDestinations = [...editForm.destinations];
    updatedDestinations[index] = { ...updatedDestinations[index], [field]: value };
    setEditForm({ ...editForm, destinations: updatedDestinations });
  };
  
  const handleAddDestination = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      destinations: [...editForm.destinations, { name: '', arrivalDate: '', departureDate: '', hotel: '', restaurants: '', attractions: '' }],
    });
  };

  const handleRemoveDestination = (index: number) => {
    if (!editForm) return;
    const updatedDestinations = editForm.destinations.filter((_, i) => i !== index);
    setEditForm({ ...editForm, destinations: updatedDestinations });
  };

  // === MỚI: Hàm xử lý thay đổi lịch trình ===
  const handleItineraryChange = (dayIdx: number, actIdx: number, field: keyof Activity, value: string | number) => {
    if (!editForm) return;
    const newItinerary = [...editForm.itinerary];
    
    // @ts-ignore: Bỏ qua check type vì ta biết cấu trúc Activity
    newItinerary[dayIdx].activities[actIdx][field] = value;
    
    setEditForm({ ...editForm, itinerary: newItinerary });
  };

  const handleUpdateTrip = async () => {
    if (!tripToProcess || !editForm) return;
    setIsSaving(true);

    // Validation logic
    if (!editForm.title.trim()) {
      showSnackbar('Tên chuyến đi không được để trống.', 'error');
      setEditTabValue('1'); setIsSaving(false); return;
    }
    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      showSnackbar('Ngày kết thúc không thể trước ngày bắt đầu.', 'error');
      setEditTabValue('1'); setIsSaving(false); return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/trips/${tripToProcess._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrips((prevTrips) =>
        prevTrips.map((t) => t._id === tripToProcess._id ? response.data.trip : t)
      );
      showSnackbar('Cập nhật chuyến đi thành công!', 'success');
      handleCloseEditModal();
    } catch (err) {
      showSnackbar('Lỗi khi cập nhật chuyến đi. Vui lòng thử lại.', 'error');
      setIsSaving(false);
    }
  };

  // === Formatting Helpers ===
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'warning';
      case 'confirmed': return 'info';
      case 'ongoing': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return 'Đang lập kế hoạch';
      case 'confirmed': return 'Đã xác nhận';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // Stats calculations
  const totalSpent = trips.reduce((acc, t) => acc + (t.budget.spent || 0), 0);
  const totalBudget = trips.reduce((acc, t) => acc + (t.budget.total || 0), 0);
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const stats = [
    { label: 'Chuyến du lịch', value: trips.length, icon: <FlightTakeoff />, gradient: gradients.primary, color: brandColors.primary },
    { label: 'Điểm đến', value: trips.reduce((acc, t) => acc + t.destinations.length, 0), icon: <Place />, gradient: gradients.secondary, color: brandColors.secondary },
    { label: 'Người đi cùng', value: trips.reduce((acc, t) => acc + t.travelers.length, 0), icon: <People />, gradient: gradients.success, color: brandColors.success },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

// Helper: Render danh sách địa điểm đẹp mắt
const renderLocationList = (data: string | string[] | undefined, type: 'hotel' | 'restaurant' | 'attraction') => {
  if (!data) return null;
  
  // Chuyển đổi về dạng mảng (nếu data là string thì gói vào mảng, nếu là mảng thì giữ nguyên)
  const list = Array.isArray(data) ? data : [data];
  if (list.length === 0) return null;

  // Cấu hình màu sắc và Icon theo loại
  let icon: React.ReactElement | null = null;
  let color: string = '';
  let title: string = '';
  switch (type) {
    case 'hotel':
      icon = <Hotel fontSize="small" />;
      color = brandColors.primary; 
      title = 'Nơi ở';
      break;
    case 'restaurant':
      icon = <Restaurant fontSize="small" />;
      color = '#ff9800'; // Cam
      title = 'Ăn uống';
      break;
    case 'attraction':
      icon = <Attractions fontSize="small" />;
      color = '#4caf50'; // Xanh lá
      title = 'Vui chơi';
      break;
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      {/* Tiêu đề mục (VD: Ăn uống) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: color, display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
      </Box>

      {/* Danh sách các địa điểm */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {list.map((item, i) => {
          // Tách Tên và Địa chỉ dựa trên dấu phẩy đầu tiên
          // VD: "Khách sạn A, 123 Đường B, TP C" -> Name: "Khách sạn A", Address: "123 Đường B, TP C"
          const firstCommaIndex = item.indexOf(',');
          let name = item;
          let address = '';

          if (firstCommaIndex !== -1) {
            name = item.substring(0, firstCommaIndex);
            address = item.substring(firstCommaIndex + 1).trim();
          }

          return (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, position: 'relative', pl: 1 }}>
              {/* Đường kẻ dọc trang trí */}
              <Box sx={{ 
                position: 'absolute', left: 0, top: 6, bottom: 6, 
                width: 3, borderRadius: 2, bgcolor: alpha(typeof color === 'string' ? color : '#000', 0.2) 
              }} />
              
              <Box sx={{ overflow: 'hidden', width: '100%' }}>
                {/* Tên địa điểm (Đậm) */}
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {name}
                </Typography>
                
                {/* Địa chỉ (Nhạt, nhỏ hơn, cắt bớt nếu quá dài) */}
                {address && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: '-webkit-box',
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 1, // Chỉ hiện tối đa 1 dòng địa chỉ cho gọn
                    }}
                    title={address} // Hover vào để xem full địa chỉ
                  >
                    {address}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};


  return (
    <Box sx={{ bgcolor: brandColors.background, minHeight: '100vh', pb: 6 }}>
      {/* === Header Section === */}
      <Box
        sx={{
          background: gradients.primary,
          pt: { xs: 6, md: 8 },
          pb: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          borderBottomLeftRadius: { xs: 32, md: 48 },
          borderBottomRightRadius: { xs: 32, md: 48 },
          boxShadow: '0 40px 80px rgba(91,92,235,0.25)',
          mb: { xs: 6, md: 8 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 3,
              mb: 4,
            }}
          >
            <Box>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 900, mb: 1, lineHeight: 1.2 }}>
                Bảng điều khiển
              </Typography>
              <Typography variant="h6" sx={{ color: alpha('#fff', 0.9), maxWidth: 520 }}>
                Quản lý các chuyến du lịch, ngân sách và kế hoạch sắp tới của bạn
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate('/trip-planner')}
              sx={{
                px: 4,
                py: 1.75,
                borderRadius: '999px',
                background: gradients.secondary,
                fontWeight: 700,
                boxShadow: '0 12px 32px rgba(255,138,101,0.35)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 18px 36px rgba(255,138,101,0.45)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Tạo chuyến mới
            </Button>
          </Box>

          {error && (
            <Typography color="error" sx={{ mb: 3, bgcolor: alpha('#fff', 0.9), p: 2, borderRadius: 2 }}>
              {error}
            </Typography>
          )}

          {/* Stats Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1,minmax(0,1fr))', sm: 'repeat(2,minmax(0,1fr))', md: 'repeat(3,minmax(0,1fr))' },
              gap: 3,
            }}
          >
            {stats.map((stat, i) => (
              <Zoom in timeout={400 + i * 100} key={stat.label}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    background: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: stat.gradient,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ background: stat.gradient, width: 56, height: 56 }}>
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color }}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            ))}
          </Box>

          {/* Budget Progress */}
          {totalBudget > 0 && (
            <Fade in timeout={800}>
              <Card sx={{ mt: 4, borderRadius: 4, background: '#fff' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ background: gradients.accent }}>
                        <TrendingUp />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Tổng ngân sách
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${budgetProgress.toFixed(1)}%`}
                      color={budgetProgress > 80 ? 'error' : budgetProgress > 50 ? 'warning' : 'success'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(budgetProgress, 100)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: alpha(brandColors.accent, 0.1),
                      '& .MuiLinearProgress-bar': { background: gradients.accent, borderRadius: 5 },
                    }}
                  />
                </CardContent>
              </Card>
            </Fade>
          )}
        </Container>
      </Box>

      {/* === Recent Trips Grid === */}
      <Container maxWidth="lg" sx={{ mt: -4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1a1a1a' }}>
            Chuyến du lịch gần đây
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý và theo dõi các chuyến đi của bạn
          </Typography>
        </Box>

        {trips.length === 0 ? (
          <Fade in timeout={600}>
            <Card sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
              <FlightTakeoff sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Chưa có chuyến du lịch nào</Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => navigate('/trip-planner')}
                sx={{ mt: 2, px: 4, py: 1.5, borderRadius: 3, background: gradients.primary, fontWeight: 700 }}
              >
                Tạo chuyến mới
              </Button>
            </Card>
          </Fade>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1,1fr)', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, gap: 3 }}>
            {trips.slice(0, 9).map((trip, idx) => (
              <Zoom in timeout={400 + idx * 50} key={trip._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.4s ease',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                      '& .trip-header': {
                        background: gradients.primary,
                        color: '#fff',
                        '& .MuiTypography-caption': { color: alpha('#fff', 0.8) }
                      },
                    },
                    '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: gradients.primary },
                  }}
                >
                    <Box className="trip-header" sx={{ p: 3, background: alpha(brandColors.primary, 0.1), transition: 'all 0.4s ease' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
                          <Avatar sx={{ background: gradients.primary, width: 48, height: 48 }}>
                            <FlightTakeoff />
                          </Avatar>
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {trip.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Chip label={getStatusText(trip.status)} color={getStatusColor(trip.status) as any} size="small" sx={{ fontWeight: 600 }} />
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip icon={<Place sx={{ fontSize: 16 }} />} size="small" label={`${trip.destinations.length} điểm đến`} sx={{ bgcolor: alpha(brandColors.secondary, 0.1), color: brandColors.secondary, fontWeight: 600 }} />
                        <Chip icon={<People sx={{ fontSize: 16 }} />} size="small" label={`${trip.travelers.length} người`} sx={{ bgcolor: alpha(brandColors.success, 0.1), color: brandColors.success, fontWeight: 600 }} />
                      </Box>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(brandColors.accent, 0.05), border: '1px solid', borderColor: alpha(brandColors.accent, 0.2) }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Ngân sách</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.accent }}>{formatCurrency(trip.budget.total || 0)}</Typography>
                        <LinearProgress variant="determinate" value={trip.budget.total > 0 ? Math.min((trip.budget.spent / trip.budget.total) * 100, 100) : 0} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha(brandColors.accent, 0.1), '& .MuiLinearProgress-bar': { background: gradients.accent, borderRadius: 3 } }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>Đã chi: {formatCurrency(trip.budget.spent || 0)}</Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ mt: 'auto', p: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
                      <Button size="small" onClick={() => handleOpenDetailsModal(trip)} sx={{ fontWeight: 600 }}>Xem chi tiết</Button>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenEditModal(trip)} sx={{ '&:hover': { bgcolor: alpha(brandColors.primary, 0.1), color: brandColors.primary } }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(trip)} sx={{ '&:hover': { bgcolor: alpha('#f44336', 0.1) } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
              </Zoom>
            ))}
          </Box>
        )}
      </Container>
      
      {/* === Dialog Xóa === */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <WarningAmber color="error" /> Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa chuyến đi <strong>"{tripToProcess?.title}"</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteConfirm}>Hủy</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Xóa</Button>
        </DialogActions>
      </Dialog>
      
      {/* === Modal Chỉnh sửa === */}
      <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, minWidth: { xs: '100%', md: 700 } } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
          Chỉnh sửa chuyến đi
          <IconButton onClick={handleCloseEditModal} sx={{ position: 'absolute', top: 8, right: 8 }}><Close /></IconButton>
        </DialogTitle>
        
        {editForm && (
          <>
            <DialogContent sx={{ p: 0, background: brandColors.background }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', background: '#fff' }}>
                <Tabs value={editTabValue} onChange={(e, newValue) => setEditTabValue(newValue)} variant="scrollable" scrollButtons="auto">
                  <Tab label="Thông tin chung" value="1" />
                  <Tab label={`Người tham gia `} value="2" />
                  <Tab label={`Điểm đến `} value="3" />
                  {/* === MỚI: Tab Lịch trình === */}
                  <Tab label={`Lịch trình `} value="4" />
                </Tabs>
              </Box>

              {/* Panel 1: Thông tin chung */}
              <Box sx={{ p: 3 }} hidden={editTabValue !== '1'}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                  <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField autoFocus name="title" label="Tên chuyến đi" fullWidth variant="outlined" value={editForm.title} onChange={handleFormChange} />
                  </Box>
                  <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField name="description" label="Mô tả" fullWidth multiline rows={3} variant="outlined" value={editForm.description} onChange={handleFormChange} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField name="startDate" label="Ngày bắt đầu" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editForm.startDate} onChange={handleFormChange} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField name="endDate" label="Ngày kết thúc" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editForm.endDate} onChange={handleFormChange} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField name="total" label="Tổng ngân sách" type="number" fullWidth variant="outlined" value={editForm.budget.total} onChange={handleFormChange} InputProps={{ startAdornment: <InputAdornment position="start">VND</InputAdornment> }} />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField name="spent" label="Đã chi tiêu" type="number" fullWidth variant="outlined" value={editForm.budget.spent} onChange={handleFormChange} InputProps={{ startAdornment: <InputAdornment position="start">VND</InputAdornment> }} />
                  </Box>
                </Box>
              </Box>
              
              {/* Panel 2: Người tham gia */}
              <Box sx={{ p: 3 }} hidden={editTabValue !== '2'}>
                {editForm.travelers.map((traveler, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2, position: 'relative', borderRadius: 2 }}>
                    <IconButton size="small" onClick={() => handleRemoveTraveler(index)} sx={{ position: 'absolute', top: 8, right: 8 }}><Delete fontSize="small" color="error" /></IconButton>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box sx={{ gridColumn: 'span 12' }}>
                        <TextField label={`Tên người ${index + 1}`} fullWidth value={traveler.name} onChange={(e) => handleTravelerChange(index, 'name', e.target.value)} />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField label="Email" fullWidth value={traveler.email} onChange={(e) => handleTravelerChange(index, 'email', e.target.value)} />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField label="Số điện thoại" fullWidth value={traveler.phone} onChange={(e) => handleTravelerChange(index, 'phone', e.target.value)} />
                      </Box>
                    </Box>
                  </Card>
                ))}
                <Button onClick={handleAddTraveler} startIcon={<PersonAdd />} variant="outlined" fullWidth sx={{ mt: 1, borderStyle: 'dashed' }}>Thêm người tham gia</Button>
              </Box>
              
              {/* Panel 3: Điểm đến (Autocomplete) */}
              <Box sx={{ p: 3 }} hidden={editTabValue !== '3'}>
                {editForm.destinations.map((dest, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2, position: 'relative', borderRadius: 2 }}>
                    <IconButton size="small" onClick={() => handleRemoveDestination(index)} sx={{ position: 'absolute', top: 8, right: 8 }}><Delete fontSize="small" color="error" /></IconButton>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box sx={{ gridColumn: 'span 12' }}>
                        <Autocomplete
                          fullWidth
                          freeSolo
                          options={destOptions}
                          loading={destLoading}
                          getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                          onInputChange={(event, newInputValue) => setCurrentDestSearch(newInputValue)}
                          onChange={(event, newValue) => {
                            const newName = typeof newValue === 'string' ? newValue : (newValue?.name || '');
                            handleDestinationChange(index, 'name', newName);
                          }}
                          value={dest.name}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option._id}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>{option.name}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>({option.city}, {option.country})</Typography>
                            </Box>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={`Tên điểm đến ${index + 1}`}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {destLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                ),
                              }}
                            />
                          )}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField label="Ngày đến" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dest.arrivalDate} onChange={(e) => handleDestinationChange(index, 'arrivalDate', e.target.value)} />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField label="Ngày đi" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dest.departureDate} onChange={(e) => handleDestinationChange(index, 'departureDate', e.target.value)} />
                      </Box>

                      <Box sx={{ gridColumn: 'span 12' }}>
                        <TextField 
                            label="Khách sạn" 
                            fullWidth 
                            value={dest.hotel || ''} 
                            onChange={(e) => handleDestinationChange(index, 'hotel', e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Hotel fontSize="small"/></InputAdornment> }}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField 
                            label="Nhà hàng" 
                            fullWidth 
                            value={dest.restaurants || ''} 
                            onChange={(e) => handleDestinationChange(index, 'restaurants', e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Restaurant fontSize="small"/></InputAdornment> }}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField 
                            label="Điểm tham quan" 
                            fullWidth 
                            value={dest.attractions || ''} 
                            onChange={(e) => handleDestinationChange(index, 'attractions', e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Attractions fontSize="small"/></InputAdornment> }}
                        />
                      </Box>

                    </Box>
                  </Card>
                ))}
                <Button onClick={handleAddDestination} startIcon={<LocationOn />} variant="outlined" fullWidth sx={{ mt: 1, borderStyle: 'dashed' }}>Thêm điểm đến</Button>
              </Box>

              {/* === Panel 4: Chỉnh sửa Lịch trình === */}
<Box sx={{ p: 3 }} hidden={editTabValue !== '4'}>
  {/* LOGIC: Nếu có Itinerary (từ AI) thì hiện Form AI, ngược lại hiện Form nhập tay */}
  
  {editForm.itinerary && editForm.itinerary.length > 0 ? (
    /* === CASE 1: HIỂN THỊ FORM AI (CÓ DỮ LIỆU CẤU TRÚC) === */
    <>
      {editForm.itinerary.map((dayPlan, dayIdx) => (
        <Box key={dayIdx} sx={{ mb: 4 }}>
          <Box sx={{ bgcolor: alpha(brandColors.primary, 0.1), p: 1.5, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: brandColors.primary }}>
                  Ngày {dayPlan.day} - {formatDate(dayPlan.date)}
              </Typography>
          </Box>
          
          {dayPlan.activities.map((activity, actIdx) => (
              <Card key={actIdx} sx={{ mb: 2, p: 2, border: '1px solid #eee' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 2, mb: 2 }}>
                      <TextField 
                          label="Giờ" size="small"
                          value={activity.time}
                          onChange={(e) => handleItineraryChange(dayIdx, actIdx, 'time', e.target.value)}
                          InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime fontSize="small"/></InputAdornment> }}
                      />
                      <TextField 
                          label="Hoạt động" size="small" fullWidth
                          value={activity.title}
                          onChange={(e) => handleItineraryChange(dayIdx, actIdx, 'title', e.target.value)}
                      />
                  </Box>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                      <TextField 
                          label="Mô tả / Địa chỉ" size="small" multiline maxRows={3} fullWidth
                          value={activity.description}
                          onChange={(e) => handleItineraryChange(dayIdx, actIdx, 'description', e.target.value)}
                      />
                      <TextField 
                          label="Chi phí dự kiến" size="small" type="number" fullWidth
                          value={activity.cost}
                          onChange={(e) => handleItineraryChange(dayIdx, actIdx, 'cost', parseInt(e.target.value) || 0)}
                          InputProps={{ startAdornment: <InputAdornment position="start">VND</InputAdornment> }}
                      />
                  </Box>
              </Card>
          ))}
        </Box>
      ))}
    </>
  ) : (
    /* === CASE 2: HIỂN THỊ FORM NHẬP TAY (NẾU KHÔNG CÓ DATA AI) === */
    <Box>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <Edit fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700}>
                Nhập lịch trình thủ công
            </Typography>
        </Box>
        <TextField
            name="tripDetails"
            multiline
            minRows={10} // Tăng độ cao để dễ nhập
            fullWidth
            variant="outlined"
            label="Nội dung lịch trình"
            placeholder="Ví dụ: \nNgày 1: Đáp máy bay xuống Đà Nẵng...\nNgày 2: Đi Bà Nà Hills..."
            value={editForm.tripDetails}
            onChange={handleFormChange}
            sx={{ bgcolor: '#fff' }}
        />
    </Box>
  )}
</Box>

            </DialogContent>
            
            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={handleCloseEditModal} disabled={isSaving}>Hủy</Button>
              <Button onClick={handleUpdateTrip} variant="contained" disabled={isSaving} startIcon={<Save />}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* === Modal Xem Chi Tiết === */}
      <Dialog
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', minHeight: '80vh' } }}
      >
        {tripToProcess && (
          <>
            {/* Header */}
            <Box sx={{ p: { xs: 2, md: 3 }, background: gradients.primary, color: '#fff', position: 'relative' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, pr: 4 }}>
                {tripToProcess.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  icon={<CalendarToday sx={{ color: '#fff !important' }} />}
                  label={`${formatDate(tripToProcess.startDate)} - ${formatDate(tripToProcess.endDate)}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, border: 'none' }}
                />
                <Chip
                  icon={<AttachMoney sx={{ color: '#fff !important' }} />}
                  label={formatCurrency(tripToProcess.budget.total || 0)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, border: 'none' }}
                />
              </Box>
              
              {/* Tabs chuyển đổi */}
              <Tabs 
                value={detailsTabValue} 
                onChange={(e, v) => setDetailsTabValue(v)}
                textColor="inherit"
                TabIndicatorProps={{ style: { background: '#fff', height: 4, borderRadius: 4 } }}
                sx={{ minHeight: 48 }}
              >
                <Tab label="Tổng quan" value="1" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
                <Tab label="Lịch trình chi tiết" value="2" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
              </Tabs>

              <IconButton onClick={handleCloseDetailsModal} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff' }}><Close /></IconButton>
            </Box>

            <DialogContent sx={{ p: 0, bgcolor: '#f8f9fa' }}>
              
              {/* TAB 1: TỔNG QUAN */}
              <Box sx={{ p: 3 }} hidden={detailsTabValue !== '1'}>
                 <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                  {tripToProcess.description || 'Chưa có mô tả chi tiết cho chuyến đi này.'}
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  {/* Cột Người tham gia */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, background: alpha(brandColors.primary, 0.1), color: brandColors.primary }}><People fontSize="small" /></Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Du khách ({tripToProcess.travelers.length})</Typography>
                    </Box>
                    {tripToProcess.travelers.map((traveler, idx) => (
                      <Card key={idx} sx={{ p: 2, mb: 1.5, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{traveler.name}</Typography>
                        {traveler.email && <Typography variant="caption" display="block" color="text.secondary">📧 {traveler.email}</Typography>}
                      </Card>
                    ))}
                  </Box>

                  {/* Cột Điểm đến */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, background: alpha(brandColors.secondary, 0.1), color: brandColors.secondary }}><LocationOn fontSize="small" /></Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Điểm đến ({tripToProcess.destinations.length})</Typography>
                    </Box>
                    {tripToProcess.destinations.map((dest, idx) => (
                      <Card key={idx} sx={{ p: 2, mb: 1.5, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}>{dest.name}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          📅 {formatDate(dest.arrivalDate)} → {formatDate(dest.departureDate)}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {renderLocationList(dest.hotels || dest.hotel, 'hotel')}
                          {renderLocationList(dest.restaurants, 'restaurant')}
                          {renderLocationList(dest.attractions, 'attraction')}
                      </Box>
                      </Card>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* TAB 2: LỊCH TRÌNH CHI TIẾT */}
<Box sx={{ p: 3 }} hidden={detailsTabValue !== '2'}>
  
  {/* CASE 1: Ưu tiên hiển thị AI nếu có dữ liệu */}
  {tripToProcess.itinerary && tripToProcess.itinerary.length > 0 ? (
    <Box>
      {tripToProcess.itinerary.map((dayPlan, dayIdx) => (
        <Box key={dayIdx} sx={{ mb: 4, position: 'relative' }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'sticky', top: 0, bgcolor: '#f8f9fa', zIndex: 1, py: 1 }}>
                <Chip label={`Ngày ${dayPlan.day}`} sx={{ bgcolor: brandColors.primary, color: '#fff', fontWeight: 800, fontSize: '1rem', height: 32 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  {new Date(dayPlan.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
                </Typography>
             </Box>
             <Box sx={{ pl: 2, borderLeft: `2px solid ${alpha(brandColors.primary, 0.2)}`, ml: 2 }}>
                {dayPlan.activities.map((activity, actIdx) => (
                  <Box key={actIdx} sx={{ position: 'relative', pl: 3, pb: 3 }}>
                    <Box sx={{ position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%', bgcolor: '#fff', border: `3px solid ${brandColors.primary}` }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: brandColors.primary, display: 'block', mb: 0.5 }}>{activity.time}</Typography>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}>{activity.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{activity.description}</Typography>
                        {activity.cost > 0 && <Chip size="small" label={formatCurrency(activity.cost)} variant="outlined" color="primary" sx={{ mt: 1 }} />}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
             </Box>
        </Box>
      ))}
    </Box>
  ) : (
    /* CASE 2: Nếu không có AI thì hiển thị Text nhập tay */
    <Card sx={{ p: 3, borderRadius: 3, border: '1px dashed #ccc', bgcolor: '#fff', minHeight: 200 }}>
        {tripToProcess.tripDetails ? (
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-line', 
                lineHeight: 1.8,
                color: '#333',
                fontSize: '1rem'
              }}
            >
              {tripToProcess.tripDetails}
            </Typography>
        ) : (
            /* CASE 3: Không có gì cả */
            <Box sx={{ textAlign: 'center', py: 6, opacity: 0.6 }}>
                <CalendarToday sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1">Chuyến đi này chưa có lịch trình chi tiết.</Typography>
            </Box>
        )}
    </Card>
  )}
</Box>

            </DialogContent>
          </>
        )}
      </Dialog>

      {/* === Snackbar === */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, boxShadow: 6 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;