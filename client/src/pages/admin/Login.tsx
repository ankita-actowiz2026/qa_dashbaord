import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import type { loginInterface } from "../../interface/login.interface";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import apiClient from "../../services/apiClient";

interface LoginFormData {
  email: string;
  password: string;
}

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6).required("Password is required"),
});

const Login = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: loginInterface) => {
    try {
      const userData = {
        email: data.email,
        password: data.password,
      };

      const result = await apiClient.post("/admin/auth/login", userData);

      const user_data = {
        accessToken: result.data.data.accessToken,
        user: {
          name: result.data.data.user.name,
          id: result.data.data.user._id,
          role: result.data.data.user.role,
        },
      };
      login(user_data.accessToken, user_data.user);
      toast.success("Logged in successfully!"); // ✅ success toast

      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed"); // ✅ error toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-300 to-gray-200">
      {/* Card */}
      <div className="w-full max-w-md backdrop-blur-lg bg-white/90 p-8 rounded-2xl shadow-2xl border border-white/20">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Login</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <p className="text-sm text-red-500">{errors.email?.message}</p>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <p className="text-sm text-red-500">{errors.password?.message}</p>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-2.5 text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:opacity-90 transition duration-200 shadow-md"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
