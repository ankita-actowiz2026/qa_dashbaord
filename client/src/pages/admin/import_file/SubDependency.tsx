import React, { useEffect } from "react";
import { useFieldArray, Controller } from "react-hook-form";
const SubDependency = ({
  control,
  register,
  watch,
  headerName,
  index,
  headersList,
  trigger,
  errors,
}) => {
  console.log("SubDependency");
  const subPath = `${headerName}.dependencies.${index}.subDependencies`;

  const { fields, append, remove } = useFieldArray({
    control,
    name: subPath,
  });

  // ✅ Ensure at least 1 sub dependency
  useEffect(() => {
    if (fields.length === 0) {
      append({
        headers: [],
        condition: "true",
        value: "",
      });
    }
  }, []); // run only once

  return (
    <div className="mt-3 space-y-2">
      {fields.map((sub, subIndex) => {
        const subCondition = watch(`${subPath}.${subIndex}.condition`);

        return (
          <div key={sub.id} className="flex gap-4 flex-wrap items-start">
            {/* MULTISELECT BLOCK */}
            <div className="flex flex-col">
              <Controller
                control={control}
                name={`${subPath}.${subIndex}.headers`}
                rules={{
                  validate: (val) => {
                    if (!val || val.length === 0) {
                      return "Select at least one colom";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <select
                    multiple
                    className="border border-gray-400 p-2 w-36 rounded"
                    value={field.value || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      );
                      field.onChange(selected);
                      trigger(`${subPath}.${subIndex}.headers`);
                    }}
                    onBlur={() => {
                      trigger(`${subPath}.${subIndex}.headers`);
                    }}
                  >
                    {headersList
                      .filter((h) => h !== headerName)
                      .map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                  </select>
                )}
              />

              {/* ERROR BELOW MULTISELECT */}
              {errors?.[headerName]?.dependencies?.[index]?.subDependencies?.[
                subIndex
              ]?.headers && (
                <p className="text-red-500 text-sm mt-1">
                  {
                    errors[headerName].dependencies[index].subDependencies[
                      subIndex
                    ].headers.message
                  }
                </p>
              )}
            </div>

            {/* RADIO BUTTONS */}
            <div className="flex items-center gap-2">
              <label>
                <input
                  type="radio"
                  value="true"
                  {...register(`${subPath}.${subIndex}.condition`)}
                />
                True
              </label>

              <label>
                <input
                  type="radio"
                  value="other"
                  {...register(`${subPath}.${subIndex}.condition`)}
                />
                Other
              </label>
            </div>

            {/* TEXTBOX BLOCK */}
            <div className="flex flex-col">
              <input
                type="text"
                placeholder="Value"
                disabled={subCondition !== "other"}
                {...register(`${subPath}.${subIndex}.value`, {
                  validate: (val) => {
                    const headers = watch(`${subPath}.${subIndex}.headers`);

                    if (subCondition === "other" && !val) {
                      return "Other value is required";
                    }

                    if (val && (!headers || headers.length === 0)) {
                      return "Header required";
                    }

                    return true;
                  },
                })}
                className="border border-gray-400 p-1 rounded"
              />

              {/* ERROR BELOW TEXTBOX */}
              {errors?.[headerName]?.dependencies?.[index]?.subDependencies?.[
                subIndex
              ]?.value && (
                <p className="text-red-500 text-sm mt-1">
                  {
                    errors[headerName].dependencies[index].subDependencies[
                      subIndex
                    ].value.message
                  }
                </p>
              )}
            </div>

            {/* DELETE */}
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(subIndex)}
                className="text-red-500"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}

      {/* ADD SUB DEP */}
      <button
        type="button"
        onClick={() =>
          append({
            headers: [],
            condition: "true",
            value: "",
          })
        }
        className="bg-blue-500 text-white px-2 rounded"
      >
        + Add Sub Dependency
      </button>
    </div>
  );
};

export default SubDependency;
