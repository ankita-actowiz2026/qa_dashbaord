import { validateRule } from "./ruleValidator";
import RuleModal from "./RuleModal";
import { FiPlus, FiTrash2, FiEdit } from "react-icons/fi";
import React, { useState, useMemo } from "react";
import { MdClear } from "react-icons/md";
import { ArrowRight, CloudHail } from "lucide-react";
import toast from "react-hot-toast";
import { getRuleName, date_format_options, RULE_LABELS } from "./defaultValues";
import { generateRulesJSON } from "./generateRulesJSON";
const defaultTempRule = {
  dependency_mode: "required",
  sub_headers: [],
  sub_mode: "required",
  sub_dependencies: [],
};
type Rule =
  | { type: "required"; value: boolean }
  | { type: "data_type"; value: string }
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
};

const ShowValidationRules: React.FC<Props> = ({ headers, onRulesChange }) => {
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
    data_type?: string;
    length_mode?: "variable" | "fixed";
    min?: number | string;
    max?: number | string;
    fixed?: number | string;
    date_format?: string;
    data_redundant_value?: string;
    data_redundant_threshold?: string;
    cell_contains_value?: string;
    fixed_header?: string[];
    not_match_found?: string[];
    cell_end_with?: string[];
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
    const error = validateRule(tempRule, {
      ...current,
      tempDataType:
        tempRule.type === "data_type"
          ? tempRule.data_type
          : current.rules?.find((r) => r.type === "data_type")?.value,
    });
    if (error) return toast.error(error);
    const updated = data.map((h, i) =>
      i === selectedHeader ? { ...h, rules: [...h.rules] } : h,
    );
    const currentHeader = updated[selectedHeader];

    // ✅ If editing → remove OLD rule (regardless of type)
    if (editingIndex !== null) {
      const removingType = currentHeader.rules[editingIndex]?.type;

      // ✅ If editing data_type → also remove date_format
      if (removingType === "data_type") {
        const previousDataType = currentHeader.rules[editingIndex]?.value;
        const newDataType = tempRule.data_type;

        currentHeader.rules = currentHeader.rules.filter((r, i) => {
          if (i === editingIndex) return false;

          // keep your existing logic
          if (r.type === "date_format") return false;

          // ✅ FIXED condition
          const isSwitchingWithDate =
            previousDataType !== newDataType &&
            (previousDataType === "date" || newDataType === "date");

          if (r.type === "data_length" && isSwitchingWithDate) {
            return false;
          }

          return true;
        });
      } else {
        console.log("Else");
        currentHeader.rules.splice(editingIndex, 1);
      }
    }
    switch (tempRule.type) {
      case "required":
        currentHeader.rules.push({
          type: "required",
          value: true,
        });
        break;
      case "data_type":
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
        break;
      case "data_length":
        currentHeader.rules.push({
          type: "data_length",
          value: {
            mode: tempRule.length_mode || "variable",
            min: tempRule.min,
            max: tempRule.max,
            fixed: tempRule.fixed,
          },
        });
        break;
      case "data_redundant":
        currentHeader.rules.push({
          type: "data_redundant",
          value: {
            data_redundant_value: tempRule.data_redundant_value,
            data_redundant_threshold: Number(tempRule.data_redundant_threshold),
          },
        });
        break;
      case "regex":
        currentHeader.rules.push({
          type: "regex",
          value: tempRule.cell_contains_value,
        });
        break;
      case "fixed_header":
        currentHeader.rules.push({
          type: "fixed_header",
          value: tempRule.fixed_header,
        });
        break;
      case "cell_start_with":
        currentHeader.rules.push({
          type: "cell_start_with",
          value: tempRule.cell_start_with,
        });
        break;
      case "cell_end_with":
        currentHeader.rules.push({
          type: "cell_end_with",
          value: tempRule.cell_end_with,
        });
        break;
      case "not_match_found":
        currentHeader.rules.push({
          type: "not_match_found",
          value: tempRule.not_match_found,
        });
        break;
      case "dependency":
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
        break;
    }

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
  const currentDataType =
    (appliedRuleDataType?.[0]?.value as string) || "string";

  const buildTempRule = (rule: Rule): any => {
    switch (rule.type) {
      case "required":
        return {
          type: "required",
          required: rule.value as boolean,
        };

      case "data_type": {
        const dataType = rule.value as string;
        const dateFormatRule = current.rules.find(
          (r) => r.type === "date_format",
        );

        const dateValue = dateFormatRule?.value as string;
        const isPredefined = date_format_options.includes(dateValue);
        return {
          type: "data_type",
          data_type: dataType,
          ...(dataType === "date" && {
            date_format: isPredefined ? dateValue : "custom",
            custom_date_format: isPredefined ? "" : dateValue,
          }),
        };
      }

      case "date_format": {
        const value = rule.value as string;
        const isPredefined = date_format_options.includes(value);
        return {
          type: "data_type", // important
          data_type: "date",
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
          fixed_header: rule.value as string[],
        };

      case "cell_start_with":
        return {
          type: "cell_start_with",
          cell_start_with: rule.value,
        };

      case "cell_end_with":
        return {
          type: "cell_end_with",
          cell_end_with: rule.value as string[],
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
          sub_dependencies: val.sub_dependencies || [],
          sub_headers: [],
          sub_mode: "required",
          sub_value: "",
        };
      }

      default:
        return {};
    }
  };

  return (
    <div className="flex h-[600px] border rounded-2xl bg-white shadow-sm mt-2">
      {/* LEFT PANEL */}
      <div className="flex flex-col w-1/4 min-h-0 border-r bg-gradient-to-b from-gray-50 to-gray-100">
        {/* HEADER */}
        <div className="p-4 font-semibold text-white bg-gray-800 border-b rounded-t-lg ">
          Headers ({filteredData.length})
        </div>

        {/* SEARCH INPUT */}
        <div className="p-3 bg-white border-b">
          <input
            type="text"
            placeholder="Search headers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* LIST */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-100">
          {filteredData.length === 0 ? (
            <div className="p-6 text-base text-center text-gray-400">
              <div className="mb-2 text-3xl"></div>
              <p className="font-medium text-gray-500">No headers found</p>
              <p className="mt-1 text-base text-gray-400">
                Try adjusting your search
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHeader(item.id)}
                  className={`group flex items-center justify-between px-3 py-2.5  cursor-pointer text-base transition-all font-semibold
          
          ${
            selectedHeader === item.id
              ? "flex items-center justify-between px-3.5 py-3 cursor-pointer transition-all duration-150 border-b border-slate-50 bg-gray-500 text-white"
              : "hover:bg-gray-200 hover:shadow-sm text-gray-800 "
          }`}
                >
                  {/* NAME */}
                  <span className="truncate">{item.name}</span>

                  {/* BADGE */}
                  {item.rules.length > 0 && (
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full transition
              ${
                selectedHeader === item.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
              }`}
                    >
                      {
                        item.rules.filter((r) => r.type !== "date_format")
                          .length
                      }
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
            className="inline-flex items-center gap-2 py-2.5 px-6  font-medium bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 active:scale-[0.98] transition"
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
          {/* EMPTY STATE */}

          {current.rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="mb-2 text-4xl">📄</div>
              <p className="mb-3 font-medium">No rules yet</p>
              <p className="mb-4 text-base text-gray-400">
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
              {/* {JSON.stringify(current)} */}
              {current.rules
                .filter((rule) => rule.type !== "date_format")
                .map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-3 border rounded-lg bg-gray-50 "
                  >
                    <div className="flex-1 min-w-0 text-base text-gray-700">
                      {[
                        "required",
                        "regex",
                        "cell_start_with",
                        "data_redundant",
                      ].includes(rule.type) && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 ">
                            {RULE_LABELS[rule.type]}{" "}
                          </span>

                          <span className="px-2.5 py-1 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
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

                              <span className="px-2.5 py-1 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                                {rule.value?.data_redundant_threshold}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {rule.type === "data_type" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-gray-500">Data Type</span>

                          {/* Data Type Badge */}
                          <span className="px-2.5 py-1 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {formatText(rule.value as string)}
                          </span>

                          {/* ✅ If DATE → show format */}
                          {rule.value === "date" &&
                            (() => {
                              const dateFormatRule = current.rules.find(
                                (r) => r.type === "date_format",
                              );

                              return dateFormatRule ? (
                                <span className="px-2.5 py-1 text-base font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">
                                  {dateFormatRule.value as string}
                                </span>
                              ) : null;
                            })()}
                        </div>
                      )}

                      {rule.type === "data_length" && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 ">
                            {RULE_LABELS[rule.type]}
                          </span>

                          {/* Mode Badge */}
                          <span className="px-2.5 py-1 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                            {formatText(rule.value?.mode)}
                          </span>

                          {/* Values */}
                          {rule.value?.mode === "fixed" && (
                            <span className="px-2 py-0.5 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                              {rule.value?.fixed || "-"}
                            </span>
                          )}

                          {rule.value?.mode === "variable" && (
                            <>
                              <span className="px-2 py-0.5 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                                {rule.value?.min || "-"}
                              </span>
                              <span className="font-semibold">To</span>
                              <span className="px-2 py-0.5 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                                {rule.value?.max || "-"}
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {[
                        "fixed_header",
                        "cell_end_with",
                        "not_match_found",
                      ].includes(rule.type) && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 ">
                            Blocked value:{" "}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(rule.value as string[])?.map((val, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 text-base font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full"
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
                            <span className="text-base text-gray-500">
                              Dependency
                            </span>

                            <span className="px-2.5 py-1 text-base font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">
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
                                    className="flex flex-wrap items-center gap-2 text-base"
                                  >
                                    {/* Headers */}
                                    <span className="px-2 py-0.5 font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
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
                          setTempRule(buildTempRule(rule));
                          setIsModalOpen(true);
                        }}
                        className="text-base text-blue-600"
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
            className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6
               transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setConfirmOpen(false)}
              className="absolute top-6 right-4 text-gray-400 hover:text-gray-600"
            >
              <MdClear size={18} />
            </button>
            {/* Title */}
            <div className=" pb-3">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                Delete Rule
              </h2>

              {/* Description */}
              <p className="text-base text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to delete this rule?
              </p>

              {/* Actions */}
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-2 text-base rounded-lg border border-gray-200
                      text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-base rounded-lg bg-red-500 text-white
                      hover:bg-red-600 transition-colors shadow-sm"
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
