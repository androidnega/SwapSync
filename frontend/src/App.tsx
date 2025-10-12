import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { API_URL } from './services/api';
import ProtectedRoute from './components/ProtectedRoute';
import RoleDashboard from './pages/RoleDashboard';
import SystemDatabase from './pages/SystemDatabase';
import SwapManager from './pages/SwapManager';
import SalesManager from './pages/SalesManager';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import Phones from './pages/Phones';
import Products from './pages/Products';
import Repairs from './pages/Repairs';
import PendingResales from './pages/PendingResales';
import ManagerDashboard from './pages/ManagerDashboard';
import StaffManagement from './pages/StaffManagement';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';
import ProfitReports from './pages/ProfitReports';
import Login from './pages/Login';
import NotAuthorized from './pages/NotAuthorized';
import Maintenance from './pages/Maintenance';
import ManagerAuditCode from './pages/ManagerAuditCode';
import AdminAuditAccess from './pages/AdminAuditAccess';
import PhoneCategories from './pages/PhoneCategories';
import PhoneBrands from './pages/PhoneBrands';
import SwappingHub from './pages/SwappingHub';
import ProductsHub from './pages/ProductsHub';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import SMSBroadcast from './pages/SMSBroadcast';
import FirstLoginPasswordChange from './components/FirstLoginPasswordChange';
import { getToken, removeToken, initializeSession, updateLastActivity } from './services/authService';
import axios from 'axios';
import './App.css';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize session (check if valid, start monitoring)
    const sessionValid = initializeSession();
    
    if (sessionValid) {
      fetchUserInfo();
    } else if (!isLoginPage) {
      navigate('/login');
    }
    
    checkMaintenanceStatus();

    // Track user activity (update session on any interaction)
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (getToken()) {
        updateLastActivity();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/maintenance/status`);
      setMaintenanceMode(response.data.maintenance_mode || false);
    } catch (err) {
      console.error('Failed to check maintenance status:', err);
    }
  };

  const fetchUserInfo = async () => {
    const token = getToken();
    if (!token && !isLoginPage) {
      navigate('/login');
      return;
    }
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user info', err);
      if (!isLoginPage) {
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    navigate('/login');
  };

  const handlePasswordChanged = async () => {
    // Refresh user data after password change
    await fetchUserInfo();
  };

  // Show first-login password change modal if required
  if (user && user.must_change_password === 1 && !isLoginPage) {
    return (
      <FirstLoginPasswordChange 
        username={user.username}
        onPasswordChanged={handlePasswordChanged}
      />
    );
  }

  // Show login page if not authenticated
  if (isLoginPage) {
    // Show maintenance mode on login page BEFORE allowing login
    if (maintenanceMode) {
      return <Maintenance reason="System maintenance in progress" />;
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Show maintenance page if maintenance mode is ON AFTER login (except for admins)
  if (maintenanceMode && user?.role !== 'admin' && user?.role !== 'super_admin' && location.pathname !== '/maintenance') {
    return <Maintenance reason={maintenanceMode ? "System maintenance in progress" : undefined} />;
  }

  // Show loading while fetching user
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/not-authorized" element={<NotAuthorized />} />
          <Route path="/maintenance" element={<Maintenance />} />
          
          {/* Dashboard - All roles */}
          <Route path="/" element={<RoleDashboard />} />
          
          {/* System Admin & Admin Only */}
          <Route path="/database" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']} userRole={user.role}>
              <SystemDatabase />
            </ProtectedRoute>
          } />
          <Route path="/activity-logs" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'manager', 'ceo']} userRole={user.role}>
              <ActivityLogs />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']} userRole={user.role}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/audit-access" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']} userRole={user.role}>
              <AdminAuditAccess />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']} userRole={user.role}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/sms-broadcast" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']} userRole={user.role}>
              <SMSBroadcast />
            </ProtectedRoute>
          } />
          
          {/* Manager Only - Business Analytics */}
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo']} userRole={user.role}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/profit-reports" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo']} userRole={user.role}>
              <ProfitReports />
            </ProtectedRoute>
          } />
          <Route path="/manager-dashboard" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo']} userRole={user.role}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/audit-code" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo']} userRole={user.role}>
              <ManagerAuditCode />
            </ProtectedRoute>
          } />
          <Route path="/brands" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo']} userRole={user.role}>
              <PhoneBrands />
            </ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo']} userRole={user.role}>
              <PhoneCategories />
            </ProtectedRoute>
          } />
          <Route path="/staff-management" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'admin', 'super_admin']} userRole={user.role}>
              <StaffManagement />
            </ProtectedRoute>
          } />
          
          {/* Business Operations - Manager & Shop Keeper ONLY (NOT admin/super_admin) */}
          <Route path="/customers" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper', 'repairer']} userRole={user.role}>
              <Customers />
            </ProtectedRoute>
          } />
          
          {/* Swapping Hub - Consolidated swapping operations */}
          <Route path="/swapping-hub" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper']} userRole={user.role}>
              <SwappingHub />
            </ProtectedRoute>
          } />
          
          {/* Products Hub - Consolidated product operations */}
          <Route path="/products-hub" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper']} userRole={user.role}>
              <ProductsHub />
            </ProtectedRoute>
          } />
          
          {/* Individual routes (for backward compatibility and direct access) */}
          <Route path="/phones" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper']} userRole={user.role}>
              <Phones />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper']} userRole={user.role}>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/sales" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper']} userRole={user.role}>
              <SalesManager />
            </ProtectedRoute>
          } />
          <Route path="/swaps" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper']} userRole={user.role}>
              <SwapManager />
            </ProtectedRoute>
          } />
          <Route path="/pending-resales" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'shop_keeper']} userRole={user.role}>
              <PendingResales />
            </ProtectedRoute>
          } />
          
          {/* Repairs - Manager & Repairer ONLY (NOT admin/super_admin) */}
          <Route path="/repairs" element={
            <ProtectedRoute allowedRoles={['manager', 'ceo', 'repairer']} userRole={user.role}>
              <Repairs />
            </ProtectedRoute>
          } />
          
          {/* Profile - All authenticated users */}
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
