export const API_ENDPOINTS = {
  SIGNUP: "/api/auth/signup",
  VERIFY_OTP: "/api/auth/verify-otp",
  RESEND_OTP: "/api/auth/resend-otp",
  LOGIN: "/api/auth/login",
  LOGOUT: "/api/auth/logout",
  ME: "/api/auth/me",
  FORGOT_PASSWORD: "/api/auth/forgot-password",
  RESET_PASSWORD: "/api/auth/reset-password",
};

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
