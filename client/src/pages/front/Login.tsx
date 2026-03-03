import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import type { loginInterface } from "../../interface/login.interface";
import loginValidate from "../../validation/front/login.validation";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../utils/front/apiClient";

const Login = () => {
  let navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const location = useLocation();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<loginInterface>({ resolver: yupResolver(loginValidate) });

  // Message from navigation
  useEffect(() => {
    if (location.state?.msg) {
      setMsg(location.state.msg);
      setMsgType(location.state.type);
    }
  }, [location.state]);

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

      const result = await apiClient.post("/api/auth/login", userData);
      const user_data = {
        accessToken: result.data.data.accessToken,
        user: {
          username: result.data.data.user.name,
          id: result.data.data.user._id,
        },
      };
      //console.log(user_data);
      //localStorage.setItem("user_data", JSON.stringify(user_data));

      //context API
      login(user_data.accessToken, user_data.user);
      //end context API
      navigate("/post/list");
    } catch (error: any) {
      setMsg(error.response?.data?.message || "Login failed");
      setMsgType("danger");
    }
  };

  return (
    <div className="flex justify-center mt-16 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

        {msg && (
          <div
            className={`text-center mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
              msgType === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              autoFocus
              {...register("email")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register("password")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.password
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;
