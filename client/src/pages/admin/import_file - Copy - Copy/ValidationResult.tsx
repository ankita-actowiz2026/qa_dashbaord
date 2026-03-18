import React from "react";
import { FiDownload } from "react-icons/fi"; // download icon

const ValidationResult = ({ response }) => {
  if (!response || !response.success) return null;

  const { data, result_file, errors_for_coloms } = response;

  return (
    <div className="p-6 space-y-6">
      {/* Download button */}
      <div>
        <a
          href={result_file}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download Report
        </a>
      </div>

      {/* Summary counts */}
      <div className="flex gap-6 text-lg font-semibold">
        <div>Total Rows: {data.total_rows}</div>
        <div>Valid Rows: {data.valid_rows}</div>
        <div>Invalid Rows: {data.invalid_rows}</div>
      </div>

      {/* Column-wise stats table */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-bold mb-2">Column-wise Stats</h2>
        <table className="min-w-full border border-gray-300 text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Column</th>
              <th className="p-2 border">Total Records</th>
              <th className="p-2 border">Valid Records</th>
              <th className="p-2 border">Invalid Records</th>
              <th className="p-2 border">Empty Count</th>
              <th className="p-2 border">Pattern Error Count</th>
              <th className="p-2 border">Redundant Error Count</th>
              <th className="p-2 border">Error Messages</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.column_wise_stats).map(([colName, stats]) => (
              <tr key={colName} className="even:bg-gray-50">
                <td className="p-2 border">{colName}</td>
                <td className="p-2 border">{stats.total_records}</td>
                <td className="p-2 border">{stats.valid_records}</td>
                <td className="p-2 border">{stats.invalid_records}</td>
                <td className="p-2 border">{stats.empty_count}</td>
                <td className="p-2 border">{stats.pattern_error_count}</td>
                <td className="p-2 border">{stats.redundant_error_count}</td>
                <td className="p-2 border">
                  {stats.error_msg.map((err, idx) => (
                    <div key={idx}>
                      Row {err.row}: {err.error_type} - {err.error_description}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Errors for columns */}
      <div className="overflow-x-auto">
        <h2 className="text-xl font-bold mb-2">Errors for Columns</h2>
        <table className="min-w-full border border-gray-300 text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Column</th>
              <th className="p-2 border">Errors</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(errors_for_coloms).map(([colName, errs]) => (
              <tr key={colName} className="even:bg-gray-50">
                <td className="p-2 border">{colName}</td>
                <td className="p-2 border">
                  {errs.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ValidationResult;
