import { validateRule } from "./ruleValidator";
import RuleModal from "./RuleModal";
import { FiSearch, FiPlus, FiTrash2, FiEdit, FiFileText } from "react-icons/fi";
import React, { useState, useMemo, useEffect } from "react";
import { MdClear } from "react-icons/md";
import { ArrowRight, CloudHail } from "lucide-react";
import toast from "react-hot-toast";
import { getRuleName, date_format_options, RULE_LABELS } from "./defaultValues";
import { generateRulesJSON } from "./generateRulesJSON";

const capitalizeFirst = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
const defaultTempRule = {
  dependency_mode: "required",
  sub_headers: [],
  sub_mode: "required",
  sub_dependencies: [],
};
type Rule =
  | { type: "required"; value: boolean }
  | { type: "data_type"; value: string[] }
  | {
      type: "data_length";
      value: {
        mode: "fixed" | "variable";
        min?: number | string;
        max?: number | string;
        fixed?: number | string;
      };
    }
  | { type: "date_format"; value: string }
  | {
      type: "data_redundant";
      value: {
        data_redundant_value: string;
        data_redundant_threshold: number;
      };
    }
  | { type: "regex"; value: string }
  | { type: "fixed_header"; value: string[] }
  | { type: "cell_start_with"; value: string[] }
  | { type: "cell_end_with"; value: string[] }
  | { type: "not_match_found"; value: string[] }
  | {
      type: "dependency";
      value: {
        mode: "required" | "other";
        main_value?: string | null;
        sub_dependencies: {
          headers: string[];
          mode: "required" | "other";
          value?: string;
        }[];
      };
    };
type HeaderItem = {
  id: number;
  name: string;
  rules: Rule[];
};

type Props = {
  headers: string[];
  onRulesChange?: (data: any) => void;
  rulesData?: Record<string, any>;
};
const ruleListClass =
  "px-2.5 py-1 text-lg font-medium text-sidebarSecondary bg-blue-50 border border-blue-200 rounded-full";
const addButtonClass =
  "inline-flex items-center gap-2 px-6 py-3 text-lg font-medium bg-sidebarSecondary  text-white rounded-xl shadow-md hover:shadow-lg hover:bg-sidebarSecondaryHover active:scale-[0.98] transition-all duration-200";
const ShowValidationRules: React.FC<Props> = ({
  headers,
  onRulesChange,
  rulesData,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
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
    data_type?: string[];
    length_mode?: "variable" | "fixed";
    min?: number | string;
    max?: number | string;
    fixed?: number | string;
    date_format?: string;
    data_redundant_value?: string;
    data_redundant_threshold?: string;
    cell_contains_value?: string;
    fixed_header?: string;
    not_match_found?: string[];
    cell_end_with?: string;
    cell_start_with?: string;
    custom_date_format?: string;
    dependency_mode?: "required" | "other";
    other_value_main_dependency?: string;

    sub_headers?: string[];
    sub_mode?: "required" | "other";
    sub_value?: string;

    sub_dependencies?: {
      headers: string[];
      mode: "required" | "other";
      value?: string;
    }[];
  }>({
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
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);
  const [selectedHeader, setSelectedHeader] = useState<number>(0);

  const current = useMemo(() => data[selectedHeader], [data, selectedHeader]);
  const applyRule = () => {
    const dataTypeRule = current.rules.find((r) => r.type === "data_type");

    const error = validateRule(tempRule, {
      ...current,
      tempDataType:
        tempRule.type === "data_type"
          ? tempRule.data_type
          : dataTypeRule?.value,
    });

    if (error) return toast.error(error);

    let newRule: Rule | null = null;

    // ✅ STEP 1: Create new rule
    switch (tempRule.type) {
      case "required":
        newRule = { type: "required", value: true };
        break;

      case "data_type": {
        const dataTypes = Array.isArray(tempRule.data_type)
          ? tempRule.data_type
          : [];

        newRule = {
          type: "data_type",
          value: dataTypes,
        };
        break;
      }

      case "date_format":
        newRule = {
          type: "date_format",
          value:
            tempRule.date_format === "custom"
              ? tempRule.custom_date_format
              : tempRule.date_format || "YYYY-MM-DD",
        };
        break;

      case "data_length":
        newRule = {
          type: "data_length",
          value: {
            mode: tempRule.length_mode || "variable",
            min: tempRule.min,
            max: tempRule.max,
            fixed: tempRule.fixed,
          },
        };
        break;

      case "data_redundant":
        newRule = {
          type: "data_redundant",
          value: {
            data_redundant_value: tempRule.data_redundant_value,
            data_redundant_threshold: Number(tempRule.data_redundant_threshold),
          },
        };
        break;

      case "regex":
        newRule = {
          type: "regex",
          value: tempRule.cell_contains_value,
        };
        break;

      case "fixed_header":
        newRule = {
          type: "fixed_header",
          value: tempRule.fixed_header,
        };
        break;

      case "cell_start_with":
        newRule = {
          type: "cell_start_with",
          value: tempRule.cell_start_with,
        };
        break;

      case "cell_end_with":
        newRule = {
          type: "cell_end_with",
          value: tempRule.cell_end_with,
        };
        break;

      case "not_match_found":
        newRule = {
          type: "not_match_found",
          value: tempRule.not_match_found,
        };
        break;

      case "dependency":
        newRule = {
          type: "dependency",
          value: {
            mode: tempRule.dependency_mode,
            main_value:
              tempRule.dependency_mode === "other"
                ? tempRule.other_value_main_dependency
                : null,
            sub_dependencies: tempRule.sub_dependencies,
          },
        };
        break;
    }

    // ✅ STEP 2: Update state IMMUTABLY
    const updated = data.map((h, i) => {
      if (i !== selectedHeader) return h;

      let rules = [...h.rules];

      // ✅ remove old rule if editing
      if (editingIndex !== null) {
        rules = rules.filter((_, idx) => idx !== editingIndex);
      }

      // ✅ special case for data_type
      if (tempRule.type === "data_type" && newRule) {
        const types = (newRule.value as string[]) || [];

        if (!types.includes("date")) {
          rules = rules.filter((r) => r.type !== "date_format");
        }
      }

      // ✅ add new rule
      if (newRule) {
        rules = [...rules, newRule];
      }

      return {
        ...h,
        rules,
      };
    });

    // ✅ FINAL SET
    setData(updated);
    onRulesChange?.(generateRulesJSON(updated));

    setIsModalOpen(false);
    setTempRule({});
    setEditingIndex(null);
    setEditingRule(false);

    const rule = getRuleName(tempRule.type || "");
    toast.success(`${rule} rule applied`);
  };
  const handleDeleteRule = (index: number) => {
    setDeleteIndex(index);
    setConfirmOpen(true);
  };
  const confirmDelete = () => {
    if (deleteIndex === null) return;

    const updated = [...data];
    const currentHeader = updated[selectedHeader];

    const deletedRule = currentHeader.rules[deleteIndex];
    currentHeader.rules.splice(deleteIndex, 1);

    setData(updated);
    onRulesChange?.(generateRulesJSON(updated));

    const rule = getRuleName(deletedRule.type);
    toast.success(`${rule} rule removed`);

    setConfirmOpen(false);
    setDeleteIndex(null);
  };

  const appliedRuleTypes = current.rules.map((r) => r.type);
  const appliedRuleDataType = current.rules.filter(
    (r) => r.type == "data_type",
  );
  const formatText = (text: string) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";
  const currentDataType = (appliedRuleDataType?.[0]?.value as string[]) || [
    "string",
  ];
  // useEffect(() => {
  //   if (headers.length > 0) {
  //     setData(
  //       headers.map((h, i) => ({
  //         id: i,
  //         name: h,
  //         rules: [],
  //       })),
  //     );
  //   }
  // }, [headers]);
  const buildTempRule = (rule: Rule): any => {
    console.log("EDIT RULE VALUE:", rule.value);
    switch (rule.type) {
      case "required":
        return {
          type: "required",
          required: rule.value as boolean,
        };

      case "data_type":
        return {
          type: "data_type",
          data_type: Array.isArray(rule.value) ? rule.value : [rule.value],
        };

      case "date_format": {
        const value = rule.value as string;
        const isPredefined = date_format_options.includes(value);

        return {
          type: "date_format",
          date_format: isPredefined ? value : "custom",
          custom_date_format: isPredefined ? "" : value,
        };
      }

      case "data_length": {
        const val = rule.value as any;
        return {
          type: "data_length",
          length_mode: val.mode || "variable",
          min: val.min ?? "",
          max: val.max ?? "",
          fixed: val.fixed ?? "",
        };
      }

      case "data_redundant": {
        const val = rule.value as any;
        return {
          type: "data_redundant",
          data_redundant_value: val.data_redundant_value,
          data_redundant_threshold: val.data_redundant_threshold,
        };
      }

      case "regex":
        return {
          type: "regex",
          cell_contains_value: rule.value as string,
        };

      case "fixed_header":
        return {
          type: "fixed_header",
          fixed_header: rule.value,
        };

      case "cell_start_with":
        return {
          type: "cell_start_with",
          cell_start_with: rule.value,
        };

      case "cell_end_with":
        return {
          type: "cell_end_with",
          cell_end_with: rule.value,
        };

      case "not_match_found":
        return {
          type: "not_match_found",
          not_match_found: rule.value as string[],
        };

      case "dependency": {
        const val = rule.value as any;
        return {
          type: "dependency",
          dependency_mode: val.mode || "required",
          other_value_main_dependency: val.main_value || "",
          sub_dependencies: (val.sub_dependencies || []).map((s: any) => ({
            headers: [...s.headers],
            mode: s.mode,
            value: s.value,
          })),
          sub_headers: [],
          sub_mode: "required",
          sub_value: "",
        };
      }

      default:
        return {};
    }
  };
  useEffect(() => {
    if (!headers.length) return;
    //if (data.length > 0 && data.some((d) => d.rules.length > 0)) return;
    const mappedData = headers.map((header, index) => {
      const saved = rulesData?.[header];

      let rules: Rule[] = [];

      if (saved) {
        // Required
        if (saved.is_required) {
          rules.push({ type: "required", value: true });
        }

        // Data type
        if (saved.data_type) {
          rules.push({
            type: "data_type",
            value: Array.isArray(saved.data_type)
              ? saved.data_type
              : [saved.data_type],
          });
        }
        if (saved.cell_start_with) {
          rules.push({
            type: "cell_start_with",
            value: saved.cell_start_with,
          });
        }
        // Length
        if (saved.length_validation_type) {
          rules.push({
            type: "data_length",
            value: {
              mode: saved.length_validation_type,
              min: saved.min_length,
              max: saved.max_length,
              fixed: saved.min_length,
            },
          });
        }

        // Date format
        if (saved.date_format) {
          rules.push({
            type: "date_format",
            value: saved.date_format,
          });
        }

        // Regex
        if (saved.cell_contains) {
          rules.push({
            type: "regex",
            value: saved.cell_contains_value,
          });
          console.log(rules);
        }

        if (saved.dependency) {
          console.log("saved start");
          console.log(saved.dependency);
          console.log("saved end");
          const keys = Object.keys(saved.dependency);

          rules.push({
            type: "dependency",
            value: {
              mode: saved.dependency.mode || "required",
              main_value: saved.dependency.main_value || null,
              sub_dependencies: saved.dependency.sub_dependencies || [],
            },
          });
        }
        if (saved.not_match_found) {
          rules.push({
            type: "not_match_found",
            value: Array.isArray(saved.not_match_found)
              ? saved.not_match_found
              : [saved.not_match_found],
          });
        }

        if (saved.cell_end_with) {
          rules.push({
            type: "cell_end_with",
            value: saved.cell_end_with,
          });
        }
        if (saved.data_redundant_value || saved.data_redundant_threshold) {
          rules.push({
            type: "data_redundant",
            value: {
              data_redundant_value: saved.data_redundant_value || "",
              data_redundant_threshold: Number(
                saved.data_redundant_threshold || 0,
              ),
            },
          });
        }
        if (saved.fixed_header) {
          rules.push({
            type: "fixed_header",
            value: saved.fixed_header,
          });
        }
      }

      return {
        id: index,
        name: header,
        rules,
      };
    });
    console.log("rulesData", rulesData);
    console.log("mappedData", mappedData);
    setData(mappedData);
  }, [headers, rulesData]);
  return (
    <div className="flex flex-col gap-5 mt-2 md:flex-row">
      {/* LEFT PANEL */}
      <div className="flex flex-col w-full md:w-1/4 h-[calc(100vh-2rem)] bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold tracking-wide text-gray-700 ">
              Columns
            </h3>
            <span className="px-2.5 py-1 text-base font-medium text-sidebar bg-blue-50 rounded-full">
              {filteredData.length}
            </span>
          </div>
        </div>

        {/* SEARCH INPUT */}
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="relative">
            <FiSearch
              className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
              size={16}
            />
            <input
              type="text"
              placeholder="Search headers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebar focus:border-transparent bg-gray-50 transition-all duration-200"
            />
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-white">
          {filteredData.length === 0 ? (
            <div className="p-6 text-lg text-center text-gray-400">
              <div className="mb-2 text-3xl"></div>
              <p className="font-medium text-gray-500">No headers found</p>
              <p className="mt-1 text-lg text-gray-400">
                Try adjusting your search
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHeader(item.id)}
                  className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg ${
                    selectedHeader === item.id
                      ? "bg-sidebar text-white shadow-md"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {/* NAME */}
                  <span className="flex-1 text-base font-medium truncate">
                    {item.name}
                  </span>

                  {/* BADGE */}
                  {item.rules.length > 0 && (
                    <span
                      className={`text-base px-2 py-1 rounded-full font-medium transition-all duration-200 ${
                        selectedHeader === item.id
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
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
      <div className="flex flex-col flex-1 h-[calc(100vh-2rem)] bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-semibold text-gray-700">
              {current.name}
            </h2>
            <p className="text-base text-gray-400 mt-0.5">
              Configure validation rules
            </p>
          </div>

          <button
            className={addButtonClass}
            onClick={() => {
              setEditingRule(false);
              setTempRule({});
              setIsModalOpen(true);
            }}
          >
            <FiPlus size={16} />
            Add Rule
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto">
          [[[[{JSON.stringify(current.rules)}]]]
          {/* EMPTY STATE */}
          {current.rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                <FiFileText className="text-3xl text-sidebar" />
              </div>
              <p className="mb-2 text-lg font-semibold from-gray-50 to-gray-100">
                No rules yet
              </p>
              <p className="mb-6 text-base text-gray-400">
                Start by adding your first validation rule
              </p>

              <button
                className={addButtonClass}
                onClick={() => {
                  setEditingRule(false);
                  setTempRule({});
                  setIsModalOpen(true);
                }}
              >
                <FiPlus size={16} />
                Add Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {current.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2 py-4 transition-all duration-200 bg-white border border-gray-100 group rounded-xl hover:shadow-md hover:border-gray-200 "
                >
                  <div className="flex-1 min-w-0 text-lg text-gray-700">
                    {[
                      "required",
                      "regex",
                      "cell_start_with",
                      "cell_end_with",
                      "fixed_header",
                      "data_redundant",
                    ].includes(rule.type) && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 ">
                          {RULE_LABELS[rule.type]}{" "}
                        </span>

                        <span className={ruleListClass}>
                          {rule.type === "required"
                            ? rule.value
                              ? "Empty Not Allowed"
                              : "Empty Allow"
                            : rule.type === "data_redundant"
                              ? rule.value?.data_redundant_value
                              : typeof rule.value === "string"
                                ? rule.value
                                : ""}
                        </span>

                        {rule.type === "data_redundant" && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Threshold</span>

                            <span className={ruleListClass}>
                              {rule.value?.data_redundant_threshold}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {rule.type === "data_type" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sidebar">Data Type</span>

                        <span className={ruleListClass}>
                          {(rule.value as string[])
                            .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {rule.type === "date_format" && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Date Format</span>
                        <span className={ruleListClass}>
                          {rule.value as string}
                        </span>
                      </div>
                    )}
                    {rule.type === "data_length" && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 ">
                          {RULE_LABELS[rule.type]}
                        </span>

                        {/* Mode Badge */}
                        <span className={ruleListClass}>
                          {formatText(rule.value?.mode)}
                        </span>

                        {/* Values */}
                        {rule.value?.mode === "fixed" && (
                          <span className={ruleListClass}>
                            {rule.value?.fixed || "-"}
                          </span>
                        )}

                        {rule.value?.mode === "variable" && (
                          <>
                            <span className={ruleListClass}>
                              {rule.value?.min || "-"}
                            </span>
                            <span className="font-semibold">To</span>
                            <span className={ruleListClass}>
                              {rule.value?.max || "-"}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {["not_match_found"].includes(rule.type) && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 ">
                          {RULE_LABELS[rule.type]}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(rule.value as string[])?.map((val, index) => (
                            <span key={index} className={ruleListClass}>
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
                          <span className="text-lg text-gray-500">
                            Dependency
                          </span>

                          <span className={ruleListClass}>
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
                                  className="flex flex-wrap items-center gap-2 text-lg"
                                >
                                  {/* Headers */}
                                  <span className={ruleListClass}>
                                    {s.headers.join(", ")}
                                  </span>

                                  {/* Arrow */}
                                  <span className="text-gray-400">
                                    <ArrowRight
                                      size={12}
                                      className="inline-block text-gray-400"
                                    />
                                  </span>

                                  {/* Mode */}
                                  {s.mode == "required" && (
                                    <span className={ruleListClass}>
                                      {capitalizeFirst(s.mode)}
                                    </span>
                                  )}
                                  {/* Value (optional) */}
                                  {s.value && (
                                    <span className={ruleListClass}>
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

                  <div className="flex items-center gap-2 ml-4 transition-opacity duration-200 opacity-100 ">
                    <button
                      onClick={() => {
                        setEditingRule(true);
                        setEditingIndex(idx);
                        setTempRule(buildTempRule(rule));
                        setIsModalOpen(true);
                      }}
                      className="p-2 transition-all duration-200 rounded-lg text-sidebar hover:text-sidebarSecondaryHover hover:bg-blue-50"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(idx)}
                      className="p-2 transition-all duration-200 rounded-lg text-sidebar hover:text-red-600 hover:bg-red-50"
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
      <RuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTempRule({});
          setEditingIndex(null);
          setEditingRule(false);
        }}
        onSubmit={applyRule}
        tempRule={tempRule}
        setTempRule={setTempRule}
        editingRule={editingRule}
        currentDataType={currentDataType}
        appliedRuleTypes={appliedRuleTypes}
        headers={data.map((h) => h.name)}
        currentHeader={current.name}
      />
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl p-6 bg-white rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setConfirmOpen(false)}
              className="absolute text-gray-400 top-6 right-4 hover:text-gray-600"
            >
              <MdClear size={18} />
            </button>
            {/* Title */}
            <div className="text-center">
              {/* Description */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <FiTrash2 className="text-2xl text-red-600" />
              </div>
              <h1 className="text-3xl font-semibold text-gray-800">
                Deleteing Rule
              </h1>
              <p className="mt-2 text-lg text-gray-500">
                Are you sure you want to delete this rule?{" "}
              </p>

              {/* Actions */}
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2 text-lg text-gray-600 transition-colors border border-gray-200 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-lg text-white transition-colors bg-red-500 rounded-lg shadow-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShowValidationRules;
