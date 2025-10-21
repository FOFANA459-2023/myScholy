// Prefer Vite env variable in production; fallback to deployed backend URL
// Note: Use import.meta.env and prefix vars with VITE_
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'https://myscholyscholarship-backend.onrender.com/api';

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
          // Refresh failed, clear tokens and let the app handle navigation
          this.removeTokens();
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

  // Scholarship methods with caching
  async getScholarships(page = 1, pageSize = 20) {
    const cacheKey = `scholarships_${page}_${pageSize}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }
    
    const result = await this.request(`/scholarships/?page=${page}&page_size=${pageSize}`);
    if (result.data) {
      this.setCachedData(cacheKey, result.data, 300000); // 5 minutes
    }
    return result;
  }

  async searchScholarships(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.country) queryParams.append('country', params.country);
    if (params.degree_level) queryParams.append('degree_level', params.degree_level);
    if (params.application_ongoing) queryParams.append('application_ongoing', params.application_ongoing);
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    
    const cacheKey = `search_${queryParams.toString()}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }
    
    const result = await this.request(`/scholarships/search/?${queryParams.toString()}`);
    if (result.data) {
      this.setCachedData(cacheKey, result.data, 120000); // 2 minutes
    }
    return result;
  }

  async getScholarship(id) {
    const cacheKey = `scholarship_${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }
    
    const result = await this.request(`/scholarships/${id}/`);
    if (result.data) {
      this.setCachedData(cacheKey, result.data, 600000); // 10 minutes
    }
    return result;
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

  // Cache management methods
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      return data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  setCachedData(key, data, ttl = 300000) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  clearCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;

