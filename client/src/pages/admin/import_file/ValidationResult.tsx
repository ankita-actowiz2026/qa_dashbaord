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
const ignoreColumns = [
  "total_records",
  "valid_records",
  "invalid_records",
  "error_msg",
  "unique_values",
  "unique_records",
  "invalid_row_numbers",
  "error_rows",
];
const getFilteredColumns = (columnStats: any) => {
  return Object.entries(columnStats).filter(([_, stats]: any) =>
    Object.entries(stats).some(([key, value]) => !ignoreColumns.includes(key)),
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
  const dependencyColumnSet = useMemo(() => {
    const set = new Set();

    Object.values(requestData || {}).forEach((rule: any) => {
      if (!rule?.dependency) return;

      const keys = Object.keys(rule.dependency);

      // ❌ ignore first key (parent)
      const childKeys = keys.slice(1);

      childKeys.forEach((key) => {
        key.split(",").forEach((col: string) => {
          set.add(col.trim());
        });
      });
    });

    return set;
  }, [requestData]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className=" mx-auto ">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                Validation Results
              </h1>
              <p className="text-slate-500 flex items-center gap-2">
                <FiCheckCircle className="text-green-500" />
                Data quality report for your uploaded file
              </p>
            </div>

            {/* File info badge - make it more visual */}
            <div className="flex items-center gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-base text-slate-600">
                    {fileName || "No file selected"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/admin/import_file")}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 rounded-full hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FaUpload className="text-slate-500 group-hover:text-blue-500 transition-colors" />
                <span className="font-medium text-slate-700 group-hover:text-blue-600">
                  Upload New
                </span>
              </button>
            </div>
          </div>
        </div>
        {/* 🔹 TOP SUMMARY */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Total Records" value={total_rows} />
            <SummaryCard title="Valid Records" value={valid_rows} success />
            <SummaryCard title="Invalid Records" value={invalid_rows} error />
          </div>
        </div>
        <div className="flex justify-end mb-6">
          <a
            href={result_file}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white font-medium overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-sidebarSecondary to-sidebarSecondaryHover"></div>
            <FiDownload className="relative z-10 text-lg group-hover:scale-110 transition-transform" />
            <span className="relative z-10">Download Full Report</span>
          </a>
        </div>
        {/* 🔹 COLUMN LIST */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  Column Analysis
                </h2>
                <p className="text-slate-500 text-base mt-1">
                  Detailed validation results for each column
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-base font-medium">
                  {filteredColumns.length} columns analyzed
                </div>
              </div>
            </div>
          </div>

          {/* BODY */}
          {/* Grid Header */}
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full border-collapse">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[5%]">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[15%]">
                    Headers
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[6%]">
                    Total
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[8%]">
                    QC Pass
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[8%]">
                    QC Fail
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[6%]">
                    Blank Rows
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[15%]">
                    Reasons
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[8%]">
                    Unique %
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[8%]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[8%]">
                    QC Fail %
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider w-[13%]">
                    No. of Row ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredColumns.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-green-50 rounded-full p-4 mb-4">
                          <CheckCircle className="text-green-500" size={48} />
                        </div>
                        <p className="text-xl font-bold text-green-600 mb-2">
                          🎉 All validations passed!
                        </p>
                        <p className="text-gray-500">
                          No issues were found in your uploaded data. Your file
                          looks great!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredColumns.map(([col, stats]: any, index: number) => (
                    <ColumnDetailRow
                      key={col}
                      col={col}
                      stats={stats}
                      index={index}
                      total_rows={total_rows}
                      colRules={requestData?.[col] || {}}
                      dependencyColumnSet={dependencyColumnSet}
                      // ... other props
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ValidationResult;
