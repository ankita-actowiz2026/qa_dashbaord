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
  const { setUserData } = useAuth();
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
      const apiUser = result.data.data.user;
      setUserData(apiUser);
      toast.success("Logged in successfully!"); // ✅ success toast

      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed"); // ✅ error toast
    }
  };
  useEffect(() => {
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.message) {
        toast.error(firstError.message as string);
      }
    }
  }, [errors]);
  const label_style = "text-base font-semibold tracking-wide text-sidebar ";
  const textbox_style =
    "w-full px-4 py-2.5 mt-1.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebar focus:border-sidebar bg-gray-50 transition-all duration-200";
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-gray-300 to-gray-200">
      {/* Card */}
      <div className="w-full max-w-md p-8 border shadow-2xl backdrop-blur-lg bg-white/90 rounded-2xl border-white/20">
        {/* Title */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">Login</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className={label_style}>Email</label>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className={textbox_style}
            />
          </div>

          {/* Password */}
          <div>
            <label className={label_style}>Password</label>
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className={textbox_style}
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full py-2.5 text-white font-semibold bg-gradient-to-r from-[#3F4D67] to-[#424649]  rounded-lg hover:opacity-90 transition duration-200 shadow-md"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
