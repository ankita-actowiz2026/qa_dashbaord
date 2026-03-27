import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type User = {
  name: string;
  id: string;
  email: string;
};

type AuthContextType = {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  updateAccessToken: (accessToken: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchMe = async () => {
    try {
      const res = await axios.get(BACKEND_URL + "/admin/auth/profile", {
        withCredentials: true,
      });

      setUser(res.data.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe(); // ✅ ONLY ONCE
  }, []);

  const login = (accessToken: string, user: User) => {
    setAccessToken(accessToken);
    setUser(user);
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
  };
  const updateAccessToken = (newAccessToken: string) => {
    // 1️⃣ Update React state
    // setAccessToken(newAccessToken);
    // // 2️⃣ Update localStorage
    // const stored = localStorage.getItem("auth_data");
    // if (stored) {
    //   const parsed = JSON.parse(stored);
    //   localStorage.setItem(
    //     "auth_data",
    //     JSON.stringify({
    //       ...parsed,
    //       accessToken: newAccessToken,
    //     }),
    //   );
    // }
  };
  return (
    <AuthContext.Provider
      value={{ accessToken, user, login, logout, updateAccessToken, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
