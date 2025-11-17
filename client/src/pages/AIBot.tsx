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
} from '@mui/material';
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
  FlightTakeoff,
  FlightLand,
  AccessTime,
  Attractions,
  LocationOn,
  AutoAwesome,
  Close, // Icon đóng
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
type FlightData = OneWayFlightData | RoundTripFlightData;


// --- COMPONENT CARD CHUYẾN BAY (Giữ nguyên) ---
const FlightCard: React.FC<{ flight: Flight }> = ({ flight }) => {
  const formatPrice = (price: number) => price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const formatTime = (isoDateString: string) => {
      try {
          return new Date(isoDateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'});
      } catch { return isoDateString; }
  }

  return (
    <Card sx={{ mb: 1.5, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #eee' }}>
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {flight.airline}
          </Typography>
          <Typography variant="h6" component="div" color="primary" sx={{ fontWeight: 700 }}>
            {formatPrice(flight.price)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightTakeoff fontSize="small" /><Typography variant="body1" sx={{ fontWeight: 500 }}>{formatTime(flight.departureTime)}</Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime fontSize="small" /><Typography variant="body2">{formatDuration(flight.duration)}</Typography></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightLand fontSize="small" /><Typography variant="body1" sx={{ fontWeight: 500 }}>{formatTime(flight.arrivalTime)}</Typography></Box>
        </Box>
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


const AIBot: React.FC = () => {
  // === THÊM MỚI: State để mở/đóng chat ===
  const [open, setOpen] = useState(false);

  // === Toàn bộ state từ AIAssistant.tsx được chuyển vào đây ===
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Xin chào! 👋 Tôi là trợ lý ảo du lịch của bạn. Tôi có thể giúp bạn:\n\n✈️ Lập kế hoạch du lịch chi tiết\n🗺️ Gợi ý điểm đến phù hợp\n🏨 Tìm khách sạn và nhà hàng\n💰 Tư vấn ngân sách\n🌤️ Thông tin thời tiết\n\nBạn muốn hỏi gì về chuyến du lịch của mình?',
      timestamp: new Date(),
      suggestions: [
        'Gợi ý điểm đến cho chuyến du lịch 3 ngày',
        'Lập kế hoạch du lịch Hà Nội',
        'Khách sạn tốt ở TP.HCM',
        'Món ăn ngon ở Đà Nẵng',
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
    // (Toàn bộ logic của handleSendMessage giữ nguyên y hệt)
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const messageToSend = inputMessage;
    setInputMessage('');
    setLoading(true);
    setTyping(true);
    setError('');
    try {
      const conversationHistory: ConversationHistoryItem[] = currentMessages
        .slice(0, -1)
        .map(msg => ({
          role: msg.type === 'ai' ? 'assistant' : 'user',
          content: msg.content,
        }));
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/ai/chat`,
        { 
          message: messageToSend,
          conversationHistory: conversationHistory 
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await new Promise(resolve => setTimeout(resolve, 500));
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
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

  const renderAiMessage = (content: string) => {
    // (Toàn bộ logic của renderAiMessage giữ nguyên y hệt)
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch && jsonMatch[0]) {
        const jsonDataString = jsonMatch[0];
        const data: FlightData = JSON.parse(jsonDataString);
        switch (data.type) {
          case 'flight_results':
            return (
              <>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{data.summary}</Typography>
                {data.flights.map((flight, index) => (<FlightCard key={index} flight={flight} />))}
              </>
            );
          case 'roundtrip_flight_results':
            return (
              <>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{data.summary}</Typography>
                {data.flights.map((flight, index) => (<RoundTripFlightCard key={index} flight={flight} />))}
              </>
            );
          default:
            break;
        }
      }
    } catch (e) {
      console.error("Lỗi khi render tin nhắn AI:", e);
    }
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
        {content}
      </Typography>
    );
  };

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
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {messages[messages.length - 1].suggestions?.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      background: 'white',
                      border: '1px solid #e0e0e0',
                      '&:hover': { background: gradients.primary, color: 'white', border: 'none', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'},
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