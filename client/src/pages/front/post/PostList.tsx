import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import PostRow from "./PostRow";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function PostList() {
  const [postData, setPostData] = useState<IPost[]>([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Auto hide message
  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => setMsg(""), 5000);
    return () => clearTimeout(timer);
  }, [msg]);

  // Message from navigation
  useEffect(() => {
    if (location.state?.msg) {
      setMsg(location.state.msg);
      setMsgType(location.state.type);
    }
  }, [location.state]);

  // Fetch posts
  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);

    try {
      const tokenData = JSON.parse(localStorage.getItem("auth_data") || "{}");

      const { data } = await axios.get(BACKEND_URL + `/api/post`, {
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
        signal: controller.signal,
      });
      setPostData(data.data);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setMsg(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load posts",
        );
        setMsgType("danger");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delete post with optimistic delete
  const handleDelete = async (id: string) => {
    const previousData = postData;
    setPostData((prev) => prev.filter((p) => p._id !== id));
    try {
      const tokenData = JSON.parse(localStorage.getItem("auth_data") || "{}");

      const res = await axios.delete(BACKEND_URL + `/api/post/${id}`, {
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });
      setMsg(res.data.message);
      setMsgType("success");
    } catch (error: any) {
      setPostData(previousData);
      setMsg(error.response?.data?.message || "Delete failed");
      setMsgType("danger");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Posts</h2>

        <Link to="/post/add">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition">
            + Create Post
          </button>
        </Link>
      </div>

      {/* Alert Message */}
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

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Desc</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Skills</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {postData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-500">
                    No post found
                  </td>
                </tr>
              ) : (
                postData.map((item) => (
                  <PostRow
                    key={item._id}
                    postData={item}
                    handleDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default PostList;
