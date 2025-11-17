// fileName: Dashboard.tsx
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
  // === THÊM MỚI (1) ===
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  InputAdornment,
  Tab, // Thêm Tab
  Tabs, // Thêm Tabs
  Autocomplete, // Thêm Autocomplete
  CircularProgress, // Thêm CircularProgress
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
  Star,
  WarningAmber, 
  Save, 
  Email, 
  Phone, 
  Close, 
  PersonAdd, // Thêm
  LocationOn, // Thêm
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gradients, brandColors } from '../theme/branding';

// === THÊM MỚI (2): Interface cho API Gợi ý ===
interface Destination {
  _id: string;
  name: string;
  country: string;
  city: string;
}

// === THÊM MỚI (3): Interface cho Traveler và Destination (để dùng trong form) ===
interface EditTraveler {
  name: string;
  email?: string;
  phone?: string;
}

interface EditDestination {
  name: string;
  arrivalDate: string;
  departureDate: string;
}


interface Trip {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  budget: {
    total: number;
    spent: number;
    currency: string;
  };
  destinations: Array<EditDestination>; // Sửa
  travelers: Array<EditTraveler>; // Sửa
}

// === THÊM MỚI (4): Interface cho Form Sửa (Giờ chứa tất cả) ===
interface EditFormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: {
    total: number;
    spent: number;
  };
  travelers: Array<EditTraveler>;
  destinations: Array<EditDestination>;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// === THÊM MỚI (5): Hàm format ngày cho input type="date" ===
const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  try {
    // Chuyển đổi từ ISO string hoặc Date string sang yyyy-mm-dd
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

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  const [tripToProcess, setTripToProcess] = useState<Trip | null>(null);
  
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [editTabValue, setEditTabValue] = useState('1');
  
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // === THÊM MỚI (6): State cho Autocomplete điểm đến ===
  const [destOptions, setDestOptions] = useState<Destination[]>([]);
  const [destLoading, setDestLoading] = useState(false);
  const [currentDestSearch, setCurrentDestSearch] = useState(""); // Chuỗi đang gõ

  useEffect(() => {
    fetchTrips();
  }, []);

  // === THÊM MỚI (7): useEffect gọi API cho Autocomplete ===
  React.useEffect(() => {
    if (currentDestSearch.trim() === '') {
      setDestOptions([]);
      return;
    }

    setDestLoading(true);
    // Debounce: Chờ 500ms sau khi người dùng ngừng gõ
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
  }, [currentDestSearch]); // Chạy lại mỗi khi chuỗi tìm kiếm thay đổi

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

  // === Dialog Xóa ===
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

  // === Modal Sửa ===
  const handleOpenEditModal = (trip: Trip) => {
    setTripToProcess(trip);
    setEditForm({
      title: trip.title,
      description: trip.description || '',
      startDate: formatDateForInput(trip.startDate),
      endDate: formatDateForInput(trip.endDate),
      budget: {
        total: trip.budget.total || 0,
        spent: trip.budget.spent || 0,
      },
      // Thêm travelers và destinations vào form
      travelers: trip.travelers.map(t => ({...t})), // Copy array
      destinations: trip.destinations.map(d => ({
        ...d,
        arrivalDate: formatDateForInput(d.arrivalDate), // Format ngày
        departureDate: formatDateForInput(d.departureDate), // Format ngày
      })),
    });
    setEditTabValue('1'); // Reset về tab 1
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setTripToProcess(null);
    setEditModalOpen(false);
    setEditForm(null); // Reset form
    setIsSaving(false);
  };

  // === Modal Chi tiết ===
  const handleOpenDetailsModal = (trip: Trip) => {
    setTripToProcess(trip);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setTripToProcess(null);
    setDetailsModalOpen(false);
  };


  // === Hàm cập nhật state của form sửa (chung) ===
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (!editForm) return;

    // Xử lý các trường budget lồng nhau
    if (name === 'total' || name === 'spent') {
      setEditForm({
        ...editForm,
        budget: {
          ...editForm.budget,
          [name]: parseFloat(value) || 0, // Chuyển sang số
        },
      });
    } else {
      // Xử lý các trường bình thường
      setEditForm({
        ...editForm,
        [name]: value,
      });
    }
  };
  
  // === Các hàm xử lý mảng Travelers trong Form ===
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

  // === Các hàm xử lý mảng Destinations trong Form ===
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
      destinations: [...editForm.destinations, { name: '', arrivalDate: '', departureDate: '' }],
    });
  };

  const handleRemoveDestination = (index: number) => {
    if (!editForm) return;
    const updatedDestinations = editForm.destinations.filter((_, i) => i !== index);
    setEditForm({ ...editForm, destinations: updatedDestinations });
  };


  // === Hàm cập nhật toàn bộ thông tin chuyến đi (có validate) ===
  const handleUpdateTrip = async () => {
    if (!tripToProcess || !editForm) return;

    setIsSaving(true);

    // Validate Tab 1: Thông tin chung
    if (!editForm.title.trim()) {
      showSnackbar('Tên chuyến đi không được để trống.', 'error');
      setEditTabValue('1'); // Chuyển về tab lỗi
      setIsSaving(false);
      return;
    }
    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      showSnackbar('Ngày kết thúc không thể trước ngày bắt đầu.', 'error');
      setEditTabValue('1');
      setIsSaving(false);
      return;
    }

    // Validate Tab 2: Người tham gia
    for (let index = 0; index < editForm.travelers.length; index++) {
      const traveler = editForm.travelers[index];
      if (!traveler.name.trim()) {
        showSnackbar(`Vui lòng nhập tên cho Người tham gia ${index + 1}.`, 'error');
        setEditTabValue('2'); // Chuyển về tab lỗi
        setIsSaving(false);
        return;
      }
    }
    
    // Validate Tab 3: Điểm đến
    for (let index = 0; index < editForm.destinations.length; index++) {
      const dest = editForm.destinations[index];
      if (!dest.name.trim()) {
        showSnackbar(`Vui lòng nhập tên cho Điểm đến ${index + 1}.`, 'error');
        setEditTabValue('3'); // Chuyển về tab lỗi
        setIsSaving(false);
        return;
      }
      if (!dest.arrivalDate || !dest.departureDate) {
        showSnackbar(`Vui lòng nhập ngày cho Điểm đến ${index + 1}.`, 'error');
        setEditTabValue('3');
        setIsSaving(false);
        return;
      }
      if (new Date(dest.departureDate) < new Date(dest.arrivalDate)) {
        showSnackbar(`Ngày đi không thể trước ngày đến (Điểm đến ${index + 1}).`, 'error');
        setEditTabValue('3');
        setIsSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      // SỬ DỤNG 'PUT' ĐỂ KHỚP VỚI BACKEND (trips.js)
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/trips/${tripToProcess._id}`,
        editForm, // Gửi toàn bộ form đã sửa
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cập nhật state local để UI thay đổi ngay
      setTrips((prevTrips) =>
        prevTrips.map((t) =>
          t._id === tripToProcess._id ? response.data.trip : t
        )
      );

      showSnackbar('Cập nhật chuyến đi thành công!', 'success');
      handleCloseEditModal();
    } catch (err) {
      showSnackbar('Lỗi khi cập nhật chuyến đi. Vui lòng thử lại.', 'error');
      setIsSaving(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Đang lập kế hoạch';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const totalSpent = trips.reduce((acc, t) => acc + (t.budget.spent || 0), 0);
  const totalBudget = trips.reduce((acc, t) => acc + (t.budget.total || 0), 0);
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const stats = [
    {
      label: 'Chuyến du lịch',
      value: trips.length,
      icon: <FlightTakeoff />,
      gradient: gradients.primary,
      color: brandColors.primary,
    },
    {
      label: 'Điểm đến',
      value: trips.reduce((acc, t) => acc + t.destinations.length, 0),
      icon: <Place />,
      gradient: gradients.secondary,
      color: brandColors.secondary,
    },
    {
      label: 'Người đi cùng',
      value: trips.reduce((acc, t) => acc + t.travelers.length, 0),
      icon: <People />,
      gradient: gradients.success,
      color: brandColors.success,
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: brandColors.background, minHeight: '100vh', pb: 6 }}>
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
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
                      <Avatar
                        sx={{
                          background: stat.gradient,
                          width: 56,
                          height: 56,
                        }}
                      >
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
                          Tiến độ ngân sách
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
                      '& .MuiLinearProgress-bar': {
                        background: gradients.accent,
                        borderRadius: 5,
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Fade>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4 }}>
        {/* Recent Trips - Fixed text color */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 800, 
              mb: 1,
              color: '#1a1a1a' // Đổi từ '#fff' sang màu tối
            }}
          >
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
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Chưa có chuyến du lịch nào
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Hãy tạo chuyến du lịch đầu tiên của bạn
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => navigate('/trip-planner')}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: gradients.primary,
                  fontWeight: 700,
                }}
              >
                Tạo chuyến mới
              </Button>
            </Card>
          </Fade>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(1,minmax(0,1fr))', sm: 'repeat(2,minmax(0,1fr))', md: 'repeat(3,minmax(0,1fr))' },
              gap: 3,
            }}
          >
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
                        color: '#fff', // Thêm màu chữ trắng khi hover
                        '& .MuiTypography-caption': { // Thêm
                          color: alpha('#fff', 0.8),
                        }
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: gradients.primary,
                    },
                  }}
                >
                    <Box
                      className="trip-header"
                      sx={{
                        p: 3,
                        background: alpha(brandColors.primary, 0.1),
                        transition: 'all 0.4s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
                          <Avatar
                            sx={{
                              background: gradients.primary,
                              width: 48,
                              height: 48,
                            }}
                          >
                            <FlightTakeoff />
                          </Avatar>
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
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
                        <Chip
                          label={getStatusText(trip.status)}
                          color={getStatusColor(trip.status) as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          icon={<Place sx={{ fontSize: 16 }} />}
                          size="small"
                          label={`${trip.destinations.length} điểm đến`}
                          sx={{ bgcolor: alpha(brandColors.secondary, 0.1), color: brandColors.secondary, fontWeight: 600 }}
                        />
                        <Chip
                          icon={<People sx={{ fontSize: 16 }} />}
                          size="small"
                          label={`${trip.travelers.length} người`}
                          sx={{ bgcolor: alpha(brandColors.success, 0.1), color: brandColors.success, fontWeight: 600 }}
                        />
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(brandColors.accent, 0.05),
                          border: '1px solid',
                          borderColor: alpha(brandColors.accent, 0.2),
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Ngân sách
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.accent }}>
                          {formatCurrency(trip.budget.total || 0)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            trip.budget.total > 0 ? Math.min((trip.budget.spent / trip.budget.total) * 100, 100) : 0
                          }
                          sx={{
                            mt: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(brandColors.accent, 0.1),
                            '& .MuiLinearProgress-bar': {
                              background: gradients.accent,
                              borderRadius: 3,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Đã chi: {formatCurrency(trip.budget.spent || 0)}
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions
                      sx={{
                        mt: 'auto',
                        p: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* === SỬA LẠI (11): Nút Xem chi tiết === */}
                      <Button
                        size="small"
                        onClick={() => handleOpenDetailsModal(trip)} // Sửa: Mở Modal Chi tiết
                        sx={{ fontWeight: 600 }}
                      >
                        Xem chi tiết
                      </Button>
                      <Box>
                        {/* === Nút Edit === */}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(trip)} // Sửa: Mở Modal
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(brandColors.primary, 0.1),
                              color: brandColors.primary,
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        {/* === Nút Delete === */}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteConfirm(trip)} // Sửa: Mở Dialog
                          sx={{
                            '&:hover': {
                              bgcolor: alpha('#f44336', 0.1),
                            },
                          }}
                        >
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
      
      {/* === Dialog Xác nhận Xóa === */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <WarningAmber color="error" />
          Xác nhận xóa
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa chuyến đi{' '}
            <strong>"{tripToProcess?.title}"</strong>?
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteConfirm}>Hủy</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* === SỬA LẠI (12): Modal Chỉnh sửa Đầy đủ === */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="md" // Mở rộng modal
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minWidth: { xs: '100%', md: 700 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
          Chỉnh sửa chuyến đi
          <IconButton 
            onClick={handleCloseEditModal} 
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        {/* Kiểm tra 'editForm' đã load chưa */}
        {editForm && (
          <>
            <DialogContent sx={{ p: 0, background: brandColors.background }}>
              {/* === THÊM MỚI: TABS === */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', background: '#fff' }}>
                <Tabs value={editTabValue} onChange={(e, newValue) => setEditTabValue(newValue)} centered>
                  <Tab label="Thông tin chung" value="1" />
                  <Tab label={`Người tham gia (${editForm.travelers.length})`} value="2" />
                  <Tab label={`Điểm đến (${editForm.destinations.length})`} value="3" />
                </Tabs>
              </Box>

              {/* === Panel 1: Thông tin chung === */}
              <Box sx={{ p: 3 }} hidden={editTabValue !== '1'}>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(12, 1fr)', 
                    gap: 2,
                  }}
                >
                  <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField
                      autoFocus
                      name="title"
                      label="Tên chuyến đi"
                      fullWidth
                      variant="outlined"
                      value={editForm.title}
                      onChange={handleFormChange}
                    />
                  </Box>
                  <Box sx={{ gridColumn: 'span 12' }}>
                    <TextField
                      name="description"
                      label="Mô tả"
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      value={editForm.description}
                      onChange={handleFormChange}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField
                      name="startDate"
                      label="Ngày bắt đầu"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={editForm.startDate}
                      onChange={handleFormChange}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField
                      name="endDate"
                      label="Ngày kết thúc"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={editForm.endDate}
                      onChange={handleFormChange}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField
                      name="total"
                      label="Tổng ngân sách"
                      type="number"
                      fullWidth
                      variant="outlined"
                      value={editForm.budget.total}
                      onChange={handleFormChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">VND</InputAdornment>,
                      }}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <TextField
                      name="spent"
                      label="Đã chi tiêu"
                      type="number"
                      fullWidth
                      variant="outlined"
                      value={editForm.budget.spent}
                      onChange={handleFormChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">VND</InputAdornment>,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              
              {/* === Panel 2: Người tham gia === */}
              <Box sx={{ p: 3 }} hidden={editTabValue !== '2'}>
                {editForm.travelers.map((traveler, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2, position: 'relative', borderRadius: 2 }}>
                    <IconButton 
                      size="small"
                      onClick={() => handleRemoveTraveler(index)}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box sx={{ gridColumn: 'span 12' }}>
                        <TextField
                          label={`Tên người ${index + 1}`}
                          fullWidth
                          value={traveler.name}
                          onChange={(e) => handleTravelerChange(index, 'name', e.target.value)}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField
                          label="Email"
                          fullWidth
                          value={traveler.email}
                          onChange={(e) => handleTravelerChange(index, 'email', e.target.value)}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField
                          label="Số điện thoại"
                          fullWidth
                          value={traveler.phone}
                          onChange={(e) => handleTravelerChange(index, 'phone', e.target.value)}
                        />
                      </Box>
                    </Box>
                  </Card>
                ))}
                <Button 
                  onClick={handleAddTraveler} 
                  startIcon={<PersonAdd />} 
                  variant="outlined" 
                  fullWidth
                  sx={{ mt: 1, borderStyle: 'dashed' }}
                >
                  Thêm người tham gia
                </Button>
              </Box>
              
              {/* === SỬA LẠI (13): Panel 3: Điểm đến (thêm Autocomplete) === */}
              <Box sx={{ p: 3 }} hidden={editTabValue !== '3'}>
                {editForm.destinations.map((dest, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2, position: 'relative', borderRadius: 2 }}>
                    <IconButton 
                      size="small"
                      onClick={() => handleRemoveDestination(index)}
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box sx={{ gridColumn: 'span 12' }}>
                        {/* === SỬ DỤNG AUTOCOMPLETE === */}
                        <Autocomplete
                          fullWidth
                          freeSolo // Cho phép người dùng gõ tự do
                          options={destOptions}
                          loading={destLoading}
                          getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                          // Cập nhật chuỗi tìm kiếm khi gõ
                          onInputChange={(event, newInputValue) => {
                            setCurrentDestSearch(newInputValue);
                          }}
                          // Cập nhật giá trị khi chọn hoặc gõ xong
                          onChange={(event, newValue) => {
                            const newName = typeof newValue === 'string' ? newValue : (newValue?.name || '');
                            handleDestinationChange(index, 'name', newName);
                          }}
                          // Hiển thị giá trị hiện tại
                          value={dest.name}
                          renderOption={(props, option) => (
                            <Box component="li" {...props} key={option._id}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {option.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
                                ({option.city}, {option.country})
                              </Typography>
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
                        <TextField
                          label="Ngày đến"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={dest.arrivalDate}
                          onChange={(e) => handleDestinationChange(index, 'arrivalDate', e.target.value)}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                        <TextField
                          label="Ngày đi"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={dest.departureDate}
                          onChange={(e) => handleDestinationChange(index, 'departureDate', e.target.value)}
                        />
                      </Box>
                    </Box>
                  </Card>
                ))}
                <Button 
                  onClick={handleAddDestination} 
                  startIcon={<LocationOn />} 
                  variant="outlined" 
                  fullWidth
                  sx={{ mt: 1, borderStyle: 'dashed' }}
                >
                  Thêm điểm đến
                </Button>
              </Box>
            </DialogContent>
            
            {/* Actions (Nút Hủy / Lưu) */}
            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={handleCloseEditModal} disabled={isSaving}>Hủy</Button>
              <Button
                onClick={handleUpdateTrip}
                variant="contained"
                disabled={isSaving}
                startIcon={<Save />}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
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
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }} // Thêm overflow
      >
        {/* Kiểm tra tripToProcess trước khi render */}
        {tripToProcess && (
          <>
            {/* Header (Giống ảnh image_56b921.png) */}
            <Box sx={{ p: {xs: 2, md: 3}, background: gradients.primary, color: '#fff' }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                {tripToProcess.title}
              </Typography>
              <Typography variant="body1" sx={{ color: alpha('#fff', 0.9), mb: 3 }}>
                {tripToProcess.description || 'Chưa có mô tả'}
              </Typography>
              {/* Dòng các chip thông tin */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CalendarToday sx={{color: '#fff !important'}} />}
                  label={`${formatDate(tripToProcess.startDate)} - ${formatDate(tripToProcess.endDate)}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                />
                <Chip
                  icon={<AttachMoney sx={{color: '#fff !important'}} />}
                  label={formatCurrency(tripToProcess.budget.total || 0)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                />
                <Chip
                  icon={<People sx={{color: '#fff !important'}} />}
                  label={`${tripToProcess.travelers.length} người`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                />
                <Chip
                  icon={<Place sx={{color: '#fff !important'}} />}
                  label={`${tripToProcess.destinations.length} điểm đến`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                />
              </Box>
              {/* Nút đóng ở góc */}
              <IconButton 
                onClick={handleCloseDetailsModal} 
                sx={{ position: 'absolute', top: 8, right: 8, color: '#fff' }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Body (2 Cột) */}
            <DialogContent sx={{ pt: 3, background: brandColors.background }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                
                {/* Cột 1: Người tham gia */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ background: gradients.primary }}>
                      <People />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Người tham gia ({tripToProcess.travelers.length})
                    </Typography>
                  </Box>
                  {tripToProcess.travelers.length > 0 ? (
                    tripToProcess.travelers.map((traveler, idx) => (
                      <Card key={idx} sx={{ p: 2.5, mb: 2, borderRadius: 3, boxShadow: 'none' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {traveler.name || `Người ${idx + 1}`}
                        </Typography>
                        {/* Hiển thị email và phone (từ interface đã sửa) */}
                        {traveler.email && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Email sx={{ fontSize: 14 }} /> {traveler.email}
                          </Typography>
                        )}
                        {traveler.phone && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Phone sx={{ fontSize: 14 }} /> {traveler.phone}
                          </Typography>
                        )}
                      </Card>
                    ))
                  ) : (
                    <Card sx={{ p: 2.5, borderRadius: 3, boxShadow: 'none' }}>
                      <Typography color="text.secondary">Chưa có người tham gia</Typography>
                    </Card>
                  )}
                </Box>

                {/* Cột 2: Điểm đến */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ background: gradients.primary }}>
                      <Place />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Điểm đến ({tripToProcess.destinations.length})
                    </Typography>
                  </Box>
                  {tripToProcess.destinations.length > 0 ? (
                    tripToProcess.destinations.map((dest, idx) => (
                      <Card key={idx} sx={{ p: 2.5, mb: 2, borderRadius: 3, boxShadow: 'none' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {idx + 1}. {dest.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📅 {formatDate(dest.arrivalDate)} → {formatDate(dest.departureDate)}
                        </Typography>
                      </Card>
                    ))
                  ) : (
                    <Card sx={{ p: 2.5, borderRadius: 3, boxShadow: 'none' }}>
                      <Typography color="text.secondary">Chưa có điểm đến</Typography>
                    </Card>
                  )}
                </Box>
              </Box>
            </DialogContent>
            {/* Nút Đóng ở footer */}
            <DialogActions sx={{ p: 2, background: brandColors.background }}>
              <Button onClick={handleCloseDetailsModal}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      {/* === Kết thúc Modal Chi Tiết === */}


      {/* === Snackbar thông báo === */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2, boxShadow: 6 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default Dashboard;