import { create } from "zustand";
import { api } from "../lib/api";

export type Role = "Admin" | "User" | "Guest";

export interface User {
  id: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Empezamos en true para verificar la sesión al cargar
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
      localStorage.setItem("jwt_token", token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await api.post<{ token: string; user: User }>("/auth/register", { email, password });
      localStorage.setItem("jwt_token", token);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("jwt_token");
    set({ user: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const { user } = await api.get<{ user: User }>("/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem("jwt_token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
