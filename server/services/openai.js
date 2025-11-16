/**
 * OpenAI/GPT Service
 * Service xử lý các yêu cầu với OpenAI API:
 * - Lên lịch trình du lịch
 * - Sinh nội dung du lịch
 * - Chat với AI assistant
 */

const axios = require('axios');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.baseURL = 'https://api.openai.com/v1';
  }

  /**
   * Tạo lịch trình du lịch chi tiết
   * @param {Object} params - Thông tin chuyến du lịch
   * @returns {Promise<Object>} Lịch trình du lịch
   */
  async generateTripPlan(params) {
    const {
      destination,
      duration,
      budget,
      interests = [],
      travelStyle = 'relaxed',
      groupSize = 2,
      startDate,
      specialRequirements = []
    } = params;

    const prompt = `
Bạn là một chuyên gia du lịch AI chuyên nghiệp. Hãy tạo lịch trình du lịch chi tiết với thông tin sau:

**Thông tin chuyến đi:**
- Điểm đến: ${destination}
- Thời gian: ${duration} ngày
- Ngân sách: ${budget} VND
- Sở thích: ${interests.join(', ') || 'Không có sở thích cụ thể'}
- Phong cách du lịch: ${travelStyle}
- Số người: ${groupSize}
- Ngày bắt đầu: ${startDate || 'Chưa xác định'}
${specialRequirements.length > 0 ? `- Yêu cầu đặc biệt: ${specialRequirements.join(', ')}` : ''}

**Yêu cầu:**
Hãy tạo lịch trình chi tiết từng ngày với:
1. **Ngày X** (tên ngày)
   - **Buổi sáng:**
     - Hoạt động chính (tên, địa chỉ, thời gian)
     - Địa điểm tham quan
     - Chi phí ước tính
   - **Buổi trưa:**
     - Nhà hàng gợi ý (tên, địa chỉ, món ăn, giá)
   - **Buổi chiều:**
     - Hoạt động chính
     - Địa điểm tham quan
     - Chi phí ước tính
   - **Buổi tối:**
     - Nhà hàng/Quán ăn
     - Hoạt động giải trí
   - **Mẹo du lịch:** (mẹo hữu ích cho ngày này)
   - **Lưu ý:** (những điều cần chú ý)

2. **Tổng chi phí ước tính** cho toàn bộ chuyến đi
3. **Mẹo tổng quan** cho chuyến du lịch
4. **Danh sách đóng gói** cần thiết
5. **Thông tin quan trọng** về điểm đến (văn hóa, an toàn, visa, v.v.)

Hãy trả về nội dung dưới dạng markdown dễ đọc, có cấu trúc rõ ràng.
`;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Bạn là một chuyên gia du lịch AI chuyên nghiệp với nhiều năm kinh nghiệm. Bạn có khả năng tạo lịch trình du lịch chi tiết, thực tế và hữu ích.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        plan: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tạo lịch trình: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Sinh nội dung du lịch (bài viết, mô tả, gợi ý)
   * @param {Object} params - Thông tin nội dung cần sinh
   * @returns {Promise<Object>} Nội dung đã sinh
   */
  async generateContent(params) {
    const {
      type, // 'article', 'description', 'recommendation', 'review'
      topic,
      destination,
      length = 'medium', // 'short', 'medium', 'long'
      style = 'informative', // 'informative', 'casual', 'professional'
      language = 'vi'
    } = params;

    const lengthTokens = {
      short: 500,
      medium: 1000,
      long: 2000
    };

    const prompts = {
      article: `Viết một bài viết về "${topic}" tại ${destination}. Bài viết nên ${style} và có độ dài ${length}.`,
      description: `Viết mô tả chi tiết về ${destination}. Bao gồm vị trí, điểm nổi bật, lịch sử, văn hóa, và những điều du khách nên biết.`,
      recommendation: `Đưa ra các gợi ý chi tiết về ${topic} tại ${destination}. Bao gồm lý do nên thử, địa chỉ, giá cả, và mẹo hữu ích.`,
      review: `Viết một review về ${topic} tại ${destination}. Bao gồm ưu điểm, nhược điểm, và đánh giá tổng thể.`
    };

    const prompt = prompts[type] || prompts.article;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `Bạn là một nhà văn du lịch chuyên nghiệp. Viết nội dung ${style} và hấp dẫn bằng tiếng ${language === 'vi' ? 'Việt' : 'Anh'}.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: lengthTokens[length],
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi sinh nội dung: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Chat với AI assistant
   * @param {String} message - Tin nhắn từ user
   * @param {Array} conversationHistory - Lịch sử hội thoại
   * @returns {Promise<Object>} Phản hồi từ AI
   */
  async chat(message, conversationHistory = []) {
    const systemPrompt = `Bạn là một trợ lý du lịch AI thông minh và thân thiện. Bạn có thể:
- Tư vấn về điểm đến, lịch trình du lịch
- Gợi ý hoạt động, nhà hàng, khách sạn
- Trả lời câu hỏi về du lịch
- Hỗ trợ lập kế hoạch du lịch
- Cung cấp thông tin về văn hóa, ẩm thực, địa điểm

Hãy trả lời một cách thân thiện, hữu ích và chính xác. Nếu không chắc chắn, hãy nói rõ.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        response: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi chat với AI: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Gợi ý điểm đến dựa trên sở thích
   * @param {Object} params - Thông tin sở thích và yêu cầu
   * @returns {Promise<Object>} Danh sách gợi ý
   */
  async recommendDestinations(params) {
    const {
      preferences = [],
      budget,
      duration,
      season,
      previousDestinations = [],
      travelStyle = 'relaxed'
    } = params;

    const prompt = `
Dựa trên thông tin sau, gợi ý 5-7 điểm đến phù hợp:

**Thông tin du khách:**
- Sở thích: ${preferences.join(', ') || 'Không có sở thích cụ thể'}
- Ngân sách: ${budget} VND
- Thời gian: ${duration} ngày
- Mùa: ${season}
- Phong cách du lịch: ${travelStyle}
- Đã đi qua: ${previousDestinations.join(', ') || 'Chưa đi đâu'}

**Yêu cầu:**
Hãy gợi ý các điểm đến với thông tin sau cho mỗi điểm:
1. Tên điểm đến
2. Quốc gia/Thành phố
3. Lý do phù hợp (tại sao phù hợp với sở thích và ngân sách)
4. Chi phí ước tính (tổng cho ${duration} ngày)
5. Thời gian tốt nhất để đi
6. Điểm nổi bật (3-5 điểm)
7. Hoạt động nên thử (3-5 hoạt động)
8. Mẹo du lịch

Trả về dưới dạng JSON hoặc markdown có cấu trúc rõ ràng.
`;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Bạn là một chuyên gia du lịch AI, chuyên gợi ý điểm đến phù hợp với từng cá nhân dựa trên sở thích, ngân sách và phong cách du lịch.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.8
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        recommendations: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi gợi ý điểm đến: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // =========================================================================
  // CÁC HÀM MỚI VÀ ĐÃ SỬA LỖI
  // =========================================================================

  /**
   * [ĐÃ SỬA LỖI] Trích xuất thông tin chuyến bay từ tin nhắn
   * @param {String} message - Tin nhắn của người dùng
   * @returns {Promise<Object>} - Object chứa thông tin chuyến bay
   */
  async extractFlightInfo(message) {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Phân tích câu sau đây của người dùng: "${message}".
      Hôm nay là ngày ${today}.
      Nhiệm vụ của bạn là trích xuất thông tin chuyến bay dưới dạng JSON.
      Các thông tin cần trích xuất:
      1. origin: Mã sân bay đi (ví dụ Sài Gòn/TPHCM -> SGN, Hà Nội -> HAN).
      2. destination: Mã sân bay đến.
      3. date: Ngày đi (YYYY-MM-DD).
      4. returnDate: Ngày VỀ (YYYY-MM-DD). Chỉ trích xuất nếu người dùng đề cập đến "khứ hồi", "hai chiều", hoặc có ngày về cụ thể.

      QUAN TRỌNG: Chỉ trả lời bằng một đối tượng JSON.
      - Nếu là câu hỏi về chuyến bay, trả về: {"isFlightQuery": true, "origin": "...", "destination": "...", "date": "...", "returnDate": "..."} (returnDate có thể là null).
      - Nếu không phải, trả về: {"isFlightQuery": false}.
    `;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const rawResponse = response.data.choices[0].message.content;
      const jsonMatch = rawResponse.match(/{[\s\S]*}/);

      if (jsonMatch && jsonMatch[0]) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Lỗi khi parse JSON (sau khi trích xuất):", jsonMatch[0]);
          return { isFlightQuery: false };
        }
      } else {
        console.error("Không tìm thấy chuỗi JSON hợp lệ trong phản hồi của AI:", rawResponse);
        return { isFlightQuery: false };
      }
    } catch (error) {
      console.error('Lỗi trong hàm extractFlightInfo:', error.response?.data || error.message);
      return { isFlightQuery: false };
    }
  }

  /**
   * Chat với ngữ cảnh chuyến bay MỘT CHIỀU
   */
  async chatWithFlightContext(message, conversationHistory, flightData) {
    if (flightData.length === 0) {
      const noFlightPrompt = `
        Người dùng hỏi: "${message}".
        Tôi đã tìm kiếm nhưng không tìm thấy chuyến bay nào phù hợp.
        Hãy trả lời người dùng một cách tự nhiên rằng bạn không tìm thấy chuyến bay nào và gợi ý họ thử tìm ngày khác hoặc hành trình khác.
      `;
      return this.chat(noFlightPrompt, conversationHistory);
    }

    const flightContext = JSON.stringify(flightData, null, 2);
    const enhancedPrompt = `
      Bạn là một backend API chỉ trả về dữ liệu JSON. Người dùng vừa hỏi: "${message}".
      Dưới đây là dữ liệu chuyến bay MỘT CHIỀU tôi đã tìm được:
      ${flightContext}
      
      Nhiệm vụ: Dựa vào dữ liệu trên, tạo ra một chuỗi JSON hợp lệ.
      Cấu trúc JSON:
      {
        "type": "flight_results",
        "summary": "Một câu tóm tắt ngắn gọn...",
        "flights": [
          {
            "airline": "...",
            "departureTime": "YYYY-MM-DDTHH:mm:ss",
            "arrivalTime": "YYYY-MM-DDTHH:mm:ss",
            "duration": ...,
            "price": ...
          }
        ]
      }
      QUAN TRỌNG: Chỉ trả về chuỗi JSON.
    `;
    
    return this.chat(enhancedPrompt, conversationHistory);
  }

  /**
   * [MỚI] Chat với ngữ cảnh chuyến bay KHỨ HỒI
   */
  async chatWithRoundTripContext(message, conversationHistory, roundTripData) {
    if (roundTripData.length === 0) {
      const noFlightPrompt = `
        Người dùng hỏi: "${message}".
        Tôi đã tìm kiếm nhưng không tìm thấy chuyến bay khứ hồi nào phù hợp.
        Hãy trả lời người dùng một cách tự nhiên và gợi ý họ thử tìm ngày khác.
      `;
      return this.chat(noFlightPrompt, conversationHistory);
    }

    const context = JSON.stringify(roundTripData, null, 2);
    const prompt = `
        Bạn là một API chỉ trả về JSON. Người dùng hỏi: "${message}".
        Dưới đây là dữ liệu chuyến bay KHỨ HỒI tôi đã tìm được:
        ${context}

        Nhiệm vụ: Dựa vào dữ liệu trên, tạo ra một chuỗi JSON hợp lệ.
        JSON phải có cấu trúc:
        {
          "type": "roundtrip_flight_results",
          "summary": "Một câu tóm tắt ngắn gọn cho chuyến bay khứ hồi...",
          "flights": [
            {
              "price": "Tổng giá vé (dạng số)",
              "departureFlight": { "airline": "...", "departureTime": "...", "arrivalTime": "...", "duration": ... },
              "returnFlight": { "airline": "...", "departureTime": "...", "arrivalTime": "...", "duration": ... }
            }
          ]
        }
        QUAN TRỌNG: Chỉ trả về chuỗi JSON.
      `;
      
    return this.chat(prompt, conversationHistory);
  }
}

module.exports = new OpenAIService();