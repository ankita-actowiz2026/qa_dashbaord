import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { IEmployee } from "../../interface/employee.interface";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface EmployeeRowProps {
  employeeData: IEmployee;
  handleDelete: (id: string) => void;
}

function EmployeeRow({ employeeData, handleDelete }: EmployeeRowProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/employee/add/${employeeData._id}`);
  };

  const confirmDelete = () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this record?",
    );
    if (confirm) handleDelete(employeeData._id);
  };

  return (
    <tr>
      <td>{employeeData.title || "-"}</td>
      <td>
        <img
          src={`${BACKEND_URL}/${employeeData.single_image}`}
          alt="profile"
          width="100"
          height="100"
        />
      </td>
      <td>
        {employeeData?.DOB
          ? new Date(employeeData.DOB).toLocaleDateString()
          : "-"}
      </td>

      <td className=" gap-2">
        <Button variant="info" size="sm" onClick={handleEdit}>
          Update
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={confirmDelete}
          aria-label="Delete employee"
        >
          Delete
        </Button>
      </td>
    </tr>
  );
}

export default EmployeeRow;
