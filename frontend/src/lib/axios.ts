import axios from "axios";

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:7001";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to format output or handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we have an envelope { status: 'fail', message: '...' } in error response
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      status: "fail",
      message: error.message || "An unexpected error occurred",
    });
  }
);
