import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import registrationValidate from "../../validation/front/registration.validations";
import type { registrationInterface } from "../../interface/registrations.interface";
import axios from "axios";
import { useNavigate } from "react-router-dom";
//import apiClient from "../../utils/front/apiClient";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Registration = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<registrationInterface>({
    resolver: yupResolver(registrationValidate),
  });

  useEffect(() => {
    if (!msg) return;

    const timer = setTimeout(() => {
      setMsg("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [msg]);

  const onSubmit = async (data: registrationInterface) => {
    try {
      data.status = "active";
      const result = await axios.post(BACKEND_URL + "/api/auth/register", data);
      setMsg(result.data.message);
      setMsgType("success");
      return navigate("/login", {
        state: { msg: result.data.message, type: "success" },
      });
    } catch (error: any) {
      setMsg(error.response?.data?.message || "Server Error");
      setMsgType("danger");
    }
  };

  return (
    <div className="flex justify-center mt-10 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

        {/* Alert Message */}
        {msg && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium border ${
              msgType === "success"
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-red-100 text-red-700 border-red-300"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              {...register("name")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Registration;
