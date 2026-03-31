import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext"; // adjust path
import { Eye, EyeOff } from "lucide-react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import apiClient from "../../services/apiClient";
import { useNavigate } from "react-router-dom";

type FormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),

  newPassword: yup
    .string()
    .required("New password is required")
    .min(6, "Password must be at least 6 characters"),

  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("newPassword")], "Passwords do not match"),
});
const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(changePasswordSchema),
  });

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        user_id: user?.id,
        current_password: data.currentPassword,
        new_password: data.newPassword,
      };

      await apiClient.post("/admin/auth/change_password", payload);

      toast.success("Password changed successfully");
      navigate("/admin/dashboard");
      reset();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to change password";

      toast.error(msg);
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
  return (
    <div className="flex items-start justify-center  px-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 shadow-md rounded-2xl">
        {/* HEADER */}
        <h2 className="mb-1 text-xl font-semibold text-gray-800">
          Change Password
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Update your account password securely
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* CURRENT PASSWORD */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Current Password
            </label>
            <div className="relative">
              <input
                type={show.current ? "text" : "password"}
                {...register("currentPassword")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                onClick={() =>
                  setShow((prev) => ({ ...prev, current: !prev.current }))
                }
                className="absolute text-gray-500 cursor-pointer right-3 top-2.5"
              >
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <input
                type={show.new ? "text" : "password"}
                {...register("newPassword")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                onClick={() => setShow((prev) => ({ ...prev, new: !prev.new }))}
                className="absolute text-gray-500 cursor-pointer right-3 top-2.5"
              >
                {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={show.confirm ? "text" : "password"}
                {...register("confirmPassword")}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span
                onClick={() =>
                  setShow((prev) => ({ ...prev, confirm: !prev.confirm }))
                }
                className="absolute text-gray-500 cursor-pointer right-3 top-2.5"
              >
                {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
