import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import type { IPost } from "../../../interface/post.interface";
import PostRow from "./PostRow";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function ListWithPagination() {
  const [postData, setPostData] = useState<IPost[]>([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(5);

  const filteredPosts = postData.filter((post) =>
    Object.values(post).join(" ").toLowerCase().includes(search.toLowerCase()),
  );
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: any = a[sortField as keyof IPost];
    let bVal: any = b[sortField as keyof IPost];

    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (Array.isArray(aVal)) aVal = aVal.join(", ");
    if (Array.isArray(bVal)) bVal = bVal.join(", ");

    if (typeof aVal === "boolean") {
      return sortOrder === "asc"
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    }

    const aDate = Date.parse(aVal);
    const bDate = Date.parse(bVal);
    if (!isNaN(aDate) && !isNaN(bDate)) {
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    }

    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);

  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => setMsg(""), 5000);
    return () => clearTimeout(timer);
  }, [msg]);

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
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
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

      await axios.delete(BACKEND_URL + `/api/post/${id}`, {
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
        },
      });
      setMsg("Deleted successfully");
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Posts</h2>

        {/* Show Entries */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <select
            value={postsPerPage}
            onChange={(e) => {
              setPostsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm">entries</span>
        </div>

        {/* Create Button */}
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
                          <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
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
                      No posts found
                    </td>
                  </tr>
                ) : (
                  currentPosts.map((item) => (
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
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2 flex-wrap">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === i + 1
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
export default ListWithPagination;
