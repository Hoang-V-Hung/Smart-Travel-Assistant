import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import Grid from '../components/Grid';
import PageHeader from '../components/PageHeader';
import {
  Add,
  Place,
  CalendarToday,
  AttachMoney,
  People,
  Delete,
  Edit,
  FlightTakeoff,
  Directions,
} from '@mui/icons-material';
import { Email, Phone } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Interface cho một điểm đến trong kế hoạch chuyến đi
interface TripDestination {
  _id?: string;
  name: string;
  arrivalDate: string;
  departureDate: string;
  accommodation?: {
    name: string;
    address: string;
    price: number;
  };
  activities: Array<{
    name: string;
    description: string;
    time: string;
    cost: number;
  }>;
}

// Interface cho kết quả tìm kiếm điểm đến từ DB
interface DBSearchResult {
  _id: string;
  name: string;
  city: string;
  country: string;
}


const TripPlanner: React.FC = () => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDestinationDialog, setOpenDestinationDialog] = useState(false);
  const [editingDestination, setEditingDestination] = useState<TripDestination | null>(null);
  const [newDestination, setNewDestination] = useState<TripDestination>({
    name: '',
    arrivalDate: '',
    departureDate: '',
    activities: [],
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
  const navigate = useNavigate();

  // State cho Autocomplete tìm kiếm
  const [openSearch, setOpenSearch] = useState(false);
  const [searchOptions, setSearchOptions] = useState<readonly DBSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const steps = [
    'Thông tin cơ bản',
    'Thêm người đi cùng',
    'Chọn điểm đến',
    'Lập lịch trình',
    'Xem lại & Hoàn tất',
  ];

  const validateStep = (step: number) => {
    const errors: { [k: string]: string } = {};
    if (step === 0) {
      if (!tripData.title) errors.title = 'Vui lòng nhập tên chuyến du lịch';
      if (!tripData.startDate) errors.startDate = 'Vui lòng chọn ngày bắt đầu';
      if (!tripData.endDate) errors.endDate = 'Vui lòng chọn ngày kết thúc';
      if (tripData.startDate && tripData.endDate && new Date(tripData.endDate) < new Date(tripData.startDate)) {
        errors.dateRange = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    if (step === 2) {
      if (destinations.length === 0) errors.destinations = 'Hãy thêm ít nhất 1 điểm đến';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleTripDataChange = (field: string, value: any) => {
    setTripData({ ...tripData, [field]: value });
  };

  const handleTravelerChange = (index: number, field: string, value: string) => {
    const newTravelers = [...tripData.travelers];
    newTravelers[index] = { ...newTravelers[index], [field]: value };
    setTripData({ ...tripData, travelers: newTravelers });
  };

  const addTraveler = () => {
    setTripData({
      ...tripData,
      travelers: [...tripData.travelers, { name: '', email: '', phone: '' }],
    });
  };

  const removeTraveler = (index: number) => {
    const newTravelers = tripData.travelers.filter((_, i) => i !== index);
    setTripData({ ...tripData, travelers: newTravelers });
  };

  const handleAddDestination = () => {
    setEditingDestination(null);
    setNewDestination({
      name: '',
      arrivalDate: '',
      departureDate: '',
      activities: [],
    });
    setOpenDestinationDialog(true);
  };

  const handleEditDestination = (destination: TripDestination) => {
    setEditingDestination(destination);
    setNewDestination(destination);
    setOpenDestinationDialog(true);
  };

  const handleSaveDestination = () => {
    if (!newDestination.name || !newDestination.arrivalDate || !newDestination.departureDate) {
      // Có thể thêm thông báo lỗi cho người dùng ở đây
      return;
    }
    if (new Date(newDestination.departureDate) < new Date(newDestination.arrivalDate)) {
      // Có thể thêm thông báo lỗi cho người dùng ở đây
      return;
    }
    if (editingDestination) {
      const updatedDestinations = destinations.map((dest) =>
        dest === editingDestination ? newDestination : dest
      );
      setDestinations(updatedDestinations);
    } else {
      setDestinations([...destinations, newDestination]);
    }
    setOpenDestinationDialog(false);
  };

  const handleRemoveDestination = (index: number) => {
    const updatedDestinations = destinations.filter((_, i) => i !== index);
    setDestinations(updatedDestinations);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/trips',
        {
          ...tripData,
          budget: { total: parseInt(tripData.budget), currency: 'VND' },
          destinations,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError('Không thể tạo chuyến du lịch');
    } finally {
      setLoading(false);
    }
  };

  const getTripDurationDays = () => {
    if (!tripData.startDate || !tripData.endDate) return 0;
    const start = new Date(tripData.startDate).getTime();
    const end = new Date(tripData.endDate).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  };

  const getEstimatedCost = () => destinations.reduce((sum, d) => sum + (d.activities || []).reduce((a, act) => a + (act.cost || 0), 0), 0);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Tên chuyến du lịch"
                value={tripData.title}
                onChange={(e) => handleTripDataChange('title', e.target.value)}
                placeholder="VD: Hành trình khám phá Đà Nẵng"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlightTakeoff />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Mô tả"
                multiline
                rows={3}
                value={tripData.description}
                onChange={(e) => handleTripDataChange('description', e.target.value)}
                placeholder="Mục tiêu chuyến đi, phong cách, kỳ vọng..."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Ngày bắt đầu"
                type="date"
                value={tripData.startDate}
                onChange={(e) => handleTripDataChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Ngày kết thúc"
                type="date"
                value={tripData.endDate}
                onChange={(e) => handleTripDataChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Ngân sách (VND)"
                type="number"
                value={tripData.budget}
                onChange={(e) => handleTripDataChange('budget', e.target.value)}
                placeholder="VD: 10000000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Người đi cùng
            </Typography>
            {tripData.travelers.map((traveler, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Họ tên"
                        value={traveler.name}
                        onChange={(e) => handleTravelerChange(index, 'name', e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={traveler.email}
                        onChange={(e) => handleTravelerChange(index, 'email', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email />
                            </InputAdornment>
                          )
                        }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Số điện thoại"
                        value={traveler.phone}
                        onChange={(e) => handleTravelerChange(index, 'phone', e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone />
                            </InputAdornment>
                          )
                        }}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {tripData.travelers.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => removeTraveler(index)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addTraveler}
            >
              Thêm người đi cùng
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Điểm đến</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddDestination}
              >
                Thêm điểm đến
              </Button>
            </Box>
            {destinations.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Chưa có điểm đến nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hãy thêm điểm đến đầu tiên cho chuyến du lịch của bạn
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {destinations.map((destination, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {destination.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(destination.arrivalDate).toLocaleDateString('vi-VN')} -{' '}
                              {new Date(destination.departureDate).toLocaleDateString('vi-VN')}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleEditDestination(destination)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveDestination(index)}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Lịch trình chi tiết (Tùy chọn)
            </Typography>
            {destinations.map((destination, index) => (
              <Card key={index} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {destination.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {new Date(destination.arrivalDate).toLocaleDateString('vi-VN')} -{' '}
                    {new Date(destination.departureDate).toLocaleDateString('vi-VN')}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Xem lại thông tin
            </Typography>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {tripData.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {tripData.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<CalendarToday />}
                    label={`${new Date(tripData.startDate).toLocaleDateString('vi-VN')} - ${new Date(tripData.endDate).toLocaleDateString('vi-VN')}`}
                  />
                  <Chip
                    icon={<AttachMoney />}
                    label={`${parseInt(tripData.budget || '0').toLocaleString('vi-VN')} VND`}
                  />
                  <Chip
                    icon={<People />}
                    label={`${tripData.travelers.length} người`}
                  />
                </Box>
              </CardContent>
            </Card>

            <Typography variant="h6" gutterBottom>
              Điểm đến ({destinations.length})
            </Typography>
            {destinations.map((destination, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{destination.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(destination.arrivalDate).toLocaleDateString('vi-VN')} -{' '}
                    {new Date(destination.departureDate).toLocaleDateString('vi-VN')}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        title="Lập kế hoạch du lịch"
        subtitle="Thiết kế hành trình, điểm đến, hoạt động và ngân sách"
      />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3, minHeight: '400px' }}>
              {Object.values(formErrors).length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {Object.values(formErrors)[0]}
                </Alert>
              )}
              {renderStepContent(activeStep)}
            </Paper>

            <Paper sx={{ p: 2, position: 'sticky', bottom: 16, zIndex: 10 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Quay lại
                </Button>
                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                  disabled={loading}
                >
                  {activeStep === steps.length - 1 ? 'Hoàn tất' : 'Tiếp theo'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" gutterBottom>
                Tóm tắt chuyến đi
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip icon={<CalendarToday />} label={`${getTripDurationDays()} ngày`} />
                <Chip icon={<Place />} label={`${destinations.length} điểm đến`} />
                <Chip icon={<People />} label={`${tripData.travelers.length} người`} />
                {tripData.budget && (
                  <Chip icon={<AttachMoney />} label={`${parseInt(tripData.budget || '0', 10).toLocaleString('vi-VN')} VND`} />
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Điểm đến
              </Typography>
              <List dense>
                {destinations.length === 0 && (
                  <ListItem>
                    <ListItemText primary="Chưa có điểm đến" secondary="Thêm điểm đến ở bước 3" />
                  </ListItem>
                )}
                {destinations.map((d, i) => (
                  <ListItem key={`${d.name}-${i}`}>
                    <ListItemIcon>
                      <Place />
                    </ListItemIcon>
                    <ListItemText
                      primary={d.name}
                      secondary={`${new Date(d.arrivalDate).toLocaleDateString('vi-VN')} - ${new Date(d.departureDate).toLocaleDateString('vi-VN')}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Ước tính chi phí hoạt động
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {getEstimatedCost().toLocaleString('vi-VN')} VND
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Dialog
          open={openDestinationDialog}
          onClose={() => setOpenDestinationDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingDestination ? 'Chỉnh sửa điểm đến' : 'Thêm điểm đến'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  id="destination-search-autocomplete"
                  open={openSearch}
                  onOpen={() => setOpenSearch(true)}
                  onClose={() => setOpenSearch(false)}
                  isOptionEqualToValue={(option, value) => option.name === value.name}
                  getOptionLabel={(option) => option.name || ''}
                  options={searchOptions}
                  loading={searchLoading}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setNewDestination({ ...newDestination, name: newValue.name });
                    }
                  }}
                  onInputChange={(event, newInputValue) => {
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    if (newInputValue.length < 2) {
                      setSearchOptions([]);
                      return;
                    }
                    searchTimeoutRef.current = setTimeout(async () => {
                      setSearchLoading(true);
                      try {
                        const response = await axios.get(
                          `http://localhost:5000/api/destinations/search?q=${newInputValue}`
                        );
                        setSearchOptions(response.data.destinations || []);
                      } catch (apiError) {
                        console.error("Lỗi khi tìm kiếm điểm đến:", apiError);
                        setSearchOptions([]);
                      } finally {
                        setSearchLoading(false);
                      }
                    }, 500);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tìm kiếm tên điểm đến..."
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option._id}>
                      {option.name} ({option.city})
                    </Box>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ngày đến"
                  type="date"
                  value={newDestination.arrivalDate}
                  onChange={(e) => setNewDestination({ ...newDestination, arrivalDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Ngày đi"
                  type="date"
                  value={newDestination.departureDate}
                  onChange={(e) => setNewDestination({ ...newDestination, departureDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDestinationDialog(false)}>Hủy</Button>
            <Button onClick={handleSaveDestination} variant="contained">
              Lưu
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default TripPlanner;