// fileName: TravelAdvisorSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Star,
  Hotel,
  Utensils,
  Coffee,
  Loader2,
  SlidersHorizontal,
  Heart,
  Share2,
  Navigation,
  TrendingUp,
  ChevronDown,
  Sparkles,
  Map,
  Award,
  X,
} from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  alpha,
} from '@mui/material';
import { gradients, brandColors } from '../theme/branding';

type Prediction = {
  description: string;
  secondary_description?: string;
  locationId: string;
  resultType: string;
};

type Place = {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  lat?: number | null;
  lng?: number | null;
  photo?: string | null;
  types?: string[];
};

const typesOptions = [
  { value: 'hotels', label: 'Khách sạn', icon: Hotel, gradient: 'linear-gradient(135deg, #5B5CEB 0%, #7C3AED 100%)' },
  { value: 'restaurants', label: 'Nhà hàng', icon: Utensils, gradient: 'linear-gradient(135deg, #FF8A65 0%, #FFB347 100%)' },
  // { value: 'attractions', label: 'Khu vui chơi', icon: Map, gradient: 'linear-gradient(135deg, #2BB0ED 0%, #5B5CEB 100%)' },
];

export default function TravelAdvisorSearch() {
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Prediction | null>(null);
  const [locationOptions, setLocationOptions] = useState<Prediction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('hotels');
  const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!locationInput || locationInput.length < 2) {
      setLocationOptions([]);
      return;
    }
    
    setLoadingAutocomplete(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/places/autocomplete?q=${encodeURIComponent(locationInput)}`);
        if (!response.ok) throw new Error('Lỗi khi gọi API autocomplete');
        const data = await response.json();
        setLocationOptions(data || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
        setLocationOptions([]);
      } finally {
        setLoadingAutocomplete(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput]);

  const fetchPlaces = async (locationId: string, type: string) => {
    setLoadingData(true);
    setError('');
    setPlaces([]);

    const coords = locationId.split(',');
    if (coords.length !== 2) {
        setError('Lỗi: Mã locationId không hợp lệ.');
        setLoadingData(false);
        return;
    }
    const lat = coords[0];
    const lng = coords[1];
    
    const radius = 2000;
    const url = `${process.env.REACT_APP_API_URL}/places/nearby/${type}?lat=${lat}&lng=${lng}&radius=${radius}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error('Lỗi khi tìm kiếm địa điểm');
      }
      
      let data: Place[] = await response.json();

      const filteredPlaces = data.filter(place => 
        (place.rating || 0) >= minRating
      );
      
      setPlaces(filteredPlaces); 
      
      if (data.length === 0) {
        setError(`Không tìm thấy ${typesOptions.find(t => t.value === type)?.label.toLowerCase()} nào tại địa điểm này.`);
      } else if (filteredPlaces.length === 0 && minRating > 0) {
        setError(`Không có ${typesOptions.find(t => t.value === type)?.label.toLowerCase()} nào nào đạt ${minRating}+ sao (Lưu ý: OpenStreetMap không cung cấp dữ liệu đánh giá).`);
      }

    } catch (err) {
      setError('Lỗi khi tìm địa điểm. Vui lòng thử lại.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSearchButtonClick = () => {
    if (!selectedLocation) {
      setError('Vui lòng chọn một địa điểm từ danh sách gợi ý.');
      return;
    }
    setError('');
    fetchPlaces(selectedLocation.locationId, selectedCategory);
  };

  const handleSelectLocation = (location: Prediction) => {
    setSelectedLocation(location);
    setLocationInput(location.description);
    setShowDropdown(false);
    setError('');
  };

  const handleClearLocation = () => {
    setLocationInput('');
    setSelectedLocation(null);
    setShowDropdown(false);
    setError('');
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (locationOptions.length > 0) {
      setShowDropdown(true);
    }
  };

  const toggleFavorite = (placeId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(placeId)) {
        newFavorites.delete(placeId);
      } else {
        newFavorites.add(placeId);
      }
      return newFavorites;
    });
  };

  const handleRatingFilterChange = (rating: number) => {
    setMinRating(rating);
    if (selectedLocation) {
        fetchPlaces(selectedLocation.locationId, selectedCategory);
    }
  };

  const currentTypeOption = typesOptions.find(t => t.value === selectedCategory);
  const CurrentIcon = currentTypeOption?.icon || Hotel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Header rewritten with MUI */}
      <Box
        sx={{
          position: 'relative',
          background: gradients.primary,
          color: '#fff',
          py: { xs: 3, md: 3 },
          // === SỬA LỖI BỊ CHE (THAY ĐỔI 1) ===
          overflow: 'visible',
          boxShadow: '0 40px 80px rgba(91, 92, 235, 0.25)',
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
          <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 2 } }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 2,
                lineHeight: 1.2,
              }}
            >
              Tìm kiếm địa điểm
            </Typography>
            <Typography variant="h6" sx={{ color: alpha('#fff', 0.85), maxWidth: 640, mx: 'auto' }}>
              Khám phá hàng nghìn khách sạn, nhà hàng và khu vui chơi được đánh giá cao
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              p: { xs: 2.5, md: 4 },
              background: 'rgba(255,255,255,0.98)',
              boxShadow: '0 30px 80px rgba(15, 23, 42, 0.25)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
                gap: { xs: 2.5, md: 3 },
                alignItems: 'flex-start', // === SỬA LỖI LAYOUT LỆCH ===
              }}
            >
              {/* === CỘT 1: ĐỊA ĐIỂM === */}
              <Box ref={dropdownRef}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                  Địa điểm <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    if (!e.target.value) {
                      setSelectedLocation(null);
                      setLocationOptions([]);
                    }
                  }}
                  onFocus={handleInputFocus}
                  placeholder="Nhập tên thành phố hoặc địa điểm..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MapPin size={18} color={brandColors.primary} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {loadingAutocomplete ? (
                          <Loader2 className="animate-spin" size={18} color={brandColors.primary} />
                        ) : locationInput ? (
                          <IconButton size="small" onClick={handleClearLocation}>
                            <X size={16} />
                          </IconButton>
                        ) : null}
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      // === SỬA KIỂU DÁNG (THAY ĐỔI 2) ===
                      borderRadius: '50px',
                      backgroundColor: alpha(brandColors.primary, selectedLocation ? 0.05 : 0.02),
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: selectedLocation ? brandColors.success : alpha('#000', 0.15),
                      },
                    },
                  }}
                />
                {selectedLocation && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: brandColors.success }} />
                    <Typography variant="caption" sx={{ color: brandColors.success, fontWeight: 600 }}>
                      Đã chọn: {selectedLocation.description}
                    </Typography>
                  </Box>
                )}

                {showDropdown && locationOptions.length > 0 && (
                  <Paper
                    elevation={6}
                    sx={{
                      position: 'absolute',
                      mt: 1,
                      width: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha(brandColors.primary, 0.2)}`,
                      maxHeight: 320,
                      overflowY: 'auto',
                      // === SỬA LỖI BỊ CHE (THAY ĐỔI 3) ===
                      zIndex: 1100,
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1.25,
                        background: alpha(brandColors.primary, 0.08),
                        borderBottom: `1px solid ${alpha(brandColors.primary, 0.1)}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {locationOptions.length} địa điểm tìm thấy
                      </Typography>
                    </Box>
                    {locationOptions.map((opt, index) => (
                      <Box
                        key={`${opt.locationId}-${index}`}
                        onClick={() => handleSelectLocation(opt)}
                        sx={{
                          px: 2.5,
                          py: 1.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          bgcolor:
                            selectedLocation?.locationId === opt.locationId
                              ? alpha(brandColors.primary, 0.1)
                              : 'transparent',
                          '&:hover': {
                            backgroundColor: alpha(brandColors.primary, 0.06),
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            background: alpha(brandColors.primary, 0.12),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: brandColors.primary,
                          }}
                        >
                          <MapPin size={18} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {opt.description}
                          </Typography>
                          {opt.secondary_description && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {opt.secondary_description}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: 'inline-flex',
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
                              mt: 0.5,
                              backgroundColor: alpha(brandColors.primary, 0.1),
                              color: brandColors.primary,
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {opt.resultType}
                          </Box>
                        </Box>
                        {selectedLocation?.locationId === opt.locationId && (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: brandColors.success,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: 12,
                            }}
                          >
                            ✓
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Paper>
                )}

                {showDropdown && !loadingAutocomplete && locationInput && locationOptions.length === 0 && (
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'absolute',
                      mt: 1,
                      width: '100%',
                      borderRadius: 3,
                      border: `1px solid ${alpha('#000', 0.1)}`,
                      p: 2,
                      zIndex: 1100, // Thêm zIndex cả ở đây
                    }}
                  >
                    <Typography variant="body2" align="center" color="text.secondary">
                      Không tìm thấy địa điểm phù hợp
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* === BẮT ĐẦU BOX BỌC (LOẠI HÌNH + TÌM) === */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' }, 
                gap: 3, 
                alignItems: 'flex-end' 
              }}>

                {/* === CỘT 2: LOẠI HÌNH === */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    Loại hình <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${typesOptions.length}, 1fr)`,
                      gap: 1,
                    }}
                  >
                    {typesOptions.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedCategory === type.value;
                      return (
                        <Button
                          key={type.value}
                          onClick={() => setSelectedCategory(type.value)}
                          sx={{
                            // === SỬA KIỂU DÁNG (THAY ĐỔI 4) ===
                            height: 56,
                            // width: 56, // Đã xóa
                            // minWidth: 56, // Đã xóa
                            borderRadius: '50px', // Đã thay đổi
                            // flexDirection: 'column', // Đã xóa
                            // gap: 1, // Đã xóa
                            px: 3.5, // Đã thêm
                            color: isSelected ? '#fff' : 'text.secondary',
                            background: isSelected ? type.gradient : alpha('#0F172A', 0.04),
                            border: isSelected ? 'none' : `1px solid ${alpha('#0F172A', 0.08)}`,
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              background: isSelected ? type.gradient : alpha('#0F172A', 0.08),
                            },
                          }}
                        >
                          {/* === SỬA KIỂU DÁNG (THAY ĐỔI 5) === */}
                          {/* <Icon size={20} /> // Đã xóa */}
                          {/* <Typography variant="caption" sx={{ fontWeight: 600 }}> // Đã xóa
                            {type.label}
                          </Typography> // Đã xóa */}
                          {type.label} {/* Đã thay đổi */}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>

                {/* === CỘT 3: NÚT TÌM === */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearchButtonClick}
                    disabled={loadingData || !selectedLocation}
                    startIcon={<Search size={18} />}
                    sx={{
                      // === SỬA KIỂU DÁNG (THAY ĐỔI 6) ===
                      borderRadius: '50px',
                      py: 0,
                      height: '56px',
                      background: gradients.primary,
                      fontWeight: 700,
                      fontSize: '1rem',
                      boxShadow: '0 10px 30px rgba(91,92,235,0.35)',
                      '&:hover': {
                        background: gradients.primary,
                        opacity: 0.9,
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        opacity: 0.6,
                        boxShadow: 'none',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Tìm
                  </Button>
                </Box>
              
              {/* === KẾT THÚC BOX BỌC === */}
              </Box> 

            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        
        {/* Stats & Filters Bar */}
        {/* === SỬA LỖI HIỂN THỊ THANH TRẮNG KHI LOADING === */}
        {places.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">              
              {places.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm">
                    Tìm thấy <span className="font-bold text-blue-600 text-lg">{places.length}</span> kết quả
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div>
                <p className="font-semibold text-red-800">Có lỗi xảy ra</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingData && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <CurrentIcon className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xl text-gray-700 font-semibold mt-6">
              Đang tìm kiếm {currentTypeOption?.label.toLowerCase()}...
            </p>
            <p className="text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
          </div>
        )}

        {/* Empty State - No results */}
        {!loadingData && places.length === 0 && selectedLocation && error && (
          <div className="text-center py-24">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <CurrentIcon className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-500 mb-6">
              Không có {currentTypeOption?.label.toLowerCase()} nào phù hợp với tiêu chí của bạn
            </p>
            <button
              onClick={() => handleRatingFilterChange(0)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
        
        {/* Empty State - Initial */}
        {!loadingData && places.length === 0 && !selectedLocation && !error && (
          <div className="text-center py-24">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Search className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Sẵn sàng khám phá
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Nhập tên thành phố hoặc địa điểm, chọn loại hình và bấm tìm kiếm
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loadingData && places.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {places.map((place) => (
              <div 
                key={place.place_id} 
                className="group bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
              >
                <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
                  {place.photo ? (
                    <img
                      src={place.photo}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CurrentIcon className="w-16 h-16 text-white/50"/>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => toggleFavorite(place.place_id)}
                      className="bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Heart 
                        className={`w-5 h-5 ${
                          favorites.has(place.place_id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                    <button className="bg-white/95 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  {place.rating && (
                    <div className="absolute bottom-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1">
                      <Star className="w-4 h-4 fill-white" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-3 leading-snug min-h-[3.5rem]">
                    {place.name}
                  </h3>
                  
                  <div className="flex items-start text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{place.vicinity || 'Không có địa chỉ'}</p>
                  </div>
                  
                  {place.rating && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-800">
                          {(place.user_ratings_total || 0).toLocaleString()}
                        </span>
                        <span>đánh giá</span>
                      </div>
                      <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                        <Navigation className="w-4 h-4" />
                        Chỉ đường
                      </button>
                    </div>
                  )}

                  {!place.rating && (
                     <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                      <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                        <Navigation className="w-4 h-4" />
                        Chỉ đường
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}