import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

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

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login-json`, {
      username,
      password,
    });
    
    if (response.data.access_token) {
      this.setToken(response.data.access_token);
      this.setUser(response.data.user);
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
    return !!this.getToken();
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await axios.get<User>(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.setUser(response.data);
    return response.data;
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

export default authService;

