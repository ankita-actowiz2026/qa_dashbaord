import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

import type { IEmployee } from "../../interface/employee.interface";
interface EmployeeRowProps {
  employeeData: IEmployee;
  handleDelete: (id: string) => void;
}
const EmployeeRow = ({ employeeData, handleDelete }: EmployeeRowProps) => {
  const navigate = useNavigate();

  const handleEdit = (id: string) => {
    return navigate("/employee/add/" + id);
  };

  return (
    <>
      <tr>
        <td>{employeeData.title}</td>
        <td>
          <img
            src={`${BACKEND_URL}/${employeeData.single_image}`}
            alt="profile"
            width="150"
          />
        </td>
        <td>{new Date(employeeData.DOB).toLocaleDateString()}</td>
        <td>
          <Button onClick={() => handleEdit(employeeData._id)} variant="info">
            Update
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this record?")
              ) {
                handleDelete(employeeData._id);
              }
            }}
          >
            Delete
          </Button>
        </td>
      </tr>
    </>
  );
};

export default EmployeeRow;
