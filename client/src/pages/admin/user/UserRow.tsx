import { useNavigate } from "react-router-dom";
import type { IUser } from "../../../interface/user.interface";

interface UserRowProps {
  userData: IUser;
  handleDelete: (id: string) => void;
}

function UserRow({ userData, handleDelete }: UserRowProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/admin/user/add/${userData._id}`);
  };

  const confirmDelete = () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this record?",
    );
    if (confirm) handleDelete(userData._id);
  };

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3">{userData.name || "-"}</td>
      <td className="px-4 py-3">{userData.email || "-"}</td>
      <td className="px-4 py-3 max-w-xs truncate">{userData.status || "-"}</td>
      <td className="px-4 py-3">
        {userData.createdAt
          ? new Date(userData.createdAt).toLocaleDateString()
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
            aria-label="Delete user"
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
export default UserRow;
