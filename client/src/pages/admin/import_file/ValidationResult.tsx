import AppliedRules from "./AppliedRule";
import { GoDotFill } from "react-icons/go";
import { useState, useMemo, useCallback } from "react";
import { FiCheckCircle } from "react-icons/fi";

import { XCircle } from "lucide-react";
import SummaryCard from "./SummaryCard";
import { useNavigate } from "react-router-dom";
import { FaUpload } from "react-icons/fa";
import { FiFileText, FiDownload } from "react-icons/fi";
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "react-router-dom";
const formatErrorMsg = (count, label) => {
  if (!count || count === 0) {
    return "No validation errors found";
  }

  switch (label) {
    case "Length Type":
      return `${count} value${count > 1 ? "s" : ""} failed length validation`;

    case "Redundant Value":
      return `${count} duplicate/redundant value${count > 1 ? "s" : ""} found`;

    case "Regex":
      return `${count} value${count > 1 ? "s" : ""} did not match the required pattern`;

    case "Data Type":
      return `${count} value${count > 1 ? "s" : ""} have incorrect data type`;

    case "fixed_header":
      return `${count} value${count > 1 ? "s" : ""} did not match allowed values`;

    case "Dependency":
      return `${count} dependency condition${count > 1 ? "s" : ""} failed`;

    case "cell_start_with":
      return `${count} value${count > 1 ? "s" : ""} did not start with the required prefix`;

    case "cell_end_with":
      return `${count} value${count > 1 ? "s" : ""} did not end with the required suffix`;

    case "blocked":
      return `${count} value${count > 1 ? "s" : ""} contain restricted/blocked content`;

    case "required":
      return `${count} empty or missing value${count > 1 ? "s" : ""} found`;
  }
};
const errorKeyMap = {
  fixed_header: "fixed_header_error_count",
  is_required: "datatype_error_count",
  cell_start_with: "cell_start_with_error_count",
  cell_end_with: "cell_end_with_error_count",
  not_match_found: "blocked_word_error_count",
};
const buildRulesArray = (colRules, issueMap = {}) => {
  const arr = [];
  console.log("+++++++++++");
  console.log(issueMap);
  console.log("+++++++++++");
  if (!colRules) return arr;

  // ✅ Length
  if (colRules.length_validation_type) {
    let value = colRules.length_validation_type;
    if (colRules.length_validation_type == "fixed") {
      value = `${value.charAt(0).toUpperCase() + value.slice(1)} (${
        colRules.min_length ?? "-"
      })`;
    } else {
      value = `${value.charAt(0).toUpperCase() + value.slice(1)} (${
        colRules.min_length ?? "-"
      } To ${colRules.max_length ?? "-"})`;
    }

    arr.push({
      label: "Length Type",
      value,
      errorMsg: formatErrorMsg(
        issueMap.length_validation_error_count,
        "Length Type",
      ),
    });
  }

  // ✅ Redundant
  if (colRules.data_redundant_value !== undefined) {
    let value = colRules.data_redundant_value;

    value = `${value} (Threshold: ${colRules.data_redundant_threshold ?? "-"})`;

    arr.push({
      label: "Redundant Value",
      value,
      errorMsg: formatErrorMsg(issueMap.redundant_error_count, "Redundant"),
    });
  }

  // ✅ Regex
  if (colRules.cell_contains) {
    let value = colRules.cell_contains
      ? `Enabled (${colRules.cell_contains_value || "pattern"})`
      : "Disabled";

    arr.push({
      label: "Regex",
      value,
      errorMsg: formatErrorMsg(issueMap.regex_pattern_error_count, "Regex"),
    });
  }
  if (colRules.data_type) {
    let value = colRules.data_type;

    value =
      colRules.data_type === "date"
        ? `Date (${colRules.date_format || "format"})`
        : colRules.data_type.charAt(0).toUpperCase() +
          colRules.data_type.slice(1);

    arr.push({
      label: "Data Type",
      value,
      errorMsg: formatErrorMsg(issueMap.datatype_error_count, "Data Type"),
    });
  }
  // ✅ Dependency

  if (colRules.dependency && Object.keys(colRules.dependency).length > 0) {
    const value = Object.entries(colRules.dependency)
      .map(([k, v]) => (v === true ? `${k} (Required)` : `${k} (${v})`))
      .join(" - ");

    arr.push({ label: "Dependency", value });
  }

  // ✅ Remaining fields (generic)
  Object.entries(colRules).forEach(([key, value]) => {
    if (
      [
        "name",
        "data_type",
        "date_format",
        "length_validation_type",
        "min_length",
        "max_length",
        "data_redundant_value",
        "data_redundant_threshold",
        "cell_contains",
        "cell_contains_value",
        "dependency",
      ].includes(key)
    ) {
      return;
    }
    const errorCount = issueMap[errorKeyMap[key]];

    arr.push({
      label: key || key,
      value: formatValue(value),
      errorMsg: formatErrorMsg(errorCount, key),
    });
  });

  return arr;
};
const formatValue = (value) => {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object")
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  if (value === true) return "Yes";
  if (value === false) return "No";
  return String(value);
};
const getFilteredColumns = (columnStats: any) => {
  return Object.entries(columnStats).filter(([_, stats]: any) =>
    Object.entries(stats).some(
      ([key, value]) =>
        ![
          "total_records",
          "valid_records",
          "invalid_records",
          "error_msg",
        ].includes(key),
    ),
  );
};
type ColumnError = {
  row: number;
  error_type: string;
  error_description: string;
};

type ColumnStats = {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  error_msg?: ColumnError[];
  [key: string]: any;
};

type ResponseData = {
  data: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    column_wise_stats: Record<string, ColumnStats>;
  };
  result_file: string;
  errors_for_coloms: Record<string, string[]>;
};
const errorStyleMap: Record<string, string> = {
  empty: "text-yellow-700 bg-yellow-50 border-yellow-200",
  regex: "text-purple-700 bg-purple-50 border-purple-200",
  datatype: "text-blue-700 bg-blue-50 border-blue-200",
  length: "text-green-700 bg-green-50 border-green-200",
  start: "text-orange-700 bg-orange-50 border-orange-200",
  end: "text-amber-700 bg-amber-50 border-amber-200",
  duplicate: "text-pink-700 bg-pink-50 border-pink-200",
  redundant: "text-pink-700 bg-pink-50 border-pink-200",
  header: "text-indigo-700 bg-indigo-50 border-indigo-200",
  blocked: "text-rose-700 bg-rose-50 border-rose-200",
  depend: "text-cyan-700 bg-cyan-50 border-cyan-200",
};

const getErrorStyle = (err: string) => {
  const lower = err.toLowerCase();

  const match = Object.keys(errorStyleMap).find((key) => lower.includes(key));

  return match
    ? errorStyleMap[match]
    : "text-gray-700 bg-gray-50 border-gray-200";
};
const FIELD_LABELS = {
  is_required: "Required",
  data_type: "Data Type",

  length_validation_type: "Length Type",
  min_length: "Min Length",
  max_length: "Max Length",

  data_redundant_value: "Redundant Value",
  data_redundant_threshold: "Redundant Threshold",

  cell_contains: "Regex Enabled",
  cell_contains_value: "Regex Pattern",

  fixed_header: "Fixed Values",
  cell_start_with: "Starts With",
  cell_end_with: "Ends With",

  not_match_found: "Blocked Values",

  dependency: "Dependency",
};
const ValidationResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const responseData = location.state?.responseData;
  const requestData = location.state?.requestData;
  const fileName = location.state?.fileName;
  // console.log(responseData);
  console.log("==========");
  console.log(requestData);
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  if (!responseData) {
    return (
      <div className="p-6 text-center text-gray-500">No data available</div>
    );
  }
  const {
    total_rows = 0,
    valid_rows = 0,
    invalid_rows = 0,
    column_wise_stats = {},
  } = responseData?.data || {};
  const { result_file, errors_for_coloms } = responseData;

  const filteredColumns = useMemo(
    () => getFilteredColumns(column_wise_stats),
    [column_wise_stats],
  );
  return (
    <div className="mt-6 space-y-6">
      <h1 className="text-4xl font-semibold text-gray-800">
        Validation Result
        {JSON.stringify(requestData)}
      </h1>
      <p className="text-base text-gray-500"></p>
      <div className="flex items-center justify-end gap-4 mt-6">
        {/* File Name */}
        <div
          className="max-w-xs text-base text-gray-600 truncate"
          title={fileName}
        >
          <span className="text-gray-400">Current file:</span>{" "}
          <span className="inline-flex items-center gap-1 font-medium text-gray-800">
            <FiFileText className="text-gray-400" />
            {fileName || "No file selected"}
          </span>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => navigate("/admin/import_file")}
          className="flex items-center gap-2 bg-black text-white py-2.5 px-5 rounded-xl font-medium hover:bg-gray-700 transition"
        >
          <FaUpload className="text-base" />
          Upload New File
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
          className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700"
        >
          <FiDownload className="text-base" />
          Download Report
        </a>
      </div>
      {/* 🔹 COLUMN LIST */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="text-base font-semibold text-gray-700">
            Column Results ({filteredColumns.length})
          </h2>
        </div>

        {/* BODY */}
        <div className="divide-y">
          {filteredColumns.length === 0 ? (
            // ✅ EMPTY STATE
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="mb-2 text-green-500" size={32} />
              <p className="text-base font-semibold text-green-600">
                All validations passed
              </p>
              <p className="mt-1 text-base text-gray-400">
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
                  ].includes(key),
              );
              const colRules = requestData?.[col] || {};

              const issueMap = Object.fromEntries(issues);
              const rulesArray = buildRulesArray(colRules, issueMap);
              const dependencyMap = {};

              Object.entries(requestData || {}).forEach(
                ([parentCol, rules]: any) => {
                  if (!rules.dependency) return;

                  const entries = Object.entries(rules.dependency);

                  for (let i = 0; i < entries.length - 1; i++) {
                    const [currentKey, currentValue] = entries[i];
                    const [nextKey, nextValue] = entries[i + 1];

                    const currentCols = currentKey
                      .split(",")
                      .map((c) => c.trim());
                    const nextCols = nextKey.split(",").map((c) => c.trim());

                    nextCols.forEach((childCol) => {
                      if (!dependencyMap[childCol]) {
                        dependencyMap[childCol] = [];
                      }

                      dependencyMap[childCol].push({
                        parentGroup: currentCols, // ✅ correct parent
                        parentValue: currentValue,
                        expected: nextValue,
                      });
                    });
                  }
                },
              );
              return (
                <div
                  key={col}
                  className="transition-all duration-200 hover:bg-gray-50"
                >
                  {/* ROW */}

                  <div className="grid grid-cols-[200px_1fr_120px] items-center gap-4 px-5 py-4 border-b hover:bg-gray-50 transition">
                    {/* 1️⃣ Column Name */}
                    <div className="font-medium text-gray-800 truncate">
                      {col}
                    </div>

                    {/* 2️⃣ Valid / Invalid */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* ✅ Valid */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-base font-medium text-green-700 bg-green-50 border border-green-200 rounded-full">
                        <CheckCircle size={14} />
                        {stats.valid_records ?? 0} Valid
                      </span>

                      {/* ❌ Invalid */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-base font-medium text-red-700 bg-red-50 border border-red-200 rounded-full">
                        <XCircle size={14} />
                        {stats.invalid_records ?? 0} Invalid
                      </span>

                      {/* 📊 Rules */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                        <FiCheckCircle size={14} />
                        {issues.length} Rules Applied
                      </span>
                    </div>

                    {/* 3️⃣ Issues (LIMITED VIEW) */}

                    {/* <div className="flex flex-wrap gap-2">
                      {issues.length > 0 ? (
                        <>
                          {issues.map(([key, val]) => (
                            <span
                              key={key}
                              className={`flex items-center gap-1 px-2.5 py-1 text-base font-medium text-red-600 bg-red-50 border border-red-100 rounded-full ${getErrorStyle(key)}`}
                            >
                              <AlertCircle size={12} />
                              {key.replaceAll("_", " ")} ({val})
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-base text-green-600">
                          <CheckCircle size={14} />
                          Clean
                        </span>
                      )}
                    </div> */}

                    {/* 4️⃣ Details Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          setExpandedColumn(expandedColumn === col ? null : col)
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-base font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
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
                  </div>

                  {/* EXPAND */}

                  {expandedColumn === col && (
                    <div className="px-5 pb-5 space-y-4 bg-gray-50">
                      <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <p className="mb-3 text-base font-semibold text-gray-700">
                          Applied Rules
                        </p>

                        <AppliedRules
                          col={col}
                          colRules={colRules}
                          issueMap={issueMap}
                          errors_for_coloms={errors_for_coloms}
                          dependencyMap={dependencyMap} // ✅ NEW
                          formatErrorMsg={formatErrorMsg}
                          FIELD_LABELS={FIELD_LABELS}
                          columnStats={column_wise_stats[col]}
                        />
                      </div>
                      {/* 🔹 SUMMARY BLOCK */}
                      <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                        <p className="mb-2 text-base font-semibold text-gray-700">
                          Column Errors
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {errors_for_coloms?.[col]?.length > 0 ? (
                            errors_for_coloms[col].map((err, i) => (
                              <span
                                key={i}
                                className={`px-2.5 py-1 text-base font-medium border rounded-full ${getErrorStyle(err)}`}
                              >
                                {err}
                              </span>
                            ))
                          ) : (
                            <span className="text-base text-green-600">
                              No issues found
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 🔹 ERROR DETAILS */}
                      {stats.error_msg && stats.error_msg.length > 0 && (
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
                          {/* Header */}
                          <div className="sticky top-0 z-10 px-4 py-3 bg-white border-b rounded-t-xl">
                            <p className="text-base font-semibold text-gray-700">
                              Error Details
                            </p>
                          </div>

                          {/* Content */}
                          {stats.error_msg && stats.error_msg.length > 0 ? (
                            <div className="max-h-[320px] overflow-y-auto divide-y">
                              {stats.error_msg.map((err, index) => (
                                <div
                                  key={index}
                                  className="grid grid-cols-[40px_150px_1fr] items-center gap-3 px-4 py-2 text-base hover:bg-gray-50"
                                >
                                  {/* Row */}
                                  <span className="font-semibold text-gray-600">
                                    #{err.row}
                                  </span>

                                  {/* Type Badge */}
                                  <span className="px-2 py-0.5 text-[11px] font-medium text-red-600 bg-red-100 rounded w-fit">
                                    {err.error_type}
                                  </span>

                                  {/* Description */}
                                  <span
                                    className="text-gray-700 truncate"
                                    title={err.error_description}
                                  >
                                    {err.error_description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-6 text-center">
                              <p className="text-base text-green-600">
                                No errors found
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
