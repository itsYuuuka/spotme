import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, register as apiRegister } from "../api";

interface AuthContextType {
  token: string | null;
  name: string | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [name, setName] = useState<string | null>(localStorage.getItem("name"));

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.data.token);
    setName(res.data.name);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("name", res.data.name);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await apiRegister(email, password, name);
    setToken(res.data.token);
    setName(res.data.name);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("name", res.data.name);
  };

  const logout = () => {
    setToken(null);
    setName(null);
    localStorage.removeItem("token");
    localStorage.removeItem("name");
  };

  const updateDisplayName = (newName: string) => {
    setName(newName);
    localStorage.setItem("name", newName);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        name,
        isLoggedIn: isTokenValid(token),
        login,
        register,
        logout,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
