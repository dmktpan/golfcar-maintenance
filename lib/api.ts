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

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Golf Courses API
export const golfCoursesApi = {
  getAll: () => apiCall('/golf-courses'),
  getById: (id: number) => apiCall(`/golf-courses/${id}`),
  create: (data: any) => apiCall('/golf-courses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/golf-courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/golf-courses/${id}`, {
    method: 'DELETE',
  }),
};

// Users API
export const usersApi = {
  getAll: () => apiCall('/users'),
  getById: (id: number) => apiCall(`/users/${id}`),
  create: (data: any) => apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Vehicles API
export const vehiclesApi = {
  getAll: () => apiCall('/vehicles'),
  getById: (id: number) => apiCall(`/vehicles/${id}`),
  create: (data: any) => apiCall('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/vehicles/${id}`, {
    method: 'DELETE',
  }),
};

// Parts API
export const partsApi = {
  getAll: () => apiCall('/parts'),
  getById: (id: number) => apiCall(`/parts/${id}`),
  create: (data: any) => apiCall('/parts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/parts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/parts/${id}`, {
    method: 'DELETE',
  }),
};

// Jobs API
export const jobsApi = {
  getAll: () => apiCall('/jobs'),
  getById: (id: number) => apiCall(`/jobs/${id}`),
  create: (data: any) => apiCall('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiCall(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiCall(`/jobs/${id}`, {
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