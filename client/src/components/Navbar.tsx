import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Dashboard,
  FlightTakeoff,
  Place,
  SmartToy,
  Login,
  PersonAdd,
  AccountCircle,
  Hotel,
  CloudQueue,
  Map,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { activeMenuItems, futureMenuItems } from '../config/navigation';
import APIIntegrationStatus from './APIIntegrationStatus';

const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isAuthenticated = localStorage.getItem('token');

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    handleClose();
  };

  // Map icons cho menu items
  const iconMap: { [key: string]: React.ReactElement } = {
    '': <Home />, // Trang chủ
    'dashboard': <Dashboard />,
    'trip-planner': <FlightTakeoff />,
    'destinations': <Place />,
    'ai-assistant': <SmartToy />,
    'flights': <FlightTakeoff />,
    'hotels': <Hotel />,
    'map': <Map />,
    'weather': <CloudQueue />,
    'reviews': <Place />,
    'transport': <Place />,
  };

  // Tạo menu items với icons
  const menuItemsWithIcons = activeMenuItems.map(item => ({
    ...item,
    icon: iconMap[item.path.replace('/', '')] || <Place />
  }));

  const futureMenuItemsWithIcons = futureMenuItems.map(item => ({
    ...item,
    icon: iconMap[item.path.replace('/', '')] || <Place />
  }));

  const drawer = (
    <Box sx={{ width: 280 }}>
      <List>
        {/* Menu items hiện tại */}
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 'bold' }}>
          Tính năng chính
        </Typography>
        {menuItemsWithIcons.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              cursor: 'pointer',
              backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                  {item.apiIntegration && (
                    <APIIntegrationStatus
                      provider={item.apiIntegration.provider}
                      status={item.apiIntegration.status}
                      endpoint={item.apiIntegration.endpoint}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}

        {/* Menu items sắp có (Coming Soon) */}
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 'bold', mt: 2 }}>
          Sắp ra mắt
        </Typography>
        {futureMenuItemsWithIcons.map((item) => (
          <ListItem
            key={item.text}
            onClick={() => {
              if (!item.comingSoon) {
                navigate(item.path);
                setMobileOpen(false);
              }
            }}
            sx={{
              cursor: item.comingSoon ? 'not-allowed' : 'pointer',
              opacity: item.comingSoon ? 0.6 : 1,
              '&:hover': {
                backgroundColor: item.comingSoon ? 'transparent' : 'action.hover'
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.text}
                  {item.comingSoon && (
                    <Chip
                      label="Sắp có"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                  {item.apiIntegration && (
                    <APIIntegrationStatus
                      provider={item.apiIntegration.provider}
                      status={item.apiIntegration.status}
                      endpoint={item.apiIntegration.endpoint}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}

        {/* Authentication buttons */}
        <Divider sx={{ my: 2 }} />
        {!isAuthenticated ? (
          <>
            <ListItem onClick={() => { navigate('/login'); setMobileOpen(false); }} sx={{ cursor: 'pointer' }}>
              <ListItemIcon><Login /></ListItemIcon>
              <ListItemText primary="Đăng nhập" />
            </ListItem>
            <ListItem onClick={() => { navigate('/register'); setMobileOpen(false); }} sx={{ cursor: 'pointer' }}>
              <ListItemIcon><PersonAdd /></ListItemIcon>
              <ListItemText primary="Đăng ký" />
            </ListItem>
          </>
        ) : (
          <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
            <ListItemIcon><AccountCircle /></ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            🌍 Smart Travel Assistant
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {menuItemsWithIcons
              .filter(item => item.path !== '/dashboard') // Ẩn Dashboard khỏi thanh chính
              .map((item) => (
                (!item.auth || isAuthenticated) && (
                  <Button
                    key={item.text}
                    color="inherit"
                    startIcon={item.icon}
                    onClick={() => navigate(item.path)}
                    sx={{
                      backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    {item.text}
                  </Button>
                )
            ))}
            </Box>
          )}

          {!isMobile && (
            <Box sx={{ ml: 2 }}>
              {isAuthenticated ? (
                <>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <AccountCircle />
                    </Avatar>
                  </IconButton>
                  <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  >
                    <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                      <Dashboard sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <AccountCircle sx={{ mr: 1 }} /> Đăng xuất
                    </MenuItem>
                </Menu>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button color="inherit" onClick={() => navigate('/login')}>
                    Đăng nhập
                  </Button>
                  <Button color="inherit" onClick={() => navigate('/register')}>
                    Đăng ký
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
