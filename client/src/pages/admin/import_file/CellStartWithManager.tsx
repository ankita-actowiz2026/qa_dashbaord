import { useFieldArray } from "react-hook-form";
import { useState } from "react";
import { useRef } from "react";
export default function CellStartWithManager({
  headerName,
  control,
  register,
  watch,
  errors,
  cellStartWithInputs,
  handleCellStartWithInputChange,
  addCellStartWith,
  cancelCellStartWith,
}) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: `${headerName}.cell_start_with`,
  });

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleDelete = (index: number) => {
    if (
      window.confirm("Are you sure you want to delete this cell start with?")
    ) {
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
      setEditError("Duplicate value not allowed");
      return;
    }

    update(editIndex!, { value: editValue });

    setEditIndex(null);
    setEditValue("");
    setEditError("");
  };
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold mr-2">
        Cell start with values
      </label>

      {/* ADD */}

      <div className="flex gap-3">
        <input
          name="cell_start_with"
          ref={inputRef}
          type="text"
          value={cellStartWithInputs[headerName] || ""}
          onChange={(e) =>
            handleCellStartWithInputChange(headerName, e.target.value)
          }
          className="border border-gray-400 p-2 rounded w-full"
        />

        <button
          type="button"
          onClick={() => {
            addCellStartWith(headerName, fields, append);

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
          onClick={() => cancelCellStartWith(headerName)}
          className="bg-gray-400 text-white px-4 rounded"
        >
          Cancel
        </button>
      </div>

      {(errors as any)?.[headerName]?.cell_start_with_input && (
        <p className="text-red-500 text-xs">
          {(errors as any)[headerName].cell_start_with_input.message}
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
