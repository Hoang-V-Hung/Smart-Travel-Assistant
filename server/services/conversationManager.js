// services/conversationManager.js
// Version: v2.3-edit-confirmed
// Purpose: Robust Conversation Manager with Inline Edit Support

class ConversationManager {
  constructor() {
    this.conversations = new Map();
  }

  // Create or get existing conversation for userId
  getConversation(userId) {
    const userIdKey = String(userId);

    if (!this.conversations.has(userIdKey)) {
      console.log('🆕 [NEW CONVERSATION] userId:', userIdKey);
      this.conversations.set(userIdKey, {
        step: 'start',
        data: {},
        startTime: Date.now()
      });
    }

    const conv = this.conversations.get(userIdKey);

    // Defensive: ensure conv and conv.data are objects
    if (!conv || typeof conv !== 'object') {
      console.warn('⚠️ getConversation: conv invalid, reinitializing for', userIdKey);
      const fresh = { step: 'start', data: {}, startTime: Date.now() };
      this.conversations.set(userIdKey, fresh);
      return fresh;
    }

    if (!conv.data || typeof conv.data !== 'object') {
      console.warn('⚠️ getConversation: conv.data invalid, resetting to {} for', userIdKey);
      conv.data = {};
    }

    // AUTO-HEALING for date fields
    if (!this.isValidDate(conv.data.startDate)) {
      console.warn(`⚠️ Sửa lỗi startDate hỏng (${conv.data.startDate}) -> Reset về hôm nay`);
      conv.data.startDate = new Date().toISOString().split('T')[0];
    }
    if (!this.isValidDate(conv.data.endDate)) {
      console.warn(`⚠️ Sửa lỗi endDate hỏng (${conv.data.endDate}) -> Reset về 3 ngày sau`);
      const next3Days = new Date();
      next3Days.setDate(next3Days.getDate() + 3);
      conv.data.endDate = next3Days.toISOString().split('T')[0];
    }

    return conv;
  }

  // Validate date string (YYYY-MM-DD or Date-parsable)
  isValidDate(dateString) {
    if (!dateString) return false;
    if (typeof dateString !== 'string') return false;
    const trimmed = dateString.trim();
    if (!trimmed) return false;
    if (trimmed === 'Chưa chọn' || trimmed === 'Invalid Date') return false;
    const d = new Date(trimmed);
    return !isNaN(d.getTime());
  }

  // Safe update: merge updates without allowing conv.data to be overridden by non-objects
  updateConversation(userId, updates = {}) {
    const userIdKey = String(userId);
    const conv = this.getConversation(userIdKey); // ensures conv.data exists

    try {
      if (updates && typeof updates === 'object') {
        const { data: incomingData, ...rest } = updates;

        // Merge top-level updates (like step, startTime)
        Object.keys(rest).forEach(k => {
          conv[k] = rest[k];
        });

        // Merge data safely
        if (incomingData && typeof incomingData === 'object') {
          conv.data = conv.data || {};
          Object.assign(conv.data, incomingData);
        } else if (incomingData !== undefined) {
          console.warn('⚠️ updateConversation: incoming data ignored because it is not an object', incomingData);
        }

        if (!conv.data || typeof conv.data !== 'object') conv.data = {};
        this.conversations.set(userIdKey, conv);
      } 
    } catch (err) {
      console.error('❌ updateConversation error:', err);
    }
  }

  resetConversation(userId) { 
    const userIdKey = String(userId);
    this.conversations.delete(userIdKey);
    console.log('🗑️  [RESET] userId:', userIdKey);
  }

  // Main response generator
  generateResponse(userId, userInput = null) {
    try {
      let conv = this.getConversation(userId);

      console.log('🔍 [GENERATE] Step:', conv.step, '| Input:', userInput);

      if (userInput) {
        this.processUserInput(userId, userInput, conv.step);
        conv = this.getConversation(userId);
      }

      const step = conv.step;
      const data = conv.data || {};

      switch (step) {
        case 'start':
          conv.step = 'destination';
          this.updateConversation(userId, { step: 'destination' });
          return this.generateResponse(userId);

        case 'destination':
          return {
            type: 'destination_form',
            message: '📍 **Bạn muốn đi du lịch ở đâu?**\n\nChọn điểm đến phổ biến hoặc nhập trực tiếp:',
            options: [
              { id: 'dn', label: '🏖️ Đà Nẵng', value: 'Đà Nẵng' },
              { id: 'pq', label: '🏝️ Phú Quốc', value: 'Phú Quốc' },
              { id: 'hn', label: '🏛️ Hà Nội', value: 'Hà Nội' },
              { id: 'nt', label: '🌊 Nha Trang', value: 'Nha Trang' }
            ],
            allowCustom: true
          };

        case 'basic_info':
          return {
            type: 'basic_info_form',
            message: '👥 **Bạn đi bao nhiêu người? Ngày nào? Và trong bao lâu?**'
          };

        case 'budget':
          const numPeople = data.numPeople || 1;
          return {
            type: 'budget_form',
            message: `💰 **Ngân sách dự kiến cho chuyến đi?**\n\n_Cho ${numPeople} người, ${data.duration || '3 ngày'}_`,
            options: [
              { id: 'b1', label: '< 5 triệu', value: 5000000 },
              { id: 'b2', label: '5-10 triệu', value: 7500000 },
              { id: 'b3', label: '10-20 triệu', value: 15000000 },
              { id: 'b4', label: '> 20 triệu', value: 30000000 }
            ],
            allowCustom: true
          };

          case 'transport':
            return {
              type: 'transport_form', // Loại message mới
              message: '✈️ **Bạn dự định di chuyển bằng phương tiện gì?**',
              options: [
                { id: 'flight', label: 'Máy bay', value: 'flight' },
                // { id: 'train', label: 'Tàu hỏa', value: 'train' },
                // { id: 'bus', label: 'Xe khách/Giường nằm', value: 'bus' },
                { id: 'personal', label: 'Xe cá nhân', value: 'personal' }
              ]
            };

            case 'origin':
          return {
            type: 'origin_form', // Type mới cho Frontend
            message: '🏠 **Bạn xuất phát từ đâu?**\n\nChọn thành phố hoặc nhập địa chỉ cụ thể:',
            options: [
              { id: 'hn', label: '🏛️ Hà Nội', value: 'Hà Nội' },
              { id: 'hcm', label: '🏙️ TP. Hồ Chí Minh', value: 'TP. Hồ Chí Minh' },
              { id: 'dn', label: '🏖️ Đà Nẵng', value: 'Đà Nẵng' }
            ],
            allowCustom: true
          };

        case 'destination_selection':
          return {
            type: 'conversation',
            message: '🔍 Đang tải thông tin về ' + (data.destination || 'điểm đến') + '...',
            loading: true
          };

        case 'generating_suggestions':
          return {
            type: 'conversation',
            message: '🤖 Đang tính toán lại lịch trình...\n⏳ Đang cập nhật khách sạn & chi phí...',
            loading: true
          };

        case 'edit_plan':
          return {
            type: 'edit_form',
            message: '✏️ **CHỈNH SỬA KẾ HOẠCH**\n\nCập nhật thông tin bên dưới để AI tính toán lại:',
            data: {
              destination: data.destination,
              startDate: data.startDate,
              duration: data.duration, 
              durationDays: data.durationDays,
              numPeople: data.numPeople,
              budget: data.budget
            }
          };

        case 'summary':
          return {
            type: 'summary',
            message: '📋 **KẾ HOẠCH DU LỊCH CỦA BẠN**\n\nVui lòng kiểm tra và xác nhận:',
            summary: this.generateSummary(data),
            buttons: [
              { id: 'confirm', label: '✅ Xác nhận & Tạo chuyến đi', value: 'confirm', primary: true },
              // { id: 'edit', label: '✏️ Sửa lại', value: 'edit' }, // Nút cũ, Frontend mới đã tự render nút Sửa
              { id: 'cancel', label: '❌ Hủy', value: 'cancel' }
            ]
          };

        default:
          return {
            type: 'conversation',
            message: '❓ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
            buttons: [{ id: 'reset', label: '🔄 Bắt đầu lại', value: 'reset' }]
          };
      }
    } catch (err) {
      console.error('❌ generateResponse error:', err);
      return {
        type: 'conversation',
        message: '❌ Có lỗi ở server khi tạo phản hồi. Vui lòng thử lại.',
        error: String(err)
      };
    }
  }

  processUserInput(userId, input, currentStep) {
    const conv = this.getConversation(userId);
    console.log('⚙️  [PROCESS] Step:', currentStep, '| Input:', input);

    try {
      switch (currentStep) {
        case 'start':
          break;

        case 'destination':
          if (input && typeof input === 'string') {
            conv.data.destination = input;
            conv.step = 'basic_info';
          }
          break;

        case 'budget':
          if (input) {
            const cleanBudget = parseInt(String(input).replace(/[^0-9]/g, ''));
            conv.data.budget = isNaN(cleanBudget) ? 5000000 : cleanBudget;
            conv.step = 'transport';
          }
          break;
        
        case 'transport':
        if (input) {
          // Lưu phương tiện vào data (flight, train, bus, personal)
          conv.data.transportMode = input;
          conv.step = 'origin'; // Chuyển tiếp sang bước chọn điểm tham quan
        }
        break;
        
        case 'origin':
          if (input && typeof input === 'string') {
            conv.data.origin = input; // Lưu điểm xuất phát
            conv.step = 'destination_selection'; // Tiếp tục luồng cũ
          }
          break;

        case 'basic_info':
          try {
            const formData = typeof input === 'string' ? JSON.parse(input) : input;
            // Number of people
            const np = formData.numPeople;
            conv.data.numPeople = (np === '1') ? 1 : (np === '2') ? 2 : (np === '3-4') ? 3 : (np === '5+') ? 5 : 1;

            // Duration
            const dur = formData.duration;
            conv.data.duration = dur;
            conv.data.durationDays = (dur === '2-3') ? 3 : (dur === '3-5') ? 4 : (dur === '5-7') ? 6 : (dur === '7+') ? 8 : 3;

            // Date handling
            const dateOpt = formData.dateOption;
            let calcStart;
            if (dateOpt && typeof dateOpt === 'string' && dateOpt.match(/^\d{4}-\d{2}-\d{2}$/)) {
              calcStart = dateOpt;
            } else {
              calcStart = this.calculateStartDate(dateOpt);
            }

            conv.data.startDate = this.getSafeDate(calcStart);
            conv.data.endDate = this.calculateEndDate(conv.data.startDate, conv.data.durationDays);

            conv.step = 'budget';
          } catch (e) {
            console.error('❌ Basic Info Parse Error:', e);
            conv.data.numPeople = 1;
            conv.data.durationDays = 3;
            conv.data.startDate = this.getSafeDate();
            conv.data.endDate = this.calculateEndDate(conv.data.startDate, 3);
            conv.step = 'budget';
          }
          break;

        case 'destination_selection':
          if (input === 'continue' || input === 'skip_auto') {
            if (input === 'skip_auto') conv.data.selectedAttractions = [];
            conv.step = 'generating_suggestions';
          } else if (input === 'change_destination') {
            conv.step = 'destination';
            conv.data = {};
          } else {
            try {
              const parsed = typeof input === 'string' ? JSON.parse(input) : input;
              conv.data.selectedAttractions = Array.isArray(parsed) ? parsed : [parsed];
              conv.step = 'generating_suggestions';
            } catch (e) {
              conv.data.selectedAttractions = [];
              conv.step = 'generating_suggestions';
            }
          }
          break;

        case 'generating_suggestions':
          break;

        // === [THÊM MỚI] XỬ LÝ SUMMARY: NẾU NGƯỜI DÙNG CHỌN EDIT HOẶC GỬI JSON ===
        case 'summary':
          if (input === 'edit') {
            conv.step = 'edit_plan';
          } else if (input === 'cancel') {
             // Hủy
          } 
          // Kiểm tra nếu nhận được JSON (update ngầm)
          else if (typeof input === 'object' || (typeof input === 'string' && input.trim().startsWith('{'))) {
              try {
                  const dataObj = typeof input === 'string' ? JSON.parse(input) : input;
                  console.log('💾 [SUMMARY] Updating data strictly...');
                  
                  // Cập nhật các trường quan trọng nếu có
                  if (dataObj.itinerary) conv.data.itinerary = dataObj.itinerary;
                  if (dataObj.costEstimate) conv.data.costEstimate = dataObj.costEstimate;
                  if (dataObj.startDate) conv.data.startDate = this.getSafeDate(dataObj.startDate);
                  
                  // Không đổi step, vẫn ở summary để hiển thị lại
              } catch (e) {
                  console.error('Error parsing summary update:', e);
              }
          }
          break;

        case 'edit_plan':
          if (input === 'cancel_edit') {
            conv.step = 'summary'; 
          } else {
            try {
              const editData = typeof input === 'string' ? JSON.parse(input) : input;
              
              if (editData.destination) conv.data.destination = editData.destination;
              if (editData.startDate) conv.data.startDate = this.getSafeDate(editData.startDate);
              if (editData.numPeople) conv.data.numPeople = parseInt(editData.numPeople) || 1;
              if (editData.budget) conv.data.budget = parseInt(editData.budget) || 5000000;
              
              if (editData.duration) {
                conv.data.duration = editData.duration;
                const dur = editData.duration;
                conv.data.durationDays = (dur === '2-3') ? 3 : (dur === '3-5') ? 4 : (dur === '5-7') ? 6 : (dur === '7+') ? 8 : (parseInt(dur) || 3);
              }
              
              conv.data.endDate = this.calculateEndDate(conv.data.startDate, conv.data.durationDays);
              conv.step = 'generating_suggestions';
            } catch (e) {
              console.error('Edit Plan parse error', e);
            }
          }
          break;

        default:
          console.log('⚠️ Unknown step:', currentStep);
          break;
      }

      this.updateConversation(userId, conv);
    } catch (err) {
      console.error('❌ processUserInput error:', err);
    }
  }

  getSafeDate(dateInput) {
    if (!dateInput) return new Date().toISOString().split('T')[0];
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      if (date.getFullYear() < 2024) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }

  calculateStartDate(option) {
    const now = new Date();
    if (option === 'thisweek') {
      const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
      now.setDate(now.getDate() + daysUntilSat);
    } else if (option === 'nextweek') {
      now.setDate(now.getDate() + 7 + (8 - now.getDay()) % 7);
    } else if (option === 'nextmonth') {
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
    } else {
      now.setDate(now.getDate() + 7);
    }
    return now.toISOString().split('T')[0];
  }

  calculateEndDate(startDate, durationDays) {
    try {
      const validStart = this.getSafeDate(startDate);
      const start = new Date(validStart);
      const days = (typeof durationDays === 'number' && !isNaN(durationDays)) ? durationDays : 3;
      start.setDate(start.getDate() + days);
      return start.toISOString().split('T')[0];
    } catch (error) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 3);
      return fallback.toISOString().split('T')[0];
    }
  }

  generateSummary(data) {
    data = data && typeof data === 'object' ? data : {};

    const safeStart = this.getSafeDate(data.startDate);
    const safeEnd = this.getSafeDate(data.endDate);

    return {
      destination: data.destination || 'Chưa chọn',
      numPeople: data.numPeople || 1,
      startDate: safeStart,
      endDate: safeEnd,
      duration: data.duration || '3 ngày',
      durationDays: data.durationDays || 3,
      budget: data.budget || 0,
      selectedAttractions: Array.isArray(data.selectedAttractions) ? data.selectedAttractions : [],
      weather: Array.isArray(data.weather) ? data.weather : [],
      hotels: Array.isArray(data.hotels) ? data.hotels : [],
      restaurants: Array.isArray(data.restaurants) ? data.restaurants : [],
      costEstimate: data.costEstimate || {},
      itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
      transportMode: data.transportMode || 'personal',
    };
  }
}

const conversationManager = new ConversationManager();
module.exports = conversationManager;