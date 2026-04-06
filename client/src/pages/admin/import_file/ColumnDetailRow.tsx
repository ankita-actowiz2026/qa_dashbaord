// ColumnDetailRow.jsx
import React from "react";
import { CheckCircle, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { FiCheckCircle } from "react-icons/fi";
import { FileDown } from "lucide-react";

const buildErrorSummary = (columnName, errorRows) => {
  const rows = [];

  Object.entries(errorRows).forEach(([rule, rowNumbers]) => {
    if (!rowNumbers || rowNumbers.length === 0) return;

    rows.push({
      column: columnName,
      rule,
      count: rowNumbers.length,
      rows: rowNumbers,
    });
  });

  return rows;
};
const downloadCSV = (data, fileName = "errors.csv") => {
  const header = ["Column", "Rule", "Count", "Rows"];

  const csvRows = [
    header.join(","),
    ...data.map(
      (row) =>
        `${row.column},${row.rule},${row.count},"[${row.rows.join(", ")}]"`,
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
};
const getDisplayRows = (rows, limit = 3) => {
  return {
    visible: rows.slice(0, limit),
    hidden: rows.slice(limit),
  };
};

const getMergedErrorRows = (errorRows) => {
  const merged = new Set();

  Object.values(errorRows).forEach((arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((row) => merged.add(row));
    }
  });

  return Array.from(merged).sort((a, b) => a - b);
};
const ColumnDetailRow = ({
  col,
  stats,
  issues,
  colRules,
  issueMap,
  errors_for_coloms,
  dependencyMap,
  formatErrorMsg,
  FIELD_LABELS,
  column_wise_stats,
  expandedColumn,
  setExpandedColumn,
  AppliedRulesComponent, // Pass AppliedRules as prop
  getErrorStyle,
  index,
  total_rows,
}) => {
  const qcFailPercentage =
    total_rows > 0
      ? ((stats.invalid_records / total_rows) * 100).toFixed(2)
      : 0;

  const mergedRows = getMergedErrorRows(stats.error_rows || {});
  const { visible, hidden } = getDisplayRows(mergedRows, 3);
  return (
    <div
      key={col}
      className="grid grid-cols-11 gap-2 p-3 border border-t-0 text-sm items-center"
    >
      <div>{index + 1}</div>
      <div>{col}</div>
      <div>{total_rows ?? 0}</div>
      <div>{stats.valid_records ?? 0} </div>
      <div>{stats.invalid_records ?? 0}</div>
      <div>{stats.total_records ?? "-"}</div>
      <div>{Object.keys(colRules).join(", ")}</div>
      <div>
        {stats.total_records > 0
          ? ((stats.unique_records / stats.total_records) * 100).toFixed(2)
          : 0}
        %
      </div>
      <div>{stats.invalid_records > 0 ? "QA Fail" : "QA Pass"}</div>
      <div>{qcFailPercentage}%</div>
      <div className="flex items-center gap-2">
        {/* Preview (optional) */}
        <div className="text-red-600 text-xs">
          {mergedRows.length > 0 ? `[${visible.join(", ")}...]` : "-"}
        </div>

        {/* Download Icon */}
        {mergedRows.length > 0 && (
          <FileDown
            className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-110"
            onClick={() => {
              const data = buildErrorSummary(col, stats.error_rows);
              downloadCSV(data, `${col}_errors.csv`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ColumnDetailRow;
