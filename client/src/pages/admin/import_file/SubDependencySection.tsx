import React, { useState, useMemo, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2 } from "react-icons/fi";
type SubDependency = {
  headers: string[];
  mode: "required" | "other";
  value?: string;
};

type TempRule = {
  sub_headers?: string[];
  sub_mode?: "required" | "other";
  sub_value?: string;
  sub_dependencies?: SubDependency[];
};

type Props = {
  tempRule: TempRule;
  setTempRule: React.Dispatch<React.SetStateAction<TempRule>>;
  headers: string[];
  currentHeader: string;
};
const radioButtonStyle = "w-4 h-4 text-sidebar focus:ring-sidebarHover";
const label_style = "text-base font-semibold tracking-wide text-sidebar ";
const textbox_style =
  "w-full px-4 py-2.5 mt-1.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebar focus:border-sidebar bg-gray-50 transition-all duration-200";
const SubDependencySection: React.FC<Props> = ({
  tempRule,
  setTempRule,
  headers,
  currentHeader,
}: any) => {
  const availableHeaders = useMemo(
    () => headers.filter((h) => h !== currentHeader),
    [headers, currentHeader],
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const handleAdd = useCallback(() => {
    if (!tempRule.sub_headers || tempRule.sub_headers.length === 0) {
      toast.error("Select at least one header");
      return;
    }

    if (tempRule.sub_mode === "other" && !tempRule.sub_value) {
      toast.error("Enter sub dependency value");
      return;
    }

    const existing = tempRule.sub_dependencies || [];

    // ✅ Exclude current editing item (important for edit case)
    const usedHeaders = new Set(
      existing
        .filter((_, idx) => idx !== editingIndex)
        .flatMap((s) => s.headers),
    );
    const duplicate = tempRule.sub_headers.some((h) => usedHeaders.has(h));

    if (duplicate) {
      toast.error("Header already used");
      return;
    }

    const newItem = {
      headers: tempRule.sub_headers,
      mode: tempRule.sub_mode,
      value: tempRule.sub_mode === "other" ? tempRule.sub_value : undefined,
    };

    let updatedList = [...existing];

    // ✅ EDIT MODE
    if (editingIndex !== null) {
      updatedList[editingIndex] = newItem;
      toast.success("Sub dependency updated");
    } else {
      updatedList.push(newItem);
      toast.success("Sub dependency added");
    }

    setTempRule({
      ...tempRule,
      sub_dependencies: updatedList,
      sub_headers: [],
      sub_mode: "required",
      sub_value: "",
    });

    setEditingIndex(null); // reset edit mode
  }, [tempRule, editingIndex, setTempRule]);

  return (
    <div className="">
      <div className="flex items-center gap-2 mb-4">
        <div className={label_style}>Sub Dependencies</div>
        <span className="px-2 py-0.5 text-xs font-medium text-sidebarSecondary bg-blue-50 rounded-full">
          Atleast One Required
        </span>
      </div>

      {/* MULTISELECT */}
      <label className="block mb-2 text-base font-medium tracking-wide text-sidebar">
        Select Headers
      </label>
      <select
        multiple
        value={tempRule.sub_headers || []}
        onChange={(e) => {
          setTempRule({
            ...tempRule,
            sub_headers: Array.from(e.target.selectedOptions, (o) => o.value),
          });
        }}
        className="w-full px-4 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebar focus:border-sidebar bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
      >
        {availableHeaders.map((h: string) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <label className="block mt-2 mb-2 text-base font-medium tracking-wide text-sidebar">
        Condition Type
      </label>
      {/* RADIO */}
      <div className="flex gap-6 pt-2 border-gray-100 order rounded-xl ">
        <label className="flex items-center gap-2 text-lg">
          <input
            type="radio"
            checked={(tempRule.sub_mode ?? "required") === "required"}
            onChange={() => setTempRule({ ...tempRule, sub_mode: "required" })}
            className={radioButtonStyle}
          />
          <span className="font-base">Required</span>
        </label>

        <label className="flex items-center gap-2 text-lg">
          <input
            type="radio"
            checked={(tempRule.sub_mode ?? "required") === "other"}
            onChange={() => setTempRule({ ...tempRule, sub_mode: "other" })}
            className={radioButtonStyle}
          />

          <span className="font-base"> Other Value</span>
        </label>
      </div>

      {tempRule.sub_mode === "other" && (
        <div className="mt-3 duration-200 animate-in slide-in-from-top-2">
          <input
            type="text"
            value={tempRule.sub_value || ""}
            onChange={(e) =>
              setTempRule({ ...tempRule, sub_value: e.target.value })
            }
            placeholder="Enter value"
            className={textbox_style}
          />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAdd}
          className="flex-1 gap-2 px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-sidebarSecondary to-sidebarSecondaryHover rounded-xl shadow-md hover:shadow-lg hover:from-sidebarSecondaryHover hover:to-sidebarSecondaryHover active:scale-[0.98] transition-all duration-200"
        >
          {editingIndex !== null
            ? "Update Sub Dependency"
            : "Add Sub Dependency"}
        </button>
        {editingIndex !== null && (
          <button
            onClick={() => {
              setEditingIndex(null);
              setTempRule({
                ...tempRule,
                sub_headers: [],
                sub_mode: "required",
                sub_value: "",
              });
            }}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 hover:text-gray-800 transition-all duration-200"
          >
            Cancel
          </button>
        )}
      </div>
      {/* LIST */}
      <div className="mt-4 space-y-2">
        {(tempRule.sub_dependencies || []).map((s: any, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 transition-all duration-200 bg-white border border-gray-100 group rounded-xl hover:shadow-md hover:border-gray-200"
          >
            <div className="flex items-center gap-2 text-sm">
              {/* Headers badges */}
              <div className="flex flex-wrap gap-1.5">
                {s.headers.map((header: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full"
                  >
                    {header}
                  </span>
                ))}
              </div>

              {/* Arrow */}
              <ArrowRight size={14} className="flex-shrink-0 text-gray-400" />

              {/* Condition */}
              {s.mode === "required" ? (
                <span className="px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-full">
                  Required
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                    Equals
                  </span>
                  <span className="px-2 py-0.5 text-xs font-mono font-medium text-gray-700 bg-gray-100 rounded-full">
                    {s.value}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => {
                  setEditingIndex(i);
                  setTempRule({
                    ...tempRule,
                    sub_headers: s.headers,
                    sub_mode: s.mode,
                    sub_value: s.value || "",
                  });
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <FiEdit size={14} />
              </button>
              <button
                onClick={() => {
                  const updated = (tempRule.sub_dependencies || []).filter(
                    (_: any, idx: number) => idx !== i,
                  );
                  setTempRule({
                    ...tempRule,
                    sub_dependencies: updated,
                  });
                  toast.success("Sub dependency removed");
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SubDependencySection);
