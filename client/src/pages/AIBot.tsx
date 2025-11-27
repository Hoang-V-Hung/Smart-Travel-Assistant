// src/components/AIBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Typography,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  IconButton,
  Fade,
  Slide,
  alpha,
  // === THÊM MỚI (1) ===
  Fab, // Nút tròn nổi
  Drawer, // Ngăn kéo
  DialogTitle,
  Zoom, // <<-- THÊM MỚI ĐỂ SỬA LỖI
  InputAdornment,
} from '@mui/material';
import ItineraryCard from '../components/AIBot/MessageTypes/ItineraryCard';
import {
  Send,
  SmartToy,
  Person,
  ContentCopy,
  ThumbUp,
  ThumbDown,
  TravelExplore,
  Lightbulb,
  Schedule,
  Hotel,
  Restaurant,
  Flight as FlightIcon,
  FlightTakeoff,
  FlightLand,
  AccessTime,
  Attractions,
  LocationOn,
  AutoAwesome,
  Close, // Icon đóng
  Place,
  CalendarToday,
  AttachMoney,
  DirectionsCar,
  DeleteOutline,
  AddCircleOutline,
} from '@mui/icons-material';
import axios from 'axios';
import { gradients, brandColors } from '../theme/branding';

// --- CÁC INTERFACE (Giữ nguyên) ---
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}
interface ConversationHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}
interface Flight {
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
}
interface RoundTripFlightDetail {
    airline: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
}
interface RoundTripFlight {
    price: number;
    departureFlight: RoundTripFlightDetail;
    returnFlight: RoundTripFlightDetail;
}
interface OneWayFlightData {
  type: 'flight_results';
  summary: string;
  flights: Flight[];
}
interface RoundTripFlightData {
  type: 'roundtrip_flight_results';
  summary: string;
  flights: RoundTripFlight[];
}
interface ItineraryPlanData {
  type: 'itinerary_plan';
  summary: string;
  data: any;
}
type FlightData = OneWayFlightData | RoundTripFlightData | ItineraryPlanData;

interface TransportFormProps {
  data: any;
  handleConversationButton: (value: string, label: string, isConfirm: boolean) => void;
}

const TransportFormComponent: React.FC<TransportFormProps> = ({ data, handleConversationButton }) => {
  const [selected, setSelected] = useState<string>('');

  const handleOption = (val: string, label: string) => {
    setSelected(val);
    // Tự động submit sau 300ms để trải nghiệm mượt hơn
    setTimeout(() => {
       handleConversationButton(val, label, false);
    }, 300);
  };

  const getIcon = (id: string) => {
      switch(id) {
          case 'flight': return <FlightTakeoff />;
          default: return <DirectionsCar />;
      }
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ background: gradients.primary, p: 3, color: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{data.message}</Typography>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {data.options?.map((opt: any) => (
            <Button
              key={opt.id}
              variant={selected === opt.value ? "contained" : "outlined"}
              onClick={() => handleOption(opt.value, opt.label)}
              startIcon={getIcon(opt.id)}
              sx={{ 
                  py: 2, 
                  justifyContent: 'flex-start', 
                  pl: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#e0e0e0',
                  color: selected === opt.value ? '#fff' : 'text.primary',
                  background: selected === opt.value ? gradients.primary : 'transparent',
                  '&:hover': {
                      borderColor: brandColors.primary,
                      background: selected === opt.value ? gradients.primary : alpha(brandColors.primary, 0.05)
                  }
              }}
            >
              {opt.label}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};


// --- COMPONENT CARD CHUYẾN BAY (Giữ nguyên) ---
const FlightCard: React.FC<{ flight: Flight }> = ({ flight }) => {
  // Helper: Format tiền VND
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Helper: Format thời gian bay (VD: 100 phút -> 1h 40m)
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eee', overflow: 'visible' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Hàng 1: Hãng bay & Giá */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(brandColors.primary, 0.1), color: brandColors.primary }}>
              <FlightTakeoff fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {flight.airline}
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800 }}>
            {formatPrice(flight.price)}
          </Typography>
        </Box>

        {/* Hàng 2: Lịch trình bay (Timeline) */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
          {/* Giờ đi */}
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {formatTime(flight.departureTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Đi
            </Typography>
          </Box>

          {/* Đường bay & Thời lượng */}
          <Box sx={{ flex: 1, px: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary' }}>
              {formatDuration(flight.duration)}
            </Typography>
            <Box sx={{ position: 'relative', height: '2px', bgcolor: '#e0e0e0', width: '100%' }}>
              <Box sx={{ position: 'absolute', right: 0, top: '-3px', width: '6px', height: '6px', borderRadius: '50%', bgcolor: '#ccc' }} />
              <Box sx={{ position: 'absolute', left: 0, top: '-3px', width: '6px', height: '6px', borderRadius: '50%', bgcolor: '#ccc' }} />
              <FlightIcon sx={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%) rotate(90deg)', color: brandColors.primary, fontSize: 16 }} />
            </Box>
          </Box>

          {/* Giờ đến */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {formatTime(flight.arrivalTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Đến
            </Typography>
          </Box>
        </Box>
        
        {/* Nút chọn (Optional) */}
        {/* <Button variant="outlined" fullWidth size="small" sx={{ mt: 2, borderRadius: 2 }}>Chọn vé này</Button> */}
      </CardContent>
    </Card>
  );
};

const RoundTripFlightCard: React.FC<{ flight: RoundTripFlight }> = ({ flight }) => {
    const formatPrice = (price: number) => price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const formatTimeFromISO = (isoString: string) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch (e) { return 'Invalid Time'; }
    };
    const formatDateFromISO = (isoString: string) => {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        } catch (e) { return 'Invalid Date'; }
    };

    return (
        <Card sx={{ mb: 1.5, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid #eee', pb: 2 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>Tổng giá vé khứ hồi</Typography>
                    <Typography variant="h5" component="div" color="primary" sx={{ fontWeight: 700 }}>{formatPrice(flight.price)}</Typography>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>✈️ Chiều đi: {flight.departureFlight.airline} - {formatDateFromISO(flight.departureFlight.departureTime)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary', mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightTakeoff /><Typography>{formatTimeFromISO(flight.departureFlight.departureTime)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime /><Typography>{formatDuration(flight.departureFlight.duration)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightLand /><Typography>{formatTimeFromISO(flight.departureFlight.arrivalTime)}</Typography></Box>
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>✈️ Chiều về: {flight.returnFlight.airline} - {formatDateFromISO(flight.returnFlight.departureTime)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightTakeoff /><Typography>{formatTimeFromISO(flight.returnFlight.departureTime)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime /><Typography>{formatDuration(flight.returnFlight.duration)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightLand /><Typography>{formatTimeFromISO(flight.returnFlight.arrivalTime)}</Typography></Box>
                </Box>
            </CardContent>
        </Card>
    );
};
// --- KẾT THÚC CARD CHUYẾN BAY ---

// --- PEOPLE DETAILS FORM COMPONENT ---
interface PeopleDetailsFormProps {
  data: any;
  handleConversationButton: (value: string, label: string, isConfirm: boolean) => void;
}

const PeopleDetailsFormComponent: React.FC<PeopleDetailsFormProps> = ({ data, handleConversationButton }) => {
  const numPeopleForm = data.numPeople || 1;
  const [formData, setFormData] = useState(
    data.travelers || Array(numPeopleForm).fill(null).map(() => ({
      name: '',
      email: '',
      phone: '',
      type: 'adult',
      age: null
    }))
  );

  const handleFormChange = (index: number, field: string, value: any) => {
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [field]: value };
    setFormData(newFormData);
  };

  const handleSubmitForm = () => {
    // Send form data as JSON
    handleConversationButton(JSON.stringify(formData), 'Tiếp tục', false);
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ background: gradients.secondary, p: 3, color: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {data.message}
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 3 }}>
          {Array(numPeopleForm).fill(null).map((_, idx) => (
            <Box
              key={idx}
              sx={{
                p: 2.5,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: '#fafafa'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: brandColors.primary }}>
                👤 Người {idx + 1}
              </Typography>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Họ và tên *"
                  placeholder="Nguyễn Văn A"
                  value={formData[idx]?.name || ''}
                  onChange={(e) => handleFormChange(idx, 'name', e.target.value)}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Email"
                  placeholder="example@email.com"
                  type="email"
                  value={formData[idx]?.email || ''}
                  onChange={(e) => handleFormChange(idx, 'email', e.target.value)}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  placeholder="0123456789"
                  value={formData[idx]?.phone || ''}
                  onChange={(e) => handleFormChange(idx, 'phone', e.target.value)}
                  size="small"
                />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => handleConversationButton('skip', 'Bỏ qua', false)}
            sx={{ flex: 1, py: 1.5 }}
          >
            ⏭️ Bỏ qua
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitForm}
            sx={{
              flex: 2,
              py: 1.5,
              background: gradients.primary,
              '&:hover': {
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              }
            }}
          >
            ✅ Tiếp tục
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
// --- END PEOPLE DETAILS FORM ---

// --- BASIC INFO FORM COMPONENT ---
interface BasicInfoFormProps {
  data: any;
  handleConversationButton: (value: string, label: string, isConfirm: boolean) => void;
}

const BasicInfoFormComponent: React.FC<BasicInfoFormProps> = ({ data, handleConversationButton }) => {
  const [numPeople, setNumPeople] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [dateOption, setDateOption] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>('');

  const handleSubmitForm = () => {
    // Validate
    if (!numPeople || !duration || !dateOption) {
      alert('Vui lòng chọn đầy đủ thông tin!');
      return;
    }

    if (dateOption === 'custom' && !customDate) {
      alert('Vui lòng chọn ngày cụ thể!');
      return;
    }

    // Create selections object
    const selections = {
      numPeople,
      duration,
      dateOption: dateOption === 'custom' ? customDate : dateOption
    };

    // Send as JSON
    const selectionsJSON = JSON.stringify(selections);
    handleConversationButton(selectionsJSON, 'Đã điền thông tin cơ bản', false);
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ background: gradients.primary, p: 3, color: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {data.message || '👥 THÔNG TIN CƠ BẢN'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Chọn tất cả thông tin rồi nhấn "Tiếp tục"
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Number of People */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            👥 Số người đi:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {[
              { value: '1', label: '1 người' },
              { value: '2', label: '2 người' },
              { value: '3-4', label: '3-4 người' },
              { value: '5+', label: '5+ người' }
            ].map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => setNumPeople(option.value)}
                color={numPeople === option.value ? 'primary' : 'default'}
                variant={numPeople === option.value ? 'filled' : 'outlined'}
                sx={{
                  py: 2.5,
                  px: 1,
                  fontSize: '0.95rem',
                  fontWeight: numPeople === option.value ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Duration */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            ⏱️ Thời gian:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {[
              { value: '2-3', label: '⏱️ 2-3 ngày' },
              { value: '3-5', label: '⏱️ 3-5 ngày' },
              { value: '5-7', label: '⏱️ 5-7 ngày' },
              { value: '7+', label: '⏱️ 7+ ngày' }
            ].map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => setDuration(option.value)}
                color={duration === option.value ? 'primary' : 'default'}
                variant={duration === option.value ? 'filled' : 'outlined'}
                sx={{
                  py: 2.5,
                  px: 1,
                  fontSize: '0.95rem',
                  fontWeight: duration === option.value ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Date Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            📅 Ngày đi:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            {[
              { value: 'thisweek', label: '📅 Tuần này' },
              { value: 'nextweek', label: '📅 Tuần sau' },
              { value: 'nextmonth', label: '📅 Tháng sau' },
              { value: 'custom', label: '📅 Chọn ngày cụ thể' }
            ].map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => setDateOption(option.value)}
                color={dateOption === option.value ? 'primary' : 'default'}
                variant={dateOption === option.value ? 'filled' : 'outlined'}
                sx={{
                  py: 2.5,
                  px: 1,
                  fontSize: '0.95rem',
                  fontWeight: dateOption === option.value ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              />
            ))}
          </Box>
          
          {/* Custom Date Input */}
          {dateOption === 'custom' && (
            <TextField
              fullWidth
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Submit Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmitForm}
          disabled={!numPeople || !duration || !dateOption || (dateOption === 'custom' && !customDate)}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 700,
            background: gradients.primary,
            '&:hover': {
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
            },
            '&:disabled': {
              background: '#ccc'
            }
          }}
        >
          ✅ Tiếp tục
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          💡 Chọn đủ 3 mục để tiếp tục
        </Typography>
      </CardContent>
    </Card>
  );
};
// --- END BASIC INFO FORM ---

// --- DESTINATION FORM COMPONENT ---
interface DestinationFormProps {
  data: any;
  handleConversationButton: (value: string, label: string, isConfirm: boolean) => void;
}
const DestinationFormComponent: React.FC<DestinationFormProps> = ({ data, handleConversationButton }) => {
  const [selected, setSelected] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const handleOption = (value: string) => {
    setSelected(value);
    setCustomInput('');
  };
  const handleSubmit = () => {
    const value = selected || customInput;
    if (!value.trim()) return alert('Vui lòng chọn hoặc nhập địa điểm!');
    handleConversationButton(value, value, false);
  };
  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ background: gradients.primary, p: 3, color: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{data.message}</Typography>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {data.options?.map((opt:any) => (
            <Chip key={opt.value} label={opt.label} clickable onClick={() => handleOption(opt.value)}
              color={selected === opt.value ? 'primary' : 'default'}
              variant={selected === opt.value ? 'filled' : 'outlined'}
              sx={{ py: 2.5, fontSize: '1rem', fontWeight: 700 }} />
          ))}
        </Box>
        <TextField
          fullWidth
          label="Nhập địa điểm khác"
          value={customInput}
          onChange={e => { setCustomInput(e.target.value); setSelected('') }}
          sx={{ mb: 3 }}
        />
        <Button variant='contained' fullWidth onClick={handleSubmit} sx={{ py: 1.5, background: gradients.primary }} disabled={!(selected || customInput)}>
          ✅ Tiếp tục
        </Button>
      </CardContent>
    </Card>
  );
};
// --- END DESTINATION FORM ---


interface OriginFormProps {
  data: any;
  handleConversationButton: (value: string, label: string, isConfirm: boolean) => void;
}
const OriginFormComponent: React.FC<OriginFormProps> = ({ data, handleConversationButton }) => {
  const [selected, setSelected] = React.useState<string>('');
  const [customInput, setCustomInput] = React.useState<string>('');

  const handleOption = (value: string) => {
    setSelected(value);
    setCustomInput('');
  };

  const handleSubmit = () => {
    const value = selected || customInput;
    if (!value.trim()) return alert('Vui lòng chọn hoặc nhập điểm xuất phát!');
    handleConversationButton(value, value, false);
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ background: gradients.primary, p: 3, color: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{data.message}</Typography>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {data.options?.map((opt: any) => (
            <Chip 
              key={opt.value} 
              label={opt.label} 
              clickable 
              onClick={() => handleOption(opt.value)}
              color={selected === opt.value ? 'primary' : 'default'}
              variant={selected === opt.value ? 'filled' : 'outlined'}
              sx={{ py: 2.5, fontSize: '1rem', fontWeight: 700 }} 
            />
          ))}
        </Box>
        <TextField
          fullWidth
          label="Nhập địa điểm của bạn (VD: Hải Phòng, Cần Thơ...)"
          value={customInput}
          onChange={e => { setCustomInput(e.target.value); setSelected('') }}
          sx={{ mb: 3 }}
        />
        <Button 
          variant='contained' 
          fullWidth 
          onClick={handleSubmit} 
          sx={{ py: 1.5, background: gradients.primary }} 
          disabled={!(selected || customInput)}
        >
          ✅ Xác nhận điểm đi
        </Button>
      </CardContent>
    </Card>
  );
};

// --- BUDGET FORM COMPONENT ---
interface BudgetFormProps {
  data: any;
  handleConversationButton: (value: string, label: string, isConfirm: boolean) => void;
}
const BudgetFormComponent: React.FC<BudgetFormProps> = ({ data, handleConversationButton }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState('');
  const handleOption = (val:number) => { setSelected(val); setCustom(''); };
  const handleSubmit=()=>{
    let value = selected ? selected.toString() : custom.replace(/[^0-9]/g, '');
    if (!value) return alert('Vui lòng chọn hoặc nhập số tiền!');
    handleConversationButton(value, value, false);
  };
  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ background: gradients.primary, p: 3, color: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{data.message}</Typography>
      </Box>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {data.options?.map((opt:any) => (
            <Chip key={opt.value} label={opt.label} clickable onClick={() => handleOption(opt.value)}
              color={selected===opt.value ? 'primary':'default'}
              variant={selected===opt.value?'filled':'outlined'}
              sx={{ py: 2.5, fontSize: '1rem', fontWeight: 700 }} />
          ))}
        </Box>
        <TextField
          fullWidth
          label="Nhập số tiền khác (VNĐ)"
          type="number"
          value={custom}
          onChange={e=>{ setCustom(e.target.value); setSelected(null) }}
          sx={{ mb: 3 }}
        />
        <Button variant='contained' fullWidth onClick={handleSubmit} sx={{ py: 1.5, background: gradients.primary }} disabled={!(selected||custom)}>
          ✅ Tiếp tục
        </Button>
      </CardContent>
    </Card>
  );
};
// --- END BUDGET FORM ---

// --- THÊM VÀO TRÊN CÙNG HOẶC TRƯỚC AIBot COMPONENT ---

// --- CẬP NHẬT COMPONENT: EDITABLE SUMMARY CARD (ĐẦY ĐỦ THÔNG TIN) ---
const EditableSummaryCard: React.FC<{ 
  data: any; 
  handleConversationButton: (value: string, label: string, isConfirm: boolean) => void 
}> = ({ data, handleConversationButton }) => {
  
  // 1. Lấy dữ liệu ban đầu
  const initialSummaryData = data.summary || data.data || {};
  
  // 2. State quản lý chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(initialSummaryData);

  // Hàm xử lý khi nhập liệu (Chỉnh sửa Lịch trình)
  const handleChangeActivity = (dayIdx: number, actIdx: number, field: string, val: string) => {
    const newItinerary = [...(editData.itinerary || [])];
    if (newItinerary[dayIdx] && newItinerary[dayIdx].activities[actIdx]) {
      const valueToSave = field === 'cost' ? Number(val) : val;
      newItinerary[dayIdx].activities[actIdx] = {
        ...newItinerary[dayIdx].activities[actIdx],
        [field]: valueToSave
      };
      setEditData({ ...editData, itinerary: newItinerary });
    }
  };

  // Hàm gửi dữ liệu đi
  const onConfirm = () => {
    // 1. Lấy danh sách dữ liệu an toàn (Bắt mọi trường hợp tên biến mà AI có thể trả về)
    const aiHotels = editData.hotels || editData.hotelsSample || editData.accommodations || [];
    const aiRestaurants = editData.restaurants || [];
    const aiAttractions = editData.selectedAttractions || editData.attractions || [];

    // 2. Hàm chuẩn hóa: Chuyển Mảng Object -> Mảng String ["Tên, Địa chỉ", ...]
    const formatList = (list: any[]) => {
        if (!Array.isArray(list)) return [];
        
        return list.map(item => {
            // Nếu đã là chuỗi thì giữ nguyên
            if (typeof item === 'string') return item; 
            
            // Lấy tên (Ưu tiên name > title)
            const name = item.name || item.title || 'Địa điểm';
            
            // Lấy địa chỉ (Ưu tiên location > vicinity > address)
            // Kiểm tra kỹ để tránh hiện chữ "undefined"
            const rawAddress = item.location || item.vicinity || item.address || '';
            const address = (rawAddress && rawAddress !== 'Không có địa chỉ') ? rawAddress : '';

            // Nếu có địa chỉ thì ghép "Tên, Địa chỉ", nếu không chỉ lấy "Tên"
            return address ? `${name}, ${address}` : name; 
        }).filter(str => str && str.trim() !== ''); // Lọc bỏ các dòng rỗng
    };

    // 3. Tạo cấu trúc destinations chuẩn cho Backend
    const finalDestinations = [{
        name: editData.destination || 'Điểm đến AI',
        arrivalDate: editData.startDate,
        departureDate: editData.endDate,
        // Gọi hàm formatList để lấy TOÀN BỘ danh sách
        hotels: formatList(aiHotels.slice(0, 1)),
        restaurants: formatList(aiRestaurants.slice(0, 3)), // Chỉ lấy 3 nhà hàng đầu tiên
        attractions: formatList(aiAttractions.slice(0, 3))  // Chỉ lấy 3 địa điểm vui chơi đầu tiên
    }];

    // 4. Gộp vào payload và gửi đi
    const payload = {
        ...editData,
        destinations: finalDestinations, // Ghi đè field destinations cũ
    };

    // Log kiểm tra xem data có đầy đủ không
    console.log('Payload sending to save:', payload);

    handleConversationButton(JSON.stringify(payload), 'Xác nhận & Tạo chuyến đi', true);
  };

  // Destructuring dữ liệu để hiển thị
  const { 
    destination, startDate, endDate, duration, durationDays, numPeople, 
    budget, costEstimate, budgetFit 
  } = editData;

  // Các mảng dữ liệu phụ trợ (Weather, Hotels, Restaurants, Attractions)
  const weather = editData.weather || [];
  const hotels = editData.hotels || editData.hotelsSample || [];
  const restaurants = editData.restaurants || [];
  const attractions = editData.selectedAttractions || editData.attractions || []; // Hỗ trợ cả 2 key
  const itinerary = editData.itinerary || [];

  // Helper format tiền
  const fmtMoney = (n: number) => n ? n.toLocaleString('vi-VN') : '0';

  const totalCost = costEstimate?.total || 0;
  const userBudget = budget || 0;
  const isOverBudget = userBudget > 0 && totalCost > userBudget;
  const overAmount = totalCost - userBudget;

  // === 1. THÊM HÀM XỬ LÝ THÊM/XÓA HOẠT ĐỘNG ===
  const handleAddActivity = (dayIdx: number) => {
    const newItinerary = [...(editData.itinerary || [])];
    // Đảm bảo mảng activities tồn tại
    if (!newItinerary[dayIdx].activities) {
        newItinerary[dayIdx].activities = [];
    }
    // Thêm item rỗng
    newItinerary[dayIdx].activities.push({
      time: '08:00', // Giờ mặc định
      title: '',
      description: '',
      cost: 0,
      type: 'attraction'
    });
    setEditData({ ...editData, itinerary: newItinerary });
  };

  const handleDeleteActivity = (dayIdx: number, actIdx: number) => {
    const newItinerary = [...(editData.itinerary || [])];
    // Cắt bỏ item tại vị trí actIdx
    newItinerary[dayIdx].activities.splice(actIdx, 1);
    setEditData({ ...editData, itinerary: newItinerary });
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <CardContent sx={{ p: 3 }}>
        {/* --- 1. TIÊU ĐỀ & TRẠNG THÁI --- */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {data.message} 
          {isEditing && <Chip label="Đang chỉnh sửa" color="primary" size="small" sx={{ ml: 1, fontWeight: 600 }} />}
        </Typography>

        {/* --- 2. THÔNG TIN CƠ BẢN (BASIC INFO) --- */}
        <Box sx={{ display: 'grid', gap: 1.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Place sx={{ color: brandColors.primary }} />
            <Typography><strong>Điểm đến:</strong> {destination || 'Chưa cập nhật'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ color: brandColors.primary }} />
            <Typography>
              <strong>Ngày đi:</strong>{' '}
              {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : '...'} 
              {' → '} 
              {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : '...'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ color: brandColors.primary }} />
            <Typography><strong>Thời gian:</strong> {duration || durationDays + ' ngày'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person sx={{ color: brandColors.primary }} />
            <Typography><strong>Người đi:</strong> {numPeople || 1} người</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney sx={{ color: brandColors.primary }} />
            <Typography><strong>Ngân sách:</strong> {budget ? budget.toLocaleString('vi-VN') : 0} VNĐ</Typography>
          </Box>
        </Box>

        {/* --- 3. ƯỚC TÍNH CHI PHÍ (COST ESTIMATE) --- */}
        {costEstimate && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(102, 126, 234, 0.05)', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              💰 Ước tính chi phí
            </Typography>
            <Box sx={{ display: 'grid', gap: 0.5, fontSize: '0.9rem' }}>
              <Typography>• Vé máy bay: {fmtMoney(costEstimate.flights)} VNĐ</Typography>
              <Typography>• Khách sạn: {fmtMoney(costEstimate.hotels)} VNĐ</Typography>
              <Typography>• Ăn uống: {fmtMoney(costEstimate.food)} VNĐ</Typography>
              <Typography>• Hoạt động: {fmtMoney(costEstimate.activities)} VNĐ</Typography>
              <Typography>• Di chuyển: {fmtMoney(costEstimate.transport)} VNĐ</Typography>
              <Typography sx={{ fontWeight: 700, mt: 1, fontSize: '1rem', color: brandColors.primary }}>
                Tổng cộng: {fmtMoney(costEstimate.total)} VNĐ 
              </Typography>

              {/* === THÊM MỚI: DÒNG CẢNH BÁO VƯỢT NGÂN SÁCH === */}
              {isOverBudget && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#d32f2f', // Màu đỏ cảnh báo
                    fontStyle: 'italic', 
                    fontWeight: 600, 
                    display: 'block', 
                    mt: 0.5 
                  }}
                >
                  ⚠️ Vượt ngân sách dự kiến: {fmtMoney(overAmount)} VNĐ
                </Typography>
              )}
            </Box>
            {budgetFit && (
              <Alert severity={budgetFit.fits ? "success" : "warning"} sx={{ mt: 1.5, py: 0 }}>
                {budgetFit.message}
              </Alert>
            )}
          </Box>
        )}

        {/* --- 4. DỰ BÁO THỜI TIẾT (WEATHER) - ĐÃ KHÔI PHỤC --- */}
        {weather.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              🌤️ Dự báo thời tiết
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              {weather.slice(0, 5).map((day: any, idx: number) => (
                <Box 
                  key={idx}
                  sx={{ 
                    minWidth: 85,
                    p: 1.5,
                    bgcolor: day.rain ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                    borderRadius: 2,
                    textAlign: 'center',
                    border: day.rain ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)'
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                    {new Date(day.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </Typography>
                  <Typography variant="h6" sx={{ my: 0.5, fontWeight: 'bold' }}>
                    {Math.round(day.temp)}°C
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.2, display: 'block' }}>
                    {day.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* --- 5. KHÁCH SẠN GỢI Ý (HOTELS) - ĐÃ KHÔI PHỤC --- */}
        {hotels.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              🏨 Khách sạn gợi ý ({hotels.length})
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {hotels.slice(0, 3).map((hotel: any, idx: number) => (
                <Box 
                  key={idx}
                  sx={{ 
                    p: 1.5,
                    bgcolor: 'rgba(76, 175, 80, 0.05)',
                    borderRadius: 2,
                    borderLeft: '4px solid #4CAF50'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {hotel.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 14 }} /> {hotel.location || hotel.vicinity || 'Không có địa chỉ'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* --- 6. NHÀ HÀNG GỢI Ý (RESTAURANTS) - ĐÃ KHÔI PHỤC --- */}
        {restaurants.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              🍽️ Nhà hàng gợi ý ({restaurants.length})
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {restaurants.slice(0, 3).map((res: any, idx: number) => (
                <Box 
                  key={idx}
                  sx={{ 
                    p: 1.5,
                    bgcolor: 'rgba(255, 152, 0, 0.05)',
                    borderRadius: 2,
                    borderLeft: '4px solid #FF9800'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {res.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 14 }} /> {res.location || res.vicinity || 'Không có địa chỉ'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* --- 7. ĐỊA ĐIỂM THAM QUAN (ATTRACTIONS) - ĐÃ KHÔI PHỤC --- */}
        {attractions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              🎯 Địa điểm tham quan ({attractions.length})
            </Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {attractions.slice(0, 3).map((attr: any, idx: number) => (
                <Box 
                  key={idx}
                  sx={{ 
                    p: 1.5,
                    bgcolor: 'rgba(156, 39, 176, 0.05)',
                    borderRadius: 2,
                    borderLeft: '4px solid #9C27B0'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {typeof attr === 'string' ? attr : attr.name}
                  </Typography>
                  {typeof attr !== 'string' && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 14 }} /> {attr.location || attr.vicinity || 'Không có địa chỉ'}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* --- 8. LỊCH TRÌNH CHI TIẾT (CÓ THỂ EDIT) --- */}
        {itinerary.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '1.1rem' }}>
              📅 LỊCH TRÌNH CHI TIẾT
            </Typography>
            {itinerary.map((dayPlan: any, dayIdx: number) => (
              <Box key={dayIdx} sx={{ mb: 3 }}>
                {/* Header Ngày */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: gradients.primary, 
                  color: '#fff', 
                  borderRadius: '8px 8px 0 0',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>🗓️ NGÀY {dayPlan.day}</span>
                  {dayPlan.date && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                       {new Date(dayPlan.date).toLocaleDateString('vi-VN')}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ border: '1px solid #e0e0e0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                  {dayPlan.activities && dayPlan.activities.map((activity: any, actIdx: number) => (
                    <Box 
                      key={actIdx} 
                      sx={{ 
                        p: 2, 
                        borderBottom: actIdx < dayPlan.activities.length - 1 ? '1px solid #f0f0f0' : 'none', 
                        bgcolor: isEditing ? '#fafafa' : '#fff',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isEditing ? (
  // --- FORM EDIT (CẬP NHẬT) ---
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
    
    {/* Cột chứa Input */}
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      
      {/* Hàng 1: Giờ + Tên hoạt động */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField 
          label="Giờ" size="small" value={activity.time} 
          onChange={(e) => handleChangeActivity(dayIdx, actIdx, 'time', e.target.value)}
          sx={{ width: '110px' }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField 
          label="Hoạt động" size="small" fullWidth value={activity.title} 
          onChange={(e) => handleChangeActivity(dayIdx, actIdx, 'title', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Hàng 2: Chi phí + Mô tả (MỚI) */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField 
          label="Chi phí" 
          size="small" 
          type="number"
          value={activity.cost || 0} 
          onChange={(e) => handleChangeActivity(dayIdx, actIdx, 'cost', e.target.value)}
          sx={{ width: '140px' }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: <InputAdornment position="start">₫</InputAdornment>,
          }}
        />
        <TextField 
          label="Mô tả / Địa chỉ" 
          size="small" 
          fullWidth 
          value={activity.description} 
          onChange={(e) => handleChangeActivity(dayIdx, actIdx, 'description', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Box>

    {/* Nút Xóa giữ nguyên */}
    <IconButton 
      onClick={() => handleDeleteActivity(dayIdx, actIdx)}
      color="error" 
      size="small"
      sx={{ mt: 1 }}
      title="Xóa hoạt động này"
    >
      <DeleteOutline />
    </IconButton>

  </Box>
) : (
                        // --- VIEW MODE ---
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: brandColors.primary, minWidth: 55, pt: 0.2 }}>
                            {activity.time}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {activity.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                              {activity.description}
                            </Typography>
                            {/* Tags giá tiền/thời lượng nếu có */}
                            {(activity.cost > 0 || activity.duration) && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    {activity.duration && <Chip label={`⏱️ ${activity.duration}`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                    {activity.cost > 0 && <Chip label={`💵 ${fmtMoney(activity.cost)}đ`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                                </Box>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}

                  {/* === NÚT THÊM HOẠT ĐỘNG (MỚI) === */}
                  {isEditing && (
                    <Box sx={{ p: 2, borderTop: '1px dashed #e0e0e0', bgcolor: '#fcfcfc' }}>
                      <Button 
                        startIcon={<AddCircleOutline />} 
                        onClick={() => handleAddActivity(dayIdx)}
                        fullWidth
                        variant="outlined"
                        sx={{ borderStyle: 'dashed', color: 'text.secondary' }}
                      >
                        Thêm hoạt động
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* --- 9. ACTION BUTTONS --- */}
        <Box sx={{ display: 'flex', gap: 1, mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
          {isEditing ? (
            <>
              <Button 
                variant="outlined" color="error" fullWidth
                onClick={() => { setIsEditing(false); setEditData(initialSummaryData); }}
              >
                Hủy bỏ
              </Button>
              <Button 
                variant="contained" fullWidth
                onClick={() => setIsEditing(false)} 
                sx={{ background: gradients.primary }}
              >
                Xem lại (Xong)
              </Button>
            </>
          ) : (
            <>
               <Button 
                 variant="outlined" 
                 onClick={() => setIsEditing(true)} 
                 startIcon={<AutoAwesome />}
                 sx={{ flex: 1 }}
               >
                 Sửa lại
               </Button>
               {/* Render dynamic buttons from backend */}
               {data.buttons?.map((btn: any) => {
                 if (btn.id === 'edit') return null; // Ẩn nút edit gốc vì đã có nút Sửa lại ở trên
                 if (btn.id === 'confirm') {
                   return (
                     <Button 
                       key={btn.id} variant="contained" 
                       sx={{ flex: 2, background: gradients.primary, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}
                       onClick={onConfirm}
                     >
                       {btn.label}
                     </Button>
                   );
                 }
                 return (
                    <Button 
                      key={btn.id} variant="outlined" color="error"
                      onClick={() => handleConversationButton(btn.value, btn.label, false)}
                    >
                      {btn.label}
                    </Button>
                 );
               })}
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const AIBot: React.FC = () => {
  // === THÊM MỚI: State để mở/đóng chat ===
  const [open, setOpen] = useState(false);
  // State to track selected attractions in destination_selection step
  const [tempSelectedAttractions, setTempSelectedAttractions] = useState<string[]>([]);

  // === Toàn bộ state từ AIAssistant.tsx được chuyển vào đây ===
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Xin chào! 👋 Tôi là trợ lý ảo du lịch của bạn. Tôi có thể giúp bạn:\n\n✈️ Lập kế hoạch du lịch chi tiết\n🗺️ Gợi ý điểm đến phù hợp\n🏨 Tìm khách sạn và nhà hàng\n💰 Tư vấn ngân sách\n🌤️ Thông tin thời tiết\n\nBạn muốn hỏi gì về chuyến du lịch của mình?',
      timestamp: new Date(),
      suggestions: [
        'Gợi ý điểm đến cho chuyến du lịch 3 ngày',
        'Lập kế hoạch du lịch',
        'Khách sạn tốt ở TP.HCM',
        'Món ăn ngon ở Đà Nẵng',
        'Chi phí đi Phú Quốc 4 ngày 3 đêm',
      'Tạo lịch trình đi Sapa cho cặp đôi',
      'Địa điểm du lịch gần Hà Nội',
      'Homestay đẹp ở Hội An',
      'Vé máy bay giá rẻ đi Quy Nhơn',
      'Thời tiết Nha Trang cuối tuần này'
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // === Toàn bộ hàm xử lý từ AIAssistant.tsx được chuyển vào đây ===
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) { // Chỉ cuộn khi modal mở
      scrollToBottom();
    }
  }, [messages, typing, open]);

  useEffect(() => {
    if (open) { // Chỉ focus khi modal mở
      inputRef.current?.focus();
    }
  }, [open]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;
  
    // 1. Tạo message hiển thị cho User
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    // Cập nhật UI ngay lập tức
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    const messageToSend = inputMessage; // Lưu lại nội dung để gửi
    setInputMessage(''); // Xóa ô nhập
    setLoading(true);
    setTyping(true);
    setError('');
  
    try {
      const token = localStorage.getItem('token');
  
      // === [LOGIC MỚI] ===
      // Regex bắt từ khóa: "tạo kế hoạch", "lập kế hoạch", "lên lịch trình", "tạo chuyến đi", "plan trip"
      // Cho phép chèn từ ở giữa, ví dụ: "tạo GIÚP MÌNH 1 cái kế hoạch"
      const planningKeywords = /(?:tạo|lập|lên|xây dựng)\s+(?:.*)?(?:kế hoạch|lịch trình|chuyến đi|trip)|(?:create|plan)\s+(?:.*)?(?:trip|itinerary)/i;
      
      const isPlanningIntent = planningKeywords.test(messageToSend);
  
      if (isPlanningIntent) {
        // CASE 1: NẾU LÀ TẠO KẾ HOẠCH -> GỌI CONVERSATION MANAGER (BẮT ĐẦU QUY TRÌNH)
        console.log("🎯 Phát hiện ý định tạo kế hoạch: Kích hoạt Conversation Flow");
        
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/ai/conversation`,
          { action: 'start' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Xử lý dữ liệu trả về từ AI
        const aiData = extractAiData(response.data);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: JSON.stringify(aiData),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
  
      } else {
        // CASE 2: CÁC TRƯỜNG HỢP CÒN LẠI -> GỌI CHAT THƯỜNG (Hỏi đáp, tìm vé, tán gẫu...)
        console.log("💬 Chat tự nhiên");
  
        const conversationHistory: ConversationHistoryItem[] = currentMessages
          .slice(0, -1) // Lấy lịch sử trừ tin nhắn mới nhất vừa push
          .map(msg => ({
            role: msg.type === 'ai' ? 'assistant' : 'user',
            content: msg.content,
          }));
  
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/ai/chat`,
          { 
            message: messageToSend,
            conversationHistory: conversationHistory 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Xử lý phản hồi text hoặc JSON từ Chat API
        let aiContent = '';
        if (response.data.success) {
          if (typeof response.data.response === 'object') {
               aiContent = JSON.stringify(response.data.response);
          } else {
               aiContent = response.data.response;
          }
        } else {
          aiContent = 'Xin lỗi, tôi đang gặp chút vấn đề kết nối. Bạn thử lại sau nhé!';
        }
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
  
    } catch (err: any) {
      console.error("Lỗi gửi tin nhắn:", err);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
      // Xóa tin nhắn user nếu lỗi để họ gửi lại
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      setInputMessage(messageToSend); // Trả lại text vào ô nhập
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleCopyMessage = (content: string) => {
    try {
        const data: FlightData = JSON.parse(content);
        if (data && data.type === 'flight_results') {
            navigator.clipboard.writeText(data.summary);
            return;
        }
    } catch (e) {
        // Bỏ qua
    }
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  // Handle button click trong conversation
  const handleConversationButton = async (value: string, label: string, isConfirm: boolean = false) => {
    try {
      // 1. HIỂN THỊ TIN NHẮN USER (button label)
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: label, // Hiển thị label của button
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const action = isConfirm ? 'confirm' : 'input';
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/ai/conversation`,
        { action, value },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await new Promise(resolve => setTimeout(resolve, 300));

      // If trip was created, save it
      if (response.data.type === 'trip_created' && response.data.tripData) {
        const saveResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/trips/from-ai`,
          { itineraryData: response.data.tripData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (saveResponse.data.success) {
          // Show success message
          const successMsg: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: JSON.stringify({
              type: 'trip_saved',
              message: '🎉 Đã lưu chuyến đi vào Dashboard!'
            }),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, successMsg]);
        }
      } else {
        // Regular conversation response
        // PATCH unwrap/normalize
        const aiData = extractAiData(response.data);
        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: JSON.stringify(aiData),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Conversation error:', error);
      setLoading(false);
    }
  };

  // PATCH: Extract the actual message data by unwrapping API response
  const safeJsonParse = (payload: any): any => {
    if (typeof payload !== 'string') return payload;
    
    let cleaned = payload.trim();
  
    // 1. Loại bỏ Markdown code block (```json ... ``` hoặc ``` ... ```)
    if (cleaned.startsWith('```')) {
      // Xóa dòng đầu tiên (vd: ```json)
      cleaned = cleaned.replace(/^```[a-z]*\s*/, '');
      // Xóa dòng cuối cùng (```)
      cleaned = cleaned.replace(/\s*```$/, '');
    }
  
    // 2. Xử lý trường hợp parse 2 lần (nếu JSON bị stringify 2 lần)
    try {
      const result = JSON.parse(cleaned);
      // Nếu kết quả vẫn là string, parse tiếp lần nữa
      if (typeof result === 'string') {
          // Đệ quy để parse tiếp nếu cần
          return safeJsonParse(result);
      }
      return result;
    } catch (e) {
      // Nếu thất bại, thử clean thêm các ký tự lạ
      try {
         const sanitized = cleaned
            .replace(/\r?\n/g, '') // Xóa xuống dòng
            .replace(/\t/g, ' ');  // Xóa tab
         return JSON.parse(sanitized);
      } catch (finalError) {
         // Vẫn lỗi thì trả về null để hàm renderAiMessage xử lý hiển thị text
         console.warn("JSON Parse failed:", finalError);
         return null; 
      }
    }
  };

  const renderAiMessage = (content: string) => {
    let data: any = content;

    // 1. Cố gắng parse JSON
    if (typeof content === 'string') {
      data = safeJsonParse(content);
      // Nếu safeJsonParse trả về null (do lỗi), fallback về content gốc
      if (!data) data = content;
   } else {
      data = content;
   }

    // === [FIX QUAN TRỌNG] ===
    // CASE 1: Nếu dữ liệu là String (Chat tự nhiên, hỏi đáp thông thường)
    // -> Hiển thị luôn, không báo lỗi type
    if (typeof data === 'string') {
      return (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
          {data}
        </Typography>
      );
    }

    // CASE 2: Nếu là Object nhưng thiếu 'type' (Fallback an toàn)
    if (!data || !data.type) {
      // Fallback cho object lạ
      return (
         <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(data, null, 2)}
         </Typography>
      );
   }

    // CASE 3: Xử lý các Type cụ thể (JSON có cấu trúc)
    switch (data.type) {
      case 'flight_results':
        return (
          <>
            {/* Hiển thị tóm tắt: "Có 5 chuyến bay..." */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: brandColors.primary }}>
               <FlightTakeoff />
               <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {data.summary}
               </Typography>
            </Box>
            
            {/* Lặp qua mảng flights và render FlightCard */}
            {data.flights.map((flight: any, index: number) => (
              <FlightCard key={index} flight={flight} />
            ))}
          </>
        );
      case 'roundtrip_flight_results':
        return (
          <>
            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{data.summary}</Typography>
            {data.flights.map((flight: any, index: number) => (<RoundTripFlightCard key={index} flight={flight} />))}
          </>
        );
      case 'itinerary_plan':
        // Smart itinerary card
        return (
          <Box sx={{ mt: 1 }}>
            <ItineraryCard
              data={data.data}
              summary={data.summary || 'Lịch trình du lịch'}
            />
          </Box>
        );
      case 'conversation':
        // Conversational flow
        return (
          <Box>
            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
              {data.message}
            </Typography>
            {data.buttons && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {data.buttons.map((btn: any) => (
                  <Chip
                    key={btn.id}
                    label={btn.label}
                    onClick={() => handleConversationButton(btn.value, btn.label)}
                    clickable
                    color={btn.primary ? 'primary' : 'default'}
                    sx={{
                      fontSize: '0.9rem',
                      py: 2.5,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        );

      case 'destination_selection':
      case 'destination_overview':
        // Destination Selection Card
        const overviewWeather = data.weather || [];
        const overviewAttractions = data.attractions || [];
        const overviewHotels = data.hotelsSample || [];
        const selectedAttractions = tempSelectedAttractions.length > 0 ? tempSelectedAttractions : (data.selectedAttractions || []);

        return (
          <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ background: gradients.primary, p: 3, color: '#fff' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                🏖️ {data.destination.toUpperCase()} - TỔNG QUAN
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Xem thông tin và chọn địa điểm bạn muốn tham quan
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Weather */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🌤️ Thời tiết 7 ngày tới
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                  {overviewWeather.slice(0, 7).map((day: any, idx: number) => (
                    <Box
                      key={idx}
                      sx={{
                        minWidth: 90,
                        p: 1.5,
                        bgcolor: day.rain ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                        borderRadius: 2,
                        textAlign: 'center',
                        border: day.rain ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)'
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                        {new Date(day.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, my: 0.5, color: day.rain ? '#2196F3' : '#FFC107' }}>
                        {Math.round(day.temp)}°C
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                        {day.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Attractions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎯 Địa điểm bạn muốn đi
                  <Chip
                    label={`Đã chọn: ${selectedAttractions.length}/${overviewAttractions.length}`}
                    size="small"
                    color="primary"
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Chọn các địa điểm bạn quan tâm (có thể chọn nhiều)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 1.5 }}>
                  {overviewAttractions.map((attraction: any, idx: number) => {
                    const isSelected = selectedAttractions.includes(attraction.name);
                    return (
                      <Box
                        key={idx}
                        onClick={() => {
                          setTempSelectedAttractions(prev => {
                            if (prev.includes(attraction.name)) {
                              return prev.filter(n => n !== attraction.name);
                            } else {
                              return [...prev, attraction.name];
                            }
                          });
                        }}
                        sx={{
                          p: 2,
                          border: isSelected ? `2px solid ${brandColors.primary}` : '1px solid #e0e0e0',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          bgcolor: isSelected ? 'rgba(102, 126, 234, 0.05)' : '#fff',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            borderColor: brandColors.primary
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{
                            minWidth: 24, height: 24, borderRadius: '50%',
                            border: `2px solid ${isSelected ? brandColors.primary : '#ccc'}`,
                            bgcolor: isSelected ? brandColors.primary : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}>
                            {isSelected && <Typography sx={{ color: '#fff', fontSize: '0.8rem' }}>✓</Typography>}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{attraction.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              ⏱️ {attraction.estimatedDuration || '2-3h'} | 💵 {attraction.estimatedCost === 0 ? 'Miễn phí' : `${(attraction.estimatedCost / 1000).toFixed(0)}k/người`}
                            </Typography>
                            {attraction.rating && <Typography variant="caption" sx={{ display: 'block' }}>⭐ {attraction.rating.toFixed(1)}</Typography>}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Hotels */}
              {overviewHotels.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🏨 Khách sạn tiêu biểu
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tham khảo giá khách sạn tại {data.destination}
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {overviewHotels.slice(0, 3).map((hotel: any, idx: number) => (
                      <Box key={idx} sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2, borderLeft: '3px solid #4CAF50' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{hotel.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>📍 {hotel.location}</Typography>
                        {hotel.rating && <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>⭐ {hotel.rating}/5</Typography>}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Buttons */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setTempSelectedAttractions([]);
                    handleConversationButton('change_destination', 'Đổi điểm đến', false);
                  }}
                  sx={{ flex: '1 1 auto', py: 1.5, minWidth: 140 }}
                >
                  ← Đổi điểm đến
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setTempSelectedAttractions([]);
                    handleConversationButton('skip_auto', 'Bỏ qua, AI tự chọn', false);
                  }}
                  sx={{ flex: '1 1 auto', py: 1.5, minWidth: 160 }}
                >
                  🤖 AI tự chọn
                </Button>
                <Button
                  variant="contained"
                  disabled={selectedAttractions.length === 0}
                  onClick={() => {
                    const selectionsJSON = JSON.stringify(selectedAttractions);
                    handleConversationButton(selectionsJSON, `Đã chọn ${selectedAttractions.length} điểm`, false);
                    setTempSelectedAttractions([]);
                  }}
                  sx={{
                    flex: '2 1 auto', py: 1.5, minWidth: 140,
                    background: gradients.primary,
                    '&:hover': { boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)' }
                  }}
                >
                  Tiếp tục ({selectedAttractions.length}) →
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      case 'basic_info_form':
        return <BasicInfoFormComponent data={data} handleConversationButton={handleConversationButton} />;
      case 'people_form':
        return <PeopleDetailsFormComponent data={data} handleConversationButton={handleConversationButton} />;
      case 'destination_form':
        return <DestinationFormComponent data={data} handleConversationButton={handleConversationButton} />;
      case 'budget_form':
        return <BudgetFormComponent data={data} handleConversationButton={handleConversationButton} />;
        case 'origin_form':
        return <OriginFormComponent data={data} handleConversationButton={handleConversationButton} />;
      case 'transport_form':
        return <TransportFormComponent data={data} handleConversationButton={handleConversationButton} />;
      case 'summary':
        return <EditableSummaryCard data={data} handleConversationButton={handleConversationButton} />;
      case 'trip_saved':
        return <Alert severity="success" sx={{ borderRadius: 2 }}>{data.message}</Alert>;

      default:
        return (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
            {typeof content === 'string' ? content : JSON.stringify(content)}
          </Typography>
        );
    }
  };

  function extractAiData(raw: any): any {
    if (!raw) return raw;

    const normalized = safeJsonParse(raw);
    // If parsing turned a double-string into JSON string, parse again
    const dataCandidate = typeof normalized === 'string' ? safeJsonParse(normalized) : normalized;

    if (dataCandidate && typeof dataCandidate === 'object') {
      if (dataCandidate.data && dataCandidate.data.type) return dataCandidate.data;
      if (dataCandidate.success && dataCandidate.type) {
        const { success, ...rest } = dataCandidate;
        return rest;
      }
      if (dataCandidate.type) return dataCandidate;
      for (const key in dataCandidate) {
        if (dataCandidate[key] && typeof dataCandidate[key] === 'object') {
          const nested = extractAiData(dataCandidate[key]);
          if (nested && typeof nested === 'object' && nested.type) return nested;
        }
      }
      return dataCandidate;
    }

    return raw;
  }

  return (
    <>
      {/* Nút tròn nổi ở góc */}
      {/* === SỬA LỖI (1): Bọc FAB trong Zoom và Đổi màu === */}
      <Zoom in={!open} unmountOnExit>
        <Fab
          aria-label="open ai assistant"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1301, // Đè lên trên mọi thứ
            background: gradients.secondary, // <-- ĐỔI MÀU NỔI BẬT (CAM/VÀNG)
            width: 72,
            height: 72,
            boxShadow: '0 8px 24px rgba(255,138,101,0.4)', // <-- ĐỔI SHADOW
            '&:hover': {
                background: gradients.secondary, // Giữ màu khi hover
                opacity: 0.9,
                transform: 'translateY(-2px)'
            }
          }}
        >
          <SmartToy sx={{ fontSize: 36, color: '#fff' }} /> {/* Thêm màu trắng cho icon */}
        </Fab>
      </Zoom>

      {/* Ngăn kéo chứa Giao diện Chat */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            // === SỬA LẠI: Kích thước nhỏ hơn cho 1 cột ===
            maxWidth: { xs: '100%', sm: '500px' }, // Chỉ còn 1 cột
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24,
            background: brandColors.background,
            overflow: 'hidden',
            height: '100%', // Thêm
          },
        }}
      >
        {/* Header */}
        <DialogTitle sx={{ p: 2, borderBottom: 1, borderColor: 'divider', background: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <AutoAwesome sx={{ fontSize: 28, color: brandColors.primary }} />
              <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
                Trợ Lý Ảo Du Lịch
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Cột Chat Interface */}
        <Paper
          elevation={0}
          sx={{
            height: '100%', // Cho phép co giãn
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            borderRadius: 0,
            overflow: 'hidden', // Thêm
          }}
        >
          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 3,
              background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
            }}
          >
            {messages.map((message, index) => (
              <Fade key={message.id} in timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, flexDirection: message.type === 'user' ? 'row-reverse' : 'row' }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      background: message.type === 'user' ? gradients.primary : gradients.secondary,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {message.type === 'user' ? <Person /> : <SmartToy />}
                  </Avatar>
                  <Box sx={{ maxWidth: '75%', position: 'relative' }}>
                    <Box
                      sx={{
                        background: message.type === 'user' ? gradients.primary : '#ffffff',
                        color: message.type === 'user' ? 'white' : '#333',
                        padding: '16px 20px',
                        borderRadius: message.type === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: message.type === 'ai' ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      {message.type === 'ai' 
                        ? renderAiMessage(message.content) 
                        : <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{message.content}</Typography>
                      }
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7, fontSize: '0.75rem' }}>
                        {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    {message.type === 'ai' && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, ml: 1 }}>
                        <IconButton size="small" onClick={() => handleCopyMessage(message.content)} sx={{ background: '#f5f5f5', '&:hover': { background: '#e0e0e0' } }}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleFeedback(message.id, true)} sx={{ background: '#f5f5f5', '&:hover': { background: '#e8f5e9' } }}>
                          <ThumbUp fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleFeedback(message.id, false)} sx={{ background: '#f5f5f5', '&:hover': { background: '#ffebee' } }}>
                          <ThumbDown fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Fade>
            ))}
            {typing && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 48, height: 48, background: gradients.secondary }}><SmartToy /></Avatar>
                <Box sx={{ background: '#ffffff', padding: '16px 20px', borderRadius: '20px 20px 20px 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">Đang soạn tin nhắn...</Typography>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Suggestions */}
          {messages[messages.length - 1]?.suggestions && !loading && (
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)', background: '#f8f9fa' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5, color: '#666' }}>💡 Gợi ý cho bạn:</Typography>
              <Box 
  sx={{ 
    display: 'grid', 
    gridTemplateRows: 'repeat(2, min-content)', // Quy định cứng 2 dòng
    gridAutoFlow: 'column',    // Dàn các phần tử theo cột (để tràn sang ngang)
    gap: 1.5,                  // Khoảng cách giữa các chip
    overflowX: 'auto',         // Bật thanh cuộn ngang
    py: 0.5,                   // Padding dọc nhỏ để không bị cắt shadow
    px: 0.5,
    // Tùy chỉnh thanh cuộn cho đẹp (mảnh và mờ)
    '&::-webkit-scrollbar': { height: '4px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    scrollBehavior: 'smooth'
  }}
>
  {messages[messages.length - 1].suggestions?.map((suggestion, index) => (
    <Chip
      key={index}
      label={suggestion}
      onClick={() => handleSuggestionClick(suggestion)}
      sx={{
        background: 'white',
        border: '1px solid #e0e0e0',
        whiteSpace: 'nowrap', // <--- QUAN TRỌNG: Giữ text trên 1 dòng
        '&:hover': { 
          background: gradients.primary, 
          color: 'white', 
          border: 'none', // Sửa border thành none để tránh nhảy layout
          transform: 'translateY(-2px)', 
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
        },
        transition: 'all 0.3s ease',
      }}
    />
  ))}
</Box>
            </Box>
          )}

          {/* Input */}
          <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)', background: 'white' }}>
            {error && (<Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>)}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                inputRef={inputRef}
                fullWidth
                multiline
                maxRows={4}
                placeholder="Nhập câu hỏi của bạn về du lịch..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    background: '#f8f9fa',
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': { border: `2px solid ${brandColors.primary}` },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                sx={{
                  minWidth: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: gradients.primary,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  '&:hover': { background: gradients.primary, opacity: 0.9, boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)', transform: 'translateY(-2px)' },
                  '&:disabled': { background: '#ccc' },
                  transition: 'all 0.3s ease',
                }}
              >
                <Send />
              </Button>
            </Box>
          </Box>
        </Paper>
      </Drawer>
    </>
  );
};

export default AIBot;