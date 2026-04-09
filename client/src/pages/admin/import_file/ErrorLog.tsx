import React, { useEffect, useState } from "react";
import apiClient from "../../../services/apiClient";
import { useNavigate, useParams } from "react-router";

const ErrorLog = () => {
  const { fileName } = useParams();
  const [errors, setErrors] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const response = await apiClient.get(
          `admin/api/error-log/${fileName}`,
          {
            withCredentials: true,
          },
        );

        setErrors(response.data.errors || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, []);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "required":
        return "bg-red-100 text-red-600";
      case "invalid_format":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading errors...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Error Log</h1>
        <p className="text-base text-gray-500">
          File: <span className="font-medium">{fileName}</span>
        </p>
        <p className="text-base text-gray-500">Total Errors: {errors.length}</p>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border shadow rounded-2xl">
        <div className="">
          <table className="w-full text-xl">
            <thead className="sticky top-0 border-b bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="p-3">Row</th>
                <th className="p-3">Column</th>
                <th className="p-3">Error Type</th>
                <th className="p-3">Message</th>
              </tr>
            </thead>

            <tbody>
              {errors.map((err: any, index) => (
                <tr
                  key={index}
                  className="transition border-b hover:bg-gray-50"
                >
                  <td className="p-3 font-medium text-gray-700">
                    {err.rowNumber}
                  </td>

                  <td className="p-3">{err.columnName}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(
                        err.errorType,
                      )}`}
                    >
                      {err.errorType}
                    </span>
                  </td>

                  <td className="p-3 text-gray-600">{err.errorMsg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {errors.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No errors found 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorLog;
