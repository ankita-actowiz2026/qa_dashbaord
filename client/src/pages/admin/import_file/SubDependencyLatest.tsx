import React, { useRef, useEffect, useMemo } from "react";
import { useFieldArray, Controller, useWatch } from "react-hook-form";
import { useFormState } from "react-hook-form";
import { InfoTooltip } from "../../../utils/ToolTips";
import { FiTrash2, FiPlus } from "react-icons/fi";
const SubDependencyLatest = ({
  control,
  register,
  headerName,
  index,
  headersList,
  trigger,
  setValue,
  inputClass,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const subPath = `${headerName}.sub_dependencies`;
  const { errors: formErrors } = useFormState({
    control,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: subPath,
  });

  /* ✅ Watch full array (IMPORTANT FIX) */
  const subDependencies = useWatch({
    control,
    name: subPath,
    defaultValue: [],
  });

  /* ✅ Remove current header */
  const filteredHeaders = useMemo(() => {
    return headersList.filter((h) => h !== headerName);
  }, [headersList, headerName]);

  const hasAppended = useRef(false);

  useEffect(() => {
    if (!hasAppended.current && fields.length === 0) {
      append({
        headers: [],
        condition: "true",
        value: "",
      });
      hasAppended.current = true;
    }
  }, [fields.length, append]);

  return (
    <div className=" border border-gray-300 rounded-xl bg-white shadow-sm">
      {/* HEADER */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 tracking-tight">
            Sub Dependencies{" "}
            <InfoTooltip
              id="sub-dependency-multiselect-tooltip"
              text={`Select the column(s) this field depends on.\nThe rule applies only when these conditions are met.`}
              tooltip_type="listing"
            />
          </h3>
          <button
            type="button"
            onClick={() => {
              append({
                headers: [],
                condition: "true",
                value: "",
              });

              // focus last input after render
              setTimeout(() => {
                const lastIndex = fields.length;
                inputRefs.current[lastIndex]?.focus();
              }, 0);
            }}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
          >
            <FiPlus size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          Add and configure sub-level dependencies
        </p>
      </div>
      <div className="p-2 space-y-4">
        {fields.map((field, index) => {
          const subCondition = subDependencies?.[index]?.condition || "true";

          return (
            <div
              key={field.id}
              className="relative border rounded-lg p-4 bg-gray-200 space-y-3"
            >
              {/* TITLE + DELETE */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 tracking-wide">
                  Sub Dependency #{index + 1}
                </p>

                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ✅ HEADERS MULTISELECT */}
                <div>
                  <label className="text-xs font-semibold text-gray-600  tracking-wide mb-1 block  pb-3">
                    Select header coloms
                  </label>

                  <Controller
                    control={control}
                    name={`${subPath}.${index}.headers`}
                    defaultValue={[]}
                    rules={{
                      validate: (val) =>
                        val && val.length > 0
                          ? true
                          : "Please select at least one column",
                    }}
                    render={({ field, fieldState }) => (
                      <>
                        <div className="flex flex-col">
                          <select
                            multiple
                            ref={(el) => (inputRefs.current[index] = el)}
                            className={`${inputClass} border rounded-md p-2 text-sm`}
                            value={field.value || []}
                            onChange={(e) => {
                              const selected = Array.from(
                                e.target.selectedOptions,
                              ).map((o) => o.value);
                              field.onChange(selected);
                            }}
                            onBlur={field.onBlur}
                          >
                            {(filteredHeaders || []).map((h, i) => (
                              <option
                                key={`${h}-${i}`}
                                value={h}
                                className="px-2 py-1 hover:bg-blue-100"
                              >
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        {fieldState.error && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                {/* ✅ CONDITION */}
                <div>
                  {/* LABEL */}
                  <label className="text-xs font-semibold text-gray-600 tracking-wide mb-1 block pb-3">
                    Sub dependancy value
                  </label>

                  {/* ROW: RADIO + TEXTBOX */}

                  {/* RADIO */}
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        value="true"
                        {...register(`${subPath}.${index}.condition`, {
                          onChange: () => {
                            setValue(`${subPath}.${index}.value`, "");

                            setTimeout(() => {
                              trigger(`${subPath}.${index}.value`);
                            }, 0);
                          },
                        })}
                      />
                      Required
                    </label>

                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        value="other"
                        {...register(`${subPath}.${index}.condition`, {
                          onChange: () => {
                            setValue(`${subPath}.${index}.value`, "");
                          },
                        })}
                      />
                      Other value
                    </label>
                  </div>

                  {/* TEXTBOX */}
                  <div className="flex flex-col ">
                    <input
                      type="text"
                      placeholder="Enter value"
                      disabled={subCondition !== "other"}
                      className={`${inputClass} border px-2 py-1 rounded w-40 mt-5 disabled:bg-gray-100 ${
                        subCondition === "other" &&
                        formErrors?.[headerName]?.sub_dependencies?.[index]
                          ?.value
                          ? "border-red-500"
                          : "border-gray-400"
                      }`}
                      {...register(`${subPath}.${index}.value`, {
                        validate: (val) => {
                          const currentCondition =
                            subDependencies?.[index]?.condition;

                          if (
                            currentCondition === "other" &&
                            (!val || !val.trim())
                          ) {
                            return "Value is required when 'Other Value' is selected";
                          }

                          return true;
                        },
                      })}
                    />
                    {/* ERROR BELOW */}
                    <p className="text-red-500 text-xs mt-1 min-h-[16px]">
                      {subCondition === "other" &&
                        formErrors?.[headerName]?.sub_dependencies?.[index]
                          ?.value?.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* ADD BUTTON */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() =>
            append({
              headers: [],
              condition: "true",
              value: "",
            })
          }
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          + Add Sub Dependency
        </button>
      </div>
    </div>
  );
};

export default React.memo(SubDependencyLatest);
