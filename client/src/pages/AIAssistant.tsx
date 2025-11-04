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
  FlightTakeoff,
  Attractions,
  LocationOn,
  AutoAwesome,
} from '@mui/icons-material';
import axios from 'axios';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

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

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setLoading(true);
    setTyping(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/ai/chat',
        { message: messageToSend },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Simulate typing delay for better UX
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
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`);
  };

  const quickActions = [
    {
      title: 'Lập kế hoạch du lịch',
      description: 'Tạo lịch trình chi tiết cho chuyến đi',
      icon: <TravelExplore sx={{ fontSize: 28 }} />,
      color: '#FF6B6B',
      action: () => handleSuggestionClick('Lập kế hoạch du lịch cho tôi'),
    },
    {
      title: 'Gợi ý điểm đến',
      description: 'Tìm điểm đến phù hợp với sở thích',
      icon: <LocationOn sx={{ fontSize: 28 }} />,
      color: '#4ECDC4',
      action: () => handleSuggestionClick('Gợi ý điểm đến phù hợp với tôi'),
    },
    {
      title: 'Tìm khách sạn',
      description: 'Tìm khách sạn tốt nhất cho bạn',
      icon: <Hotel sx={{ fontSize: 28 }} />,
      color: '#45B7D1',
      action: () => handleSuggestionClick('Tìm khách sạn tốt'),
    },
    {
      title: 'Nhà hàng & Ẩm thực',
      description: 'Khám phá món ăn địa phương',
      icon: <Restaurant sx={{ fontSize: 28 }} />,
      color: '#FFA07A',
      action: () => handleSuggestionClick('Gợi ý nhà hàng ngon'),
    },
    {
      title: 'Tư vấn ngân sách',
      description: 'Tính toán chi phí du lịch',
      icon: <Schedule sx={{ fontSize: 28 }} />,
      color: '#96CEB4',
      action: () => handleSuggestionClick('Tư vấn ngân sách du lịch'),
    },
    {
      title: 'Điểm tham quan',
      description: 'Khám phá các địa điểm nổi tiếng',
      icon: <Attractions sx={{ fontSize: 28 }} />,
      color: '#FECA57',
      action: () => handleSuggestionClick('Gợi ý điểm tham quan'),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
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
          <Box
            sx={{
              textAlign: 'center',
              mb: 4,
              color: 'white',
            }}
          >
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
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #fff, #f0f0f0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Trợ Lý Ảo Du Lịch
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
              Trải nghiệm du lịch thông minh với AI
            </Typography>
          </Box>
        </Fade>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' },
            gap: 3,
            maxHeight: 'calc(100vh - 200px)',
          }}
        >
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
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '10px',
                    '&:hover': {
                      background: '#555',
                    },
                  },
                }}
              >
                {messages.map((message, index) => (
                  <Fade
                    key={message.id}
                    in
                    timeout={500}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        mb: 3,
                        flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          background:
                            message.type === 'user'
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        {message.type === 'user' ? (
                          <Person />
                        ) : (
                          <SmartToy />
                        )}
                      </Avatar>
                      <Box
                        sx={{
                          maxWidth: '75%',
                          position: 'relative',
                        }}
                      >
                        <Box
                          sx={{
                            background:
                              message.type === 'user'
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : '#ffffff',
                            color: message.type === 'user' ? 'white' : '#333',
                            padding: '16px 20px',
                            borderRadius:
                              message.type === 'user'
                                ? '20px 20px 4px 20px'
                                : '20px 20px 20px 4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border:
                              message.type === 'ai'
                                ? '1px solid rgba(0,0,0,0.05)'
                                : 'none',
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              lineHeight: 1.6,
                            }}
                          >
                            {message.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 1,
                              opacity: 0.7,
                              fontSize: '0.75rem',
                            }}
                          >
                            {message.timestamp.toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>

                        {message.type === 'ai' && (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.5,
                              mt: 1,
                              ml: 1,
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleCopyMessage(message.content)}
                              sx={{
                                background: '#f5f5f5',
                                '&:hover': { background: '#e0e0e0' },
                              }}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleFeedback(message.id, true)}
                              sx={{
                                background: '#f5f5f5',
                                '&:hover': { background: '#e8f5e9' },
                              }}
                            >
                              <ThumbUp fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleFeedback(message.id, false)}
                              sx={{
                                background: '#f5f5f5',
                                '&:hover': { background: '#ffebee' },
                              }}
                            >
                              <ThumbDown fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Fade>
                ))}

                {typing && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      }}
                    >
                      <SmartToy />
                    </Avatar>
                    <Box
                      sx={{
                        background: '#ffffff',
                        padding: '16px 20px',
                        borderRadius: '20px 20px 20px 4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Đang soạn tin nhắn...
                      </Typography>
                    </Box>
                  </Box>
                )}

                <div ref={messagesEndRef} />
              </Box>

              {/* Suggestions */}
              {messages[messages.length - 1]?.suggestions && !loading && (
                <Box
                  sx={{
                    p: 2,
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    background: '#f8f9fa',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5, color: '#666' }}>
                    💡 Gợi ý cho bạn:
                  </Typography>
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              <Box
                sx={{
                  p: 3,
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  background: 'white',
                }}
              >
                {error && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                    {error}
                  </Alert>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-end',
                  }}
                >
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
                        '& fieldset': {
                          border: 'none',
                        },
                        '&:hover fieldset': {
                          border: 'none',
                        },
                        '&.Mui-focused fieldset': {
                          border: '2px solid #667eea',
                        },
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
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: '#ccc',
                      },
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
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '10px',
                },
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
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                  }}
                >
                  <Lightbulb sx={{ color: '#FFD700', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Thao tác nhanh
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr' },
                    gap: 2,
                  }}
                >
                  {quickActions.map((action, index) => (
                    <Fade
                      key={index}
                      in
                      timeout={600}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <Card
                        sx={{
                          cursor: 'pointer',
                          borderRadius: '16px',
                          border: '1px solid rgba(0,0,0,0.08)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(action.color, 0.3)}`,
                            border: `2px solid ${action.color}`,
                          },
                        }}
                        onClick={action.action}
                      >
                        <CardContent
                          sx={{
                            p: 2.5,
                            '&:last-child': { pb: 2.5 },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              mb: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                background: `linear-gradient(135deg, ${action.color}15, ${action.color}30)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: action.color,
                              }}
                            >
                              {action.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600, mb: 0.5 }}
                              >
                                {action.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: '0.85rem' }}
                              >
                                {action.description}
                              </Typography>
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
