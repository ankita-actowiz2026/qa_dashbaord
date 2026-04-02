import { ArrowRight } from "lucide-react";

import { FiList } from "react-icons/fi";
import { GoDotFill } from "react-icons/go";
import ErrorBadge from "./ErrorBadge";

type Props = {
  col: string;
  colRules: any;
  issueMap: any;
  errors_for_coloms: Record<string, string[]>;
  dependencyMap: any; // ✅ NEW
  formatErrorMsg: (count: number, label: string) => string;
  FIELD_LABELS: Record<string, string>;
  columnStats: any; // ✅ NEW
};
const AppliedRules = ({
  col,
  colRules,
  issueMap,
  errors_for_coloms,
  dependencyMap,
  formatErrorMsg,
  FIELD_LABELS,
  columnStats,
}: Props) => {
  const dependentRules = dependencyMap[col] || [];

  if (
    (!colRules || Object.keys(colRules).length === 0) &&
    dependentRules.length === 0
  ) {
    return <div className="text-base text-green-600">No rules applied</div>;
  }
  const parseDependencyKey = (key: string) => {
    return key.split(",").map((k) => k.trim());
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* ✅ Length */}
      {colRules.length_validation_type && (
        <div className="p-4 transition bg-white border shadow-sm rounded-xl hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xl font-medium tracking-wide text-gray-500 uppercase">
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

          <div className="flex items-center gap-1 mt-1 text-base text-red-600">
            <ErrorBadge
              count={issueMap.length_validation_error_count}
              label="Length Type"
            />
          </div>
        </div>
      )}
      {/* ✅ Redundant */}
      {colRules.data_redundant_value !== undefined && (
        <div className="p-4 transition bg-white border shadow-sm rounded-xl hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xl font-medium tracking-wide text-gray-500 uppercase">
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
          <div className="flex items-center gap-1 mt-1 text-base text-red-600">
            <ErrorBadge
              count={issueMap.redundant_error_count}
              label="Redundant Value"
            />
          </div>
        </div>
      )}
      {/* ✅ Regex */}
      {colRules.cell_contains && (
        <div className="p-4 transition bg-white border shadow-sm rounded-xl hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xl font-medium tracking-wide text-gray-500 uppercase">
              Regex
            </span>
          </div>
          <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
            <FiList size={16} />
            <span> {colRules.cell_contains_value || "pattern"}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-base text-red-600">
            <ErrorBadge
              count={issueMap.regex_pattern_error_count}
              label="Regex"
            />
          </div>
        </div>
      )}
      {/* ✅ Data Type */}
      {colRules.data_type && (
        <div className="p-4 transition bg-white border shadow-sm rounded-xl hover:shadow-md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xl font-medium tracking-wide text-gray-500 uppercase">
              Data Type
            </span>
          </div>
          <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
            <FiList size={16} />
            <span>
              {colRules.data_type === "date"
                ? `Date with format ${colRules.date_format || "format"}`
                : colRules.data_type.charAt(0).toUpperCase() +
                  colRules.data_type.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-base text-red-600">
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
          <div className="text-xl font-medium text-gray-500 uppercase">
            Dependency
          </div>

          <div className="flex flex-col gap-1">
            {(() => {
              const entries = Object.entries(colRules.dependency || {});

              return entries.map(([key, value], index) => {
                const next = entries[index + 1];
                if (!next) return null;

                const [nextKey, nextValue] = next;

                const currentFields = parseDependencyKey(key);
                const nextFields = parseDependencyKey(nextKey);

                const left =
                  value === true
                    ? `${currentFields.join(" & ")} is required`
                    : `${currentFields.join(" & ")} = ${value}`;

                const right =
                  nextValue === true
                    ? `${nextFields.join(" & ")} must be required`
                    : `${nextFields.join(" & ")} must be ${nextValue}`;

                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-base font-semibold text-black break-words"
                  >
                    <FiList size={16} />
                    {left}{" "}
                    <ArrowRight
                      size={12}
                      className="inline-block text-gray-400"
                    />{" "}
                    {right}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
      {dependentRules.length > 0 &&
        dependentRules.map((dep, idx) => {
          const errorCount = columnStats?.dependancy_error_count || 0;
          const parentText =
            dep.parentValue === true
              ? `${dep.parentGroup.join(" & ")} is required`
              : `${dep.parentGroup.join(" & ")} = ${dep.parentValue}`;

          const expectedText =
            dep.expected === true
              ? `${col} must be required`
              : `${col} must be ${dep.expected}`;
          return (
            <div key={idx} className="p-3 border rounded-lg bg-gray-50">
              <div className="text-xl font-medium text-gray-500 uppercase">
                Dependency (From {dep.parent})
              </div>

              <div className="flex items-center gap-1 text-base font-semibold text-black break-words">
                <FiList size={16} />
                If {parentText}{" "}
                <ArrowRight size={12} className="inline-block text-gray-400" />{" "}
                {expectedText}
              </div>

              <div className="flex items-center gap-1 mt-1 text-base text-red-600">
                <GoDotFill size={10} />
                {formatErrorMsg(errorCount, "Dependency")}
              </div>
            </div>
          );
        })}
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
          <div className="p-4 transition bg-white border shadow-sm rounded-xl hover:shadow-md">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl font-medium tracking-wide text-gray-500 uppercase">
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
            <div className="flex items-center gap-1 mt-1 text-base text-red-600">
              <ErrorBadge count={errorCount} label={key} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppliedRules;
