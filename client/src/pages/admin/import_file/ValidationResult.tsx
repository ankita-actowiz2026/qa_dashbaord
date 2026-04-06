import AppliedRules from "./AppliedRule";
import ColumnDetailRow from "./ColumnDetailRow";

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
      return `${count} value${count > 1 ? "s" : ""} did not match fixed value`;

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
          "unique_values",
          "unique_records",
          "invalid_row_numbers",
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

  fixed_header: "Fixed Value",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ">
      <div className="   space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Records Summary
        </h1>

        <p className="text-lg text-gray-500"></p>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-base text-gray-500">
              <FiFileText className="text-gray-400" />
              <span>Current file:</span>
              <span
                className="font-medium text-gray-800 truncate max-w-[200px]"
                title={fileName}
              >
                {fileName || "No file selected"}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/import_file")}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:from-gray-700 hover:to-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <FaUpload className="text-lg" />
            Upload New File
          </button>
        </div>
        {/* 🔹 TOP SUMMARY */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Total Records" value={total_rows} icon="📊" />
            <SummaryCard
              title="Valid Records"
              value={valid_rows}
              success
              icon="✅"
            />
            <SummaryCard
              title="Invalid Records"
              value={invalid_rows}
              error
              icon="❌"
            />
          </div>
        </div>
        <div className="flex justify-end mb-6">
          <a
            href={result_file}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            <FiDownload className="text-lg" />
            Download Full Report
          </a>
        </div>
        {/* 🔹 COLUMN LIST */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
              Column Analysis Results
              <span className="ml-2 text-base font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredColumns.length} columns
              </span>
            </h2>
          </div>

          {/* BODY */}
          <div className="grid grid-cols-11 gap-2 bg-gray-100 p-3 rounded-t-lg font-semibold text-sm text-gray-700 border">
            <div>ID</div>
            <div>Headers</div>
            <div>Total</div>
            <div>QC Pass</div>
            <div>QC Fail</div>
            <div>Blank Rows</div>
            <div>Reasons</div>
            <div>Unique %</div>
            <div>Status</div>
            <div>QC Fail %</div>
            <div>No of Row ID</div>
          </div>
          <div className="divide-y">
            {filteredColumns.length === 0 ? (
              // ✅ EMPTY STATE
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-green-50 rounded-full p-4 mb-4">
                  <CheckCircle className="text-green-500" size={48} />
                </div>
                <p className="text-xl font-bold text-green-600 mb-2">
                  🎉 All validations passed!
                </p>
                <p className="text-gray-500">
                  No issues were found in your uploaded data. Your file looks
                  great!
                </p>
              </div>
            ) : (
              filteredColumns.map(([col, stats]: any, index: number) => {
                const issues = Object.entries(stats).filter(
                  ([key, val]) =>
                    ![
                      "total_records",
                      "valid_records",
                      "invalid_records",
                      "error_msg",
                      "unique_values",
                      "unique_records",
                      "invalid_row_numbers",
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
                  <ColumnDetailRow
                    key={col}
                    col={col}
                    stats={stats}
                    issues={issues}
                    colRules={colRules}
                    issueMap={issueMap}
                    errors_for_coloms={errors_for_coloms}
                    dependencyMap={dependencyMap}
                    formatErrorMsg={formatErrorMsg}
                    FIELD_LABELS={FIELD_LABELS}
                    column_wise_stats={column_wise_stats}
                    expandedColumn={expandedColumn}
                    setExpandedColumn={setExpandedColumn}
                    AppliedRulesComponent={AppliedRules}
                    getErrorStyle={getErrorStyle}
                    index={index}
                    total_rows={total_rows}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ValidationResult;
