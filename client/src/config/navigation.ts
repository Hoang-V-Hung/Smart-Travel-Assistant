// Cấu hình navigation cho Smart Travel Assistant
// Dễ dàng thêm/sửa/xóa menu items và tích hợp API

export interface MenuItem {
  text: string;
  path: string;
  icon: React.ReactElement;
  auth: boolean;
  comingSoon?: boolean;
  description: string;
  apiIntegration?: {
    provider: string;
    status: 'ready' | 'in-progress' | 'planned';
    endpoint?: string;
  };
}

// Menu items hiện tại đã hoạt động
export const activeMenuItems: MenuItem[] = [
  {
    text: 'Trang chủ',
    path: '/',
    icon: null as any, // Sẽ được set trong component
    auth: false,
    description: 'Trang chủ với tổng quan về dịch vụ',
    apiIntegration: {
      provider: 'Internal',
      status: 'ready'
    }
  },
  {
    text: 'Dashboard',
    path: '/dashboard',
    icon: null as any,
    auth: true,
    description: 'Quản lý chuyến du lịch của bạn',
    apiIntegration: {
      provider: 'Internal',
      status: 'ready'
    }
  },
  {
    text: 'Lập kế hoạch',
    path: '/trip-planner',
    icon: null as any,
    auth: true,
    description: 'Tạo lịch trình du lịch thông minh',
    apiIntegration: {
      provider: 'Internal',
      status: 'ready'
    }
  },
  {
    text: 'Điểm đến',
    path: '/destinations',
    icon: null as any,
    auth: false,
    description: 'Khám phá các điểm đến hấp dẫn',
    apiIntegration: {
      provider: 'Internal',
      status: 'ready'
    }
  },
  {
    text: 'AI Assistant',
    path: '/ai-assistant',
    icon: null as any,
    auth: true,
    description: 'Trò chuyện với AI để được tư vấn',
    apiIntegration: {
      provider: 'OpenAI',
      status: 'ready',
      endpoint: '/api/ai/chat'
    }
  }
];

// Menu items sắp có (cần tích hợp API)
export const futureMenuItems: MenuItem[] = [
  {
    text: 'Vé máy bay',
    path: '/flights',
    icon: null as any,
    auth: true,
    comingSoon: true,
    description: 'Tìm kiếm và đặt vé máy bay',
    apiIntegration: {
      provider: 'Skyscanner',
      status: 'planned',
      endpoint: 'https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/'
    }
  },
  {
    text: 'Khách sạn',
    path: '/hotels',
    icon: null as any,
    auth: true,
    comingSoon: true,
    description: 'Đặt khách sạn và chỗ ở',
    apiIntegration: {
      provider: 'TripAdvisor',
      status: 'planned',
      endpoint: 'https://api.content.tripadvisor.com/api/v1/'
    }
  },
  {
    text: 'Bản đồ',
    path: '/map',
    icon: null as any,
    auth: true,
    comingSoon: true,
    description: 'Xem bản đồ và chỉ đường',
    apiIntegration: {
      provider: 'Google Maps',
      status: 'planned',
      endpoint: 'https://maps.googleapis.com/maps/api/'
    }
  },
  {
    text: 'Thời tiết',
    path: '/weather',
    icon: null as any,
    auth: true,
    comingSoon: true,
    description: 'Dự báo thời tiết cho điểm đến',
    apiIntegration: {
      provider: 'OpenWeatherMap',
      status: 'in-progress',
      endpoint: 'https://api.openweathermap.org/data/2.5/'
    }
  },
  {
    text: 'Đánh giá',
    path: '/reviews',
    icon: null as any,
    auth: true,
    comingSoon: true,
    description: 'Xem đánh giá và gợi ý từ cộng đồng',
    apiIntegration: {
      provider: 'TripAdvisor',
      status: 'planned',
      endpoint: 'https://api.content.tripadvisor.com/api/v1/'
    }
  },
  {
    text: 'Giao thông',
    path: '/transport',
    icon: null as any,
    auth: true,
    comingSoon: true,
    description: 'Tìm kiếm phương tiện di chuyển',
    apiIntegration: {
      provider: 'Google Maps',
      status: 'planned',
      endpoint: 'https://maps.googleapis.com/maps/api/'
    }
  }
];

// Hàm helper để lấy menu items theo trạng thái
export const getMenuItemsByStatus = (status: 'ready' | 'in-progress' | 'planned') => {
  return [...activeMenuItems, ...futureMenuItems].filter(
    item => item.apiIntegration?.status === status
  );
};

// Hàm helper để lấy menu items theo provider
export const getMenuItemsByProvider = (provider: string) => {
  return [...activeMenuItems, ...futureMenuItems].filter(
    item => item.apiIntegration?.provider === provider
  );
};

// Hàm helper để cập nhật trạng thái API integration
export const updateMenuItemStatus = (
  path: string, 
  status: 'ready' | 'in-progress' | 'planned'
) => {
  const allItems = [...activeMenuItems, ...futureMenuItems];
  const item = allItems.find(item => item.path === path);
  if (item && item.apiIntegration) {
    item.apiIntegration.status = status;
    if (status === 'ready') {
      item.comingSoon = false;
    }
  }
};
