import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  useFieldArray,
  Controller,
  useWatch,
  useFormState,
} from "react-hook-form";
import { InfoTooltip } from "../../../utils/ToolTips";
import { FiTrash2, FiPlus } from "react-icons/fi";

const SubDependencyLatest = ({
  control,
  register,
  headerName,
  headersList,
  trigger,
  setValue,
  inputClass,
}) => {
  const subPath = `${headerName}.sub_dependencies`;

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: subPath,
  });

  const { errors: formErrors } = useFormState({ control });

  const subDependencies = useWatch({
    control,
    name: subPath,
    defaultValue: [],
  });

  const [editIndex, setEditIndex] = useState(0); // default open first

  const inputRefs = useRef([]);

  const filteredHeaders = useMemo(() => {
    return headersList.filter((h) => h !== headerName);
  }, [headersList, headerName]);

  /* ✅ Default one row */
  useEffect(() => {
    if (fields.length === 0) {
      append({
        headers: [],
        condition: "true",
        value: "",
      });
    }
  }, [fields, append]);

  /* ✅ Add new */
  const handleAdd = () => {
    append({
      headers: [],
      condition: "true",
      value: "",
    });

    setEditIndex(fields.length);

    setTimeout(() => {
      inputRefs.current[fields.length]?.focus();
    }, 0);
  };

  /* ✅ Save row */
  const handleSave = (index) => {
    const item = subDependencies[index];

    if (!item?.headers?.length) return alert("Select at least one column");

    if (item.condition === "other" && !item.value?.trim()) {
      return alert("Value required for Other");
    }

    setEditIndex(null);
  };

  return (
    <div className="border rounded-xl bg-white shadow-sm">
      {/* HEADER */}
      <div className="px-4 py-3 border-b bg-gray-100 flex justify-between items-center">
        <h3 className="flex gap-2 font-semibold">
          Sub Dependencies
          <InfoTooltip text="Add dependency rules" />
        </h3>

        <button
          onClick={handleAdd}
          className="p-2 bg-blue-600 text-white rounded-full"
        >
          <FiPlus />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {fields.map((field, index) => {
          const item = subDependencies[index] || {};
          const isEditing = editIndex === index;

          return (
            <div key={field.id} className="border p-3 rounded bg-gray-50">
              {/* HEADER */}
              <div className="flex justify-between mb-2">
                <b>Sub Dependency #{index + 1}</b>

                <div className="flex gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => setEditIndex(index)}
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => remove(index)}
                    className="text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {/* ========================= */}
              {/* ✅ EDIT MODE */}
              {/* ========================= */}
              {isEditing ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* HEADERS */}
                  <Controller
                    control={control}
                    name={`${subPath}.${index}.headers`}
                    rules={{
                      validate: (val) =>
                        val?.length > 0 || "Select at least one column",
                    }}
                    render={({ field, fieldState }) => (
                      <>
                        <select
                          multiple
                          ref={(el) => (inputRefs.current[index] = el)}
                          className={`${inputClass} border p-2 w-full`}
                          value={field.value || []}
                          onChange={(e) => {
                            const selected = Array.from(
                              e.target.selectedOptions,
                            ).map((o) => o.value);
                            field.onChange(selected);
                          }}
                        >
                          {filteredHeaders.map((h, i) => (
                            <option key={i} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>

                        {fieldState.error && (
                          <p className="text-red-500 text-xs">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />

                  {/* CONDITION */}
                  <div>
                    <div className="flex gap-3">
                      <label>
                        <input
                          type="radio"
                          value="true"
                          {...register(`${subPath}.${index}.condition`)}
                        />
                        Required
                      </label>

                      <label>
                        <input
                          type="radio"
                          value="other"
                          {...register(`${subPath}.${index}.condition`)}
                        />
                        Other
                      </label>
                    </div>

                    <input
                      type="text"
                      disabled={item.condition !== "other"}
                      placeholder="Enter value"
                      className="border p-2 mt-2 w-full"
                      {...register(`${subPath}.${index}.value`, {
                        validate: (val) => {
                          if (item.condition === "other" && !val?.trim()) {
                            return "Value required";
                          }
                          return true;
                        },
                      })}
                    />

                    <p className="text-red-500 text-xs">
                      {
                        formErrors?.[headerName]?.sub_dependencies?.[index]
                          ?.value?.message
                      }
                    </p>
                  </div>

                  {/* SAVE BUTTON */}
                  <div className="col-span-full flex justify-end">
                    <button
                      onClick={() => handleSave(index)}
                      className="bg-green-600 text-white px-4 py-1 rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* ========================= */
                /* ✅ VIEW MODE */
                /* ========================= */
                <div className="text-sm space-y-1">
                  <div>
                    <b>Headers:</b> {item.headers?.join(", ")}
                  </div>
                  <div>
                    <b>Condition:</b>{" "}
                    {item.condition === "true" ? "Required" : "Other"}
                  </div>
                  <div>
                    <b>Value:</b> {item.value || "-"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(SubDependencyLatest);
