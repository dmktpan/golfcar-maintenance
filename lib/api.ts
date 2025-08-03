// lib/api.ts
import { Job } from './data';

export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api/proxy'  // ใช้ proxy routes สำหรับ production
  : '/api/proxy'  // ใช้ proxy routes สำหรับ development

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
  retries: number = 2,
  timeout: number = 30000 // เพิ่มเป็น 30 วินาที
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('⏰ API call timeout triggered for:', `${API_BASE_URL}${endpoint}`);
    controller.abort();
  }, timeout);

  const makeRequest = async (attempt: number): Promise<ApiResponse<T>> => {
    try {
      console.log('🌐 API Call initiated:', {
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        attempt: `${attempt}/${retries + 1}`,
        timestamp: new Date().toISOString(),
        hasBody: !!options.body
      });
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      
      console.log('📡 API Response received:', {
        url: `${API_BASE_URL}${endpoint}`,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        timestamp: new Date().toISOString()
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('❌ API Error Response:', {
            url: `${API_BASE_URL}${endpoint}`,
            status: response.status,
            errorData,
            timestamp: new Date().toISOString()
          });
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', {
            url: `${API_BASE_URL}${endpoint}`,
            status: response.status,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            timestamp: new Date().toISOString()
          });
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Success Response:', {
        url: `${API_BASE_URL}${endpoint}`,
        dataKeys: Object.keys(data || {}),
        hasData: !!data,
        itemCount: data.data?.length || 'N/A',
        timestamp: new Date().toISOString()
      });
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('⏰ API call timed out:', {
            url: `${API_BASE_URL}${endpoint}`,
            timeout: `${timeout}ms`,
            attempt,
            timestamp: new Date().toISOString()
          });
          
          if (attempt <= retries) {
            console.log('🔄 Retrying API call due to timeout:', { 
              url: `${API_BASE_URL}${endpoint}`, 
              retriesLeft: retries - attempt + 1 
            });
            const delay = Math.min(2000, Math.pow(2, attempt) * 1000);
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeRequest(attempt + 1);
          }
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        console.error('❌ API call failed:', {
          url: `${API_BASE_URL}${endpoint}`,
          error: error.message,
          attempt,
          timestamp: new Date().toISOString()
        });
        
        // Retry logic - ลดจำนวน retry และไม่ retry ถ้า timeout
        if (attempt <= retries && !error.message.includes('timeout')) {
          const delay = Math.min(2000, Math.pow(2, attempt) * 1000); // จำกัด delay สูงสุด 2 วินาที
          console.log('🔄 Retrying API call:', { 
            url: `${API_BASE_URL}${endpoint}`, 
            retriesLeft: retries - attempt + 1,
            delay: `${delay}ms`
          });
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

// Users API (External API via proxy)
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

// Local Users API (Internal API - supports central role)
export const localUsersApi = {
  getAll: async () => {
    const response = await fetch('/api/users');
    return await response.json();
  },
  getById: async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  },
  update: async (id: string, data: any) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await response.json();
  },
  delete: async (id: string) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    return await response.json();
  },
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
  getAll: () => apiCall<Job[]>('/jobs'),
  getById: (id: string) => apiCall<Job>(`/jobs/${id}`),
  create: (data: Partial<Job>) => apiCall<Job>('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Job>) => {
    console.log('🔧 jobsApi.update called:', {
      id,
      data,
      dataKeys: Object.keys(data),
      timestamp: new Date().toISOString()
    });
    
    return apiCall<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: (id: string) => apiCall<void>(`/jobs/${id}`, {
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