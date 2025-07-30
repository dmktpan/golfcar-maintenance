// lib/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://192.168.1.54:8080/api' 
  : 'http://localhost:3000/api'

// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Helper function for API calls with timeout and retry mechanism
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3,
  timeout: number = 10000
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const makeRequest = async (attempt: number): Promise<ApiResponse<T>> => {
    try {
      console.log(`🌐 API Call (attempt ${attempt}/${retries + 1}): ${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API Error ${response.status}: ${endpoint}`, {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // ส่ง error message จาก API ถ้ามี
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log(`✅ API Success: ${endpoint} (${data.data?.length || 'N/A'} items)`);
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`⏰ API Timeout: ${endpoint} (${timeout}ms)`);
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        console.error(`❌ API Error (attempt ${attempt}): ${endpoint}`, error.message);
        
        // Retry logic
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest(attempt + 1);
        }
        
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  };

  return makeRequest(1);
}

// Golf Courses API
export const golfCoursesApi = {
  getAll: () => apiCall('/golf-courses'),
  getById: (id: string) => apiCall(`/golf-courses/${id}`),
  create: (data: any) => apiCall('/golf-courses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/golf-courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/golf-courses/${id}`, {
    method: 'DELETE',
  }),
};

// Users API
export const usersApi = {
  getAll: () => apiCall('/users'),
  getById: (id: string) => apiCall(`/users/${id}`),
  create: (data: any) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Vehicles API
export const vehiclesApi = {
  getAll: () => apiCall('/vehicles'),
  getById: (id: string) => apiCall(`/vehicles/${id}`),
  create: (data: any) => apiCall('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/vehicles/${id}`, {
    method: 'DELETE',
  }),
};

// Parts API
export const partsApi = {
  getAll: () => apiCall('/parts'),
  getById: (id: string) => apiCall(`/parts/${id}`),
  create: (data: any) => apiCall('/parts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/parts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/parts/${id}`, {
    method: 'DELETE',
  }),
};

// Jobs API
export const jobsApi = {
  getAll: () => apiCall('/jobs'),
  getById: (id: string) => apiCall(`/jobs/${id}`),
  create: (data: any) => apiCall('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/jobs/${id}`, {
    method: 'DELETE',
  }),
};

// Parts Usage Logs API
export const partsUsageLogsApi = {
  getAll: () => apiCall('/parts-usage-logs'),
  create: (data: any) => apiCall('/parts-usage-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Serial History API
export const serialHistoryApi = {
  getAll: () => apiCall('/serial-history'),
  create: (data: any) => apiCall('/serial-history', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Auth API
export const authApi = {
  login: (credentials: { code: string; password: string }) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
};