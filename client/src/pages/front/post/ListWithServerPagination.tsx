import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import type { IPost } from "../../../interface/post.interface";
import PostRow from "./PostRow";
import apiClient from "../../../utils/front/apiClient";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function ListWithServerPagination() {
  const [postData, setPostData] = useState<IPost[]>([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("_id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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

      const { data } = await axios.get(
        BACKEND_URL + "/api/post/serverPagination",
        {
          signal: controller.signal,
          params: {
            page,
            limit,
            search,
            sortField,
            sortOrder,
          },
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
        },
      );

      setPostData(data.data);
      setTotal(data.total);
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
  }, [page, limit, search, sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delete post with optimistic delete
  const handleDelete = async (id: string) => {
    const previousData = postData;
    setPostData((prev) => prev.filter((p) => p._id !== id));
    try {
      const res = await apiClient.delete(`/api/post/${id}`);
      setMsg(res.data.message);
      setMsgType("success");
    } catch (error: any) {
      setPostData(previousData);
      setMsg(error.response?.data?.message || "Delete failed");
      setMsgType("danger");
    }
  };
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, [postData]); // or [loading]
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Posts</h2>

        <Link
          to="/post/add"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + Create Post
        </Link>
      </div>

      {/* Alert */}
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
        <>
          {/* Search */}
          <input
            ref={searchRef}
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 w-full md:w-80 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400"
          />

          {/* Table */}
          <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  {[
                    { label: "Title", field: "title" },
                    { label: "Email", field: "email" },
                    { label: "Desc", field: "description" },
                    { label: "Author", field: "author" },
                    { label: "Published", field: "published" },
                    { label: "Type", field: "option_type" },
                    { label: "Date", field: "createdAt" },
                  ].map((col) => (
                    <th
                      key={col.field}
                      onClick={() => handleSort(col.field)}
                      className="px-4 py-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field && (
                          <span className="text-xs">
                            {sortOrder === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                  <th className="px-4 py-3">Skills</th>
                  <th className="px-4 py-3">Tags</th>
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

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center mt-6 gap-2 flex-wrap">
              {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    page === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default ListWithServerPagination;
