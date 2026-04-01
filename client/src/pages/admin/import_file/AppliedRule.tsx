import { FaRuler } from "react-icons/fa";
import { FiList } from "react-icons/fi";
import { GoDotFill } from "react-icons/go";
import ErrorBadge from "./ErrorBadge";

type Props = {
  colRules: any;
  issueMap: any;
  formatErrorMsg: (count: number, label: string) => string;
  FIELD_LABELS: Record<string, string>;
};
const AppliedRules = ({
  colRules,
  issueMap,
  formatErrorMsg,
  FIELD_LABELS,
}: Props) => {
  if (!colRules || Object.keys(colRules).length === 0) {
    return <div className="text-base text-green-600">No rules applied</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* ✅ Length */}
      {colRules.length_validation_type && (
        <div className="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xl font-medium text-gray-500 uppercase tracking-wide">
              Length Type
            </span>
          </div>
          <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
            <FiList size={16} />
            <span>
              {colRules.length_validation_type === "fixed"
                ? `Fixed value ${colRules.min_length ?? "-"}`
                : `Variable value from ${colRules.min_length ?? "-"} to ${colRules.max_length ?? "-"}`}
            </span>
          </div>

          <div className="mt-1 text-base text-red-600 flex items-center gap-1">
            <ErrorBadge
              count={issueMap.length_validation_error_count}
              label="Length Type"
            />
          </div>
        </div>
      )}
      {/* ✅ Redundant */}
      {colRules.data_redundant_value !== undefined && (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xl font-medium text-gray-500 uppercase tracking-wide">
              Redundant Value
            </span>
          </div>
          <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
            <FiList size={16} />
            <span>
              Redundant Value {colRules.data_redundant_value} with Threshold{" "}
              {colRules.data_redundant_threshold ?? "-"}
            </span>
          </div>
          <div className="mt-1 text-base text-red-600 flex items-center gap-1">
            <ErrorBadge
              count={issueMap.redundant_error_count}
              label="Redundant Value"
            />
          </div>
        </div>
      )}
      {/* ✅ Regex */}
      {colRules.cell_contains && (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xl font-medium text-gray-500 uppercase tracking-wide">
              Regex
            </span>
          </div>
          <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
            <FiList size={16} />
            <span> {colRules.cell_contains_value || "pattern"}</span>
          </div>
          <div className="mt-1 text-base text-red-600 flex items-center gap-1">
            <ErrorBadge
              count={issueMap.regex_pattern_error_count}
              label="Regex"
            />
          </div>
        </div>
      )}
      {/* ✅ Data Type */}
      {colRules.data_type && (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xl font-medium text-gray-500 uppercase tracking-wide">
              Data Type
            </span>
          </div>
          <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
            <FiList size={16} />
            <span>
              {colRules.data_type === "date"
                ? `Date with format ${colRules.date_format || "format"}`
                : colRules.data_type}
            </span>
          </div>
          <div className="mt-1 text-base text-red-600 flex items-center gap-1">
            <ErrorBadge
              count={issueMap.datatype_error_count}
              label="Data Type"
            />
          </div>
        </div>
      )}
      {/* ✅ Dependency */}
      {colRules.dependency && Object.keys(colRules.dependency).length > 0 && (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xl font-medium text-gray-500 uppercase tracking-wide">
              Dependency
            </span>
          </div>
          <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
            <FiList size={16} />
            <span>
              {Object.entries(colRules.dependency)
                .map(([k, v]) =>
                  v === true ? `${k} (Required)` : `${k} (${v})`,
                )
                .join(" • ")}
            </span>
          </div>
          <div className="mt-1 text-base text-red-600 flex items-center gap-1">
            ++
            <GoDotFill size={10} />
            {formatErrorMsg(issueMap.dependancy_error_count, "Dependency")}
          </div>
        </div>
      )}
      {/* ✅ Generic Rules */}
      {Object.entries(colRules).map(([key, value]) => {
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
        )
          return null;

        const errorMap: any = {
          fixed_header: "fixed_header_error_count",
          is_required: "empty_count",
          cell_start_with: "cell_start_with_error_count",
          cell_end_with: "cell_end_with_error_count",
          not_match_found: "blocked_word_error_count",
        };

        const errorCount = issueMap[errorMap[key]];

        const formattedValue = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "object"
            ? Object.entries(value)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            : value === true
              ? "Yes"
              : value === false
                ? "No"
                : String(value);

        return (
          <div key={key} className="p-3 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xl font-medium text-gray-500 uppercase tracking-wide">
                {FIELD_LABELS[key] || key}
              </span>
            </div>
            <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
              <FiList size={16} />
              <span>
                {key == "fixed_header" ? (
                  <>Any of </>
                ) : key == "cell_start_with" ? (
                  "Start With "
                ) : key == "cell_end_with" ? (
                  "Any of "
                ) : key == "not_match_found" ? (
                  "Not allowed "
                ) : (
                  ""
                )}
                {formattedValue}
              </span>
            </div>
            <div className="mt-1 text-base text-red-600 flex items-center gap-1">
              <ErrorBadge count={issueMap.errorCount} label={key} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppliedRules;
