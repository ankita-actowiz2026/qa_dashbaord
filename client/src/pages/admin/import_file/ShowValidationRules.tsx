import { FiTrash2, FiEdit } from "react-icons/fi";
import React, { useState } from "react";
import TagInputRule from "./TagInputRule";
import toast from "react-hot-toast";
import SubDependencySection from "./SubDependencySection";
import { Ruler } from "lucide-react";

import { ToggleLeft, ToggleRight } from "lucide-react";
const date_format_options = [
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM-DD-YYYY",
  "YYYY/MM/DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD HH:mm:ss",
  "DD-MM-YYYY HH:mm:ss",
  "MM/DD/YYYY HH:mm:ss",
  "YYYY-MM-DDTHH:mm:ss",
  "DD-MM-YYYY h:i:s a",
  "MM/DD/YYYY h:i a",
  "YYYY-MM-DD h:i:s A",
  "DD MMM YYYY",
  "MMM DD, YYYY",
  "MMMM DD, YYYY",
  "DD Month YYYY",
  "DD-MM-YY",
  "MM/DD/YY",
  "DD_MM_YYYY",
  "MM_DD_YYYY",
  "YYYY_MM_DD",
  "DD_MM_YYYY h:i:s a",
  "MM_DD_YYYY h:i:s a",
  "YYYY_MM_DD h:i:s a",
  "DD_MM_YYYY HH:mm:ss",
  "MM_DD_YYYY HH:mm:ss",
  "YYYY_MM_DD HH:mm:ss",
];

type Rule = {
  type: string;
  value?: string | number;
};

type HeaderItem = {
  id: number;
  name: string;
  rules: Rule[];
};

type Props = {
  headers: string[];
  onRulesChange?: (data: any) => void;
};

const ShowValidationRules: React.FC<Props> = ({ headers, onRulesChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [tempRule, setTempRule] = useState<{
    type?:
      | "required"
      | "data_type"
      | "data_length"
      | "date_format"
      | "data_redundant"
      | "regex"
      | "fixed_header"
      | "not_match_found"
      | "cell_end_with"
      | "cell_start_with"
      | "dependency";

    required?: boolean;
    data_type?: string;
    length_mode?: "variable" | "fixed";
    min?: any;
    max?: any;
    fixed?: any;
    date_format?: string;
    data_redundant_value?: string;
    data_redundant_threshold?: string;
    cell_contains_value?: string;
    fixed_header?: string[];
    not_match_found?: string[];
    cell_end_with?: string[];
    cell_start_with?: string;
    custom_date_format?: string;
    // ✅ DEPENDENCY
    dependency_mode?: "required" | "other";
    other_value_main_dependency?: string;

    // ✅ TEMP INPUT
    sub_headers?: string[];
    sub_mode?: "required" | "other";
    sub_value?: string;

    // ✅ FINAL LIST
    sub_dependencies?: {
      headers: string[];
      mode: "required" | "other";
      value?: string;
    }[];
  }>({
    // ✅ VERY IMPORTANT DEFAULTS (fix uncontrolled warning)
    dependency_mode: "required",
    sub_headers: [],
    sub_mode: "required",
    sub_dependencies: [],
  });
  const [data, setData] = useState<HeaderItem[]>(
    headers.map((h, i) => ({
      id: i, // ✅ ADD THIS
      name: h,
      rules: [],
    })),
  );
  const [search, setSearch] = useState("");
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const [selectedHeader, setSelectedHeader] = useState<number>(0);

  const current = data[selectedHeader];

  const applyRule = () => {
    // ✅ 1. Rule must be selected
    if (!tempRule.type) {
      toast.error("Please select a rule");
      return;
    }

    // ✅ 2. If Data Type → must select value
    if (tempRule.type === "data_type" && !tempRule.data_type) {
      toast.error("Please select data type");
      return;
    }
    if (tempRule.type === "data_length") {
      const dataTypeRule = current.rules?.find(
        (rule) => rule.type === "data_type",
      );

      const dataType = dataTypeRule?.value || "string";

      if (tempRule.length_mode === "fixed") {
        if (!tempRule.fixed && tempRule.fixed !== 0) {
          toast.error(
            dataType === "date"
              ? "Please enter fixed date"
              : "Please enter fixed value",
          );
          return;
        }

        if (dataType === "date") {
          const fixedDate = new Date(tempRule.fixed);

          if (isNaN(fixedDate.getTime())) {
            toast.error("Invalid date");
            return;
          }
        } else {
          // 🔢 NUMBER / LENGTH VALIDATION
          const fixedVal = Number(tempRule.fixed);

          if (isNaN(fixedVal)) {
            toast.error("Fixed value must be a number");
            return;
          }

          if (fixedVal < 0) {
            toast.error("Fixed value cannot be negative");
            return;
          }
        }
      } else if (tempRule.length_mode === "variable") {
        if (dataType === "date") {
          const minDate = new Date(tempRule.min);
          const maxDate = new Date(tempRule.max);

          if (!tempRule.min) {
            toast.error("Please enter minimum date");
            return;
          }

          if (!tempRule.max) {
            toast.error("Please enter maximum date");
            return;
          }

          if (isNaN(minDate.getTime())) {
            toast.error("Invalid minimum date");
            return;
          }

          if (isNaN(maxDate.getTime())) {
            toast.error("Invalid maximum date");
            return;
          }

          if (minDate > maxDate) {
            toast.error("Minimum date cannot be greater than maximum date");
            return;
          }
        } else {
          const minVal = Number(tempRule.min);
          const maxVal = Number(tempRule.max);

          if (tempRule.min === "" || tempRule.min === undefined) {
            toast.error("Please enter minimum value");
            return;
          }

          if (tempRule.max === "" || tempRule.max === undefined) {
            toast.error("Please enter maximum value");
            return;
          }

          if (isNaN(minVal) || minVal < 0) {
            toast.error("Minimum value must be a number and >= 0");
            return;
          }

          if (isNaN(maxVal) || maxVal < 0) {
            toast.error("Maximum value must be a number and >= 0");
            return;
          }
          if (minVal >= maxVal) {
            toast.error(
              "Minimum value cannot be same or greater than maximum value",
            );
            return;
          }
        }
      }
    }

    // DATE FORMAT VALIDATION
    if (tempRule.type === "date_format" && !tempRule.date_format) {
      toast.error("Please select date format");
      return;
    }
    ///
    if (tempRule.type === "data_type" && tempRule.date_format === "custom") {
      // ✅ CUSTOM VALIDATION

      if (!tempRule.custom_date_format) {
        toast.error("Please enter custom date format");
        return;
      }

      // basic format validation (production safe)
      const validPattern = /^[YMDHhms:\-/\sA]+$/;

      if (!validPattern.test(tempRule.custom_date_format)) {
        toast.error("Invalid custom date format");
        return;
      }
    }
    ///
    if (tempRule.type === "data_redundant") {
      if (!tempRule.data_redundant_value) {
        toast.error("Please enter redundant value");
        return;
      }

      if (!tempRule.data_redundant_threshold) {
        toast.error("Please enter threshold");
        return;
      }
    }

    if (tempRule.type === "data_redundant") {
      if (!tempRule.data_redundant_value) {
        toast.error("Please enter redundant value");
        return;
      }

      if (!tempRule.data_redundant_threshold) {
        toast.error("Please enter threshold");
        return;
      }
    }

    // ✅ Regex Validation
    if (tempRule.type === "regex") {
      if (!tempRule.cell_contains_value) {
        toast.error("Please enter regex value");
        return;
      }
    }

    if (tempRule.type === "fixed_header") {
      if (!tempRule.fixed_header || tempRule.fixed_header.length === 0) {
        toast.error("Please add at least one fixed header value");
        return;
      }
    }
    if (tempRule.type === "cell_end_with") {
      if (!tempRule.cell_end_with || tempRule.cell_end_with.length === 0) {
        toast.error("Please add at least one cell end with");
        return;
      }
    }
    if (tempRule.type === "cell_start_with") {
      if (!tempRule.cell_start_with) {
        toast.error("Please add at least one cell start with");
        return;
      }
    }
    if (tempRule.type === "not_match_found") {
      if (!tempRule.not_match_found || tempRule.not_match_found.length === 0) {
        toast.error("Please add at least one blocked word");
        return;
      }
    }
    if (tempRule.type === "dependency") {
      if (
        tempRule.dependency_mode === "other" &&
        !tempRule.other_value_main_dependency
      ) {
        toast.error("Enter main dependency value");
        return;
      }

      if (
        !tempRule.sub_dependencies ||
        tempRule.sub_dependencies.length === 0
      ) {
        toast.error("Add at least one sub dependency");
        return;
      }
    }
    const updated = [...data];
    const currentHeader = updated[selectedHeader];

    // ✅ If editing → remove OLD rule (regardless of type)
    if (editingIndex !== null) {
      const removingType = currentHeader.rules[editingIndex]?.type;

      // ✅ If editing data_type → also remove date_format
      if (removingType === "data_type") {
        currentHeader.rules = currentHeader.rules.filter(
          (r, i) => i !== editingIndex && r.type !== "date_format",
        );
      } else {
        currentHeader.rules.splice(editingIndex, 1);
      }
    }

    // ======================
    // REQUIRED
    // ======================
    if (tempRule.type === "required") {
      currentHeader.rules.push({
        type: "required",
        value: true,
      });
    }

    // ======================
    // DATA TYPE
    // ======================
    if (tempRule.type === "data_type") {
      currentHeader.rules.push({
        type: "data_type",
        value: tempRule.data_type || "string", // ✅ fallback
      });

      if (tempRule.data_type == "date") {
        currentHeader.rules.push({
          type: "date_format",
          value:
            tempRule.date_format === "custom"
              ? tempRule.custom_date_format
              : tempRule.date_format || "YYYY-MM-DD", // ✅ safety fallback
        });
      }
    }
    if (tempRule.type === "data_length") {
      currentHeader.rules.push({
        type: "data_length",
        value: {
          mode: tempRule.length_mode || "variable",
          min: tempRule.min,
          max: tempRule.max,
          fixed: tempRule.fixed,
        },
      });
    }

    // if (tempRule.type === "date_format") {

    //   currentHeader.rules.push({
    //     type: "date_format",
    //     value: tempRule.date_format || "YYYY-MM-DD", // ✅ safety fallback
    //   });
    // }

    if (tempRule.type === "data_redundant") {
      currentHeader.rules.push({
        type: "data_redundant",
        value: {
          data_redundant_value: tempRule.data_redundant_value,
          data_redundant_threshold: Number(tempRule.data_redundant_threshold),
        },
      });
    }

    // ======================
    // REGEX
    // ======================
    if (tempRule.type === "regex") {
      currentHeader.rules.push({
        type: "regex",
        value: tempRule.cell_contains_value,
      });
    }

    if (tempRule.type === "fixed_header") {
      currentHeader.rules.push({
        type: "fixed_header",
        value: tempRule.fixed_header,
      });
      console.log(currentHeader);
    }

    if (tempRule.type === "cell_start_with") {
      currentHeader.rules.push({
        type: "cell_start_with",
        value: tempRule.cell_start_with,
      });
    }

    if (tempRule.type === "cell_end_with") {
      currentHeader.rules.push({
        type: "cell_end_with",
        value: tempRule.cell_end_with,
      });
    }

    if (tempRule.type === "not_match_found") {
      currentHeader.rules.push({
        type: "not_match_found",
        value: tempRule.not_match_found,
      });
    }

    if (tempRule.type === "dependency") {
      currentHeader.rules.push({
        type: "dependency",
        value: {
          mode: tempRule.dependency_mode,
          main_value:
            tempRule.dependency_mode === "other"
              ? tempRule.other_value_main_dependency
              : null,
          sub_dependencies: tempRule.sub_dependencies,
        },
      });
    }
    setData(updated);
    onRulesChange?.(generateJSON(currentHeader));

    setIsModalOpen(false);
    setTempRule({});
    setEditingIndex(null);
    setEditingRule(false);
    const rule = getRuleName(tempRule.type);
    toast.success(`${rule} rule applied`);
  };
  const generateJSON = (currentHeader) => {
    const result: any = {};

    data.forEach((item) => {
      const obj: any = {
        name: item.name,
      };

      item.rules.forEach((rule) => {
        if (rule.type === "required") {
          obj.has_empty = rule.value;
        }

        if (rule.type === "data_type") {
          obj.data_type = rule.value;
        }

        if (rule.type === "data_length") {
          const val = rule.value;

          obj.length_validation_type = val.mode;

          if (val.mode === "fixed") {
            obj.min_length = val.fixed;
            obj.max_length = val.fixed;
          } else {
            obj.min_length = val.min;
            obj.max_length = val.max;
          }
        }

        if (rule.type === "date_format") {
          obj.date_format = rule.value;
        }

        if (rule.type === "data_redundant") {
          obj.data_redundant_value = rule.value.data_redundant_value;
          obj.data_redundant_threshold = Number(
            rule.value.data_redundant_threshold,
          );
        }

        if (rule.type === "regex") {
          obj.cell_contains = true;
          obj.cell_contains_value = rule.value;
        }

        if (rule.type === "fixed_header") {
          obj.fixed_header = rule.value;
        }

        if (rule.type === "cell_start_with") {
          obj.cell_start_with = rule.value;
        }

        if (rule.type === "cell_end_with") {
          obj.cell_end_with = rule.value;
        }

        if (rule.type === "not_match_found") {
          obj.not_match_found = rule.value;
        }

        if (rule.type === "dependency") {
          const dep: any = {};

          const main = rule.value;

          // ✅ MAIN
          dep[item.name] = main.mode === "required" ? true : main.main_value;

          // ✅ SUB DEPENDENCIES
          main.sub_dependencies?.forEach((sub: any) => {
            const key = sub.headers.join(","); // comma separated headers

            dep[key] = sub.mode === "required" ? true : (sub.value ?? true); // fallback safety
          });

          obj.dependency = dep;

          console.log("Dependency Output:", dep);
        }
      });

      if (Object.keys(obj).length > 1) {
        result[item.name] = obj;
      }
    });

    return result;
  };

  const handleDeleteRule = (index: number) => {
    if (window.confirm("Are you sure to delete this rule?")) {
      const updated = [...data];
      const currentHeader = updated[selectedHeader];

      const deletedRule = currentHeader.rules[index];

      currentHeader.rules.splice(index, 1);
      console.log(updated);
      setData(updated);

      // ✅ send updated JSON to parent
      onRulesChange?.(generateJSON(currentHeader));

      // ✅ toast message
      const rule = getRuleName(deletedRule.type);
      toast.success(`${rule} rule removed`);
    }
  };

  const getRuleName = (ruleType: string) => {
    if (ruleType === "required") return "Required";
    if (ruleType === "data_type") return "Data Type";
    if (ruleType === "data_length") return "Length type";
    if (ruleType === "regex") return "Regex";
    if (ruleType === "data_redundant") return "Data redundant and threshold";
    if (ruleType === "date_format") return "Date format";
    if (ruleType === "fixed_header") return "Fixed Header Value";
    if (ruleType === "cell_start_with") return "Cell start with";
    if (ruleType === "cell_end_with") return "Cell end with";
    if (ruleType === "not_match_found") return "Blocked value";
    if (ruleType === "dependency") return "Dependacy";
  };
  const appliedRuleTypes = current.rules.map((r) => r.type);
  const appliedRuleDataType = current.rules.filter(
    (r) => r.type == "data_type",
  );
  const formatText = (text: string) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";
  const currentDataType =
    (appliedRuleDataType?.[0]?.value as string) || "string";

  return (
    <div className="flex h-[600px] border rounded-2xl bg-white shadow-sm mt-2">
      {/* LEFT PANEL */}
      <div className="flex flex-col w-1/4 min-h-0 border-r bg-gradient-to-b from-gray-50 to-gray-100">
        {/* HEADER */}
        <div className="p-4 font-semibold text-white border-b bg-gray-800 rounded-t-lg ">
          Headers({filteredData.length})
        </div>

        {/* SEARCH INPUT */}
        <div className="p-3 bg-white border-b">
          <input
            type="text"
            placeholder="Search headers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* LIST */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-100">
          {filteredData.length === 0 ? (
            <div className="p-6 text-sm text-center text-gray-400">
              <div className="mb-2 text-3xl"></div>
              <p className="font-medium text-gray-500">No headers found</p>
              <p className="mt-1 text-xs text-gray-400">
                Try adjusting your search
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHeader(item.id)}
                  className={`group flex items-center justify-between px-3 py-2.5  cursor-pointer text-sm transition-all font-semibold
          
          ${
            selectedHeader === item.id
              ? "flex items-center justify-between px-3.5 py-3 cursor-pointer transition-all duration-150 border-b border-slate-50 bg-[#6C7685] text-white"
              : "hover:bg-white hover:shadow-sm text-gray-800 "
          }`}
                >
                  {/* NAME */}
                  <span className="truncate">{item.name}</span>

                  {/* BADGE */}
                  {item.rules.length > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full transition
              ${
                selectedHeader === item.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
              }`}
                    >
                      {item.rules.length}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="relative flex flex-col flex-1 min-h-0">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-700">{current.name}</h2>

          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 active:scale-[0.98] transition"
            onClick={() => {
              setEditingRule(false);
              setTempRule({});
              setIsModalOpen(true);
            }}
          >
            Add Rule
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto">
          {/* EMPTY STATE */}

          {current.rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="mb-2 text-4xl">📄</div>
              <p className="mb-3 font-medium">No rules yet</p>
              <p className="mb-4 text-sm text-gray-400">
                Start by adding your first rule
              </p>

              <button
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                onClick={() => {
                  setEditingRule(false);
                  setTempRule({});
                  setIsModalOpen(true);
                }}
              >
                Add Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* [[{JSON.stringify(current.rules)}]] */}
              {current.rules
                .filter((rule) => rule.type !== "date_format")
                .map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-3 border rounded-lg bg-gray-50"
                  >
                    <div className="text-sm text-gray-700">
                      {rule.type === "required" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">Required: </span>

                          <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {rule.value ? "Empty Not Allowed" : "Empty Allow"}
                          </span>
                        </div>
                      )}

                      {rule.type === "data_type" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-gray-500">Data Type</span>

                          {/* Data Type Badge */}
                          <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {formatText(rule.value as string)}
                          </span>

                          {/* ✅ If DATE → show format */}
                          {rule.value === "date" &&
                            (() => {
                              const dateFormatRule = current.rules.find(
                                (r) => r.type === "date_format",
                              );

                              return dateFormatRule ? (
                                <span className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">
                                  {dateFormatRule.value as string}
                                </span>
                              ) : null;
                            })()}
                        </div>
                      )}

                      {rule.type === "data_length" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">Length</span>

                          {/* Mode Badge */}
                          <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {formatText(rule.value?.mode)}
                          </span>

                          {/* Values */}
                          {rule.value?.mode === "fixed" && (
                            <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                              {rule.value?.fixed || "-"}
                            </span>
                          )}

                          {rule.value?.mode === "variable" && (
                            <>
                              <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                                {rule.value?.min || "-"}
                              </span>
                              <span className="font-semibold">To</span>
                              <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                                {rule.value?.max || "-"}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* ✅ DATE FORMAT */}
                      {/* {rule.type === "date_format" && (
                      <div className="flex items-center gap-2">
                        <span className=" text-gray-500">Date Format : </span>

                        <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                          {rule.value as string}
                        </span>
                      </div>
                    )} */}

                      {rule.type === "data_redundant" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">Redundant </span>
                          <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {rule.value.data_redundant_value}
                          </span>
                          <span className=" text-gray-500">Threshold </span>
                          <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {rule.value.data_redundant_threshold}
                          </span>
                        </div>
                      )}

                      {rule.type === "regex" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">Regex: </span>

                          <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {rule.value}
                          </span>
                        </div>
                      )}

                      {rule.type === "fixed_header" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">
                            Fixed Header Values:{" "}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(rule.value as string[])?.map((val, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {rule.type === "cell_start_with" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">
                            Cell Start With:{" "}
                          </span>
                          <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {rule.value}
                          </span>
                        </div>
                      )}
                      {rule.type === "cell_end_with" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">
                            Cell End With:{" "}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(rule.value as string[])?.map((val, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {rule.type === "not_match_found" && (
                        <div className="flex items-center gap-2">
                          <span className=" text-gray-500">
                            Blocked value:{" "}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(rule.value as string[])?.map((val, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full"
                              >
                                {val}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {rule.type === "dependency" && (
                        <div className="flex flex-col gap-2">
                          {/* 🔹 Main Dependency */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Dependency
                            </span>

                            <span className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">
                              {rule.value.mode === "required"
                                ? "Required"
                                : rule.value.main_value}
                            </span>
                          </div>

                          {/* 🔹 Sub Dependencies */}
                          {rule.value.sub_dependencies?.length > 0 && (
                            <div className="flex flex-col gap-2 pl-4 border-l border-gray-200">
                              {rule.value.sub_dependencies.map(
                                (s: any, i: number) => (
                                  <div
                                    key={i}
                                    className="flex flex-wrap items-center gap-2 text-xs"
                                  >
                                    {/* Headers */}
                                    <span className="px-2 py-0.5 font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                                      {s.headers.join(", ")}
                                    </span>

                                    {/* Arrow */}
                                    <span className="text-gray-400">→</span>

                                    {/* Mode */}
                                    <span className="px-2 py-0.5 font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full">
                                      {s.mode}
                                    </span>

                                    {/* Value (optional) */}
                                    {s.value && (
                                      <span className="px-2 py-0.5 font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full">
                                        {s.value}
                                      </span>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingRule(true);
                          setEditingIndex(idx);
                          if (rule.type === "required") {
                            setTempRule({
                              type: "required",
                              required: rule.value as boolean,
                            });
                          }

                          if (rule.type === "data_type") {
                            const dataType = rule.value as string;

                            let dateFormatRule = current.rules.find(
                              (r) => r.type === "date_format",
                            );

                            let dateValue = dateFormatRule?.value as string;

                            const isPredefined =
                              date_format_options.includes(dateValue);

                            setTempRule({
                              type: "data_type",
                              data_type: dataType,

                              ...(dataType === "date" && {
                                date_format: isPredefined
                                  ? dateValue
                                  : "custom",
                                custom_date_format: isPredefined
                                  ? ""
                                  : dateValue,
                              }),
                            });
                          }
                          // ✅ DATA LENGTH
                          if (rule.type === "data_length") {
                            const val = rule.value as any;

                            setTempRule({
                              type: "data_length",
                              length_mode: val.mode || "variable",
                              min: val.min ?? "",
                              max: val.max ?? "",
                              fixed: val.fixed ?? "",
                            });
                          }

                          // ✅ DATE FORMAT
                          if (rule.type === "date_format") {
                            const value = rule.value as string;

                            const isPredefined =
                              date_format_options.includes(value);

                            setTempRule({
                              type: "data_type", // ⚠️ IMPORTANT (since UI is inside data_type block)
                              data_type: "date",

                              date_format: isPredefined ? value : "custom",
                              custom_date_format: isPredefined ? "" : value,
                            });
                          }

                          // ✅ DATA REDUNDANT
                          if (rule.type === "data_redundant") {
                            const val = rule.value as any;

                            setTempRule({
                              type: "data_redundant",
                              data_redundant_value: val.data_redundant_value,
                              data_redundant_threshold:
                                val.data_redundant_threshold,
                            });
                          }

                          // ✅ REGEX
                          if (rule.type === "regex") {
                            setTempRule({
                              type: "regex",
                              cell_contains_value: rule.value as string,
                            });
                          }

                          if (rule.type === "fixed_header") {
                            setTempRule({
                              type: "fixed_header",
                              fixed_header: rule.value as string[],
                            });
                          }
                          if (rule.type === "cell_start_with") {
                            setTempRule({
                              type: "cell_start_with",
                              cell_start_with: rule.value as string[],
                            });
                          }
                          if (rule.type === "cell_end_with") {
                            setTempRule({
                              type: "cell_end_with",
                              cell_end_with: rule.value as string[],
                            });
                          }
                          if (rule.type === "not_match_found") {
                            setTempRule({
                              type: "not_match_found",
                              not_match_found: rule.value as string[],
                            });
                          }
                          if (rule.type === "dependency") {
                            const val = rule.value as any;

                            setTempRule({
                              type: "dependency", // ✅ VERY IMPORTANT (fix dropdown issue)

                              // MAIN
                              dependency_mode: val.mode || "required",
                              other_value_main_dependency: val.main_value || "",

                              // SUB DEPENDENCIES (existing list)
                              sub_dependencies: val.sub_dependencies || [],

                              // RESET INPUT STATE
                              sub_headers: [],
                              sub_mode: "required",
                              sub_value: "",
                            });
                          }
                          setIsModalOpen(true);
                        }}
                        className="text-sm text-blue-600"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white w-[420px] rounded-2xl shadow-xl p-6">
            {/* HEADER */}
            <h2 className="mb-4 text-lg font-semibold">
              {editingRule ? "Edit Rule" : "Add Rule"}
            </h2>
            {/* RULE TYPE */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-600">
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
                className="w-full px-3 py-2 mt-1 text-sm border rounded-lg"
              >
                <option value="">Select</option>

                <option
                  value="required"
                  disabled={appliedRuleTypes.includes("required")}
                >
                  Required
                </option>

                <option
                  value="data_type"
                  disabled={appliedRuleTypes.includes("data_type")}
                >
                  Data Type
                </option>

                <option
                  value="data_length"
                  disabled={appliedRuleTypes.includes("data_length")}
                >
                  Data Length
                </option>

                {currentDataType === "date" && (
                  <option
                    value="date_format"
                    disabled={appliedRuleTypes.includes("date_format")}
                  >
                    Date Format
                  </option>
                )}
                <option
                  value="data_redundant"
                  disabled={appliedRuleTypes.includes("data_redundant")}
                >
                  Data Redundant & Threshold
                </option>
                <option
                  disabled={appliedRuleTypes.includes("regex")}
                  value="regex"
                >
                  Regex
                </option>
                <option
                  value="fixed_header"
                  disabled={appliedRuleTypes.includes("fixed_header")}
                >
                  Fixed Header Value
                </option>
                <option
                  value="cell_start_with"
                  disabled={appliedRuleTypes.includes("cell_start_with")}
                >
                  Cell Start With
                </option>
                <option
                  value="cell_end_with"
                  disabled={appliedRuleTypes.includes("cell_end_with")}
                >
                  Cell End With
                </option>
                <option
                  value="not_match_found"
                  disabled={appliedRuleTypes.includes("not_match_found")}
                >
                  Blocked Value
                </option>
                <option
                  value="dependency"
                  disabled={appliedRuleTypes.includes("dependency")}
                >
                  Dependency
                </option>
              </select>
            </div>
            {/* REQUIRED RULE */}
            {tempRule.type === "required" && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Field required?</span>
                <ToggleRight className="text-blue-400" size={28} />
              </div>
            )}
            {/* DATA TYPE RULE */}
            {tempRule.type === "data_type" && (
              <>
                {/* Data Type */}
                <div className="mb-4">
                  <label className="text-sm text-gray-600">
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
                    className="w-full px-3 py-2 mt-1 text-sm border rounded-lg"
                  >
                    <option value="string">String</option>
                    <option value="alphabetic">Alphabetic</option>
                    <option value="integer">Integer</option>
                    <option value="float">Float</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                {/* ✅ Show only if date selected */}
                {tempRule.data_type === "date" && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-600">
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
                      className="w-full px-3 py-2 mt-1 text-sm border rounded-lg"
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
                    <label className="text-sm text-gray-600">
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
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </>
            )}

            {tempRule.type === "data_length" && (
              <div className="space-y-4">
                {/* MODE */}
                <div>
                  <label className="text-sm text-gray-600">Length Type</label>
                  <select
                    value={tempRule.length_mode || "variable"}
                    onChange={(e) =>
                      setTempRule({
                        ...tempRule,
                        length_mode: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 mt-1 text-sm border rounded-lg"
                  >
                    <option value="variable">Variable</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                {/* VARIABLE */}
                {tempRule.length_mode === "variable" && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* STRING TYPES */}
                    {["string", "alphabetic", "email", "boolean"].includes(
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
                          className="px-3 py-2 text-sm border rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Max Value"
                          value={tempRule.max || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, max: e.target.value })
                          }
                          className="px-3 py-2 text-sm border rounded-lg"
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
                          className="px-3 py-2 text-sm border rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Max Length"
                          value={tempRule.max || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, max: e.target.value })
                          }
                          className="px-3 py-2 text-sm border rounded-lg"
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
                          className="px-3 py-2 text-sm border rounded-lg"
                        />
                        <input
                          type="date"
                          value={tempRule.max || ""}
                          onChange={(e) =>
                            setTempRule({ ...tempRule, max: e.target.value })
                          }
                          className="px-3 py-2 text-sm border rounded-lg"
                        />
                      </>
                    )}
                  </div>
                )}
                {/* FIXED */}
                {tempRule.length_mode === "fixed" && (
                  <div className="grid grid-cols-1 gap-3">
                    {/* STRING TYPES */}
                    {["string", "alphabetic", "email", "boolean"].includes(
                      currentDataType,
                    ) && (
                      <input
                        type="number"
                        placeholder="Fixed Value"
                        value={tempRule.fixed || ""}
                        onChange={(e) =>
                          setTempRule({ ...tempRule, fixed: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg"
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
                        className="w-full px-3 py-2 text-sm border rounded-lg"
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
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
            {/* {tempRule.type === "date_format" && (
              <div className="mb-4">
                <label className="text-sm text-gray-600">
                  Select Date Format
                </label>

                <select
                  value={tempRule.date_format || "YYYY-MM-DD"}
                  onChange={(e) =>
                    setTempRule({
                      ...tempRule,
                      date_format: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 mt-1 text-sm border rounded-lg"
                >
                  {date_format_options.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
            )} */}
            {tempRule.type === "data_redundant" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">
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
                    className="w-full px-3 py-2 mt-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Threshold</label>
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
                    className="w-full px-3 py-2 mt-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            {tempRule.type === "regex" && (
              <div>
                <label className="text-sm text-gray-600">
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
                  className="w-full px-3 py-2 mt-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {tempRule.type === "fixed_header" && (
              <TagInputRule
                label="Fixed header value"
                values={tempRule.fixed_header || []}
                onChange={(val) =>
                  setTempRule({ ...tempRule, fixed_header: val })
                }
              />
            )}
            {tempRule.type === "cell_start_with" && (
              // <TagInputRule
              //   label="Cell start with"
              //   values={tempRule.cell_start_with || []}
              //   onChange={(val) =>
              //     setTempRule({ ...tempRule, cell_start_with: val })
              //   }
              // />
              <div>
                <label className="text-sm text-gray-600">Cell start with</label>
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
                  className="w-full px-3 py-2 mt-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {tempRule.type === "cell_end_with" && (
              <TagInputRule
                label="Cell end with  value"
                values={tempRule.cell_end_with || []}
                onChange={(val) =>
                  setTempRule({ ...tempRule, cell_end_with: val })
                }
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
                  <label className="text-sm font-medium text-gray-600">
                    Main Dependency
                  </label>

                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="dependency_mode"
                        checked={
                          (tempRule.dependency_mode ?? "required") ===
                          "required"
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

                    <label className="flex items-center gap-2 text-sm">
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
                      className="w-full px-3 py-2 mt-2 text-sm border rounded-lg"
                    />
                  )}
                </div>

                {/* SUB DEPENDENCY COMPONENT */}
                <SubDependencySection
                  tempRule={tempRule}
                  setTempRule={setTempRule}
                  headers={data.map((h) => h.name)}
                  currentHeader={current.name}
                />
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setTempRule({});
                }}
                className="px-4 py-2 text-sm border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  applyRule();
                }}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {editingRule ? "Edit Rule" : "Add Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowValidationRules;
