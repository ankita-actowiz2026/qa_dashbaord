import axios, { AxiosError } from "axios";

const BACKEND_URL = "http://localhost:5000";

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, //add this If frontend and backend are on different ports/domains
});

/* =======================
   Auth Context Injection
======================= */
let accessToken: string | null = (() => {
  try {
    const stored = localStorage.getItem("auth_data");
    if (!stored) return null;           
    return JSON.parse(stored)?.accessToken ?? null;
  } catch {
    return null;
  }
})();
let updateAccessToken: ((accessToken: string) => void) | null = null;
let logout: (() => void) | null = null;

export const injectAuthContext = (authContext: {
  accessToken: string | null;
  updateAccessToken: (accessToken: string) => void;
  logout: () => void;
}) => {
  if (authContext.accessToken) {
    accessToken = authContext.accessToken;
  }
  updateAccessToken = authContext.updateAccessToken;
  logout = authContext.logout;
};

/* =======================
   Refresh Token Control
======================= */
let isRefreshing = false;
let failedQueue: {
  resolve: (accessToken: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, accessToken: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(accessToken!);
  });
  failedQueue = [];
};

/* =======================
   Request Interceptor
======================= */
apiClient.interceptors.request.use((config: any) => {
  const stored = localStorage.getItem("auth_data");

  if (stored) {
    const parsed = JSON.parse(stored);
    const token = parsed?.accessToken;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* =======================
   Response Interceptor
======================= */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (accessToken) => {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post("/api/auth/refresh");

        accessToken = data.accessToken;
        updateAccessToken?.(data.accessToken);

        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization =
          `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logout?.();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
