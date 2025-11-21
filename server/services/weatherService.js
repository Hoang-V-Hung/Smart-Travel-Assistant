// server/services/weatherService.js
const axios = require('axios');

const API_KEY = process.env.OPENWEATHER_API_KEY || 'a051f8d4be0fea3f0842474990dd6513';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Lấy thời tiết hiện tại theo tên thành phố
 * @param {string} city - Tên thành phố (VD: 'Đà Nẵng', 'Da Nang')
 * @returns {Promise<Object>}
 */
const getCurrentWeather = async (city) => {
  try {
    const url = `${BASE_URL}/weather`;
    const params = {
      q: city,
      appid: API_KEY,
      units: 'metric', // Celsius
      lang: 'vi'
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      wind_speed: data.wind.speed,
      rain: data.rain ? data.rain['1h'] || 0 : 0
    };
  } catch (error) {
    console.error('❌ Weather API Error:', error.message);
    return null;
  }
};

/**
 * Lấy dự báo thời tiết 5 ngày
 * @param {string} city - Tên thành phố
 * @returns {Promise<Array>}
 */
const getForecast = async (city) => {
  try {
    const url = `${BASE_URL}/forecast`;
    const params = {
      q: city,
      appid: API_KEY,
      units: 'metric',
      lang: 'vi',
      cnt: 40 // 5 ngày x 8 timestamps/ngày
    };

    const response = await axios.get(url, { params });
    const list = response.data.list;

    // Group by date
    const dailyForecasts = {};
    
    list.forEach(item => {
      const date = item.dt_txt.split(' ')[0]; // YYYY-MM-DD
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          temps: [],
          conditions: [],
          rains: [],
          humidity: [],
          icons: []
        };
      }
      
      dailyForecasts[date].temps.push(item.main.temp);
      dailyForecasts[date].conditions.push(item.weather[0].description);
      dailyForecasts[date].rains.push(item.rain ? item.rain['3h'] || 0 : 0);
      dailyForecasts[date].humidity.push(item.main.humidity);
      dailyForecasts[date].icons.push(item.weather[0].icon);
    });

    // Calculate daily averages
    return Object.values(dailyForecasts).map(day => {
      const avgTemp = Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length);
      const maxTemp = Math.round(Math.max(...day.temps));
      const minTemp = Math.round(Math.min(...day.temps));
      const totalRain = day.rains.reduce((a, b) => a + b, 0);
      
      // Most common condition
      const conditionCounts = {};
      day.conditions.forEach(c => {
        conditionCounts[c] = (conditionCounts[c] || 0) + 1;
      });
      const mostCommonCondition = Object.keys(conditionCounts).reduce((a, b) => 
        conditionCounts[a] > conditionCounts[b] ? a : b
      );

      // Most common icon
      const iconCounts = {};
      day.icons.forEach(i => {
        iconCounts[i] = (iconCounts[i] || 0) + 1;
      });
      const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) => 
        iconCounts[a] > iconCounts[b] ? a : b
      );

      // Get emoji
      const emoji = getWeatherEmoji(mostCommonIcon);

      return {
        date: day.date,
        temp: avgTemp,
        temp_max: maxTemp,
        temp_min: minTemp,
        description: mostCommonCondition,
        icon: mostCommonIcon,
        emoji,
        rain: totalRain > 0,
        rain_amount: Math.round(totalRain)
      };
    }).slice(0, 5); // Only 5 days
  } catch (error) {
    console.error('❌ Forecast API Error:', error.message);
    return [];
  }
};

/**
 * Get weather emoji from icon code
 */
const getWeatherEmoji = (iconCode) => {
  const emojiMap = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
  };
  return emojiMap[iconCode] || '🌤️';
};

/**
 * Format weather info for conversation
 */
const formatWeatherForChat = (forecast) => {
  if (!forecast || forecast.length === 0) {
    return 'Không thể lấy thông tin thời tiết.';
  }

  let message = '🌤️ **Dự báo thời tiết:**\n\n';
  
  forecast.forEach((day, index) => {
    const dateObj = new Date(day.date);
    const dayName = dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
    
    message += `${day.emoji} **${dayName}**: ${day.temp_min}°C - ${day.temp_max}°C\n`;
    message += `   ${day.description}`;
    if (day.rain) {
      message += ` (Mưa ${day.rain_amount}mm)`;
    }
    message += '\n\n';
  });

  return message;
};

module.exports = {
  getCurrentWeather,
  getForecast,
  formatWeatherForChat,
  getWeatherEmoji
};

