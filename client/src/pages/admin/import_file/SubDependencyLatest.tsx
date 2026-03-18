import React, { useRef, useEffect, useMemo } from "react";
import { useFieldArray, Controller, useWatch } from "react-hook-form";

const SubDependencyLatest = ({
  control,
  register,
  headerName,
  index,
  headersList,
  trigger,
  errors,
  setValue,
  getValues,
}) => {
  const subPath = `${headerName}.sub_dependencies`;

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
                  <select
                    multiple
                    className="border border-gray-400 p-2 w-40 rounded"
                    value={field.value || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      );
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

                  {/* ✅ SHOW ERROR FROM fieldState */}
                  {fieldState.error && (
                    <p className="text-red-500 text-xs">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
            {/* TRUE */}
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="true"
                {...register(`${subPath}.${index}.condition`, {
                  onChange: () => {
                    trigger(`${subPath}.${index}.value`);
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
                    trigger([
                      `${subPath}.${index}.value`,
                      `${subPath}.${index}.headers`, // ✅ THIS FIXES YOUR MULTISELECT ISSUE
                    ]);
                  },
                })}
              />
              Other Value
            </label>
            {/* TEXTBOX */}
            <input
              type="text"
              className="border  border-gray-400 p-2 w-full rounded"
              disabled={subCondition !== "other"}
              {...register(`${subPath}.${index}.value`, {
                validate: (val) => {
                  const currentCondition = getValues(
                    `${subPath}.${index}.condition`,
                  );

                  if (
                    currentCondition === "other" &&
                    (val == null || val.trim() === "")
                  ) {
                    return "for other dependancy value is required";
                  }

                  return true;
                },
              })}
            />
            {/* ERROR */}
            {errors?.[headerName]?.sub_dependencies && (
              <div className="text-red-600">
                {Object.entries(errors[headerName].sub_dependencies).map(
                  ([index, subDepErrors]) => (
                    <div key={index}>
                      <strong>Sub-dependency {parseInt(index) + 1}:</strong>
                      <ul>
                        {Object.entries(subDepErrors).map(
                          ([fieldName, errorObj]) => (
                            <li key={fieldName}>
                              {fieldName}:{" "}
                              {errorObj?.message || JSON.stringify(errorObj)}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ),
                )}
              </div>
            )}{" "}
            {errors?.[headerName]?.sub_dependencies?.[index]?.value
              ?.message && (
              <p className="text-red-500 text-xs">
                ={errors[headerName].sub_dependencies[index].value.message}
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

      {/* ✅ ADD BUTTON */}
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
          console.log(getValues()); // ✅ full form data
        }}
      >
        Log Values
      </button>
    </div>
  );
};

export default React.memo(SubDependencyLatest);
