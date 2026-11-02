const BASE_URL = '';

/**
 * Enhanced fetch wrapper with automatic JWT token management and error normalization
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('helpconnect_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Automatic logout on expired or invalid token
      if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
        localStorage.removeItem('helpconnect_token');
        localStorage.removeItem('helpconnect_user');
        window.dispatchEvent(new Event('helpconnect_auth_expired'));
      }

      const errorMessage =
        (data && data.message) ||
        (data && data.errors && data.errors.map(e => e.msg).join(', ')) ||
        `HTTP Error ${response.status}: ${response.statusText}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Authentication APIs
export const authApi = {
  login: async (credentials) => {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return apiFetch('/api/auth/me');
  },

  getVolunteers: async () => {
    return apiFetch('/api/auth/volunteers');
  },
};

// Assistance Requests APIs
export const requestApi = {
  create: async (requestData) => {
    return apiFetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  sendSos: async (sosData) => {
    return apiFetch('/api/requests/sos', {
      method: 'POST',
      body: JSON.stringify(sosData),
    });
  },

  ingestSms: async (smsData) => {
    return apiFetch('/api/requests/sms-ingest', {
      method: 'POST',
      body: JSON.stringify(smsData),
    });
  },

  getActiveSos: async () => {
    return apiFetch('/api/requests/sos/active');
  },

  getAll: async ({ page = 1, limit = 10, status = '', assistanceType = '', search = '', isSos = undefined } = {}) => {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    if (status) params.set('status', status);
    if (assistanceType) params.set('assistanceType', assistanceType);
    if (search) params.set('search', search);
    if (isSos !== undefined) params.set('isSos', isSos);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/api/requests${query}`);
  },

  getNearby: async ({ latitude, longitude, radius = 10 }) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });
    return apiFetch(`/api/requests/nearby?${params.toString()}`);
  },

  getById: async (id) => {
    return apiFetch(`/api/requests/${id}`);
  },

  assignVolunteer: async (id, volunteerId) => {
    return apiFetch(`/api/requests/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ volunteerId }),
    });
  },

  updateStatus: async (id, status) => {
    return apiFetch(`/api/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Disaster Alerts APIs
export const alertApi = {
  getActive: async () => {
    return apiFetch('/api/alerts');
  },

  create: async (alertData) => {
    return apiFetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  },

  deactivate: async (id) => {
    return apiFetch(`/api/alerts/${id}/deactivate`, {
      method: 'PATCH',
    });
  },
};

// Dashboard Analytics API
export const dashboardApi = {
  getStats: async () => {
    return apiFetch('/api/dashboard');
  },
};
