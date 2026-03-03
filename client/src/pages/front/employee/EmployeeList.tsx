import Container from "react-bootstrap/Container";
import React, { useEffect, useState, useCallback } from "react";
import { Button, Table, Spinner } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import type { IEmployee } from "../../interface/employee.interface";
import EmployeeRow from "./EmployeeRow";
import Alert from "react-bootstrap/Alert";
import apiClient from "../../utils/apiClient";

function EmployeeList() {
  const [employeeData, setemployeeData] = useState<IEmployee[]>([]);
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

  // Fetch employee
  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);

    try {
      const { data } = await apiClient.get(`/api/employee`, {
        signal: controller.signal,
      });
      setemployeeData(data.data);
    } catch (error: any) {
      if (error.name !== "CanceledError") {
        setMsg("Failed to load employees");
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

  // Delete employee with optimistic delete
  const handleDelete = async (id: string) => {
    const previousData = employeeData;
    setemployeeData((prev) => prev.filter((p) => p._id !== id));

    try {
      await apiClient.delete(`/api/employee/${id}`);
      setMsg("Deleted successfully");
      setMsgType("success");
    } catch (error: any) {
      setemployeeData(previousData);
      setMsg(error.response?.data?.message || "Delete failed");
      setMsgType("danger");
    }
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">employees</h2>
        <Link to="/employee/add">
          <Button variant="success">Create Employee</Button>
        </Link>
      </div>

      {msg && (
        <Alert
          variant={msgType === "success" ? "success" : "danger"}
          className="text-center"
        >
          {msg}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>single image</th>
                <th>DOB</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted py-5">
                    No employees found
                  </td>
                </tr>
              ) : (
                employeeData.map((item) => (
                  <EmployeeRow
                    key={item._id}
                    employeeData={item}
                    handleDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}
export default EmployeeList;
