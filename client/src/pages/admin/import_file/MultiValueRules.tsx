import { set, useFieldArray } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { InfoTooltip } from "../../../utils/ToolTips";
export default function MultiValueRules({
  headerName,
  control,
  register,
  watch,
  errors,
  multiValueRulesInputs,
  handleMultiValueRulesInputChange,
  addMultiValueRules,
  cancelMultiValueRules,
  inputType,
}) {
  console.log("MultiValueRules");
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: `${headerName}.${inputType}`,
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const title =
    inputType === "fixed_header"
      ? "Fixed Header Values"
      : inputType === "cell_start_with"
        ? "Cell Start With Values"
        : inputType === "cell_end_with"
          ? "Cell End With Values"
          : inputType === "not_match_found"
            ? "Blocked Values"
            : "";
  const handleDelete = (index: number) => {
    if (window.confirm("Are you sure you want to delete?")) {
      remove(index);
    }
  };
  const startEdit = (index: number) => {
    setEditIndex(index);
    setEditValue(fields[index].value);
    setEditError("");
  };
  const updateValue = () => {
    if (!editValue.trim()) {
      setEditError("Value cannot be empty");
      return;
    }

    const exists = fields.some(
      (f, i) =>
        i !== editIndex &&
        f.value?.trim().toLowerCase() === editValue.trim().toLowerCase(),
    );

    if (exists) {
      setEditError("Value is already exist. please add another.");
      return;
    }

    update(editIndex!, { value: editValue });

    setEditIndex(null);
    setEditValue("");
    setEditError("");
  };
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold flex items-center gap-1">
        {title}
        <InfoTooltip id={`${inputType}-tooltip`} text={title} />
      </label>

      {/* ADD */}

      <div className="flex gap-3">
        <input
          name="{inputType}"
          ref={inputRef}
          type="text"
          value={multiValueRulesInputs[headerName] || ""}
          onChange={(e) =>
            handleMultiValueRulesInputChange(
              headerName,
              e.target.value,
              inputType,
            )
          }
          className="border border-gray-400 p-2 rounded w-full"
        />

        <button
          type="button"
          onClick={() => {
            addMultiValueRules(headerName, fields, append, inputType);

            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Add
        </button>

        <button
          type="button"
          onClick={() => cancelMultiValueRules(headerName, inputType)}
          className="bg-gray-400 text-white px-4 rounded"
        >
          Clean
        </button>
      </div>

      {(errors as any)?.[headerName]?.[`${inputType}_input`] && (
        <p className="text-red-500 text-xs">
          {(errors as any)[headerName][`${inputType}_input`].message}
        </p>
      )}

      {/* LIST */}

      {fields.map((field, idx) => (
        <div key={field.id} className="flex gap-3 items-center">
          {editIndex === idx ? (
            <div className="w-full">
              <div className="flex gap-3">
                <input
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    setEditError("");
                  }}
                  className="border p-2 rounded w-full"
                />

                <button
                  type="button"
                  onClick={updateValue}
                  className="bg-green-600 text-white px-3 rounded"
                >
                  Update
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditIndex(null);
                    setEditError("");
                  }}
                  className="bg-gray-400 text-white px-3 rounded"
                >
                  Cancel
                </button>
              </div>

              {editError && (
                <p className="text-red-500 text-xs mt-1">{editError}</p>
              )}
            </div>
          ) : (
            <>
              <span className="flex-1">{field.value}</span>

              <button
                type="button"
                onClick={() => startEdit(idx)}
                className="bg-yellow-500 text-white px-3 rounded"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="bg-red-500 text-white px-3 rounded"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
