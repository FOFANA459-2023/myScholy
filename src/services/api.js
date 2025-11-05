// Prefer Vite env variable in production; fallback to deployed backend URL
// Note: Use import.meta.env and prefix vars with VITE_
const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "https://myscholyscholarship-backend.onrender.com/api";

// Debug logging for mobile troubleshooting
console.log("🌐 API Configuration Debug:");
console.log("Environment:", import.meta.env?.MODE || "unknown");
console.log("API Base URL:", API_BASE_URL);
console.log("Available env vars:", import.meta.env);

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get access token from localStorage
  getAccessToken() {
    const tokens = JSON.parse(localStorage.getItem("tokens") || "null");
    return tokens?.access || null;
  }

  // Get refresh token from localStorage
  getRefreshToken() {
    const tokens = JSON.parse(localStorage.getItem("tokens") || "null");
    return tokens?.refresh || null;
  }

  // Set tokens in localStorage
  setTokens(tokens) {
    localStorage.setItem("tokens", JSON.stringify(tokens));
  }

  // Remove tokens from localStorage
  removeTokens() {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
  }

  // Refresh access token
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      const tokens = this.getRefreshToken()
        ? {
            access: data.access,
            refresh: this.getRefreshToken(),
          }
        : data;

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
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if token exists
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      // Debug logging for mobile issues
      console.log("🔍 API Request Debug:");
      console.log("URL:", url);
      console.log("Method:", config.method || "GET");
      console.log("Headers:", config.headers);

      let response = await fetch(url, config);

      console.log("📡 Response Status:", response.status);
      console.log(
        "📡 Response Headers:",
        Object.fromEntries(response.headers.entries()),
      );

      // If token expired, try to refresh and retry
      if (response.status === 401 && accessToken) {
        console.log("🔑 Token expired, attempting refresh...");
        try {
          accessToken = await this.refreshToken();
          config.headers["Authorization"] = `Bearer ${accessToken}`;
          response = await fetch(url, config);
          console.log("✅ Token refreshed, retry status:", response.status);
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);
          // Refresh failed, clear tokens and let the app handle navigation
          this.removeTokens();
          throw new Error("Authentication failed");
        }
      }

      let data = null;
      const contentType = response.headers.get("content-type");
      if (response.status !== 204 && contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
      console.log(
        "📦 Response data preview:",
        typeof data,
        Object.keys(data || {}),
      );

      if (!response.ok) {
        const errorMessage =
          data.error || data.detail || `HTTP error! status: ${response.status}`;
        console.error("❌ API Error:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ Request successful");
      return { data, error: null };
    } catch (error) {
      console.error("🚨 API Request Failed:");
      console.error("URL:", url);
      console.error("Error:", error.message);
      console.error("Stack:", error.stack);
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

    const result = await this.request(
      `/scholarships/?page=${page}&page_size=${pageSize}`,
    );
    if (result.data) {
      this.setCachedData(cacheKey, result.data, 300000); // 5 minutes
    }
    return result;
  }

  async searchScholarships(params = {}) {
    const queryParams = new URLSearchParams();

    const hasSearch = !!params.search;
    const hasCountry = !!params.country;
    const hasLevel = !!params.degree_level;
    const hasOngoing = typeof params.application_ongoing !== "undefined";

    if (hasSearch) queryParams.append("search", params.search);
    if (hasCountry) queryParams.append("country", params.country);
    if (hasLevel) queryParams.append("degree_level", params.degree_level);
    if (hasOngoing)
      queryParams.append(
        "application_ongoing",
        String(params.application_ongoing) === "true" || params.application_ongoing === true
          ? "true"
          : "false",
      );
    if (params.page) queryParams.append("page", params.page);
    if (params.page_size) queryParams.append("page_size", params.page_size);

    const cacheKey = `search_${queryParams.toString()}`;

    // Bypass cache when any filter/search is applied to always get fresh filtered data
    const shouldBypassCache = hasSearch || hasCountry || hasLevel || hasOngoing;

    if (!shouldBypassCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }
    }

    const result = await this.request(
      `/scholarships/?${queryParams.toString()}`,
    );

    if (result.data && !shouldBypassCache) {
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
    const result = await this.request("/scholarships/", {
      method: "POST",
      body: scholarshipData,
    });

    if (result.data && !result.error) {
      // Clear cache after successful creation
      this.clearCache();
    }

    return result;
  }

  async updateScholarship(id, scholarshipData) {
    const result = await this.request(`/admin/scholarships/${id}/`, {
      method: "PUT",
      body: scholarshipData,
    });

    if (result.data && !result.error) {
      // Clear cache after successful update
      this.clearCache();
    }

    return result;
  }

  async deleteScholarship(id) {
    const result = await this.request(`/admin/scholarships/${id}/delete/`, {
      method: "DELETE",
    });

    if (result.data && !result.error) {
      // Clear cache after successful deletion
      this.clearCache();
    }

    return result;
  }

  // Authentication methods
  async login(credentials) {
    const { data, error } = await this.request("/auth/login/", {
      method: "POST",
      body: credentials,
    });

    if (data && data.tokens) {
      this.setTokens(data.tokens);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return { data, error };
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.request("/auth/logout/", {
        method: "POST",
        body: { refresh: refreshToken },
      });
    }
    this.removeTokens();
    return { data: { message: "Logout successful" }, error: null };
  }

  async registerStudent(userData) {
    return this.request("/auth/student/register/", {
      method: "POST",
      body: userData,
    });
  }

  // Admin user management (new endpoints)
  async getAdmins() {
    return this.request("/admins/", { method: "GET" });
  }

  async createAdmin(adminPayload) {
    return this.request("/admins/", { method: "POST", body: adminPayload });
  }

  async updateAdmin(userId, adminPayload) {
    return this.request(`/admins/${userId}/`, {
      method: "PATCH",
      body: adminPayload,
    });
  }

  async deleteAdmin(userId) {
    return this.request(`/admins/${userId}/`, { method: "DELETE" });
  }

  async getUserProfile() {
    return this.request("/auth/profile/");
  }

  // Admin methods
  async getAdminScholarships(params = {}) {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page);
    if (params.page_size) queryParams.append("page_size", params.page_size);
    if (params.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/admin/scholarships/?${queryString}`
      : "/admin/scholarships/";

    return this.request(endpoint);
  }

  // Admin scholarship management methods
  async createAdminScholarship(scholarshipData) {
    const result = await this.request("/admin/scholarships/", {
      method: "POST",
      body: scholarshipData,
    });

    if (result.data && !result.error) {
      this.clearCache();
    }

    return result;
  }

  async getAdminScholarship(id) {
    return this.request(`/admin/scholarships/${id}/`);
  }

  async updateAdminScholarship(id, scholarshipData) {
    const result = await this.request(`/admin/scholarships/${id}/`, {
      method: "PUT",
      body: scholarshipData,
    });

    if (result.data && !result.error) {
      this.clearCache();
    }

    return result;
  }

  async deleteAdminScholarship(id) {
    const result = await this.request(`/admin/scholarships/${id}/`, {
      method: "DELETE",
    });

    if (result.data && !result.error) {
      this.clearCache();
    }

    return result;
  }

  // Admin Statistics
  async getAdminStatistics() {
    const cacheKey = "admin_statistics";
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return { data: cached, error: null };
    }
    const result = await this.request("/admin/statistics/");
    if (result.data) {
      this.setCachedData(cacheKey, result.data, 60000); // cache 60s
    }
    return result;
  }

  // Super Admin User Export with optional filters
  async exportUsersCSV(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.role) params.append("role", options.role);
      if (Array.isArray(options.fields) && options.fields.length) {
        params.append("fields", options.fields.join(","));
      }
      const qs = params.toString();
      const url = `${this.baseURL}/admin/users/export/${qs ? `?${qs}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      if (options.returnBlob) {
        return { data: blob, error: null };
      }
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const roleSuffix = options.role ? `_${options.role}` : "";
      a.download = `users_export${roleSuffix}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);

      return { data: { message: "Export successful" }, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  async exportActiveScholarships() {
    try {
      const response = await fetch(`${this.baseURL}/admin/scholarships/export/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.blob();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Get current user from localStorage
  getCurrentUser() {
    return JSON.parse(localStorage.getItem("user") || "null");
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
      console.warn("Cache read error:", error);
      return null;
    }
  }

  setCachedData(key, data, ttl = 300000) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Cache write error:", error);
    }
  }

  clearCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("cache_")) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Cache clear error:", error);
    }
  }
}

export const apiService = new ApiService();
export default apiService;
