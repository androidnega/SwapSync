import axios from 'axios';
import { API_URL } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  company_name?: string;
  role: 'shop_keeper' | 'repairer' | 'admin';
  is_active: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class AuthService {
  private tokenKey = 'access_token';
  private userKey = 'user';
  private lastActivityKey = 'last_activity';
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
  private timeoutCheckInterval: NodeJS.Timeout | null = null;

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login-json`, {
      username,
      password,
    });
    
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
      this.setUser(response.data.user);
      this.updateLastActivity(); // Track session start
      this.startSessionMonitoring(); // Start monitoring for timeout
    }
    
    return response.data;
  }

  async register(userData: {
    username: string;
    email: string;
    full_name: string;
    password: string;
    role: string;
  }): Promise<User> {
    const response = await axios.post<User>(`${API_URL}/auth/register`, userData);
    return response.data;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.lastActivityKey);
    this.stopSessionMonitoring();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  setUser(user: User) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    const hasToken = !!this.getToken();
    if (hasToken && this.isSessionExpired()) {
      // Session expired, auto-logout
      this.logout();
      return false;
    }
    return hasToken;
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Check session timeout
    if (this.isSessionExpired()) {
      this.logout();
      throw new Error('Session expired');
    }

    const response = await axios.get<User>(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.setUser(response.data);
    this.updateLastActivity(); // Update activity on API call
    return response.data;
  }

  // Session timeout management
  updateLastActivity() {
    localStorage.setItem(this.lastActivityKey, Date.now().toString());
  }

  getLastActivity(): number {
    const lastActivity = localStorage.getItem(this.lastActivityKey);
    return lastActivity ? parseInt(lastActivity, 10) : 0;
  }

  isSessionExpired(): boolean {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) return false;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    return timeSinceLastActivity > this.sessionTimeout;
  }

  getRemainingSessionTime(): number {
    const lastActivity = this.getLastActivity();
    if (!lastActivity) return 0;
    
    const elapsed = Date.now() - lastActivity;
    const remaining = this.sessionTimeout - elapsed;
    return Math.max(0, remaining);
  }

  startSessionMonitoring() {
    // Clear any existing interval
    this.stopSessionMonitoring();
    
    // Check session every minute
    this.timeoutCheckInterval = setInterval(() => {
      if (this.isAuthenticated() && this.isSessionExpired()) {
        console.log('⏰ Session expired - auto logout');
        this.logout();
        window.location.href = '/login?reason=timeout';
      }
    }, 60000); // Check every 1 minute
  }

  stopSessionMonitoring() {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
  }

  // Initialize session (call this on app start)
  initializeSession() {
    if (this.isAuthenticated()) {
      // Check if session is still valid
      if (this.isSessionExpired()) {
        this.logout();
        return false;
      }
      // Start monitoring for this session
      this.startSessionMonitoring();
      // Update activity (user opened a new tab)
      this.updateLastActivity();
      return true;
    }
    return false;
  }
}

const authService = new AuthService();

// Named exports for convenience
export const login = (username: string, password: string) => authService.login(username, password);
export const logout = () => authService.logout();
export const getToken = () => authService.getToken();
export const setToken = (token: string) => authService.setToken(token);
export const removeToken = () => authService.logout(); // Alias for logout
export const getUser = () => authService.getUser();
export const setUser = (user: User) => authService.setUser(user);
export const isAuthenticated = () => authService.isAuthenticated();
export const getCurrentUser = () => authService.getCurrentUser();
export const updateLastActivity = () => authService.updateLastActivity();
export const initializeSession = () => authService.initializeSession();
export const getRemainingSessionTime = () => authService.getRemainingSessionTime();

export default authService;

