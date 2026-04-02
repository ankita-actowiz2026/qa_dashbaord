import React from "react";
import { ToggleRight } from "lucide-react";
import TagInputRule from "./TagInputRule";
import SubDependencySection from "./SubDependencySection";
import { MdClear } from "react-icons/md";
import { useRef, useEffect } from "react";

import {
  DATA_TYPE_OPTIONS,
  RULE_OPTIONS,
  date_format_options,
} from "./defaultValues";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  tempRule: any;
  setTempRule: React.Dispatch<React.SetStateAction<any>>;
  editingRule: boolean;
  currentDataType: string;
  appliedRuleTypes: string[];
  headers: string[];
  currentHeader: string;
};

const RuleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  tempRule,
  setTempRule,
  editingRule,
  currentDataType,
  appliedRuleTypes,
  headers,
  currentHeader,
}) => {
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative"
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-6 right-4 text-gray-400 hover:text-gray-600"
        >
          <MdClear size={18} />
        </button>

        {/* HEADER */}
        <div className="mb-6 border-b pb-3">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            {editingRule ? "Edit Rule" : "Add Rule"} for '{currentHeader}'
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Configure validation rules for your selected column
          </p>
        </div>
        {/* RULE TYPE */}
        <div className="mb-5">
          <label className="text-base font-medium text-gray-600">
            Select Rule
          </label>
          <select
            value={tempRule.type || ""}
            onChange={(e) => {
              const type = e.target.value as any;

              setTempRule({
                type,
                ...(type === "data_type" && { data_type: "string" }),
                ...(type === "data_length" && {
                  data_type: "string",
                  length_mode: "variable",
                }),
                ...(type === "date_format" && {
                  date_format: "YYYY-MM-DD",
                }),
                ...(type === "dependency" && {
                  dependency_mode: "required",
                  sub_headers: [],
                  sub_mode: "required",
                  sub_dependencies: [],
                }),
              });
            }}
            className="w-full px-3 py-2 mt-1 text-base border rounded-lg"
          >
            <option value="" disabled hidden>
              Select Rule
            </option>

            {RULE_OPTIONS.filter(
              (opt) => !opt.show || opt.show({ currentDataType }),
            ).map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={appliedRuleTypes.includes(opt.value)}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* DATA TYPE RULE */}
        {tempRule.type === "data_type" && (
          <>
            {/* Data Type */}
            <div className="mb-4">
              <label className="text-base text-gray-600">
                Select Data Type
              </label>

              <select
                value={tempRule.data_type || "string"}
                onChange={(e) => {
                  const newType = e.target.value;

                  setTempRule((prev) => ({
                    ...prev,
                    data_type: newType,
                    ...(newType !== "date" && { date_format: undefined }),
                  }));
                }}
                className="w-full px-3 py-2 mt-1 text-base border rounded-lg"
              >
                {DATA_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Show only if date selected */}
            {tempRule.data_type === "date" && (
              <div className="mb-4">
                <label className="text-base text-gray-600">
                  Select Date Format
                </label>

                <select
                  value={tempRule.date_format || ""}
                  onChange={(e) =>
                    setTempRule({
                      ...tempRule,
                      date_format: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 text-base border rounded-lg"
                >
                  {date_format_options.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                  <option value="custom">Custom Date...</option>
                </select>
              </div>
            )}
            {tempRule.date_format === "custom" && (
              <div className="mb-4">
                <label className="text-base text-gray-600">
                  Add custom date
                </label>
                <input
                  type="text"
                  value={tempRule.custom_date_format || ""}
                  onChange={(e) =>
                    setTempRule({
                      ...tempRule,
                      custom_date_format: e.target.value,
                    })
                  }
                  placeholder="Enter custom format (e.g. YYYY-DD-MM)"
                  className="w-full px-3 py-2 text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </>
        )}

        {tempRule.type === "data_length" && (
          <div className="space-y-4">
            {/* MODE */}
            <div>
              <label className="text-base text-gray-600">Length Type</label>
              <select
                value={tempRule.length_mode || "variable"}
                onChange={(e) =>
                  setTempRule({
                    ...tempRule,
                    length_mode: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 mt-1 text-base border rounded-lg"
              >
                <option value="variable">Variable</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            {/* VARIABLE */}
            {tempRule.length_mode === "variable" && (
              <div className="grid grid-cols-2 gap-3">
                {/* STRING TYPES */}
                {["string", "alphabetic", "boolean"].includes(
                  currentDataType,
                ) && (
                  <>
                    <input
                      type="number"
                      placeholder="Min Value"
                      value={tempRule.min || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, min: e.target.value })
                      }
                      className="px-3 py-2 text-base border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max Value"
                      value={tempRule.max || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, max: e.target.value })
                      }
                      className="px-3 py-2 text-base border rounded-lg"
                    />
                  </>
                )}

                {/* NUMBER */}
                {["integer", "float"].includes(currentDataType) && (
                  <>
                    <input
                      type="number"
                      placeholder="Min Length"
                      value={tempRule.min || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, min: e.target.value })
                      }
                      className="px-3 py-2 text-base border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max Length"
                      value={tempRule.max || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, max: e.target.value })
                      }
                      className="px-3 py-2 text-base border rounded-lg"
                    />
                  </>
                )}

                {/* DATE */}
                {currentDataType === "date" && (
                  <>
                    <input
                      type="date"
                      value={tempRule.min || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, min: e.target.value })
                      }
                      className="px-3 py-2 text-base border rounded-lg"
                    />
                    <input
                      type="date"
                      value={tempRule.max || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, max: e.target.value })
                      }
                      className="px-3 py-2 text-base border rounded-lg"
                    />
                  </>
                )}
              </div>
            )}
            {/* FIXED */}
            {tempRule.length_mode === "fixed" && (
              <div className="grid grid-cols-1 gap-3">
                {/* STRING TYPES */}
                {["string", "alphabetic", "boolean"].includes(
                  currentDataType,
                ) && (
                  <input
                    type="number"
                    placeholder="Fixed Value"
                    value={tempRule.fixed || ""}
                    onChange={(e) =>
                      setTempRule({ ...tempRule, fixed: e.target.value })
                    }
                    className="w-full px-3 py-2 text-base border rounded-lg"
                  />
                )}

                {/* NUMBER */}
                {["integer", "float"].includes(currentDataType) && (
                  <input
                    type="number"
                    placeholder="Fixed Number"
                    value={tempRule.fixed || ""}
                    onChange={(e) =>
                      setTempRule({ ...tempRule, fixed: e.target.value })
                    }
                    className="w-full px-3 py-2 text-base border rounded-lg"
                  />
                )}

                {/* DATE */}
                {currentDataType === "date" && (
                  <input
                    type="date"
                    value={tempRule.fixed || ""}
                    onChange={(e) =>
                      setTempRule({ ...tempRule, fixed: e.target.value })
                    }
                    className="w-full px-3 py-2 text-base border rounded-lg"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {tempRule.type === "data_redundant" && (
          <div className="space-y-3">
            <div>
              <label className="text-base text-gray-600">Redundant Value</label>
              <input
                type="text"
                value={tempRule.data_redundant_value || ""}
                onChange={(e) =>
                  setTempRule({
                    ...tempRule,
                    data_redundant_value: e.target.value,
                  })
                }
                placeholder="Enter value"
                className="w-full px-3 py-2 mt-1 text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-base text-gray-600">Threshold</label>
              <input
                type="number"
                value={tempRule.data_redundant_threshold || ""}
                onChange={(e) =>
                  setTempRule({
                    ...tempRule,
                    data_redundant_threshold: e.target.value,
                  })
                }
                placeholder="Enter threshold"
                className="w-full px-3 py-2 mt-1 text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        {tempRule.type === "regex" && (
          <div>
            <label className="text-base text-gray-600">
              Cell Contains (Regex)
            </label>
            <input
              type="text"
              value={tempRule.cell_contains_value || ""}
              onChange={(e) =>
                setTempRule({
                  ...tempRule,
                  cell_contains_value: e.target.value,
                })
              }
              placeholder="e.g. ^[A-Za-z]+$"
              className="w-full px-3 py-2 mt-1 text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {tempRule.type === "fixed_header" && (
          <TagInputRule
            label="Fixed value"
            values={tempRule.fixed_header || []}
            onChange={(val) => setTempRule({ ...tempRule, fixed_header: val })}
          />
        )}
        {tempRule.type === "cell_start_with" && (
          <div>
            <label className="text-base text-gray-600">Cell start with</label>
            <input
              type="text"
              value={tempRule.cell_start_with || ""}
              onChange={(e) =>
                setTempRule({
                  ...tempRule,
                  cell_start_with: e.target.value,
                })
              }
              placeholder="e.g. https://"
              className="w-full px-3 py-2 mt-1 text-base border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        {tempRule.type === "cell_end_with" && (
          <TagInputRule
            label="Cell end with  value"
            values={tempRule.cell_end_with || []}
            onChange={(val) => setTempRule({ ...tempRule, cell_end_with: val })}
          />
        )}
        {tempRule.type === "not_match_found" && (
          <TagInputRule
            label="Blocked value"
            values={tempRule.not_match_found || []}
            onChange={(val) =>
              setTempRule({ ...tempRule, not_match_found: val })
            }
          />
        )}

        {tempRule.type === "dependency" && (
          <div className="space-y-5">
            {/* MAIN */}
            <div>
              <label className="text-base font-medium text-gray-600">
                Main Dependency
              </label>

              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 text-base">
                  <input
                    type="radio"
                    name="dependency_mode"
                    checked={
                      (tempRule.dependency_mode ?? "required") === "required"
                    }
                    onChange={() =>
                      setTempRule({
                        ...tempRule,
                        dependency_mode: "required",
                      })
                    }
                  />
                  Required
                </label>

                <label className="flex items-center gap-2 text-base">
                  <input
                    type="radio"
                    name="dependency_mode"
                    checked={
                      (tempRule.dependency_mode ?? "required") === "other"
                    }
                    onChange={() =>
                      setTempRule({
                        ...tempRule,
                        dependency_mode: "other",
                      })
                    }
                  />
                  Other Value
                </label>
              </div>

              {(tempRule.dependency_mode ?? "required") === "other" && (
                <input
                  type="text"
                  placeholder="Enter value"
                  value={tempRule.other_value_main_dependency ?? ""}
                  onChange={(e) =>
                    setTempRule({
                      ...tempRule,
                      other_value_main_dependency: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-2 text-base border rounded-lg"
                />
              )}
            </div>

            {/* SUB DEPENDENCY COMPONENT */}
            <SubDependencySection
              tempRule={tempRule}
              setTempRule={setTempRule}
              headers={headers} // ✅ use prop
              currentHeader={currentHeader} // ✅ use prop
            />
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-base border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {editingRule ? "Edit Rule" : "Add Rule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleModal;
