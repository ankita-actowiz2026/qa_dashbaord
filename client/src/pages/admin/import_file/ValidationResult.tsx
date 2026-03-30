import { useState } from "react";
import SummaryCard from "./SummaryCard";
import { useNavigate } from "react-router-dom";
import { FaUpload } from "react-icons/fa";
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const getFilteredColumns = (columnStats: any) => {
  return Object.entries(columnStats).filter(([_, stats]: any) => {
    const keys = Object.keys(stats);

    return keys.some(
      (key) =>
        ![
          "total_records",
          "valid_records",
          "invalid_records",
          "error_msg",
        ].includes(key) &&
        stats[key] !== 0 &&
        stats[key] !== null,
    );
  });
};
const ValidationResult = ({ responseData, onUploadNew }: any) => {
  const navigate = useNavigate();
  const [expandedColumn, setExpandedColumn] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState<any>(null);

  if (!responseData) return null;

  const { total_rows, valid_rows, invalid_rows, column_wise_stats } =
    responseData.data;
  const { result_file, errors_for_coloms } = responseData;

  const filteredColumns = getFilteredColumns(column_wise_stats);

  return (
    <div className="mt-6 space-y-6">
      <div className="mt-6 text-right">
        <button
          onClick={onUploadNew}
          className="flex items-center gap-2 bg-black border border-gray-300 text-white py-2.5 px-5 rounded-xl font-medium hover:bg-gray-700 hover:shadow-sm transition-all duration-200"
        >
          <FaUpload className="text-sm" />
          Upload Another File
        </button>
      </div>
      {/* 🔹 TOP SUMMARY */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard title="Total Rows" value={total_rows} />
        <SummaryCard title="Valid Rows" value={valid_rows} success />
        <SummaryCard title="Invalid Rows" value={invalid_rows} error />
      </div>
      <div className="flex justify-end">
        <a
          href={result_file}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 rounded-xl "
        >
          Download Report
        </a>
      </div>
      {/* 🔹 COLUMN LIST */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="text-sm font-semibold text-gray-700">
            Column Results
          </h2>
        </div>

        {/* BODY */}
        <div className="divide-y">
          {filteredColumns.length === 0 ? (
            // ✅ EMPTY STATE
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="mb-2 text-green-500" size={32} />
              <p className="text-sm font-semibold text-green-600">
                All validations passed
              </p>
              <p className="mt-1 text-xs text-gray-400">
                No issues were found in your uploaded data.
              </p>
            </div>
          ) : (
            filteredColumns.map(([col, stats]: any) => {
              const issues = Object.entries(stats).filter(
                ([key, val]) =>
                  ![
                    "total_records",
                    "valid_records",
                    "invalid_records",
                    "error_msg",
                  ].includes(key) &&
                  val !== 0 &&
                  val !== null,
              );

              return (
                <div
                  key={col}
                  className="transition-all duration-200 hover:bg-gray-50"
                >
                  {/* ROW */}
                  <div className="flex items-center justify-between gap-4 px-5 py-4">
                    {/* LEFT */}
                    <div className="flex items-center flex-1 gap-3 overflow-hidden">
                      {/* Column Name */}
                      <div className="font-medium text-gray-800 truncate max-w-[180px]">
                        {col}
                      </div>

                      {/* Issues */}
                      <div className="flex flex-wrap gap-2">
                        {issues.length > 0 ? (
                          issues.map(([key, val]) => (
                            <span
                              key={key}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-full"
                            >
                              <AlertCircle size={12} />
                              {key.replaceAll("_", " ")} ({val})
                            </span>
                          ))
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle size={14} />
                            No issues
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RIGHT BUTTON */}
                    <button
                      onClick={() =>
                        setExpandedColumn(expandedColumn === col ? null : col)
                      }
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 transition bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      {expandedColumn === col ? (
                        <>
                          Hide <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          Details <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* EXPAND */}
                  {expandedColumn === col && (
                    <div className="px-5 pb-5 space-y-4 bg-gray-50">
                      {/* 🔹 SUMMARY BLOCK */}
                      <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                          Invalid Types
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {errors_for_coloms[col]?.length > 0 ? (
                            errors_for_coloms[col].map((err, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-full"
                              >
                                {err}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-green-600">
                              No issues found
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 🔹 ERROR DETAILS */}
                      {(stats.error_msg && stats.error_msg.length > 0) ?? (
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
                          {/* Header */}
                          <div className="sticky top-0 z-10 px-4 py-3 bg-white border-b rounded-t-xl">
                            <p className="text-sm font-semibold text-gray-700">
                              Error Details
                            </p>
                          </div>

                          {/* Content */}
                          {stats.error_msg && stats.error_msg.length > 0 ? (
                            <div className="max-h-[320px] overflow-y-auto divide-y">
                              {stats.error_msg.map((err, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 px-4 py-2 text-xs transition hover:bg-gray-50"
                                >
                                  {/* Row */}
                                  <span className="font-semibold text-gray-600 whitespace-nowrap">
                                    Row {err.row}
                                  </span>

                                  {/* Type Badge */}
                                  <span className="px-2 py-0.5 text-[11px] font-medium text-red-600 bg-red-100 rounded whitespace-nowrap">
                                    {err.error_type}
                                  </span>

                                  {/* Description */}
                                  <span className="text-gray-700 truncate">
                                    {err.error_description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-6 text-center">
                              <p className="text-xs text-green-600">
                                No errors found 🎉
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default ValidationResult;
