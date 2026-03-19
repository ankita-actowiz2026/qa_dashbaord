import React, { useRef, useEffect, useMemo } from "react";
import { useFieldArray, Controller, useWatch } from "react-hook-form";
import { useFormState } from "react-hook-form";
import { InfoTooltip } from "../../../utils/ToolTips";
const SubDependencyLatest = ({
  control,
  register,
  headerName,
  index,
  headersList,
  trigger,
  setValue,
}) => {
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
    <div className="mt-3 space-y-3">
      {fields.map((field, index) => {
        const subCondition = subDependencies?.[index]?.condition || "true";

        return (
          <div
            key={field.id}
            className="flex items-start gap-3 flex-wrap border p-2 rounded"
          >
            {/* ✅ MULTISELECT */}
            <Controller
              control={control}
              name={`${subPath}.${index}.headers`}
              defaultValue={[]}
              rules={{
                validate: (val) =>
                  val && val.length > 0 ? true : "Sub dependency is required",
              }}
              render={({ field, fieldState }) => (
                <>
                  <div className="flex flex-col justify-center">
                    <select
                      multiple
                      className="border border-gray-400 p-2 w-40 rounded"
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
                        <option key={`${h}-${i}`} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>

                    {fieldState.error && (
                      <p className="text-red-500 text-xs">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            />
            <InfoTooltip
              id="sub-dependancy-multiselect-tooltip"
              text={`Select the column(s) and values that this field depends on. \nThe rule will apply only when the selected conditions are met.`}
            />

            {/* TRUE */}
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="true"
                {...register(`${subPath}.${index}.condition`, {
                  onChange: () => {
                    // ✅ clear value when switching to true
                    setValue(`${subPath}.${index}.value`, "");
                    setTimeout(() => {
                      trigger(`${subPath}.${index}.value`);
                    }, 0);
                  },
                })}
              />
              True
            </label>

            {/* OTHER VALUE */}
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="other"
                {...register(`${subPath}.${index}.condition`, {
                  onChange: () => {
                    setValue(`${subPath}.${index}.value`, ""); // optional reset
                  },
                })}
              />
              Other Value
            </label>

            {/* TEXTBOX */}
            <input
              type="text"
              className="border border-gray-400 p-1 rounded"
              disabled={subCondition !== "other"}
              {...register(`${subPath}.${index}.value`, {
                validate: (val) => {
                  const currentCondition = subDependencies?.[index]?.condition;

                  console.log(currentCondition + "===" + val);

                  if (
                    currentCondition === "other" &&
                    (!val || val?.trim() === "")
                  ) {
                    return "for other dependancy value is required";
                  }

                  return true;
                },
              })}
            />
            <InfoTooltip
              id="sub-dependancy-radio-tooltip"
              text="Select Yes to make this field mandatory when the condition is applied. Select Other to apply this rule only when the field matches a specific value."
            />
            {/* ✅ ERROR (only show when condition = other) */}
            {subCondition === "other" &&
              formErrors?.[headerName]?.sub_dependencies?.[index]?.value
                ?.message && (
                <p className="text-red-500 text-xs">
                  {
                    formErrors?.[headerName]?.sub_dependencies?.[index]?.value
                      ?.message
                  }
                </p>
              )}

            {/* DELETE BUTTON */}
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      {/* ADD BUTTON */}
      <button
        type="button"
        onClick={() =>
          append({
            headers: [],
            condition: "true",
            value: "",
          })
        }
        className="bg-blue-500 text-white px-3 py-1 rounded"
      >
        + Add Sub Dependency
      </button>

      <button
        type="button"
        onClick={() => {
          console.log(subDependencies); // ✅ updated values
        }}
      >
        Log Values
      </button>
    </div>
  );
};

export default React.memo(SubDependencyLatest);
