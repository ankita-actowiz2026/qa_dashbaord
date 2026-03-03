import apiClient from "../../../utils/front/apiClient";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";
import type { IPost } from "../../../interface/post.interface";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const tagOptions = [
  "Suspense",
  "Informative",
  "Knowledge",
  "Religious",
  "Health",
];
const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  email: yup.string().email("Enter valid email").required("Email required"),
  description: yup.string().required("Description is required"),
  author: yup.string().required("Author is required"),
  published: yup.boolean().required("Published is required"),
  option_type: yup.string().required("Option type is required"),
  skills: yup
    .array()
    .of(yup.string().required())
    .min(1, "Please select at least one skills")
    .required("Please select skills"),
  tags: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one tag")
    .required("Tags are required"),
});

function PostAdd() {
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
    const fetchPost = async () => {
      setLoading(true);
      try {
        const tokenData = JSON.parse(localStorage.getItem("auth_data") || "{}");
        const { data } = await axios.get(BACKEND_URL + `/api/post/${id}`, {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
        });
        Object.entries(data.data).forEach(([k, v]) =>
          setValue(k as keyof IPost, v),
        );
        setValue("option_type", data.data.option_type);
        setValue("published", data.data.published.toString());
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

    fetchPost();
  }, [id]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IPost>({
    resolver: yupResolver(schema),
    defaultValues: {
      skills: [],
      //  published: "false",
      tags: [],
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
  const onSubmit = async (data: IPost) => {
    setLoading(true);
    try {
      const send_data = {
        title: data.title,
        email: data.email,
        description: data.description,
        author: data.author,
        published: data.published,
        option_type: data.option_type,
        tags: data.tags,
        skills: data.skills,
      };
      let res: any;
      if (mode == "add") {
        res = await apiClient.post("/api/post", send_data);
      } else {
        res = await apiClient.put("/api/post/" + id, send_data);
      }

      navigate("/post/list", {
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
          Post
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
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              autoFocus
              type="text"
              placeholder="Title"
              {...register("title")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors.title
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              rows={4}
              {...register("description")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.description
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium mb-1">Author</label>
            <input
              type="text"
              {...register("author")}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.author
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            />
            {errors.author && (
              <p className="text-red-500 text-sm mt-1">
                {errors.author.message}
              </p>
            )}
          </div>

          {/* Published */}
          <div>
            <label className="block text-sm font-medium mb-2">Published</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="true"
                  {...register("published", {
                    setValueAs: (v) => v === "true",
                  })}
                  className="accent-blue-600"
                />
                Yes
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="false"
                  {...register("published", {
                    setValueAs: (v) => v === "true",
                  })}
                  className="accent-blue-600"
                />
                No
              </label>
            </div>
            {errors.published && (
              <p className="text-red-500 text-sm mt-1">
                {errors.published.message}
              </p>
            )}
          </div>

          {/* Option Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Option Type
            </label>
            <select
              {...register("option_type")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Select --</option>
              <option value="AB">AB</option>
              <option value="BC">BC</option>
              <option value="CD">CD</option>
              <option value="DE">DE</option>
            </select>
            {errors.option_type && (
              <p className="text-red-500 text-sm mt-1">
                {errors.option_type.message}
              </p>
            )}
          </div>

          {/* Skills (Multi Select) */}
          <div>
            <label className="block text-sm font-medium mb-1">Skills</label>
            <select
              multiple
              {...register("skills")}
              onChange={(e) =>
                setValue(
                  "skills",
                  Array.from(e.target.selectedOptions, (o) => o.value),
                  { shouldValidate: true },
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            >
              <option value="cricket">Cricket</option>
              <option value="badminton">Badminton</option>
              <option value="a">a</option>
              <option value="b">b</option>
            </select>
            {errors.skills && (
              <p className="text-red-500 text-sm mt-1">
                {errors.skills.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-3">
              {tagOptions.map((tag) => (
                <label key={tag} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value={tag}
                    {...register("tags")}
                    className="accent-blue-600"
                  />
                  {tag}
                </label>
              ))}
            </div>
            {errors.tags && (
              <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
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
              onClick={() => navigate(`/post/list`)}
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
export default PostAdd;
