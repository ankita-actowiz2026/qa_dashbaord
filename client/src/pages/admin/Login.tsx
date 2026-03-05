import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import type { loginInterface } from "../../interface/login.interface";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface LoginFormData {
  email: string;
  password: string;
}

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6).required("Password is required"),
});

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });
  useEffect(() => {
    if (location.state?.msg) {
      setMsg(location.state.msg);

      navigate(location.pathname, { replace: true }); //every tie refresh will not show msg
    }
  }, [location.state, navigate, location.pathname]);
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        setMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);
  const onSubmit = async (data: loginInterface) => {
    try {
      const userData = {
        email: data.email,
        password: data.password,
      };

      const result = await axios.post(
        BACKEND_URL + "/admin/auth/login",
        userData,
        {
          withCredentials: true,
        },
      );
      navigate("/admin/dashboard");
    } catch (error: any) {
      setMsg(error.response?.data?.message || "Login failed");
      setMsgType("danger");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        {msg && (
          <div className="mb-4 px-4 py-3 text-red-700 bg-red-100 border border-red-300 rounded-lg text-center">
            {msg}
          </div>
        )}

        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-red-500">{errors.email?.message}</p>
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-red-500">{errors.password?.message}</p>
          </div>

          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
