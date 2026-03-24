import React, { useState } from "react";
import { FiDownload } from "react-icons/fi"; // download icon
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
const ValidationResult = ({ response }) => {
  if (!response || !response.success) return null;

  const { data, result_file, errors_for_coloms } = response;
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (colName) => {
    setExpandedRow(expandedRow === colName ? null : colName);
  };
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex justify-center">
        Validations Result
      </h1>
      {/* Download button */}
      <div className="flex justify-end">
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
      <div className="flex flex-wrap gap-3 justify-center">
        <div className="px-4 py-3 bg-gray-700 text-white font-bold rounded text-center min-w-[140px]">
          Total Rows: {data.total_rows}
        </div>

        <div className="px-4 py-3 bg-gray-700 text-white font-bold rounded text-center min-w-[140px]">
          Valid Rows: {data.valid_rows}
        </div>

        <div className="px-4 py-3 bg-gray-700 text-white font-bold rounded text-center min-w-[140px]">
          Invalid Rows: {data.invalid_rows}
        </div>
      </div>

      {/* Column-wise stats table */}
      <div className="overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex align">
          Column-wise Errors
        </h2>

        {/* Header */}
        <div className="grid grid-cols-12 bg-gray-200 font-semibold border">
          <div className="p-3">Column</div>
          <div className="p-3 text-center">#Records</div>
          <div className="p-3 text-center">#Valid </div>
          <div className="p-3 text-center">#Invalid</div>
          <div className="p-3 text-center">#Empty</div>
          <div className="p-3 text-center">#Datatype Error</div>
          <div className="p-3 text-center">#Regex Error</div>
          <div className="p-3 text-center">#Redundant Error</div>
          <div className="p-3 text-center">#Fixed header Error</div>
          <div className="p-3 text-center">#Length</div>
          <div className="p-3 text-center">#Blocked</div>
          <div className="p-3 text-center">Action</div>
        </div>

        {/* Rows */}
        {Object.entries(data.column_wise_stats).map(
          ([colName, stats], index) => (
            <div key={colName} className="border-t">
              {/* Main Row */}
              <div
                className={`grid grid-cols-12 items-center text-sm ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <div className="p-3 font-medium break-words">{colName}</div>

                <div className="p-3 text-center">{stats.total_records}</div>
                <div className="p-3 text-center text-green-600 font-semibold">
                  {stats.valid_records}
                </div>
                <div className="p-3 text-center text-red-600 font-semibold">
                  {stats.invalid_records}
                </div>
                <div className="p-3 text-center">{stats.empty_count}</div>

                <div className="p-3 text-center">
                  {stats.datatype_error_count}
                </div>
                <div className="p-3 text-center">
                  {stats.regex_pattern_error_count}
                </div>
                <div className="p-3 text-center">
                  {stats.redundant_error_count}
                </div>
                <div className="p-3 text-center">
                  {stats.fixed_header_error_count}
                </div>
                <div className="p-3 text-center">
                  {stats.length_validation_error_count}
                </div>
                <div className="p-3 text-center">
                  {stats.blocked_word_error_count}
                </div>

                {/* Expand Button */}
                <div className="p-3 text-center">
                  <button
                    onClick={() => toggleRow(colName)}
                    className="text-blue-600 hover:text-blue-800 text-lg"
                  >
                    {expandedRow === colName ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Section */}
              {expandedRow === colName && (
                <div className="bg-gray-50 p-4 border-t space-y-3">
                  <div className="text-sm">
                    <span className="font-semibold">#Dependency Error:</span>{" "}
                    {stats.dependancy_error_count}
                  </div>

                  <div>
                    <div className="font-semibold mb-1">Error Messages:</div>
                    <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                      {stats.error_msg.map((err, idx) => (
                        <div key={idx}>
                          Row {err.row}: {err.error_type} -{" "}
                          {err.error_description}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="font-semibold">Invalid Types:</span>{" "}
                    {errors_for_coloms[colName]?.length > 0
                      ? errors_for_coloms[colName].join(", ")
                      : "No errors"}
                  </div>
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default ValidationResult;
