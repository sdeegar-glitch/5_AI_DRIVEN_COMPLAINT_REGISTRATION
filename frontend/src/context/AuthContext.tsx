import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/axios.js";
import { API_ENDPOINTS } from "../constants/index.js";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  verified: boolean;
  uploadLimit: number;
  searchLimit: number;
  uploadsUsed: number;
  searchesUsed: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and check active session
  const checkSession = async () => {
    try {
      console.log("[AuthContext] Checking active session...");
      const response = await api.get(API_ENDPOINTS.ME);
      if (response.data?.status === "success" && response.data?.data?.user) {
        setUser(response.data.data.user);
        console.log("[AuthContext] Session active. User:", response.data.data.user.email);
      } else {
        setUser(null);
        console.log("[AuthContext] No active session found.");
      }
    } catch (error) {
      setUser(null);
      console.log("[AuthContext] Error verifying session or not logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    console.log("[AuthContext] Attempting login for email:", email);
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, { email, password });
      if (response.data?.status === "success" && response.data?.data?.user) {
        setUser(response.data.data.user);
        console.log("[AuthContext] Login successful. User:", response.data.data.user.email);
      } else {
        throw new Error(response.data?.message || "Failed to log in");
      }
    } catch (error: any) {
      console.error("[AuthContext] Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("[AuthContext] Attempting logout...");
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
      setUser(null);
      console.log("[AuthContext] Logout successful.");
    } catch (error) {
      console.error("[AuthContext] Logout failed:", error);
      // Force user reset locally even if request fails
      setUser(null);
    }
  };

  const refreshUser = async () => {
    console.log("[AuthContext] Refreshing user data...");
    try {
      const response = await api.get(API_ENDPOINTS.ME);
      if (response.data?.status === "success" && response.data?.data?.user) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to refresh user details:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
