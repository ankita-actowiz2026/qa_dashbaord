import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const isAuthenticated = async () => {
  try {
    const res = await axios.get(BACKEND_URL+"/admin/auth/me", {
      withCredentials: true,
    });
    return res.data.success;
  } catch (error) {
    return false;
  }
};