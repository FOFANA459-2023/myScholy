// ...existing code...
const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get access token from localStorage
  getAccessToken() {
    const tokens = JSON.parse(localStorage.getItem('tokens') || 'null');
    return tokens?.access || null;
  }

  // Get refresh token from localStorage
  getRefreshToken() {
    const tokens = JSON.parse(localStorage.getItem('tokens') || 'null');
    return tokens?.refresh || null;
  }

  // Set tokens in localStorage
  setTokens(tokens) {
    localStorage.setItem('tokens', JSON.stringify(tokens));
  }

  // Remove tokens from localStorage
  removeTokens() {
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
  }

  // Refresh access token
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const tokens = this.getRefreshToken() ? { 
        access: data.access, 
        refresh: this.getRefreshToken() 
      } : data;
      
      this.setTokens(tokens);
      return data.access;
    } catch (error) {
      this.removeTokens();
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let accessToken = this.getAccessToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if token exists
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      let response = await fetch(url, config);

      // If token expired, try to refresh and retry
      if (response.status === 401 && accessToken) {
        try {
          accessToken = await this.refreshToken();
          config.headers['Authorization'] = `Bearer ${accessToken}`;
          response = await fetch(url, config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || `HTTP error! status: ${response.status}`);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Scholarship methods
  async getScholarships() {
    return this.request('/scholarships/');
  }

  async getScholarship(id) {
    return this.request(`/scholarships/${id}/`);
  }

  async createScholarship(scholarshipData) {
    return this.request('/scholarships/', {
      method: 'POST',
      body: scholarshipData,
    });
  }

  async updateScholarship(id, scholarshipData) {
    return this.request(`/scholarships/${id}/`, {
      method: 'PUT',
      body: scholarshipData,
    });
  }

  async deleteScholarship(id) {
    return this.request(`/admin/scholarships/${id}/delete/`, {
      method: 'DELETE',
    });
  }

  // Authentication methods
  async login(credentials) {
    const { data, error } = await this.request('/auth/login/', {
      method: 'POST',
      body: credentials,
    });

    if (data && data.tokens) {
      this.setTokens(data.tokens);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { data, error };
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.request('/auth/logout/', {
        method: 'POST',
        body: { refresh: refreshToken },
      });
    }
    this.removeTokens();
    return { data: { message: 'Logout successful' }, error: null };
  }

  async registerStudent(userData) {
    return this.request('/auth/student/register/', {
      method: 'POST',
      body: userData,
    });
  }


  // Admin user management (new endpoints)
  async getAdmins() {
    return this.request('/admins/', { method: 'GET' });
  }

  async createAdmin(adminPayload) {
    return this.request('/admins/', { method: 'POST', body: adminPayload });
  }

  async updateAdmin(userId, adminPayload) {
    return this.request(`/admins/${userId}/`, { method: 'PATCH', body: adminPayload });
  }

  async deleteAdmin(userId) {
    return this.request(`/admins/${userId}/`, { method: 'DELETE' });
  }

  async getUserProfile() {
    return this.request('/auth/profile/');
  }

  // Admin methods
  async getAdminScholarships() {
    return this.request('/admin/scholarships/');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Get current user from localStorage
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  }
}

export const apiService = new ApiService();
export default apiService;

