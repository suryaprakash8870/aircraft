import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutThunk } from '../../store/slices/authSlice';
import { showSnackbar } from '../../store/slices/uiSlice';
import { getInitials } from '../../utils/helpers';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import HistoryIcon from '@mui/icons-material/History';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const DRAWER_WIDTH = 248;

const navItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard', roles: ['admin', 'operator', 'viewer'] },
  { label: 'Fuel Agents', icon: PeopleIcon, path: '/fuel-agents', roles: ['admin', 'operator'] },
  { label: 'Airports', icon: FlightTakeoffIcon, path: '/airports', roles: ['admin', 'operator'] },
  { label: 'Fuel Purchases', icon: ShoppingCartIcon, path: '/fuel-purchases', roles: ['admin', 'operator'] },
  { label: 'Fuel Stock', icon: InventoryIcon, path: '/fuel-stock', roles: ['admin', 'operator', 'viewer'] },
  { label: 'Aircrafts', icon: AirplanemodeActiveIcon, path: '/aircrafts', roles: ['admin', 'operator'] },
  { label: 'Aircraft Filling', icon: LocalGasStationIcon, path: '/aircraft-filling', roles: ['admin', 'operator'] },
  { label: 'Reports', icon: AssessmentIcon, path: '/reports', roles: ['admin', 'operator', 'viewer'] },
];

const adminItems = [
  { label: 'Users', icon: ManageAccountsIcon, path: '/users', roles: ['admin'] },
  { label: 'Audit Logs', icon: HistoryIcon, path: '/audit-logs', roles: ['admin'] },
];

const roleColors = {
  admin: 'error',
  operator: 'primary',
  viewer: 'success',
};

const SidebarContent = ({ onClose, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleNav = (path) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  const userRole = user?.role || 'viewer';

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FlightTakeoffIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ lineHeight: 1.2 }}>
              AeroFuel
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Management System
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton size="small" onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        <List disablePadding>
          <ListItem sx={{ px: 2, py: 0.25 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}
            >
              Main Menu
            </Typography>
          </ListItem>
          {navItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <ListItem key={item.path} disablePadding sx={{ px: 1, py: 0.25 }}>
                  <ListItemButton
                    selected={active}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      borderRadius: 1.5,
                      py: 0.875,
                      px: 1.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon sx={{ fontSize: 20, color: active ? 'primary.main' : 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 400,
                        color: active ? 'primary.main' : 'text.primary',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}

          {userRole === 'admin' && (
            <>
              <ListItem sx={{ px: 2, py: 0.25, mt: 1 }}>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}
                >
                  Administration
                </Typography>
              </ListItem>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <ListItem key={item.path} disablePadding sx={{ px: 1, py: 0.25 }}>
                    <ListItemButton
                      selected={active}
                      onClick={() => handleNav(item.path)}
                      sx={{ borderRadius: 1.5, py: 0.875, px: 1.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Icon sx={{ fontSize: 20, color: active ? 'primary.main' : 'text.secondary' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: active ? 600 : 400,
                          color: active ? 'primary.main' : 'text.primary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </>
          )}
        </List>
      </Box>

      {/* User Footer */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {getInitials(user?.full_name || user?.username || 'U')}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              sx={{ fontSize: '0.8125rem' }}
            >
              {user?.full_name || user?.username || 'User'}
            </Typography>
            <Chip
              label={userRole}
              size="small"
              color={roleColors[userRole] || 'default'}
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, mt: 0.25 }}
            />
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1.5,
            py: 0.75,
            px: 1.5,
            color: 'error.main',
            '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.06)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <LogoutIcon sx={{ fontSize: 18, color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500, color: 'error.main' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
};

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await dispatch(logoutThunk());
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <SidebarContent isMobile={false} />
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <SidebarContent isMobile={true} onClose={handleDrawerToggle} />
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* AppBar */}
        <AppBar
          position="static"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: 10,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '64px !important' }}>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FlightTakeoffIcon sx={{ color: 'white', fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  AeroFuel
                </Typography>
              </Box>
            )}

            <Box sx={{ flex: 1 }} />

            {/* User Menu */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                borderRadius: 2,
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={handleMenuOpen}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {getInitials(user?.full_name || user?.username || 'U')}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                  {user?.full_name || user?.username || 'User'}
                </Typography>
                <Chip
                  label={user?.role || 'viewer'}
                  size="small"
                  color={roleColors[user?.role] || 'default'}
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600 }}
                />
              </Box>
              <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1,
                  minWidth: 180,
                  borderRadius: 2,
                  '& .MuiMenuItem-root': { fontSize: '0.875rem', py: 1 },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  {user?.full_name || user?.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1.5 }}>
                <LogoutIcon fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            bgcolor: 'background.default',
            p: { xs: 2, sm: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
