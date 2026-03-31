import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ✅ User type
type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
};

// ✅ API User type (backend response)
type ApiUser = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
};

// ✅ Context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUserData: (user: ApiUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Normalize user (single source of truth)
  const normalizeUser = (apiUser: ApiUser): User => ({
    id: apiUser._id,
    first_name: apiUser.first_name,
    last_name: apiUser.last_name,
    email: apiUser.email,
    role: apiUser.role,
  });

  // ✅ Set user from API
  const setUserData = (apiUser: ApiUser) => {
    setUser(normalizeUser(apiUser));
  };

  // ✅ Fetch logged-in user
  const fetchMe = async () => {
    try {
      const res = await axios.get(BACKEND_URL + "/admin/auth/profile", {
        withCredentials: true,
      });

      setUserData(res.data.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  // ✅ Logout
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUserData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
