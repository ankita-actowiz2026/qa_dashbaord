import React from "react";
import Select from "react-select";

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
  currentDataType: string[];
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
  const options = DATA_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));
  const label_style = "text-base font-semibold tracking-wide text-sidebar ";
  const label_style_title =
    "text-xs font-semibold tracking-wide text-gray-500 uppercase";
  const dropdown_style =
    "w-full px-4 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebarSecondary focus:border-sidebarSecondary bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer";
  const textbox_style =
    "w-full px-4 py-2.5 mt-1.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebarSecondary focus:border-sidebarSecondary bg-gray-50 transition-all duration-200";
  const div_class_1 = "px-6 pt-1 pb-2 border-t border-gray-50";
  const radioButtonStyle = "w-4 h-4 text-sidebar focus:ring-sidebarHover";
  const effectiveDataType =
    tempRule.data_type?.length > 0 ? tempRule.data_type : currentDataType || [];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 bg-black/60 backdrop-blur-base"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-[580px] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-300"
      >
        <button
          onClick={onClose}
          className="absolute z-20 flex items-center justify-center w-8 h-8 text-gray-400 transition-all duration-200 rounded-full top-4 right-4 hover:text-gray-600 hover:bg-gray-100"
        >
          <MdClear size={18} />
        </button>
        {/* HEADER */}
        <div className="sticky top-0 z-10 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-sidebarSecondary"></div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {editingRule ? "Edit Rule" : "Add Rule"}
            </h2>
          </div>
          <p className="pl-3 mt-2 text-base text-gray-500">
            Configure validation rules for{" "}
            <span className="font-medium text-sidebarSecondary">
              {currentHeader}
            </span>
          </p>
        </div>
        {/* RULE TYPE */}
        <div className={div_class_1}>
          <label className={label_style}>Rule Type</label>
          <div className="mt-1">
            <select
              value={tempRule.type || ""}
              onChange={(e) => {
                const type = e.target.value as any;
                setTempRule((prev) => ({
                  ...prev,
                  type,
                  ...(type === "data_type" && { data_type: [] }),
                  ...(type === "data_length" && {
                    data_type: [],
                    length_mode: "variable",
                  }),
                  ...(type === "date_format" && { date_format: "YYYY-MM-DD" }),
                  ...(type === "dependency" && {
                    dependency_mode: "required",
                    sub_headers: [],
                    sub_mode: "required",
                    sub_dependencies: [],
                  }),
                }));
              }}
              className={dropdown_style}
            >
              {" "}
              <option value="" disabled hidden>
                {" "}
                Select Rule{" "}
              </option>{" "}
              {RULE_OPTIONS.filter(
                (opt) =>
                  !opt.show || opt.show({ currentDataType: effectiveDataType }),
              ).map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={appliedRuleTypes.includes(opt.value)}
                >
                  {" "}
                  {opt.label}{" "}
                </option>
              ))}{" "}
            </select>
          </div>
        </div>
        {/* DATA TYPE RULE */}
        {tempRule.type === "data_type" && (
          <>
            {/* Data Type */}
            <div className={div_class_1}>
              <label className={label_style}>Data Type</label>

              <div className="mt-1">
                <Select
                  isMulti
                  options={options}
                  value={options.filter((opt) =>
                    (tempRule.data_type || []).includes(opt.value),
                  )}
                  onChange={(selected) => {
                    const selectedValues = selected
                      ? selected.map((opt) => opt.value)
                      : [];

                    setTempRule((prev) => {
                      const updated: any = {
                        ...prev,
                        data_type: selectedValues,
                      };

                      // 🔥 instant cleanup
                      if (!selectedValues.includes("date")) {
                        delete updated.date_format;
                        delete updated.custom_date_format;
                      }

                      return updated;
                    });
                  }}
                  menuPortalTarget={document.body} // 🔥 important
                  menuPosition="fixed" // 🔥 important
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }), // ensure on top
                  }}
                  className="w-full text-base transition-all duration-200 border border-gray-200 rounded-lg cursor-pointer focus:outline-none focus:ring-1 bg-gray-50 hover:border-gray-300"
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          </>
        )}

        {tempRule.type === "date_format" && (
          <>
            <div className={div_class_1}>
              <label className={label_style}>Date Format</label>
              <div className="mt-1">
                <select
                  value={tempRule.date_format || ""}
                  onChange={(e) =>
                    setTempRule({
                      ...tempRule,
                      date_format: e.target.value,
                    })
                  }
                  className={dropdown_style}
                >
                  {date_format_options.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                  <option value="custom">Custom Date...</option>
                </select>
              </div>
            </div>

            {tempRule.date_format === "custom" && (
              <div className={div_class_1}>
                <label className={label_style}>Add custom date</label>
                <div className="mt-1">
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
                    className={textbox_style}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {tempRule.type === "data_length" && (
          <div className={div_class_1}>
            <label className={label_style}>Length Type</label>
            <div className="mt-1">
              <select
                value={tempRule.length_mode || "variable"}
                onChange={(e) =>
                  setTempRule({
                    ...tempRule,
                    length_mode: e.target.value as any,
                  })
                }
                className={dropdown_style}
              >
                <option value="variable">Variable</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            {/* VARIABLE */}

            {tempRule.length_mode === "variable" && (
              <div className="mt-2">
                <label className={label_style}>Min - Max Length</label>
                <div className="mt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {/* STRING TYPES */}
                    {currentDataType.some((type) =>
                      [
                        "string",
                        "alphabetic",
                        "boolean",
                        "integer",
                        "float",
                      ].includes(type),
                    ) && (
                      <>
                        <input
                          type="number"
                          placeholder="Min Value"
                          value={tempRule.min || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, min: e.target.value })
                          }
                          className={textbox_style}
                        />
                        <input
                          type="number"
                          placeholder="Max Value"
                          value={tempRule.max || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, max: e.target.value })
                          }
                          className={textbox_style}
                        />
                      </>
                    )}

                    {/* NUMBER */}
                    {/* {currentDataType.some((type) =>
                      ["integer", "float"].includes(type),
                    ) && (
                      <>
                        <input
                          type="number"
                          placeholder="Min Length"
                          value={tempRule.min || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, min: e.target.value })
                          }
                          className={textbox_style}
                        />
                        <input
                          type="number"
                          placeholder="Max Length"
                          value={tempRule.max || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, max: e.target.value })
                          }
                          className={textbox_style}
                        />
                      </>
                    )} */}

                    {/* DATE */}
                    {currentDataType.some((type) =>
                      ["date"].includes(type),
                    ) && (
                      <>
                        <input
                          type="date"
                          value={tempRule.min || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, min: e.target.value })
                          }
                          className={textbox_style}
                        />
                        <input
                          type="date"
                          value={tempRule.max || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, max: e.target.value })
                          }
                          className={textbox_style}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* FIXED */}
            {tempRule.length_mode === "fixed" && (
              <div>
                <div className="">
                  <div className="grid grid-cols-1 gap-0 mt-3">
                    <label className={label_style}>Fixed Value</label>
                    {/* STRING TYPES */}
                    <div className="p-0 m-0 ">
                      {currentDataType.some((type) =>
                        [
                          "string",
                          "alphabetic",
                          "boolean",
                          "integer",
                          "float",
                        ].includes(type),
                      ) && (
                        <input
                          type="number"
                          placeholder="Fixed Value"
                          value={tempRule.fixed || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, fixed: e.target.value })
                          }
                          className={textbox_style}
                        />
                      )}

                      {/* NUMBER */}
                      {/* {currentDataType.some((type) =>
                        ["integer", "float"].includes(type),
                      ) && (
                        <input
                          type="number"
                          placeholder="Fixed Number"
                          value={tempRule.fixed || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, fixed: e.target.value })
                          }
                          className={textbox_style}
                        />
                      )} */}

                      {/* DATE */}
                      {currentDataType.includes("date") && (
                        <input
                          type="date"
                          value={tempRule.fixed || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, fixed: e.target.value })
                          }
                          className={textbox_style}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {tempRule.type === "data_redundant" && (
          <div>
            <div className={div_class_1}>
              <label className={label_style}>Redundant Value</label>
              <div className="mt-0">
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
                  className={textbox_style}
                />
              </div>
            </div>

            <div className={div_class_1}>
              <label className={label_style}>Threshold</label>
              <div className="mt-0">
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
                  className={textbox_style}
                />
              </div>
            </div>
          </div>
        )}
        {tempRule.type === "regex" && (
          <div className={div_class_1}>
            <label className={label_style}>Regex Pattern</label>
            <div className="mt-0">
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
                className={textbox_style}
              />
            </div>
          </div>
        )}
        {tempRule.type === "fixed_header" && (
          <div className={div_class_1}>
            <label className={label_style}>Fixed Value</label>
            <div className="mt-0">
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
                className={textbox_style}
              />
            </div>
          </div>
        )}
        {tempRule.type === "cell_start_with" && (
          <div className={div_class_1}>
            <label className={label_style}>Cell start with</label>
            <div className="mt-0">
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
                className={textbox_style}
              />
            </div>
          </div>
        )}
        {tempRule.type === "cell_end_with" && (
          <div className={div_class_1}>
            <label className={label_style}>Cell end with</label>
            <div className="mt-0">
              <input
                type="text"
                value={tempRule.cell_end_with || ""}
                onChange={(e) =>
                  setTempRule({
                    ...tempRule,
                    cell_end_with: e.target.value,
                  })
                }
                placeholder="e.g. .com"
                className={textbox_style}
              />
            </div>
          </div>
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
          <div className="px-6 py-4 border-gray-50">
            {/* MAIN */}
            <div>
              <label className={label_style}>Main Dependency</label>

              <div className="flex gap-6 mt-1">
                <label className={"flex items-center gap-2 text-lg"}>
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

                <label className="flex items-center gap-2 text-lg">
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
                  className={textbox_style}
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
            className="px-5 py-2.5 text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-800 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium bg-sidebarSecondary  text-white rounded-xl shadow-md hover:shadow-lg hover:bg-sidebarSecondaryHover active:scale-[0.98] transition-all duration-200"
          >
            {editingRule ? "Edit Rule" : "Add Rule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleModal;
