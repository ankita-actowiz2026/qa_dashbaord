import { useNavigate } from "react-router-dom";
import type { IPost } from "../../../interface/post.interface";

interface PostRowProps {
  postData: IPost;
  handleDelete: (id: string) => void;
}

function PostRow({ postData, handleDelete }: PostRowProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/post/add/${postData._id}`);
  };

  const confirmDelete = () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this record?",
    );
    if (confirm) handleDelete(postData._id);
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3">{postData.title || "-"}</td>

      <td className="px-4 py-3">{postData.email || "-"}</td>

      <td className="px-4 py-3 max-w-xs truncate">
        {postData.description || "-"}
      </td>

      <td className="px-4 py-3">{postData.author || "-"}</td>

      <td className="px-4 py-3">
        {postData.published ? (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Yes
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            No
          </span>
        )}
      </td>

      <td className="px-4 py-3">{postData.option_type || "-"}</td>

      <td className="px-4 py-3">
        {Array.isArray(postData.skills) && postData.skills.length ? (
          <div className="flex flex-wrap gap-1">
            {postData.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          "-"
        )}
      </td>

      <td className="px-4 py-3">
        {Array.isArray(postData.tags) && postData.tags.length ? (
          <div className="flex flex-wrap gap-1">
            {postData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          "-"
        )}
      </td>

      <td className="px-4 py-3">
        {postData.createdAt
          ? new Date(postData.createdAt).toLocaleDateString()
          : "-"}
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleEdit}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-md transition"
          >
            Update
          </button>

          <button
            onClick={confirmDelete}
            aria-label="Delete post"
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
export default PostRow;
