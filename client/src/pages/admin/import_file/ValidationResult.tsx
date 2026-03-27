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
        Validation Summary
      </h1>
      {/* Download button */}
      <div className="flex justify-end">
        <a
          href={result_file}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700  rounded-xl "
        >
          Download Report
        </a>
      </div>

      {/* Summary counts */}
      <div className="flex flex-wrap gap-3 justify-center">
        <div className="px-4 py-3 bg-gray-700 text-white font-bold rounded-xl text-center min-w-[140px] shadow-sm">
          Total Rows : {data.total_rows}
        </div>

        <div className="px-4 py-3 bg-gray-700 text-white font-bold rounded-xl text-center min-w-[140px] shadow-sm">
          Valid Rows : {data.valid_rows}
        </div>

        <div className="px-4 py-3 bg-gray-700 text-white font-bold rounded-xl text-center min-w-[140px] shadow-sm">
          Invalid Rows : {data.invalid_rows}
        </div>
      </div>

      {/* Column-wise stats table */}
      {/* Column-wise stats table */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 text-center md:text-left">
          Column Error Details{" "}
        </h2>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 bg-gray-200 font-semibold border text-sm rounded-lg overflow-hidden">
              <div className="p-3">Column</div>
              <div className="p-3 text-center">Records</div>
              <div className="p-3 text-center">Valid</div>
              <div className="p-3 text-center">Invalid</div>
              <div className="p-3 text-center">Datatype</div>
              <div className="p-3 text-center">Empty</div>
              <div className="p-3 text-center">Regex</div>
              <div className="p-3 text-center">Length</div>
              <div className="p-3 text-center">Redundant</div>
              <div className="p-3 text-center">Header</div>
              <div className="p-3 text-center">Start/End</div>
              <div className="p-3 text-center">Action</div>
            </div>

            {/* Rows */}
            {Object.entries(data.column_wise_stats).map(
              ([colName, stats], index) => (
                <div key={colName} className="border-t">
                  <div
                    className={`grid grid-cols-12 items-center text-sm ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <div className="p-3 font-medium">
                      {colName
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </div>

                    <div className="p-3 text-center">{stats.total_records}</div>
                    <div className="p-3 text-center text-green-600">
                      {stats.valid_records}
                    </div>
                    <div className="p-3 text-center text-red-600">
                      {stats.invalid_records}
                    </div>

                    <div className="p-3 text-center">
                      {stats.datatype_error_count}
                    </div>
                    <div className="p-3 text-center">{stats.empty_count}</div>
                    <div className="p-3 text-center">
                      {stats.regex_pattern_error_count}
                    </div>
                    <div className="p-3 text-center">
                      {stats.length_validation_error_count}
                    </div>
                    <div className="p-3 text-center">
                      {stats.redundant_error_count}
                    </div>
                    <div className="p-3 text-center">
                      {stats.fixed_header_error_count}
                    </div>
                    <div className="p-3 text-center">
                      {stats.cell_start_with_end_with_error_count}
                    </div>

                    <div className="p-3 text-center">
                      <button onClick={() => toggleRow(colName)}>
                        {expandedRow === colName ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>
                  {expandedRow === colName && (
                    <div className="bg-gray-50 border-t p-3 md:p-4 space-y-3 md:pl-16">
                      {/* Grid instead of plain divs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">
                            Dependency Error:
                          </span>{" "}
                          {stats.dependancy_error_count}
                        </div>

                        <div className="sm:col-span-2 break-words">
                          <span className="font-semibold">Invalid Types:</span>{" "}
                          {errors_for_coloms[colName]?.length > 0
                            ? errors_for_coloms[colName].join(", ")
                            : "No errors"}
                        </div>
                      </div>

                      {/* Optional Scrollable Error Messages */}
                      {stats.error_msg?.length > 0 && (
                        <div>
                          <div className="font-semibold mb-1 text-sm">
                            Error Messages:
                          </div>
                          <div className="max-h-40 overflow-y-auto text-xs md:text-sm space-y-1 bg-white p-2 rounded border">
                            {stats.error_msg.map((err, idx) => (
                              <div key={idx} className="break-words">
                                Row {err.row}: {err.error_type} -{" "}
                                {err.error_description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        {/* 📱 Mobile Card View */}
        <div className="md:hidden space-y-4">
          {Object.entries(data.column_wise_stats).map(([colName, stats]) => (
            <div key={colName} className="bg-white shadow rounded-lg p-4">
              <div className="font-bold text-lg mb-2">
                {colName
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total: {stats.total_records}</div>
                <div className="text-green-600">
                  Valid: {stats.valid_records}
                </div>
                <div className="text-red-600">
                  Invalid: {stats.invalid_records}
                </div>
                <div>Empty: {stats.empty_count}</div>
                <div>Datatype: {stats.datatype_error_count}</div>
                <div>Regex: {stats.regex_pattern_error_count}</div>
                <div>Length: {stats.length_validation_error_count}</div>
                <div>Redundant: {stats.redundant_error_count}</div>
              </div>

              {/* Expand */}
              <button
                onClick={() => toggleRow(colName)}
                className="mt-3 text-blue-600 text-sm"
              >
                {expandedRow === colName ? "Hide Details ▲" : "View Details ▼"}
              </button>

              {expandedRow === colName && (
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <div>Blocked: {stats.blocked_word_error_count}</div>
                  <div>Dependency: {stats.dependancy_error_count}</div>
                  <div>
                    Errors:{" "}
                    {errors_for_coloms[colName]?.length > 0
                      ? errors_for_coloms[colName].join(", ")
                      : "No errors"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValidationResult;
