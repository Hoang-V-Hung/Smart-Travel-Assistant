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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
} from '@mui/material';
import Grid from '../components/Grid';
import PageHeader from '../components/PageHeader';
import {
  Add,
  FlightTakeoff,
  Place,
  CalendarToday,
  AttachMoney,
  People,
  TrendingUp,
  SmartToy,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  destinations: Array<{
    name: string;
    arrivalDate: string;
    departureDate: string;
  }>;
  travelers: Array<{
    name: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewTrip, setOpenNewTrip] = useState(false);
  const [newTrip, setNewTrip] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/trips', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(response.data.trips);
    } catch (err: any) {
      setError('Không thể tải danh sách chuyến du lịch');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(prev => prev.filter(t => t._id !== tripId));
    } catch (err: any) {
      setError('Không thể xóa chuyến du lịch');
    }
  };

  const handleCreateTrip = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/trips',
        {
          ...newTrip,
          budget: { total: parseInt(newTrip.budget), currency: 'VND' },
          destinations: [],
          travelers: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOpenNewTrip(false);
      setNewTrip({ title: '', description: '', startDate: '', endDate: '', budget: '' });
      fetchTrips();
    } catch (err: any) {
      setError('Không thể tạo chuyến du lịch mới');
    }
  };

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
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Quản lý các chuyến du lịch của bạn"
      />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <FlightTakeoff />
                </Avatar>
                <Box>
                  <Typography variant="h6">{trips.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chuyến du lịch
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Place />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {trips.reduce((acc, trip) => acc + trip.destinations.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Điểm đến
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {formatCurrency(
                      trips.reduce((acc, trip) => acc + trip.budget.spent, 0)
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã chi tiêu
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {trips.reduce((acc, trip) => acc + trip.travelers.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Người đi cùng
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Trips - Cards Grid */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Chuyến du lịch gần đây</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenNewTrip(true)}
                >
                  Tạo chuyến mới
                </Button>
              </Box>
              
              {trips.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Chưa có chuyến du lịch nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Hãy tạo chuyến du lịch đầu tiên của bạn
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenNewTrip(true)}
                  >
                    Tạo chuyến mới
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {trips.slice(0, 8).map((trip) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={trip._id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                                <FlightTakeoff />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                                  {trip.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={getStatusText(trip.status)}
                              color={getStatusColor(trip.status) as any}
                              size="small"
                              variant="outlined"
                            />
                          </Box>

                          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip size="small" variant="outlined" label={`${trip.destinations.length} điểm đến`} />
                            <Chip size="small" variant="outlined" label={`Ngân sách: ${formatCurrency(trip.budget.total || 0)}`} />
                            {trip.travelers?.length > 0 && (
                              <Chip size="small" variant="outlined" label={`${trip.travelers.length} người`} />
                            )}
                          </Box>

                          {/* <CardActions sx={{ mt: 1, p: 0, justifyContent: 'space-between' }}>
                            <Button size="small" onClick={() => navigate(`/trip-planner/${trip._id}`)}>
                              Xem chi tiết
                            </Button>
                            <Box>
                              <IconButton size="small" onClick={() => navigate(`/trip-planner/${trip._id}`)}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteTrip(trip._id)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardActions> */}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thao tác nhanh
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SmartToy />}
                    onClick={() => navigate('/ai-assistant')}
                  >
                    AI Assistant
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Place />}
                    onClick={() => navigate('/destinations')}
                  >
                    Khám phá điểm đến
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FlightTakeoff />}
                    onClick={() => navigate('/trip-planner')}
                  >
                    Lập kế hoạch
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUp />}
                    onClick={() => navigate('/destinations')}
                  >
                    Xu hướng du lịch
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenNewTrip(true)}
      >
        <Add />
      </Fab>

      {/* New Trip Dialog */}
      <Dialog open={openNewTrip} onClose={() => setOpenNewTrip(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo chuyến du lịch mới</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên chuyến du lịch"
            fullWidth
            variant="outlined"
            value={newTrip.title}
            onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTrip.description}
            onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Ngày bắt đầu"
                type="date"
                fullWidth
                variant="outlined"
                value={newTrip.startDate}
                onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Ngày kết thúc"
                type="date"
                fullWidth
                variant="outlined"
                value={newTrip.endDate}
                onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Ngân sách (VND)"
            type="number"
            fullWidth
            variant="outlined"
            value={newTrip.budget}
            onChange={(e) => setNewTrip({ ...newTrip, budget: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewTrip(false)}>Hủy</Button>
          <Button onClick={handleCreateTrip} variant="contained">
            Tạo
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default Dashboard;
