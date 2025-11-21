import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Typography, Box, Card, Button, TextField, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  Stepper, Step, StepLabel, StepIconProps, styled, Fade, Chip, Snackbar, Alert, 
  Autocomplete, CircularProgress, alpha, Divider
} from '@mui/material';
import {
  Add, Delete, CheckCircle, FlightTakeoff,
  Group, Place, FlightLand, DirectionsCar, Flight,
  LocationOn, Hotel, Restaurant, Attractions, CalendarMonth,
  AttachMoney, Description, Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gradients, brandColors } from '../theme/branding';

// ============================================
// CUSTOM DEBOUNCE HOOK
// ============================================
function useDebounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => func(...args), delay);
  }, [func, delay]);
}

// ============================================
// INTERFACES
// ============================================
interface TripDestination {
  _id?: string; 
  name: string; 
  arrivalDate: string; 
  departureDate: string;
  hotels: string[];       // Đổi từ hotel?: string sang string[]
  restaurants: string[];  // Đổi từ restaurants?: string sang string[]
  attractions: string[];  // Đổi từ attractions?: string sang string[]
}

interface FlightDetails {
  airline: string;
  departureTime: string;
  returnTime?: string | null;
  price: number;
  type?: 'oneway' | 'roundtrip';
}

interface OSMResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

// ============================================
// STYLED COMPONENTS
// ============================================
const ColorStepIconRoot = styled('div')<{ 
  ownerState: { active?: boolean; completed?: boolean; color: string }; 
}>(({ theme, ownerState }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  zIndex: 1,
  color: theme.palette.text.secondary,
  width: 56,
  height: 56,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '2px solid',
  borderColor: alpha(theme.palette.primary.main, 0.2),
  ...(ownerState.completed && {
    background: gradients.primary,
    color: '#fff',
    borderColor: 'transparent',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  }),
  ...(ownerState.active && {
    background: ownerState.color,
    color: '#fff',
    borderColor: 'transparent',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
    transform: 'scale(1.1)',
  }),
}));

function ColorStepIcon(props: StepIconProps & { iconInfo: { icon: React.ElementType; color: string } }) {
  const { active, completed, className, iconInfo } = props;
  const IconComponent = iconInfo.icon;
  return (
    <ColorStepIconRoot ownerState={{ active, completed, color: iconInfo.color }} className={className}>
      <IconComponent sx={{ fontSize: 28 }} />
    </ColorStepIconRoot>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatCurrency = (amount: string | number) => 
  new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(typeof amount === 'string' ? parseInt(amount) : amount);

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
// ============================================
// OSM AUTOCOMPLETE COMPONENT
// ============================================
interface OSMAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactElement;
  placeholder?: string;
}

const OSMAutocomplete: React.FC<OSMAutocompleteProps> = ({ 
  label, 
  value, 
  onChange, 
  icon, 
  placeholder 
}) => {
  const [options, setOptions] = useState<OSMResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const searchOSM = async (query: string) => {
    if (!query || query.length < 3) return;
    setLoading(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          accept_language: 'vi',
        }
      });
      setOptions(response.data);
    } catch (error) {
      console.error("OSM Error:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(searchOSM, 800);

  useEffect(() => {
    if (inputValue !== value) setInputValue(value);
  }, [value]);

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.display_name)}
      filterOptions={(x) => x}
      value={value}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
        if (newInputValue === '') onChange('');
        if (newInputValue && newInputValue !== value) {
          debouncedSearch(newInputValue);
        }
      }}
      onChange={(event: any, newValue: OSMResult | string | null) => {
        if (typeof newValue === 'string') {
          onChange(newValue);
        } else if (newValue && newValue.display_name) {
          onChange(newValue.display_name);
        } else {
          onChange('');
        }
        setOptions([]);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: icon ? (
              <InputAdornment position="start">{icon}</InputAdornment>
            ) : null,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props as any;
        return (
          <li key={option.place_id} {...optionProps}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%',
              py: 1,
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}>
              <Box sx={{ 
                mr: 2, 
                color: 'primary.main', 
                display: 'flex',
                bgcolor: alpha(brandColors.primary, 0.1),
                borderRadius: '50%',
                p: 1
              }}>
                <LocationOn />
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography 
                  component="span" 
                  sx={{ 
                    fontWeight: 600, 
                    display: 'block',
                    color: 'text.primary'
                  }}
                >
                  {option.display_name.split(',')[0]}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {option.display_name}
                </Typography>
              </Box>
            </Box>
          </li>
        );
      }}
      sx={{
        '& .MuiAutocomplete-listbox': {
          '& li': {
            borderRadius: 1,
            mx: 0.5,
          }
        }
      }}
    />
  );
};
interface MultiItemInputProps {
  label: string;
  icon: React.ReactElement;
  items: string[];
  onItemsChange: (newItems: string[]) => void;
  placeholder?: string;
}

const MultiItemInput: React.FC<MultiItemInputProps> = ({ 
  label, icon, items, onItemsChange, placeholder 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddItem = () => {
    if (inputValue.trim()) {
      // Thêm vào mảng nếu chưa tồn tại
      if (!items.includes(inputValue.trim())) {
        onItemsChange([...items, inputValue.trim()]);
      }
      setInputValue(''); // Reset ô nhập
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    onItemsChange(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <OSMAutocomplete
            label={label}
            icon={icon}
            value={inputValue}
            onChange={(val) => setInputValue(val)}
            placeholder={placeholder}
          />
        </Box>
        <Button 
          variant="contained" 
          onClick={handleAddItem}
          disabled={!inputValue.trim()}
          sx={{ mt: 1, height: 40, minWidth: 50 }}
        >
          <Add />
        </Button>
      </Box>
      
      {/* Hiển thị danh sách đã chọn */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {items.map((item, idx) => (
          <Chip
            key={idx}
            label={item.split(',')[0]} // Chỉ hiện tên ngắn gọn
            onDelete={() => handleRemoveItem(idx)}
            size="small"
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
    </Box>
  );
};
// ============================================
// MAIN COMPONENT
// ============================================
const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [highestStepVisited, setHighestStepVisited] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Main Data State
  const [tripData, setTripData] = useState({
    title: '', 
    description: '', 
    tripDetails: '',
    startDate: '', 
    endDate: '', 
    budget: '',
    origin: '', 
    flightDestination: '',
    transportMode: 'personal', 
    flightDetails: null as FlightDetails | null,
    travelers: [{ name: '', email: '', phone: '' }],
  });

  const [destinations, setDestinations] = useState<TripDestination[]>([]);
  
  // Flight Search State
  const [availableFlights, setAvailableFlights] = useState<FlightDetails[]>([]);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightType, setFlightType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [flightSearchDate, setFlightSearchDate] = useState('');
  const [flightReturnDate, setFlightReturnDate] = useState('');

  // Destination Dialog State
  const [showDestDialog, setShowDestDialog] = useState(false);
  const [currentDest, setCurrentDest] = useState<TripDestination>({ 
    name: '', 
    arrivalDate: '', 
    departureDate: '', 
    hotels: [],       // Sửa thành mảng rỗng
  restaurants: [],  // Sửa thành mảng rỗng
  attractions: []   // Sửa thành mảng rỗng
  });

  // UI State
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'error' as 'error' | 'warning' | 'info' | 'success' 
  });

  const steps = [
    { 
      id: 0, 
      title: 'Thông tin cơ bản', 
      icon: Description, 
      color: gradients.primary, 
      desc: 'Tên, ngân sách và thời gian' 
    },
    { 
      id: 1, 
      title: 'Người đi cùng', 
      icon: Group, 
      color: gradients.primary, 
      desc: 'Thêm thành viên' 
    },
    { 
      id: 2, 
      title: 'Điểm đến', 
      icon: Place, 
      color: gradients.primary, 
      desc: 'Chọn các địa điểm' 
    },
    { 
      id: 3, 
      title: 'Di chuyển', 
      icon: Flight, 
      color: gradients.primary, 
      desc: 'Tìm vé & Phương tiện' 
    }, 
    { 
      id: 4, 
      title: 'Tóm tắt', 
      icon: CheckCircle, 
      color: gradients.primary, 
      desc: 'Hoàn tất kế hoạch' 
    },
  ];

  useEffect(() => {
    if (tripData.startDate && !flightSearchDate) setFlightSearchDate(tripData.startDate);
    if (tripData.endDate && !flightReturnDate) setFlightReturnDate(tripData.endDate);
  }, [tripData.startDate, tripData.endDate]);

  // ============================================
  // HANDLERS
  // ============================================
  const showSnackbar = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleSearchFlights = async () => {
    if (!tripData.origin) { 
      showSnackbar('Vui lòng nhập điểm xuất phát', 'warning'); 
      return; 
    }
    if (!tripData.flightDestination) { 
      showSnackbar('Vui lòng nhập điểm đến', 'warning'); 
      return; 
    } 
    if (!flightSearchDate) { 
      showSnackbar('Vui lòng chọn ngày bay', 'warning'); 
      return; 
    }

    setFlightLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = { 
        origin: tripData.origin.toUpperCase(), 
        destination: tripData.flightDestination.toUpperCase(),
        date: flightSearchDate 
      };
      
      if (flightType === 'roundtrip') {
        if (!flightReturnDate) { 
          showSnackbar('Vui lòng chọn ngày về', 'warning'); 
          setFlightLoading(false); 
          return; 
        }
        if (new Date(flightReturnDate) < new Date(flightSearchDate)) { 
          showSnackbar('Ngày về không được trước ngày đi', 'warning'); 
          setFlightLoading(false); 
          return; 
        }
        params.returnDate = flightReturnDate;
      }
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/trips/search-flights`, 
        { 
          params, 
          headers: { 'Authorization': `Bearer ${token}` } 
        }
      );
      setAvailableFlights(response.data.flights);
    } catch (err) { 
      showSnackbar('Lỗi tìm vé', 'error'); 
    } finally { 
      setFlightLoading(false); 
    }
  };

  const validateStep = (): boolean => {
    switch (activeStep) {
      case 0: 
        if (!tripData.title.trim()) { 
          showSnackbar('Nhập Tên chuyến đi'); 
          return false; 
        }
        if (!tripData.startDate || !tripData.endDate) { 
          showSnackbar('Chọn Ngày bắt đầu/kết thúc'); 
          return false; 
        }
        if (!tripData.budget) { 
          showSnackbar('Nhập Ngân sách'); 
          return false; 
        }
        return true;
      case 1: 
        for (let i = 0; i < tripData.travelers.length; i++) {
          const t = tripData.travelers[i];
          if (!t.name.trim()) { 
            showSnackbar(`Nhập tên Người ${i+1}`); 
            return false; 
          }
        }
        return true;
      case 2: 
        if (destinations.length === 0) { 
          showSnackbar('Thêm ít nhất 1 điểm đến'); 
          return false; 
        }
        return true;
      case 3: 
        if (!tripData.origin.trim()) { 
          showSnackbar('Vui lòng nhập điểm xuất phát'); 
          return false; 
        }
        if (tripData.transportMode === 'flight') {
          if (!tripData.flightDestination.trim()) { 
            showSnackbar('Vui lòng nhập điểm đến (Mã sân bay)'); 
            return false; 
          }
          if (!tripData.flightDetails) { 
            showSnackbar('Vui lòng chọn một chuyến bay'); 
            return false; 
          }
        }
        return true;
      default: 
        return true;
    }
  };

  const handleNext = async () => {
    if (activeStep < steps.length - 1) {
      if (validateStep()) { 
        setActiveStep(activeStep + 1); 
        setHighestStepVisited(Math.max(highestStepVisited, activeStep + 1)); 
      }
    } else {
      setIsSubmitting(true);
      try {
        const { budget, travelers, ...rest } = tripData;
        const finalTripData = { 
          ...rest, 
          destinations, 
          travelers: travelers.filter(t => t.name.trim()),
          budget: { 
            total: parseFloat(budget) || 0, 
            spent: 0, 
            currency: 'VND' 
          } 
        };
        const token = localStorage.getItem('token'); 
        if (!token) throw new Error("No token");
        await axios.post(
          `${process.env.REACT_APP_API_URL}/trips`, 
          finalTripData, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setShowSuccessDialog(true); 
      } catch (err) { 
        showSnackbar('Lỗi tạo chuyến đi', 'error'); 
      } finally { 
        setIsSubmitting(false); 
      }
    }
  };
  // ============================================
  // RENDER STEP CONTENT
  // ============================================
  const renderStepContent = () => {
    switch (activeStep) {
      // === STEP 0: THÔNG TIN CƠ BẢN ===
      case 0: return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Description sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Thông tin chuyến đi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Điền các thông tin cơ bản về chuyến du lịch của bạn
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField 
                fullWidth 
                label="Tên chuyến đi" 
                value={tripData.title} 
                onChange={(e) => setTripData({ ...tripData, title: e.target.value })} 
                placeholder="VD: Du lịch Đà Nẵng - Hội An"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlightTakeoff color="primary" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField 
                fullWidth 
                multiline 
                rows={2} 
                label="Mô tả ngắn" 
                value={tripData.description} 
                onChange={(e) => setTripData({ ...tripData, description: e.target.value })} 
                placeholder="Mô tả ngắn gọn về chuyến đi..."
              />

              <TextField 
                fullWidth 
                multiline 
                rows={4} 
                label="Lịch trình chi tiết" 
                value={tripData.tripDetails} 
                onChange={(e) => setTripData({ ...tripData, tripDetails: e.target.value })} 
                placeholder="Kế hoạch chi tiết cho từng ngày..."
              />

              <Divider sx={{ my: 1 }}>
                <Chip label="Thời gian & Ngân sách" icon={<Schedule />} />
              </Divider>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
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
                        <CalendarMonth color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
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
                        <CalendarMonth color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <TextField 
                fullWidth 
                label="Ngân sách (VND)" 
                type="number" 
                value={tripData.budget} 
                onChange={(e) => setTripData({ ...tripData, budget: e.target.value })} 
                helperText={tripData.budget ? `≈ ${formatCurrency(tripData.budget)}` : 'Nhập tổng ngân sách dự kiến'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </Fade>
      );

      // === STEP 1: NGƯỜI ĐI CÙNG ===
      case 1: return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Group sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Người đi cùng
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thêm thông tin những người tham gia chuyến đi
              </Typography>
            </Box>

            {tripData.travelers.map((traveler, idx) => (
              <Card 
                key={idx} 
                sx={{ 
                  mb: 3, 
                  p: 3, 
                  position: 'relative',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: 3,
                    borderColor: 'primary.main',
                  }
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Chip 
                    label={`Người ${idx + 1}`} 
                    color="primary" 
                    size="small" 
                    sx={{ fontWeight: 600 }}
                  />
                  {tripData.travelers.length > 1 && (
                    <IconButton 
                      onClick={() => setTripData({ 
                        ...tripData, 
                        travelers: tripData.travelers.filter((_, i) => i !== idx) 
                      })} 
                      size="small"
                      sx={{ 
                        color: 'error.main',
                        '&:hover': { bgcolor: alpha('#f44336', 0.1) }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField 
                    fullWidth 
                    label="Họ tên" 
                    value={traveler.name} 
                    onChange={(e) => { 
                      const t = [...tripData.travelers]; 
                      t[idx].name = e.target.value; 
                      setTripData({...tripData, travelers: t}) 
                    }} 
                    placeholder="Nhập họ và tên"
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <TextField 
                      fullWidth 
                      label="Email" 
                      type="email"
                      value={traveler.email} 
                      onChange={(e) => { 
                        const t = [...tripData.travelers]; 
                        t[idx].email = e.target.value; 
                        setTripData({...tripData, travelers: t}) 
                      }} 
                      placeholder="email@example.com"
                    />
                    <TextField 
                      fullWidth 
                      label="Số điện thoại" 
                      value={traveler.phone} 
                      onChange={(e) => { 
                        const t = [...tripData.travelers]; 
                        t[idx].phone = e.target.value; 
                        setTripData({...tripData, travelers: t}) 
                      }} 
                      placeholder="0123456789"
                    />
                  </Box>
                </Box>
              </Card>
            ))}

            <Button 
              onClick={() => setTripData({ 
                ...tripData, 
                travelers: [...tripData.travelers, { name: '', email: '', phone: '' }] 
              })} 
              variant="outlined" 
              fullWidth
              startIcon={<Add />}
              sx={{ 
                py: 1.5,
                borderStyle: 'dashed',
                borderWidth: 2,
                '&:hover': {
                  borderStyle: 'dashed',
                  borderWidth: 2,
                }
              }}
            >
              Thêm người đi cùng
            </Button>
          </Box>
        </Fade>
      );

      // === STEP 2: ĐIỂM ĐẾN ===
      case 2: return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Place sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Điểm đến
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thêm các địa điểm bạn muốn ghé thăm
              </Typography>
            </Box>

            <Button 
              onClick={() => setShowDestDialog(true)} 
              variant="contained" 
              startIcon={<Add />} 
              fullWidth 
              sx={{ 
                mb: 3, 
                py: 1.5,
                background: gradients.primary,
                fontWeight: 600,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
              }}
            >
              Thêm điểm đến mới
            </Button>

            {destinations.length === 0 ? (
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: alpha(brandColors.primary, 0.05),
                  border: '2px dashed',
                  borderColor: alpha(brandColors.primary, 0.2)
                }}
              >
                <Place sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Chưa có điểm đến nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nhấn nút "Thêm điểm đến mới" để bắt đầu
                </Typography>
              </Paper>
            ) : (
              destinations.map((dest, idx) => (
                <Card 
                  key={idx} 
                  sx={{ 
                    mb: 2, 
                    p: 3, 
                    position: 'relative',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'start', mb: 2 }}>
                    <Box 
                      sx={{ 
                        bgcolor: alpha(brandColors.primary, 0.1),
                        color: 'primary.main',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        fontWeight: 700
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                        {dest.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <CalendarMonth sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {formatDate(dest.arrivalDate)} - {formatDate(dest.departureDate)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                      onClick={() => setDestinations(destinations.filter((_, i) => i !== idx))} 
                      size="small"
                      sx={{ 
                        color: 'error.main',
                        '&:hover': { bgcolor: alpha('#f44336', 0.1) }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  {(dest.hotels.length > 0 || dest.restaurants.length > 0 || dest.attractions.length > 0) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        
                        {/* Lặp qua danh sách khách sạn */}
                        {dest.hotels.map((hotel, i) => (
                          <Chip 
                            key={`h-${i}`}
                            icon={<Hotel sx={{fontSize: 16}}/>} 
                            label={hotel.split(',')[0]} 
                            size="small"
                            sx={{ bgcolor: alpha(brandColors.primary, 0.1) }}
                          />
                        ))}

                        {/* Lặp qua danh sách nhà hàng */}
                        {dest.restaurants.map((res, i) => (
                          <Chip 
                            key={`r-${i}`}
                            icon={<Restaurant sx={{fontSize: 16}}/>} 
                            label={res.split(',')[0]} 
                            size="small" 
                            sx={{ bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }}
                          />
                        ))}

                        {/* Lặp qua danh sách điểm tham quan */}
                        {dest.attractions.map((attr, i) => (
                          <Chip 
                            key={`a-${i}`}
                            icon={<Attractions sx={{fontSize: 16}}/>} 
                            label={attr.split(',')[0]} 
                            size="small"
                            sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Card>
              ))
            )}
          </Box>
        </Fade>
      );
      // === STEP 3: DI CHUYỂN ===
      case 3: return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Flight sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Phương tiện di chuyển
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chọn cách bạn muốn đến điểm đến
              </Typography>
            </Box>

            {/* 1. CHỌN LOẠI PHƯƠNG TIỆN TRƯỚC */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
              {[
                { mode: 'personal', icon: DirectionsCar, label: 'Xe cá nhân' },
                { mode: 'flight', icon: Flight, label: 'Máy bay' }
              ].map(({ mode, icon: Icon, label }) => (
                <Card 
                  key={mode} 
                  onClick={() => {
                    // Reset dữ liệu khi đổi mode để tránh nhầm lẫn
                    setTripData({
                      ...tripData, 
                      transportMode: mode,
                      origin: '',           // Reset điểm đi
                      flightDestination: '' // Reset điểm đến bay
                    });
                    setAvailableFlights([]); // Xóa kết quả tìm kiếm cũ
                  }} 
                  sx={{ 
                    p: 3, 
                    cursor: 'pointer', 
                    minWidth: 160,
                    textAlign: 'center', 
                    border: '2px solid',
                    borderColor: tripData.transportMode === mode ? 'primary.main' : 'divider',
                    bgcolor: tripData.transportMode === mode ? alpha(brandColors.primary, 0.05) : 'white',
                    transition: 'all 0.3s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    }
                  }}
                >
                  <Icon 
                    sx={{ 
                      fontSize: 48, 
                      color: tripData.transportMode === mode ? 'primary.main' : 'grey.400',
                      mb: 1
                    }} 
                  />
                  <Typography fontWeight={600} color={tripData.transportMode === mode ? 'primary.main' : 'text.secondary'}>
                    {label}
                  </Typography>
                </Card>
              ))}
            </Box>

            {/* 2. HIỂN THỊ FORM NHẬP LIỆU DỰA TRÊN MODE */}
            
            {/* === TRƯỜNG HỢP XE CÁ NHÂN === */}
            {tripData.transportMode === 'personal' && (
               <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                 <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                   Thông tin di chuyển:
                 </Typography>
                 <OSMAutocomplete 
                    label="Địa điểm xuất phát (Nhà riêng/Thành phố)" 
                    value={tripData.origin} 
                    onChange={(val) => setTripData({ ...tripData, origin: val })} 
                    icon={<Place />}
                    placeholder="Nhập địa chỉ nơi bạn bắt đầu đi..."
                  />
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Với xe cá nhân, hệ thống sẽ tính toán chi phí xăng xe và thời gian di chuyển ước tính từ điểm xuất phát này.
                  </Alert>
               </Box>
            )}

            {/* === TRƯỜNG HỢP MÁY BAY === */}
            {tripData.transportMode === 'flight' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                   Tìm kiếm chuyến bay:
                 </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                  <TextField 
                    fullWidth 
                    label="Sân bay đi (Mã SB)" 
                    value={tripData.origin} 
                    onChange={(e) => setTripData({ ...tripData, origin: e.target.value.toUpperCase() })} 
                    placeholder="VD: HAN, SGN" 
                    helperText="Nhập mã sân bay (3 ký tự)"
                    InputProps={{ 
                      startAdornment: (
                        <InputAdornment position="start">
                          <FlightTakeoff color="primary" />
                        </InputAdornment>
                      ) 
                    }} 
                  />
                  <TextField 
                    fullWidth 
                    label="Sân bay đến (Mã SB)" 
                    value={tripData.flightDestination} 
                    onChange={(e) => setTripData({ ...tripData, flightDestination: e.target.value.toUpperCase() })} 
                    placeholder="VD: DAD, CXR" 
                    helperText="Nhập mã sân bay (3 ký tự)"
                    InputProps={{ 
                      startAdornment: (
                        <InputAdornment position="start">
                          <FlightLand color="primary" />
                        </InputAdornment>
                      ) 
                    }} 
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, gap: 2 }}>
                  {[
                    { type: 'oneway', label: 'Một chiều' },
                    { type: 'roundtrip', label: 'Khứ hồi' }
                  ].map(({ type, label }) => (
                    <Button 
                      key={type}
                      variant={flightType === type ? 'contained' : 'outlined'} 
                      onClick={() => setFlightType(type as any)} 
                      sx={{ borderRadius: 3, px: 4, fontWeight: 600 }}
                    >
                      {label}
                    </Button>
                  ))}
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: flightType === 'roundtrip' ? '1fr 1fr' : '1fr', 
                  gap: 2, 
                  mb: 3 
                }}>
                  <TextField 
                    label="Ngày bay" 
                    type="date" 
                    value={flightSearchDate} 
                    onChange={(e) => setFlightSearchDate(e.target.value)} 
                    InputLabelProps={{ shrink: true }}
                  />
                  {flightType === 'roundtrip' && (
                    <TextField 
                      label="Ngày về" 
                      type="date" 
                      value={flightReturnDate} 
                      onChange={(e) => setFlightReturnDate(e.target.value)} 
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                </Box>

                <Button 
                  variant="contained" 
                  onClick={handleSearchFlights} 
                  fullWidth 
                  disabled={flightLoading} 
                  sx={{ mb: 3, py: 1.5, background: gradients.primary, fontWeight: 600 }}
                >
                  {flightLoading ? <CircularProgress size={24} color="inherit"/> : 'Tìm chuyến bay'}
                </Button>
                
                {/* PHẦN KẾT QUẢ TÌM KIẾM GIỮ NGUYÊN NHƯ CŨ */}
                {availableFlights.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      Kết quả tìm kiếm ({availableFlights.length} chuyến bay)
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {availableFlights.map((flight, idx) => (
                    <Card 
                      key={idx} 
                      onClick={() => setTripData({...tripData, flightDetails: flight})} 
                      sx={{ 
                        p: 3, 
                        cursor: 'pointer', 
                        border: '2px solid',
                        borderColor: tripData.flightDetails === flight ? 'success.main' : 'divider',
                        bgcolor: tripData.flightDetails === flight ? alpha(brandColors.success, 0.05) : 'white',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: 'success.main',
                          transform: 'translateX(4px)',
                          boxShadow: 3,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" fontWeight={700}>{flight.airline}</Typography>
                            {flight.returnTime && <Chip label="Khứ hồi" size="small" color="info" sx={{ height: 24, fontWeight: 600 }} />}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FlightTakeoff sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Đi: {formatDateTime(flight.departureTime)}
                              </Typography>
                            </Box>
                            {flight.returnTime && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FlightLand sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  Về: {formatDateTime(flight.returnTime)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" fontWeight={700} color="primary.main">
                            {formatCurrency(flight.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">/người</Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      );

      // === STEP 4: TÓM TẮT ===
      case 4: return (
        <Fade in timeout={600}>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Tóm tắt chuyến đi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Xem lại thông tin trước khi hoàn tất
              </Typography>
            </Box>

            <Card 
              sx={{ 
                p: 4, 
                mb: 3, 
                background: gradients.primary, 
                color: '#fff',
                borderRadius: 3
              }}
            >
              <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
                {tripData.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip 
                  icon={<AttachMoney sx={{ color: '#fff !important' }} />}
                  label={formatCurrency(tripData.budget)} 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: '#fff',
                    fontWeight: 600
                  }} 
                />
                <Chip 
                  icon={<Place sx={{ color: '#fff !important' }} />}
                  label={`${destinations.length} điểm đến`} 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: '#fff',
                    fontWeight: 600
                  }} 
                />
                <Chip 
                  icon={<Group sx={{ color: '#fff !important' }} />}
                  label={`${tripData.travelers.length} người`} 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: '#fff',
                    fontWeight: 600
                  }} 
                />
              </Box>
              {tripData.description && (
                <Typography variant="body1" sx={{ mt: 2, opacity: 0.95 }}>
                  {tripData.description}
                </Typography>
              )}
            </Card>

            <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth color="primary" />
                Thời gian
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Bắt đầu: ${formatDate(tripData.startDate)}`} 
                  variant="outlined"
                  color="primary"
                />
                <Chip 
                  label={`Kết thúc: ${formatDate(tripData.endDate)}`} 
                  variant="outlined"
                  color="primary"
                />
              </Box>
            </Card>

            <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Flight color="primary" />
                Di chuyển
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Phương tiện:</strong> {tripData.transportMode === 'personal' ? '🚗 Xe cá nhân' : '✈️ Máy bay'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Tuyến đường:</strong> {tripData.origin || '?'} → {tripData.flightDestination || '?'}
              </Typography>
              {tripData.transportMode === 'flight' && tripData.flightDetails && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: alpha(brandColors.primary, 0.05),
                  borderRadius: 2
                }}>
                  <Typography variant="body2">
                    <strong>Hãng:</strong> {tripData.flightDetails.airline}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Giá vé:</strong> {formatCurrency(tripData.flightDetails.price)}
                  </Typography>
                </Box>
              )}
            </Card>
          </Box>
        </Fade>
      );

      default: return null;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', pb: 6 }}>
      <Box sx={{ background: gradients.primary, pt: 4, pb: 6, boxShadow: 3 }}>
        <Container maxWidth="md">
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#fff', 
              textAlign: 'center', 
              fontWeight: 900,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            ✈️ Tạo Chuyến Đi
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)', 
              textAlign: 'center',
              mt: 1
            }}
          >
            Lên kế hoạch cho chuyến du lịch hoàn hảo của bạn
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: -4 }}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 2 }}>
          <Stepper alternativeLabel activeStep={activeStep}>
            {steps.map((step, idx) => (
              <Step key={step.id}>
                <StepLabel 
                  StepIconComponent={(props) => (
                    <ColorStepIcon {...props} iconInfo={{ icon: step.icon, color: step.color }} />
                  )} 
                  onClick={() => idx <= highestStepVisited && setActiveStep(idx)} 
                  sx={{ 
                    cursor: idx <= highestStepVisited ? 'pointer' : 'default',
                    '&:hover': idx <= highestStepVisited ? { opacity: 0.8 } : {}
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, mt: 1 }}>
                    {step.title}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
          {renderStepContent()}
        </Paper>

        <Paper sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          p: 3,
          borderRadius: 3,
          boxShadow: 2
        }}>
          <Button 
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))} 
            disabled={activeStep === 0}
            variant="outlined"
            sx={{ px: 4, fontWeight: 600 }}
          >
            ← Quay lại
          </Button>
          <Button 
            onClick={handleNext} 
            variant="contained" 
            disabled={isSubmitting}
            sx={{ 
              px: 4, 
              fontWeight: 600,
              background: gradients.primary
            }}
          >
            {activeStep === steps.length - 1 
              ? (isSubmitting ? 'Đang lưu...' : '✓ Hoàn tất') 
              : 'Tiếp theo →'
            }
          </Button>
        </Paper>
      </Container>

      {/* DIALOG THÊM ĐIỂM ĐẾN */}
      <Dialog 
        open={showDestDialog} 
        onClose={() => setShowDestDialog(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 20 }}>
          📍 Thêm Điểm Đến
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OSMAutocomplete 
              label="Thành phố / Điểm đến chính" 
              value={currentDest.name} 
              onChange={(val) => setCurrentDest({...currentDest, name: val})} 
              icon={<Place />}
              placeholder="Nhập tên thành phố (VD: Đà Nẵng)"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField 
                type="date" 
                label="Ngày đến" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={currentDest.arrivalDate} 
                onChange={(e) => setCurrentDest({...currentDest, arrivalDate: e.target.value})} 
              />
              <TextField 
                type="date" 
                label="Ngày đi" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                value={currentDest.departureDate} 
                onChange={(e) => setCurrentDest({...currentDest, departureDate: e.target.value})} 
              />
            </Box>

            <Divider>
              <Chip label="Chi tiết (Tùy chọn)" size="small" />
            </Divider>
            
            <MultiItemInput
              label="Khách sạn / Nơi ở"
              icon={<Hotel />}
              placeholder="Tìm và thêm khách sạn"
              items={currentDest.hotels}
              onItemsChange={(newItems) => setCurrentDest({ ...currentDest, hotels: newItems })}
            />

            <MultiItemInput
              label="Nhà hàng / Quán ăn"
              icon={<Restaurant />}
              placeholder="Tìm và thêm nhà hàng"
              items={currentDest.restaurants}
              onItemsChange={(newItems) => setCurrentDest({ ...currentDest, restaurants: newItems })}
            />

            <MultiItemInput
              label="Điểm tham quan"
              icon={<Attractions />}
              placeholder="Tìm và thêm điểm vui chơi"
              items={currentDest.attractions}
              onItemsChange={(newItems) => setCurrentDest({ ...currentDest, attractions: newItems })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowDestDialog(false)} sx={{ fontWeight: 600 }}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={() => { 
              if(!currentDest.name) { 
                showSnackbar('Vui lòng nhập tên điểm đến', 'warning'); 
                return; 
              }
              setDestinations([...destinations, currentDest]); 
              setCurrentDest({ 
                name: '', 
                arrivalDate: '', 
                departureDate: '', 
                hotels: [],      // Reset về mảng
                restaurants: [], // Reset về mảng
                attractions: []  // Reset về mảng
              });
              setShowDestDialog(false); 
            }}
            sx={{ fontWeight: 600 }}
          >
            ✓ Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUCCESS DIALOG */}
      <Dialog open={showSuccessDialog} PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700}>
            🎉 Thành công!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography>
            Đã tạo chuyến đi thành công. Chúc bạn có chuyến đi vui vẻ!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ px: 4, fontWeight: 600 }}
          >
            Về Dashboard
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={handleCloseSnackbar}
          sx={{ fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TripPlanner;