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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-[580px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-300"
      >
        {/* CLOSE BUTTON */}

        <button
          onClick={onClose}
          className="absolute z-10 flex items-center justify-center w-8 h-8 text-gray-400 transition-all duration-200 rounded-full top-4 right-4 hover:text-gray-600 hover:bg-gray-100"
        >
          <MdClear size={18} />
        </button>
        {/* HEADER */}
        <div className="sticky top-0 z-10 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingRule ? "Edit Rule" : "Add Rule"}
            </h2>
          </div>
          <p className="pl-3 mt-2 text-sm text-gray-500">
            Configure validation rules for{" "}
            <span className="font-medium text-blue-600">{currentHeader}</span>
          </p>
        </div>
        {/* RULE TYPE */}
        <div className="px-6 pt-5 pb-3">
          <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Rule Type
          </label>
          <div className="mt-2">
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
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
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
        </div>
        {/* DATA TYPE RULE */}
        {tempRule.type === "data_type" && (
          <>
            {/* Data Type */}
            <div className="px-6 py-4 border-t border-gray-50">
              <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Configuration
              </label>
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700">
                  Data Type
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
                  className="w-full px-4 py-2.5 mt-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  {DATA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* ✅ Show only if date selected */}
            {tempRule.data_type === "date" && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Date Format
                </label>

                <select
                  value={tempRule.date_format || ""}
                  onChange={(e) =>
                    setTempRule({
                      ...tempRule,
                      date_format: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
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
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700">
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
                  className="w-full px-4 py-2.5 mt-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
                />
              </div>
            )}
          </>
        )}
        {tempRule.type === "data_length" && (
          <div className="px-6 py-4 border-t border-gray-50">
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Length Configuration
            </label>
            {/* MODE */}
            <div className="pb-4 mt-3">
              <label className="text-sm font-medium text-gray-700">
                Length Type
              </label>
              <select
                value={tempRule.length_mode || "variable"}
                onChange={(e) =>
                  setTempRule({
                    ...tempRule,
                    length_mode: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
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
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="Max Value"
                      value={tempRule.max || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, max: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="Max Length"
                      value={tempRule.max || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, max: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                    <input
                      type="date"
                      value={tempRule.max || ""}
                      onChange={(e) =>
                        setTempRule({ ...tempRule, max: e.target.value })
                      }
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                    className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                    className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                    className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                )}
              </div>
            )}
          </div>
        )}
        {tempRule.type === "data_redundant" && (
          <div className="px-6 py-4 border-t border-gray-50">
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Redundancy Configuration
            </label>
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Redundant Value
              </label>
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
                className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Threshold
              </label>
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
                className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
              />
            </div>
          </div>
        )}
        {tempRule.type === "regex" && (
          <div className="px-6 py-4 border-t border-gray-50">
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Pattern Configuration
            </label>
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Regular Expression
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
                className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
              />
            </div>
          </div>
        )}
        {tempRule.type === "fixed_header" && (
          <div className="px-6 py-4 border-t border-gray-50">
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Fixed Value
            </label>
            <input
              type="text"
              value={tempRule.fixed_header || ""}
              onChange={(e) =>
                setTempRule({
                  ...tempRule,
                  fixed_header: e.target.value,
                })
              }
              placeholder="Enter fixed value (e.g. India)"
              className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
            />
          </div>
        )}
        {tempRule.type === "cell_start_with" && (
          <div className="px-6 py-4 border-t border-gray-50">
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Cell start with
            </label>
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
              className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
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
          <div className="px-6 py-4 border-t border-gray-50">
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Dependency Configuration
            </label>
            {/* MAIN */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Main Dependency
              </label>

              <div className="flex gap-6 mt-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 transition-colors cursor-pointer hover:text-blue-600">
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
                  className="w-full px-4 py-2.5 mt-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
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
        <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 mt-4 bg-white border-t border-gray-100 rounded-b-2xl">
          {" "}
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-800 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200"
          >
            {editingRule ? "Edit Rule" : "Add Rule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleModal;
