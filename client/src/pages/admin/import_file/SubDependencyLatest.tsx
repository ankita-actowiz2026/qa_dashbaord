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
            className="flex items-start gap-6 text-sm border border-gray-300 p-3 rounded"
          >
            {/* ✅ HEADERS MULTISELECT */}
            <div className="flex flex-col w-44">
              <label className="flex items-center gap-1 font-medium mb-1">
                Headers
                <InfoTooltip
                  id="sub-dependency-multiselect-tooltip"
                  text={`Select the column(s) this field depends on.\nThe rule applies only when these conditions are met.`}
                />
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
                    <select
                      multiple
                      className="border border-gray-400 p-2 rounded"
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
                      <p className="text-red-500 text-xs mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            {/* ✅ CONDITION */}
            <div className="flex flex-col">
              {/* LABEL */}
              <label className="flex items-center gap-1 font-medium mb-1">
                Sub dependancy value
                <InfoTooltip
                  id="sub-dependency-condition-tooltip"
                  text={`Choose True to always apply this rule.\nChoose Other Value to match a specific value.`}
                />
              </label>

              {/* RADIO BUTTONS */}
              <div className="flex items-center gap-4">
                {/* TRUE */}
                <label className="flex items-center gap-1">
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

                {/* OTHER */}
                <label className="flex items-center gap-1">
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

              {/* VALUE INPUT (NEXT LINE) */}
              <input
                type="text"
                placeholder="Enter value"
                disabled={subCondition !== "other"}
                className={`border rounded px-2 py-1 mt-1 disabled:bg-gray-100 ${
                  formErrors?.[headerName]?.sub_dependencies?.[index]?.value
                    ? "border-red-500"
                    : "border-gray-400"
                }`}
                {...register(`${subPath}.${index}.value`, {
                  validate: (val) => {
                    const currentCondition =
                      subDependencies?.[index]?.condition;

                    if (currentCondition === "other" && (!val || !val.trim())) {
                      return "Value is required when 'Other Value' is selected";
                    }

                    return true;
                  },
                })}
              />

              {/* ERROR MESSAGE (ALWAYS RESERVED SPACE) */}
              <p className="text-red-500 text-xs mt-1 min-h-[16px]">
                {subCondition === "other" &&
                  formErrors?.[headerName]?.sub_dependencies?.[index]?.value
                    ?.message}
              </p>
            </div>

            {/* ✅ DELETE BUTTON */}
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 mt-6"
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
