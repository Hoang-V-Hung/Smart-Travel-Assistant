// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles'; // Bỏ createTheme
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TripPlanner from './pages/TripPlanner';
import Destinations from './pages/Destinations';
import AIAssistant from './pages/AIAssistant';
import AIBot from './pages/AIBot';
import TravelAdvisorSearch from './pages/TravelAdvisorSearch';

// *** THAY ĐỔI CHÍNH Ở ĐÂY ***
// Import theme từ file riêng
import theme from './theme';

// *** BỎ ĐI TOÀN BỘ PHẦN createTheme(...) ở đây ***

function App() {
  return (
    // Sử dụng theme đã import
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trip-planner" element={<TripPlanner />} />
              <Route path="/destinations" element={<Destinations />} />
              {/* <Route path="/ai-assistant" element={<AIAssistant />} /> */}
              <Route path="/search-travel-advisor" element={<TravelAdvisorSearch />} />
            </Routes>
            <AIBot />
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;