import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

let accessToken = localStorage.getItem("cc_access") || null;
let refreshToken = localStorage.getItem("cc_refresh") || null;

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem("cc_access", access);
  if (refresh) localStorage.setItem("cc_refresh", refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("cc_access");
  localStorage.removeItem("cc_refresh");
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && refreshToken && !original._retried) {
      original._retried = true;

      refreshing =
        refreshing ||
        axios
          .post("/api/auth/refresh", { refreshToken })
          .then((r) => {
            setTokens(r.data.accessToken, r.data.refreshToken);
            return r.data.accessToken;
          })
          .catch(() => {
            clearTokens();
            window.location.href = "/login";
            return null;
          })
          .finally(() => {
            refreshing = null;
          });

      const fresh = await refreshing;
      if (fresh) {
        original.headers.Authorization = `Bearer ${fresh}`;
        return axios(original).then((r) => r.data);
      }
    }

    const message =
      error.response?.data?.error?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  sendOtp: (mobile) => api.post("/auth/send-otp", { mobile }),
  register: (payload) => api.post("/auth/register", payload),
  login: (mobile, password) => api.post("/auth/login", { mobile, password }),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const profileApi = {
  mine: () => api.get("/profile/me"),
  update: (payload) => api.patch("/profile/me", payload),
};

export const grievanceApi = {
  create: (payload) => api.post("/grievances", payload),
  mine: (params) => api.get("/grievances/mine", { params }),
  one: (ticketId) => api.get(`/grievances/${ticketId}`),
  queue: (params) => api.get("/grievances/queue", { params }),
  stats: () => api.get("/grievances/stats"),
  updateStatus: (ticketId, payload) => api.patch(`/grievances/${ticketId}/status`, payload),
};

export const notificationApi = {
  mine: (params) => api.get("/notifications/mine", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

export const aiApi = {
  ask: (question) => api.post("/ai/ask", { question }),
  knowledge: () => api.get("/ai/knowledge"),
};

export const documentApi = {
  types: () => api.get("/documents/types"),
  mine: () => api.get("/documents/mine"),
  one: (id) => api.get(`/documents/${id}`),
  viewUrl: (id) => api.get(`/documents/${id}/view`),
  remove: (id) => api.delete(`/documents/${id}`),
  queue: (params) => api.get("/documents/queue", { params }),
  review: (id, payload) => api.patch(`/documents/${id}/review`, payload),

  upload: (formData, onProgress) =>
    api.post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }),
};

export const paymentApi = {
  fees: () => api.get("/payments/fees"),
  mine: () => api.get("/payments/mine"),
  create: (payload) => api.post("/payments", payload),
  confirm: (receiptId, payload) => api.post(`/payments/${receiptId}/confirm`, payload),
  receipt: (receiptId) => api.get(`/payments/${receiptId}`),
  stats: () => api.get("/payments/stats"),
};

export const systemApi = {
  health: () => api.get("/system/health"),
};

export default api;
