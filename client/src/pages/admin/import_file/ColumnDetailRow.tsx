// ColumnDetailRow.jsx
import { FileDown } from "lucide-react";
const RULE_LABELS: Record<string, string> = {
  empty: "Empty data",
  datatype: "Data type Error",
  regex: "Regex pattern mismatch",
  redundant: "Redundant data",
  fixed_header: "Fixed data",
  start_with: "Start with data",
  end_with: "End with",
  length: "Data Length",
  blocked: "Blocked value",
  dependency: "Dependency data",
};
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
    ...data.map((row) => {
      const ruleLabel = RULE_LABELS[row.rule] || row.rule;

      return `${row.column},${ruleLabel},${row.count},"[${row.rows.join(", ")}]"`;
    }),
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
const RULE_LABEL_MAP = {
  length_validation_type: "length_validation",
  data_redundant_value: "data_redundant_value",
  cell_contains: "regex",
  not_match_found: "blocked_word",
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
  dependencyColumnSet,
}) => {
  const qcFailPercentage =
    total_rows > 0
      ? ((stats.invalid_records / total_rows) * 100).toFixed(2)
      : 0;
  const uniquePercentage =
    stats.total_records > 0
      ? ((stats.unique_records / stats.total_records) * 100).toFixed(2)
      : 0;

  const mergedRows = getMergedErrorRows(stats.error_rows || {});
  const { visible, hidden } = getDisplayRows(mergedRows, 3);
  return (
    <tr className="transition-colors border-b hover:bg-slate-50 border-slate-100">
      {/* ID */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-center text-base font-bold rounded-lg shadow-sm w-7 h-7 text-slate-800">
          {index + 1}
        </div>
      </td>

      {/* Headers */}
      <td className="px-3 py-3">
        <div
          className="text-base font-semibold truncate text-slate-800"
          title={col}
        >
          {col}
        </div>
      </td>

      {/* Total */}
      <td className="px-3 py-3">
        <div className="text-base font-bold text-slate-700 whitespace-nowrap">
          {total_rows ?? 0}
        </div>
      </td>

      {/* QC Pass */}
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-green-600 whitespace-nowrap">
            {stats.valid_records ?? 0}
          </span>
        </div>
      </td>

      {/* QC Fail */}
      <td className="px-3 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-red-600 whitespace-nowrap">
            {stats.invalid_records ?? 0}
          </span>
        </div>
      </td>

      {/* Blank Rows */}
      <td className="px-3 py-3">
        <span className="text-base font-medium whitespace-nowrap">
          {stats.empty_count ?? 0}
        </span>
      </td>

      {/* Reasons */}
      <td className="px-3 py-3">
        {(() => {
          const hiddenKeys = [
            "min_length",
            "max_length",
            "data_redundant_threshold",
            "cell_contains_value",
          ];

          const ruleKeys = Object.keys(colRules || {}).filter(
            (key) => !hiddenKeys.includes(key),
          );

          // ✅ Add dependency if:
          // 1. Column is part of dependency chain
          // 2. OR dependency error exists
          if (
            (dependencyColumnSet?.has(col) ||
              stats?.dependancy_error_count > 0) &&
            !ruleKeys.includes("dependency")
          ) {
            ruleKeys.push("dependency");
          }

          const displayKeys = ruleKeys.map((key) => RULE_LABEL_MAP[key] || key);

          return displayKeys.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-base px-2 py-0.5 bg-red-50 text-red-600 rounded-full whitespace-nowrap">
                {displayKeys.slice(0, 2).join(", ")}
              </span>

              {displayKeys.length > 2 && (
                <div className="relative inline-block group">
                  <span className="text-base px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full cursor-help whitespace-nowrap">
                    +{displayKeys.length - 2}
                  </span>

                  <div className="invisible group-hover:visible absolute z-50 bottom-full left-0 mb-2 p-2 bg-gray-900 text-white text-base rounded-lg shadow-xl min-w-[200px]">
                    <div className="mb-1 font-semibold text-gray-300">
                      All Rules:
                    </div>

                    <div className="text-gray-200">
                      {displayKeys.join(", ")}
                    </div>

                    <div className="absolute border-4 border-transparent top-full left-4 border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-base text-gray-400">—</span>
          );
        })()}
      </td>

      {/* Unique Percentage */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold min-w-[45px] whitespace-nowrap">
            {uniquePercentage}%
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-base font-semibold whitespace-nowrap
          ${stats.invalid_records > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
        >
          {stats.invalid_records > 0 ? "QA FAIL" : "QA PASS"}
        </span>
      </td>

      {/* QC Fail Percentage */}
      <td className="px-3 py-3">
        <span className={`text-base font-bold whitespace-nowrap }`}>
          {qcFailPercentage}%
        </span>
      </td>

      {/* No. of Row ID */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          {mergedRows.length > 0 ? (
            <>
              <div className="px-2 py-1 font-mono text-base rounded-md bg-red-50 whitespace-nowrap">
                [{visible.slice(0, 3).join(", ")}
                {visible.length > 3 ? ", ..." : ""}]
              </div>
              <button
                onClick={() => {
                  const data = buildErrorSummary(col, stats.error_rows);
                  downloadCSV(data, `${col}_errors.csv`);
                }}
                className="p-1 transition-all rounded-lg hover:bg-red-100"
                title="Download error details"
              >
                <FileDown className="w-6 h-6 text-blue-600 transition-transform hover:scale-110" />
              </button>
            </>
          ) : (
            <span className="flex items-center gap-1 text-base text-green-600 whitespace-nowrap">
              All valid
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};
export default ColumnDetailRow;
