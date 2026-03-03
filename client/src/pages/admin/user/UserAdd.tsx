import apiClient from "../../../utils/front/apiClient";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";
import type { IUser } from "../../../interface/user.interface";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Enter valid email").required("Email required"),
  password: yup.string().required("Password is required"),  
  status: yup.string().required("Status is required"),
});

function UserAdd() {
  const { id } = useParams();
  const topRef = useRef<HTMLHeadingElement>(null);
  const [mode, setMode] = useState("add");
  let navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");

  useEffect(() => {
    if (id) setMode("edit");
  }, [id]);

  useEffect(() => {
    if (msg && msgType === "danger") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(() => topRef.current?.focus());
    }
  }, [msg, msgType]);
  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const tokenData = JSON.parse(localStorage.getItem("admin_data") || "{}");
        const { data } = await axios.get(BACKEND_URL + `/admin/user/${id}`, {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
        });
        Object.entries(data.data).forEach(([k, v]) =>
          setValue(k as keyof IUser, v),
        );        
        //setValue("status", data.data.status.toString());
      } catch (error: any) {
        setMsg(
          error?.response?.data?.message ||
            error?.message ||
            "Something went wrong",
        );
        setMsgType("danger");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IUser>({
    resolver: yupResolver(schema),
    defaultValues: {      
        status: "active",      
    },
  });
  // const formValues = watch();
  // console.log(formValues);

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        setMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);
  const onSubmit = async (data: IUser) => {
    setLoading(true);
    try {
      const send_data = {
        name: data.name,
        email: data.email,
        password: data.password,        
        status: data.status,
      };
      let res: any;
      const tokenData = JSON.parse(localStorage.getItem("admin_data") || "{}"); 
      if (mode == "add") {
        res = await axios.post(
          BACKEND_URL + "/admin/user",
          send_data,
          {
            headers: {
              Authorization: `Bearer ${tokenData.accessToken}`,
            },
          }
        );
      } else {
        res = await apiClient.put( BACKEND_URL + "/admin/user/" + id, send_data,
          {
            headers: {
              Authorization: `Bearer ${tokenData.accessToken}`,
            },
          });
      }

      navigate("/admin/user/list", {
        state: { msg: res.data.message, type: "success" },
      });
    } catch (error: any) {
      setMsg(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong",
      );
      setMsgType("danger");
      window.scrollTo({ top: 0, behavior: "smooth" });

      requestAnimationFrame(() => {
        topRef.current?.focus();
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center mt-10 px-4">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl p-8">
        <h2 ref={topRef} className="text-2xl font-bold text-center mb-6">
          User
        </h2>

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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`space-y-5 ${loading ? "opacity-50" : ""}`}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              autoFocus
              type="text"
              placeholder="Title"
              {...register("name")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.name
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
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

         
         {mode === "add" ? (
         
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
             <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          ): null}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="active"
                  {...register("status")}
                  className="accent-blue-600"
                />
                Active
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="inactive"
                  {...register("status")}
                  className="accent-blue-600"
                />
                Inactive
              </label>
            </div>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">
                {errors.status.message}
              </p>
            )}
          </div>
         
          {/* Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/admin/user/list`)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default UserAdd;
