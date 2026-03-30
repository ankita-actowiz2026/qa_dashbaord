import React, { useState } from "react";
import toast from "react-hot-toast";

const SubDependencySection = ({
  tempRule,
  setTempRule,
  headers,
  currentHeader,
}: any) => {
  const availableHeaders = headers.filter((h: string) => h !== currentHeader);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const handleAdd = () => {
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
    const usedHeaders = existing
      .filter((_, idx) => idx !== editingIndex)
      .flatMap((s: any) => s.headers);

    const duplicate = tempRule.sub_headers.some((h: string) =>
      usedHeaders.includes(h),
    );

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
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-sm font-semibold">Sub Dependencies</h3>

      {/* MULTISELECT */}
      <select
        multiple
        value={tempRule.sub_headers || []}
        onChange={(e) => {
          setTempRule({
            ...tempRule,
            sub_headers: Array.from(e.target.selectedOptions, (o) => o.value),
          });
        }}
        className="w-full border rounded-lg px-3 py-2 h-28"
      >
        {availableHeaders.map((h: string) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      {/* RADIO */}
      <div className="flex gap-4">
        <label>
          <input
            type="radio"
            checked={(tempRule.sub_mode ?? "required") === "required"}
            onChange={() => setTempRule({ ...tempRule, sub_mode: "required" })}
          />
          Required
        </label>

        <label>
          <input
            type="radio"
            checked={(tempRule.sub_mode ?? "required") === "other"}
            onChange={() => setTempRule({ ...tempRule, sub_mode: "other" })}
          />
          Other Value
        </label>
      </div>

      {tempRule.sub_mode === "other" && (
        <input
          type="text"
          value={tempRule.sub_value || ""}
          onChange={(e) =>
            setTempRule({ ...tempRule, sub_value: e.target.value })
          }
          placeholder="Enter value"
          className="w-full border rounded-lg px-3 py-2"
        />
      )}

      <button
        onClick={handleAdd}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        {editingIndex !== null ? "Update Sub Dependency" : "Add Sub Dependency"}
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
          className="text-sm text-gray-500 underline"
        >
          Cancel Edit
        </button>
      )}

      {/* LIST */}
      {(tempRule.sub_dependencies || []).map((s: any, i: number) => (
        <div
          key={i}
          className="flex justify-between items-center bg-gray-100 px-3 py-2 rounded"
        >
          <div className="text-sm">
            {s.headers.join(", ")} → {s.mode} {s.value && <b>({s.value})</b>}
          </div>

          <div className="flex gap-2">
            {/* EDIT */}
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
              className="text-blue-600 text-xs"
            >
              Edit
            </button>

            {/* DELETE */}
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
              className="text-red-500 text-xs"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubDependencySection;
