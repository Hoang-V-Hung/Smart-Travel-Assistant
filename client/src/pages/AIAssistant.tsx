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
  FlightTakeoff, // Giữ lại icon này
  FlightLand,     // Icon mới
  AccessTime,     // Icon mới
  Attractions,
  LocationOn,
  AutoAwesome,
} from '@mui/icons-material';
import axios from 'axios';
import { gradients, brandColors } from '../theme/branding';

// --- CÁC INTERFACE CŨ VÀ MỚI ---
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

// Interface cho dữ liệu chuyến bay MỘT CHIỀU
interface Flight {
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
}

// Interface cho chi tiết một chặng bay (đi hoặc về)
interface RoundTripFlightDetail {
    airline: string;
    departureTime: string;
    arrivalTime: string;
    duration: number;
}

// Interface cho toàn bộ thông tin một lựa chọn khứ hồi
interface RoundTripFlight {
    price: number;
    departureFlight: RoundTripFlightDetail;
    returnFlight: RoundTripFlightDetail;
}

// Định nghĩa các loại dữ liệu trả về một cách tường minh (Discriminated Unions)
interface OneWayFlightData {
  type: 'flight_results';
  summary: string;
  flights: Flight[]; // Mảng này CHẮC CHẮN chỉ chứa Flight
}

interface RoundTripFlightData {
  type: 'roundtrip_flight_results';
  summary: string;
  flights: RoundTripFlight[]; // Mảng này CHẮC CHẮN chỉ chứa RoundTripFlight
}

// Kiểu dữ liệu cuối cùng là 1 trong 2 loại trên
type FlightData = OneWayFlightData | RoundTripFlightData;





// --- COMPONENT MỚI ĐỂ RENDER CARD CHUYẾN BAY ---
const FlightCard: React.FC<{ flight: Flight }> = ({ flight }) => {
  // Hàm định dạng giá tiền sang VNĐ
  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // Hàm chuyển đổi phút sang "Xh Ym"
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };
  
  // Hàm chỉ lấy giờ và phút từ chuỗi ISO date
  const formatTime = (isoDateString: string) => {
      try {
          return new Date(isoDateString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'});
      } catch {
          return isoDateString; // Trả về chuỗi gốc nếu không parse được
      }
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlightTakeoff fontSize="small" />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatTime(flight.departureTime)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime fontSize="small" />
            <Typography variant="body2">{formatDuration(flight.duration)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlightLand fontSize="small" />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatTime(flight.arrivalTime)}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const RoundTripFlightCard: React.FC<{ flight: RoundTripFlight }> = ({ flight }) => {
    // Tái sử dụng các hàm format hữu ích
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
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                        Tổng giá vé khứ hồi
                    </Typography>
                    <Typography variant="h5" component="div" color="primary" sx={{ fontWeight: 700 }}>
                        {formatPrice(flight.price)}
                    </Typography>
                </Box>
                
                {/* Chuyến bay đi */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    ✈️ Chiều đi: {flight.departureFlight.airline} - {formatDateFromISO(flight.departureFlight.departureTime)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary', mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightTakeoff /><Typography>{formatTimeFromISO(flight.departureFlight.departureTime)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime /><Typography>{formatDuration(flight.departureFlight.duration)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightLand /><Typography>{formatTimeFromISO(flight.departureFlight.arrivalTime)}</Typography></Box>
                </Box>

                {/* Chuyến bay về */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    ✈️ Chiều về: {flight.returnFlight.airline} - {formatDateFromISO(flight.returnFlight.departureTime)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightTakeoff /><Typography>{formatTimeFromISO(flight.returnFlight.departureTime)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AccessTime /><Typography>{formatDuration(flight.returnFlight.duration)}</Typography></Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FlightLand /><Typography>{formatTimeFromISO(flight.returnFlight.arrivalTime)}</Typography></Box>
                </Box>
            </CardContent>
        </Card>
    );
};



const AIAssistant: React.FC = () => {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

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
    // Nếu nội dung là JSON, chỉ copy phần tóm tắt
    try {
        const data: FlightData = JSON.parse(content);
        if (data && data.type === 'flight_results') {
            navigator.clipboard.writeText(data.summary);
            return;
        }
    } catch (e) {
        // Bỏ qua lỗi và copy như bình thường
    }
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  // --- [THÊM MỚI] HÀM RENDER NỘI DUNG AI ---
  const renderAiMessage = (content: string) => {
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);

      // Kiểm tra nếu tìm thấy kết quả và lấy ra chuỗi JSON ở phần tử đầu tiên
      if (jsonMatch && jsonMatch[0]) {
        // [SỬA LỖI Ở ĐÂY] Chỉ parse chuỗi jsonMatch[0], không phải cả mảng jsonMatch
        const jsonDataString = jsonMatch[0];
        const data: FlightData = JSON.parse(jsonDataString);
        
        // Dùng switch case dựa trên 'type' để render đúng component
        // TypeScript bây giờ đủ thông minh để hiểu kiểu dữ liệu trong mỗi case
        switch (data.type) {
          case 'flight_results':
            return (
              <>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {data.summary}
                </Typography>
                {data.flights.map((flight, index) => (
                  <FlightCard key={index} flight={flight} />
                ))}
              </>
            );

          case 'roundtrip_flight_results':
            return (
              <>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {data.summary}
                </Typography>
                {data.flights.map((flight, index) => (
                  <RoundTripFlightCard key={index} flight={flight} />
                ))}
              </>
            );

          default:
            break;
        }
      }
    } catch (e) {
      console.error("Lỗi khi render tin nhắn AI:", e);
    }
    
    // Fallback cho mọi trường hợp lỗi hoặc không tìm thấy JSON
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
        {content}
      </Typography>
    );
  };

  const quickActions = [
    {
      title: 'Lập kế hoạch du lịch',
      description: 'Tạo lịch trình chi tiết cho chuyến đi',
      icon: <TravelExplore sx={{ fontSize: 28 }} />,
      color: brandColors.primary,
      action: () => handleSuggestionClick('Lập kế hoạch du lịch cho tôi'),
    },
    {
      title: 'Gợi ý điểm đến',
      description: 'Tìm điểm đến phù hợp với sở thích',
      icon: <LocationOn sx={{ fontSize: 28 }} />,
      color: brandColors.accent,
      action: () => handleSuggestionClick('Gợi ý điểm đến phù hợp với tôi'),
    },
    {
      title: 'Tìm khách sạn',
      description: 'Tìm khách sạn tốt nhất cho bạn',
      icon: <Hotel sx={{ fontSize: 28 }} />,
      color: brandColors.secondary,
      action: () => handleSuggestionClick('Tìm khách sạn tốt'),
    },
    {
      title: 'Nhà hàng & Ẩm thực',
      description: 'Khám phá món ăn địa phương',
      icon: <Restaurant sx={{ fontSize: 28 }} />,
      color: brandColors.warning,
      action: () => handleSuggestionClick('Gợi ý nhà hàng ngon'),
    },
    {
      title: 'Tư vấn ngân sách',
      description: 'Tính toán chi phí du lịch',
      icon: <Schedule sx={{ fontSize: 28 }} />,
      color: brandColors.success,
      action: () => handleSuggestionClick('Tư vấn ngân sách du lịch'),
    },
    {
      title: 'Điểm tham quan',
      description: 'Khám phá các địa điểm nổi tiếng',
      icon: <Attractions sx={{ fontSize: 28 }} />,
      color: brandColors.accent,
      action: () => handleSuggestionClick('Gợi ý điểm tham quan'),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: gradients.primary,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0, // 'inset: 0' thay thế cho top, left, right, bottom: 0
      opacity: 0.1,
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      pointerEvents: 'none',
    },
      }}
    >
      <Box
        sx={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: { xs: 2, md: 4 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 4, color: 'white' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '12px 24px',
                borderRadius: '50px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <AutoAwesome sx={{ fontSize: 32, color: '#FFD700' }} />
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, background: 'linear-gradient(45deg, #fff, #f0f0f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Trợ Lý Ảo Du Lịch
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
              Trải nghiệm du lịch thông minh với AI
            </Typography>
          </Box>
        </Fade>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 3, maxHeight: 'calc(100vh - 200px)' }}>
          {/* Chat Interface */}
          <Slide direction="right" in timeout={600}>
            <Paper
              elevation={24}
              sx={{
                height: { xs: 'calc(100vh - 300px)', md: 'calc(100vh - 200px)' },
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 3,
                  background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' },
                  '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '10px', '&:hover': { background: '#555' } },
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
                          {/* --- THAY ĐỔI DUY NHẤT TRONG JSX LÀ Ở ĐÂY --- */}
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
                    <Avatar sx={{ width: 48, height: 48, background: gradients.secondary }}>
                      <SmartToy />
                    </Avatar>
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
                          '&:hover': {
                            background: gradients.primary,
                            color: 'white',
                            border: 'none',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
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
                {error && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                    {error}
                  </Alert>
                )}
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
          </Slide>

          {/* Quick Actions Sidebar */}
          <Slide direction="left" in timeout={800}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: { xs: 'auto', lg: 'calc(100vh - 200px)' },
                overflow: 'auto',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.3)', borderRadius: '10px' },
              }}
            >
              <Paper
                elevation={24}
                sx={{
                  p: 3,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Lightbulb sx={{ color: '#FFD700', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Thao tác nhanh</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr' }, gap: 2 }}>
                  {quickActions.map((action, index) => (
                    <Fade key={index} in timeout={600} style={{ transitionDelay: `${index * 100}ms` }}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          borderRadius: '16px',
                          border: '1px solid rgba(0,0,0,0.08)',
                          transition: 'all 0.3s ease',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${alpha(action.color, 0.3)}`, border: `2px solid ${action.color}` },
                        }}
                        onClick={action.action}
                      >
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: `linear-gradient(135deg, ${action.color}15, ${action.color}30)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: action.color }}>
                              {action.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>{action.title}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>{action.description}</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Fade>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Slide>
        </Box>
      </Box>
    </Box>
  );
};

export default AIAssistant;