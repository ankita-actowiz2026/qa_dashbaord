import { set, useFieldArray } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { InfoTooltip } from "../../../utils/ToolTips";
import { FaPlus } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { FiTrash2 } from "react-icons/fi";
import { MdClear } from "react-icons/md";
import { FiSave } from "react-icons/fi";

export default function MultiValueRules({
  headerName,
  control,
  register,
  errors,
  multiValueRulesInputs,
  handleMultiValueRulesInputChange,
  addMultiValueRules,
  cancelMultiValueRules,
  inputType,
  rule,
  inputClass,
  textboxClass,
  clearErrors,
}) {
  //console.log("MultiValueRules");
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
      ? "Fixed Value"
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
      console.log(`${headerName}.${inputType}`);
      clearErrors(`${headerName}.${inputType}_input`);
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
      setEditError("Value is already exist.");
      return;
    }

    update(editIndex!, { value: editValue });
    clearErrors(`${headerName}.${inputType}_input`);

    setEditIndex(null);
    setEditValue("");
    setEditError("");
  };
  return (
    <div className="p-3 mt-3 space-y-4 bg-transparent border border-gray-300 shadow-sm rounded-xl sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold ">
          {title}
          <InfoTooltip
            id={`${inputType}-tooltip`}
            text={rule.toolTips}
            tooltip_type="listing"
          />
        </label>
      </div>

      {/* ADD */}

      <div className="flex items-center gap-2">
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
          className={`${inputClass} w-full sm:max-w-[200px]`}
        />

        <button
          type="button"
          title="Add "
          onClick={() => {
            addMultiValueRules(
              headerName,
              fields,
              append,
              inputType,
              rule.errorMsgLabel,
            );

            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }}
          className="p-2 text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <FaPlus className="w-4 h-4" />
        </button>
        {multiValueRulesInputs[headerName]?.trim() && (
          <button
            type="button"
            title="Clear"
            onClick={() => cancelMultiValueRules(headerName, inputType)}
            className="p-2 text-gray-700 transition bg-gray-200 rounded-md hover:bg-gray-300"
          >
            <MdClear size={14} />
          </button>
        )}
      </div>

      {(errors as any)?.[headerName]?.[`${inputType}_input`] && (
        <p className="text-xs text-red-500">
          {(errors as any)[headerName][`${inputType}_input`].message}
        </p>
      )}

      {/* LIST */}
      <div className="overflow-x-auto">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="flex flex-wrap items-start justify-between gap-3 p-3 mb-3 bg-white border border-gray-300 shadow-sm sm:flex-nowrap sm:items-center rounded-xl"
          >
            {editIndex === idx ? (
              <div className="w-full">
                <div className="flex flex-wrap items-center w-full gap-3 p-2 border rounded-lg sm:flex-nowrap">
                  <input
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                      setEditError("");
                    }}
                    className={`${inputClass} w-full sm:max-w-[200px]`}
                  />

                  <button
                    type="button"
                    onClick={updateValue}
                    className="text-blue-600 transition rounded-lg  bg-blue-50 hover:bg-blue-100"
                  >
                    <FiSave size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditIndex(null);
                      setEditError("");
                    }}
                    className="text-gray-600 transition rounded-lg  bg-gray-50 hover:bg-gray-100"
                  >
                    <MdClear size={18}></MdClear>
                  </button>
                </div>

                {editError && (
                  <p className="mt-1 text-xs text-red-500">{editError}</p>
                )}
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm break-words">
                  {field.value}
                </span>

                <button
                  type="button"
                  onClick={() => startEdit(idx)}
                  className="text-blue-600 transition duration-150 rounded-lg  hover:bg-blue-50 hover:text-blue-700"
                >
                  <FiEdit size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="text-blue-600 transition duration-150 rounded-lg  hover:bg-blue-50 hover:text-blue-700"
                >
                  <FiTrash2 size={18} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
