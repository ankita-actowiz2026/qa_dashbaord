import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import apiClient from "../../services/apiClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // adjust path
import axios from "axios";
import toast from "react-hot-toast";

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
};
import * as yup from "yup";

const updateProfileSchema = yup.object({
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
});
const UpdateProfile: React.FC = () => {
  const { user, setUserData } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(updateProfileSchema),
  });

  // ✅ Prefill form
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        role: user.role || "",
      });
    }
  }, [user, reset]);

  // ✅ Submit
  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
      };
      const result = await apiClient.post(
        "/admin/auth/update_profile",
        payload,
      );
      console.log(result.data.data);
      const apiUser = result.data.data;
      setUserData(apiUser);
      toast.success("Profile updated successfully");
      navigate("/admin/dashboard");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    }
  };

  // ✅ Toast for Yup errors
  useEffect(() => {
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.message) {
        toast.error(firstError.message as string);
      }
    }
  }, [errors]);

  return (
    <div className="flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-lg p-6 bg-white border border-gray-200 shadow-md rounded-2xl">
        {/* HEADER */}
        <h2 className="mb-1 text-xl font-semibold text-gray-800">
          Update Profile
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Update your personal details
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              {...register("first_name")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              {...register("last_name")}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Email (Read Only) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register("email")}
              disabled
              className="w-full px-3 py-2 text-gray-500 bg-gray-100 border rounded-lg cursor-not-allowed"
            />
          </div>

          {/* Role (Read Only) */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Role
            </label>
            <input
              {...register("role")}
              disabled
              className="w-full px-3 py-2 text-gray-500 bg-gray-100 border rounded-lg cursor-not-allowed"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
