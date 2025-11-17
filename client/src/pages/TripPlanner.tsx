// fileName: TripPlanner.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepIconProps,
  styled,
  Avatar,
  alpha,
  Fade,
  Zoom,
  LinearProgress,
  Chip,
  Snackbar,
  Alert,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  CalendarToday,
  AttachMoney,
  Delete,
  CheckCircle,
  FlightTakeoff,
  Email,
  Phone,
  Place,
  Group,
  ArrowRight,
  ArrowLeft,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gradients, brandColors } from '../theme/branding';

// Interface cho API (từ Destinations.tsx)
interface Destination {
  _id: string;
  name: string;
  country: string;
  city: string;
}

interface TripDestination {
  _id?: string;
  name: string;
  arrivalDate: string;
  departureDate: string;
  activities?: Array<{ name: string; description: string; time: string; cost: number }>;
}

const ColorStepIconRoot = styled('div')<{
  ownerState: { active?: boolean; completed?: boolean; color: string };
}>(({ theme, ownerState }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  zIndex: 1,
  color: theme.palette.text.secondary,
  width: 64,
  height: 64,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '3px solid',
  borderColor: alpha(theme.palette.primary.main, 0.2),
  
  ...(ownerState.completed && {
    background: gradients.primary, 
    color: '#fff',
    borderColor: 'transparent',
  }),
  ...(ownerState.active && {
    background: ownerState.color, 
    color: '#fff',
    borderColor: 'transparent',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    transform: 'scale(1.15)',
  }),
}));

function ColorStepIcon(props: StepIconProps & { iconInfo: { icon: React.ElementType; color: string } }) {
  const { active, completed, className, iconInfo } = props;
  const IconComponent = iconInfo.icon;

  return (
    <ColorStepIconRoot ownerState={{ active, completed, color: iconInfo.color }} className={className}>
      <IconComponent sx={{ fontSize: 32 }} />
    </ColorStepIconRoot>
  );
}

const isValidEmail = (email: string): boolean => {
  // Email là không bắt buộc, nhưng nếu nhập thì phải đúng định dạng
  if (email.trim() === '') return true; 
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  // SĐT là không bắt buộc, nhưng nếu nhập thì phải đúng định dạng
  if (phone.trim() === '') return true;
  // Cho phép số, +, -, ( ), và khoảng trắng
  const regex = /^[\+]?[0-9\s\(\)-]+$/;
  return regex.test(phone.trim());
};


const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [tripData, setTripData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: [{ name: '', email: '', phone: '' }],
  });
  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  const [showDestDialog, setShowDestDialog] = useState(false);
  const [currentDest, setCurrentDest] = useState({ name: '', arrivalDate: '', departureDate: '' });

  // State cho dialog thành công
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  // State cho nút Hoàn tất
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'warning' | 'info' | 'success',
  });

  // State cho Autocomplete
  const [destInputValue, setDestInputValue] = useState(''); // Lưu nội dung gõ
  const [destOptions, setDestOptions] = useState<Destination[]>([]); // Lưu kết quả từ API
  const [destLoading, setDestLoading] = useState(false); // Báo hiệu đang tải

  // State theo dõi bước cao nhất
  const [highestStepVisited, setHighestStepVisited] = useState(0);


  // useEffect gọi API tìm kiếm điểm đến
  React.useEffect(() => {
    if (destInputValue === '') {
      setDestOptions([]);
      return;
    }

    // Bắt đầu tìm (debounce)
    const timer = setTimeout(async () => {
      setDestLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('q', destInputValue);
        
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
    }, 500); // Chờ 500ms

    // Hủy timer nếu người dùng gõ tiếp
    return () => {
      clearTimeout(timer);
    };
  }, [destInputValue]); // Chạy lại mỗi khi nội dung gõ thay đổi


  const steps = [
    {
      id: 0,
      title: 'Thông tin cơ bản',
      icon: FlightTakeoff,
      color: gradients.primary,
      desc: 'Tên chuyến đi, ngân sách và thời gian',
    },
    {
      id: 1,
      title: 'Người đi cùng',
      icon: Group,
      color: gradients.primary, 
      desc: 'Thêm thành viên và thông tin liên lạc',
    },
    {
      id: 2,
      title: 'Điểm đến',
      icon: Place,
      color: gradients.primary, 
      desc: 'Chọn các địa điểm bạn muốn ghé thăm',
    },
    {
      id: 3,
      title: 'Tóm tắt',
      icon: CheckCircle,
      color: gradients.primary, 
      desc: 'Xem lại và hoàn tất kế hoạch',
    },
  ];

  const addTraveler = () => {
    setTripData({ ...tripData, travelers: [...tripData.travelers, { name: '', email: '', phone: '' }] });
  };

  const removeTraveler = (idx: number) => {
    setTripData({ ...tripData, travelers: tripData.travelers.filter((_, i) => i !== idx) });
  };

  const updateTraveler = (idx: number, field: string, value: string) => {
    const updated = [...tripData.travelers];
    (updated[idx] as any)[field] = value;
    setTripData({ ...tripData, travelers: updated });
  };

  // Hàm đóng Dialog (đã thêm)
  const handleCloseDestDialog = () => {
    setShowDestDialog(false);
    // Reset state của autocomplete
    setDestInputValue('');
    setDestOptions([]);
    setDestLoading(false);
  };

  const addDestination = () => {
    if (!currentDest.name) {
      showSnackbar('Vui lòng chọn hoặc nhập tên điểm đến');
      return;
    }
    if (!currentDest.arrivalDate || !currentDest.departureDate) {
      showSnackbar('Vui lòng chọn ngày đến và ngày đi');
      return;
    }
    if (new Date(currentDest.departureDate) < new Date(currentDest.arrivalDate)) {
      showSnackbar('Ngày đi không thể trước ngày đến');
      return;
    }

    setDestinations([...destinations, currentDest]);
    setCurrentDest({ name: '', arrivalDate: '', departureDate: '' });
    handleCloseDestDialog(); // <-- Dùng hàm mới
  };

  const removeDestination = (idx: number) => {
    setDestinations(destinations.filter((_, i) => i !== idx));
  };

  const validateStep = (): boolean => {
    switch (activeStep) {
      case 0: // Thông tin cơ bản
        if (!tripData.title.trim()) { 
          showSnackbar('Vui lòng nhập Tên chuyến đi');
          return false;
        }
        if (!tripData.startDate || !tripData.endDate) {
          showSnackbar('Vui lòng chọn Ngày bắt đầu và Ngày kết thúc');
          return false;
        }
        if (new Date(tripData.endDate) < new Date(tripData.startDate)) {
          showSnackbar('Ngày kết thúc không thể trước Ngày bắt đầu');
          return false;
        }
        if (!tripData.budget) {
          showSnackbar('Vui lòng nhập Ngân sách');
          return false;
        }
        return true;
  
      case 1: // Người đi cùng
        for (let index = 0; index < tripData.travelers.length; index++) {
          const traveler = tripData.travelers[index];
          if (!traveler.name.trim()) {
            showSnackbar(`Vui lòng nhập tên cho Người ${index + 1}`);
            return false;
          }
          if (!isValidEmail(traveler.email)) {
            showSnackbar(`Email của Người ${index + 1} không hợp lệ.`, 'error');
            return false;
          }
          if (!isValidPhone(traveler.phone)) {
            showSnackbar(`Số điện thoại của Người ${index + 1} không hợp lệ. Chỉ nhập số, dấu +, -, ( ).`, 'error');
            return false;
          }
        }
        return true;
  
      case 2: // Điểm đến
        if (destinations.length === 0) {
          showSnackbar('Vui lòng thêm ít nhất một điểm đến');
          return false;
        }
        return true;
  
      case 3: // Tóm tắt
      default:
        return true;
    }
  };

  // ==========================================================
  // SỬA LỖI KHÔNG LƯU NGÂN SÁCH TẠI ĐÂY
  // ==========================================================
  const handleNext = async () => {
    if (activeStep < steps.length - 1) {
      if (validateStep()) {
        setActiveStep(activeStep + 1);
        setHighestStepVisited(Math.max(highestStepVisited, activeStep + 1));
      }
    } else {
      // Đây là bước "Hoàn tất"
      setIsSubmitting(true); // 1. Bắt đầu loading

      try {
        // === SỬA LỖI TẠI ĐÂY ===
        // 1. Tách 'budget' (là string) và 'travelers' ra khỏi tripData
        const { budget, travelers, ...restOfTripData } = tripData;
        
        // 2. Tạo đối tượng 'budget' mới mà backend mong muốn
        const budgetObject = {
          total: parseFloat(budget) || 0, // Chuyển "123121231" -> 123121231
          spent: 0, // Mặc định là 0 khi mới tạo
          currency: 'VND' // Bạn có thể thêm trường này
        };

        // 3. Lọc ra những traveler hợp lệ (đã nhập tên)
        const validTravelers = travelers.filter(t => t.name.trim() !== '');

        // 4. Gộp lại thành dữ liệu cuối cùng để gửi đi
        const finalTripData = { 
          ...restOfTripData, 
          destinations, 
          budget: budgetObject, // Ghi đè 'budget' bằng object mới
          travelers: validTravelers, // Gửi danh sách đã lọc
        };
        // === KẾT THÚC SỬA ===

        const token = localStorage.getItem('token'); 
        if (!token) {
          showSnackbar('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.', 'error');
          setIsSubmitting(false); // Dừng loading
          return; // Dừng hàm
        }
      
        // 5. Gửi 'finalTripData' đã được chuyển đổi
        await axios.post(
          `${process.env.REACT_APP_API_URL}/trips`, 
          finalTripData,
          {
            headers: {
              'Authorization': `Bearer ${token}` // Gửi token lên server
            }
          }
        );
      
        // 6. Gọi thành công
        console.log('ĐÃ GỬI DATA THÀNH CÔNG:', finalTripData);
        setShowSuccessDialog(true); 
      } catch (err) {
        // 7. Xử lý nếu gọi API thất bại
        console.error("Lỗi khi tạo chuyến đi:", err);
        showSnackbar('Đã có lỗi xảy ra. Không thể tạo chuyến đi.', 'error');
      } finally {
        // 8. Luôn tắt loading sau khi hoàn tất
        setIsSubmitting(false); 
      }
    }
  };

  const handleBack = () => {
    setActiveStep(Math.max(0, activeStep - 1));
  };

  // Hàm xử lý nhấp vào Stepper
  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= highestStepVisited) {
      // Chỉ cho phép nhấp vào các bước đã truy cập (hoặc bước hiện tại)
      setActiveStep(stepIndex);
    } else {
      // Nếu cố nhấp vào bước chưa mở khóa, thông báo lỗi
      showSnackbar('Vui lòng hoàn thành các bước trước đó', 'warning');
    }
  };


  const formatCurrency = (amount: string | number) => { // Sửa: Chấp nhận cả number
    const num = typeof amount === 'string' ? parseInt(amount) : amount;
    if (!num) return '0 ₫'; // Trả về 0 ₫ nếu không có giá trị
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Hàm cho Snackbar
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const renderStepContent = () => {
    switch (activeStep) {
      // ===================================
      // CASE 0
      // ===================================
      case 0:
      return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: gradients.primary,
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                <FlightTakeoff sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Thông tin chuyến đi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Điền thông tin cơ bản về chuyến du lịch của bạn
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: 2, 
              }}
            >
              <Box sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Tên chuyến đi"
                  value={tripData.title}
                  onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                  placeholder="VD: Khám phá Đà Nẵng"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FlightTakeoff sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Ngày bắt đầu"
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => setTripData({ ...tripData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday sx={{ color: 'success.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Ngày kết thúc"
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) => setTripData({ ...tripData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday sx={{ color: 'error.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>

              <Box sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Ngân sách (VND)"
                  type="number"
                  value={tripData.budget}
                  onChange={(e) => setTripData({ ...tripData, budget: e.target.value })}
                  placeholder="20,000,000"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney sx={{ color: 'warning.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  helperText={tripData.budget ? `≈ ${formatCurrency(tripData.budget)}` : ''}
                  sx={{ '& .MMuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>

              <Box sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Mô tả"
                  value={tripData.description}
                  onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                  placeholder="Mô tả ngắn gọn về chuyến đi của bạn..."
                  sx={{ '& .MMuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>
            </Box>
          </Box>
        </Fade>
      );
  
      // ===================================
      // CASE 1
      // ===================================
      case 1:
      return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: gradients.primary, 
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                <Group sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Người đi cùng
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thêm thông tin những người tham gia chuyến đi
              </Typography>
            </Box>

            {tripData.travelers.map((traveler, idx) => (
              <Zoom in timeout={400 + idx * 100} key={idx}>
                <Card
                  sx={{
                    mb: 3,
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: alpha(brandColors.primary, 0.2), 
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
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ background: gradients.primary }}> 
                          {idx + 1}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Người {idx + 1}
                        </Typography>
                      </Box>
                      {tripData.travelers.length > 1 && (
                        <IconButton
                          onClick={() => removeTraveler(idx)}
                          size="small"
                          sx={{
                            bgcolor: alpha('#f44336', 0.1),
                            '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                          }}
                        >
                          <Delete sx={{ color: 'error.main' }} />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                      <Box sx={{ gridColumn: 'span 12' }}>
                        <TextField
                          fullWidth
                          label="Họ tên"
                          value={traveler.name}
                          onChange={(e) => updateTraveler(idx, 'name', e.target.value)}
                          placeholder="Nguyễn Văn A"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={traveler.email}
                          onChange={(e) => updateTraveler(idx, 'email', e.target.value)}
                          placeholder="email@example.com"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email sx={{ color: 'text.secondary' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                        <TextField
                          fullWidth
                          label="Số điện thoại"
                          type="tel"
                          value={traveler.phone}
                          onChange={(e) => updateTraveler(idx, 'phone', e.target.value)}
                          placeholder="0123456789"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone sx={{ color: 'text.secondary' }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            ))}
            <Button
              onClick={addTraveler}
              variant="outlined"
              startIcon={<Add />}
              fullWidth
              size="large"
              sx={{
                py: 2,
                borderRadius: 3,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: alpha(brandColors.primary, 0.3), 
                color: brandColors.primary, 
                fontWeight: 700,
                '&:hover': {
                  borderColor: brandColors.primary, 
                  bgcolor: alpha(brandColors.primary, 0.05), 
                },
              }}
            >
              Thêm người đi cùng
            </Button>
          </Box>
        </Fade>
      );
  
      // ===================================
      // CASE 2
      // ===================================
      case 2:
      return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  background: gradients.primary, 
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                <Place sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Điểm đến
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chọn các địa điểm bạn muốn ghé thăm trong chuyến đi
              </Typography>
            </Box>

            <Button
              onClick={() => setShowDestDialog(true)}
              variant="contained"
              startIcon={<Add />}
              fullWidth
              size="large"
              sx={{
                py: 2,
                mb: 4,
                borderRadius: 3,
                background: gradients.primary, 
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(91, 92, 235, 0.4)', 
                '&:hover': { boxShadow: '0 12px 32px rgba(91, 92, 235, 0.5)' }, 
              }}
            >
              Thêm điểm đến
            </Button>

            {destinations.length === 0 ? (
              <Paper
                sx={{
                  py: 8,
                  textAlign: 'center',
                  borderRadius: 4,
                  background: alpha(brandColors.primary, 0.05), 
                  border: '2px dashed',
                  borderColor: alpha(brandColors.primary, 0.2), 
                }}
              >
                <LocationOn sx={{ fontSize: 80, color: alpha(brandColors.primary, 0.4), mb: 2 }} /> 
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Chưa có điểm đến nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hãy thêm điểm đến đầu tiên cho chuyến đi của bạn
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
                {destinations.map((dest: any, idx) => (
                  <Zoom in timeout={400 + idx * 100} key={idx}>
                    <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <Card
                        sx={{
                          position: 'relative',
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor: alpha(brandColors.primary, 0.2), 
                          transition: 'all 0.3s ease',
                          height: '100%',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 32px rgba(91, 92, 235, 0.2)', 
                            borderColor: brandColors.primary, 
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
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <Avatar
                              sx={{
                                background: gradients.primary, 
                                width: 48,
                                height: 48,
                              }}
                            >
                              <Place />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {dest.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  icon={<CalendarToday sx={{ fontSize: 14 }} />}
                                  label={dest.arrivalDate}
                                  size="small"
                                  sx={{ bgcolor: alpha(brandColors.success, 0.1), color: brandColors.success, fontWeight: 600 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  →
                                </Typography>
                                <Chip
                                  icon={<CalendarToday sx={{ fontSize: 14 }} />}
                                  label={dest.departureDate}
                                  size="small"
                                  sx={{ bgcolor: alpha(brandColors.secondary, 0.1), color: brandColors.secondary, fontWeight: 600 }}
                                />
                              </Box>
                            </Box>
                            <IconButton
                              onClick={() => removeDestination(idx)}
                              size="small"
                              sx={{
                                bgcolor: alpha('#f44336', 0.1),
                                '&:hover': { bgcolor: alpha('#f44336', 0.2) },
                              }}
                            >
                              <Delete sx={{ color: 'error.main', fontSize: 20 }} />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  </Zoom>
                ))}
              </Box>
            )}
          </Box>
        </Fade>
      );
  
      // ===================================
      // CASE 3 (Sửa formatCurrency)
      // ===================================
      case 3:
  return (
    <Fade in timeout={600}>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              background: gradients.primary, 
              margin: '0 auto',
              mb: 2,
            }}
          >
            <CheckCircle sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Tóm tắt chuyến đi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Xem lại thông tin và hoàn tất kế hoạch
          </Typography>
        </Box>

        <Card
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
                  background: gradients.primary,
            mb: 4,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>
              {tripData.title || 'Chuyến đi của bạn'}
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.9), mb: 3 }}>
              {tripData.description || 'Chưa có mô tả'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<CalendarToday />}
                label={`${tripData.startDate || 'N/A'} - ${tripData.endDate || 'N/A'}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                icon={<AttachMoney />}
                label={tripData.budget ? formatCurrency(tripData.budget) : 'Chưa xác định'}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                icon={<Group />}
                label={`${tripData.travelers.filter(t => t.name.trim() !== '').length} người`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                icon={<Place />}
                label={`${destinations.length} điểm đến`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
              />
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
          {/* Travelers */}
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ background: gradients.primary }}> 
                    <Group />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Người tham gia ({tripData.travelers.filter(t => t.name.trim() !== '').length})
                  </Typography>
                </Box>
                {tripData.travelers.filter(t => t.name.trim() !== '').map((traveler, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: alpha(brandColors.primary, 0.05), 
                      border: '1px solid',
                      borderColor: alpha(brandColors.primary, 0.1), 
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {traveler.name}
                    </Typography>
                    {traveler.email && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        📧 {traveler.email}
                      </Typography>
                    )}
                    {traveler.phone && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        📱 {traveler.phone}
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>

          {/* Destinations */}
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ background: gradients.primary }}> 
                    <Place />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Điểm đến ({destinations.length})
                  </Typography>
                </Box>
                {destinations.length > 0 ? (
                  destinations.map((dest: any, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: alpha(brandColors.primary, 0.05), 
                        border: '1px solid',
                        borderColor: alpha(brandColors.primary, 0.1), 
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {idx + 1}. {dest.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📅 {dest.arrivalDate} → {dest.departureDate}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Chưa có điểm đến
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
  
      default:
        return null;
    }
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', pb: 6 }}>
      {/* Header */}
      <Box
        sx={{
            background: gradients.primary,
          pt: 3,
          pb: 4,
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
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>
              Tạo Chuyến Du Lịch
            </Typography>
            <Typography variant="h6" sx={{ color: alpha('#fff', 0.9), mb: 4 }}>
              Thiết kế hành trình hoàn hảo trong vài phút
            </Typography>
            {/* Progress Bar */}
            <Box sx={{ px: 10 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha('#fff', 0.2),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: gradients.primary, 
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.9), mt: 1 }}>
                {Math.round(progress)}% hoàn thành
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Container */}
      <Container maxWidth="md" sx={{ mt: 3 }}>
        {/* Stepper */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            p: 4,
            pt: 10,
            mb: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stepper alternativeLabel activeStep={activeStep}>
            {steps.map((step, idx) => (
              <Step key={step.id}>
                <StepLabel
                  StepIconComponent={(props) => <ColorStepIcon {...props} iconInfo={{ icon: step.icon, color: step.color }} />}
                  onClick={() => handleStepClick(idx)}
                  sx={{
                    cursor: 'pointer',
                    '& .MuiStepLabel-label': {
                      fontWeight: 700,
                      mt: 2,
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.desc}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Content */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {renderStepContent()}
        </Paper>

        {/* Navigation */}
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            position: 'sticky',
            bottom: 16,
            zIndex: 10,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowLeft />}
            size="large"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 700,
            }}
          >
            Quay lại
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {steps.map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 40,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: idx <= activeStep ? 'primary.main' : alpha(brandColors.primary, 0.2),
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={isSubmitting}
            endIcon={
              activeStep === steps.length - 1 ? (
                isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />
              ) : <ArrowRight />
            }
            size="large"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: steps[activeStep].color, // Sẽ tự động lấy primary
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {activeStep === steps.length - 1 ? (isSubmitting ? 'Đang lưu...' : 'Hoàn tất') : 'Tiếp theo'}
          </Button>
        </Paper>
      </Container>

      {/* Destination Dialog */}
      <Dialog
        open={showDestDialog}
        onClose={handleCloseDestDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: gradients.primary, 
            color: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <Place />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Thêm Điểm Đến
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Tìm kiếm hoặc nhập thông tin điểm đến
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
            <Box sx={{ gridColumn: 'span 12' }}>
              <Autocomplete
                fullWidth
                freeSolo
                options={destOptions}
                loading={destLoading}
                getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
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
                onInputChange={(event, newInputValue) => {
                  setDestInputValue(newInputValue);
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setCurrentDest({ ...currentDest, name: newValue }); // Tự gõ
                  } else if (newValue) {
                    setCurrentDest({ ...currentDest, name: newValue.name }); // Chọn
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tìm hoặc nhập điểm đến"
                    placeholder="VD: Hà Nội, Tokyo, Paris"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <React.Fragment>
                          {destLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="Ngày đến"
                type="date"
                value={currentDest.arrivalDate}
                onChange={(e) => setCurrentDest({ ...currentDest, arrivalDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ color: 'success.main' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
            <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="Ngày đi"
                type="date"
                value={currentDest.departureDate}
                onChange={(e) => setCurrentDest({ ...currentDest, departureDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ color: 'error.main' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MMuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseDestDialog} sx={{ borderRadius: 2 }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={addDestination}
            sx={{
              borderRadius: 2,
              px: 3,
              background: gradients.primary, 
              fontWeight: 700,
            }}
          >
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Thành công */}
      <Dialog
        open={showSuccessDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, textAlign: 'center', p: 3 } }}
      >
        <DialogTitle>
          <Zoom in={showSuccessDialog} style={{ transitionDelay: '200ms' }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'success.main',
                margin: '0 auto',
                mb: 2,
                background: gradients.primary, 
              }}
            >
              <CheckCircle sx={{ fontSize: 60, color: '#fff' }} />
            </Avatar>
          </Zoom>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Thành công!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" color="text.secondary">
            Chuyến đi của bạn đã được tạo.
            Chúc bạn một hành trình vui vẻ!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 0, pt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setShowSuccessDialog(false);
              navigate('/'); // <-- Tự động điều hướng về trang chủ
              setActiveStep(0); // Reset form
            }}
            sx={{
              borderRadius: 3,
              px: 6,
              py: 1.5,
              fontWeight: 700,
              background: gradients.primary,
            }}
          >
            Về Trang chủ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Thông báo lỗi */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2, boxShadow: 6 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default TripPlanner;