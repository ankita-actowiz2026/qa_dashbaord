import React, { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import SubDependency from "./SubDependency";
import { InfoTooltip } from "../../../utils/ToolTips";
const DependencyBuilder = ({
  headerName,
  headersList,
  control,
  register,
  watch,
  trigger,
  errors,
}) => {
  const depPath = `${headerName}.dependencies`;
  console.log("DependencyBuilder");
  const { fields, append, remove } = useFieldArray({
    control,
    name: depPath,
  });

  const isEnabled = watch(`${headerName}.has_dependency`);

  // ✅ Ensure at least 1 dependency (SAFE)
  useEffect(() => {
    if (!isEnabled) return;

    if (fields.length === 0) {
      append({
        condition: "true",
        value: "",
        subDependencies: [
          {
            headers: [],
            condition: "true",
            value: "",
          },
        ],
      });
    }
  }, [isEnabled]); // ✅ DO NOT include fields.length

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        {/* Checkbox */}
        <label className="text-sm font-semibold flex items-center gap-1">
          <input
            type="checkbox"
            {...register(`${headerName}.has_dependency`)}
            className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
          />
          Add Dependency
          <InfoTooltip
            id="dependancy-tooltip"
            text="You can add dependancy and other depandancy"
          />
        </label>

        {/* MAIN UI */}
        {isEnabled && (
          <div className="mt-3 space-y-4">
            {fields[0] &&
              (() => {
                const index = 0;
                const field = fields[0];
                const condition = watch(`${depPath}.${index}.condition`);

                return (
                  <div key={field.id} className="border p-3 rounded">
                    {/* MAIN CONDITION */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* TRUE */}
                      <label className="flex items-center gap-1 ">
                        <input
                          type="radio"
                          value="true"
                          {...register(`${depPath}.${index}.condition`)}
                        />
                        True
                      </label>

                      {/* OTHER */}
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          value="other"
                          {...register(`${depPath}.${index}.condition`)}
                        />
                        Other Value
                      </label>

                      {/* TEXTBOX */}
                      <input
                        type="text"
                        placeholder="Enter value"
                        disabled={condition !== "other"}
                        {...register(`${depPath}.${index}.value`, {
                          validate: (val) => {
                            if (condition === "other" && !val) {
                              return "Other value is required";
                            }
                            return true;
                          },
                        })}
                        className="border border-gray-400 p-1 rounded "
                      />

                      {/* ✅ ERROR MESSAGE */}
                      <div className="w-full">
                        {errors?.[headerName]?.dependencies?.[index]?.value && (
                          <p className="text-red-500 text-sm">
                            {
                              errors[headerName].dependencies[index].value
                                .message
                            }
                          </p>
                        )}
                      </div>
                      {/* DELETE MAIN */}
                      {/* {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500"
                        >
                          ✕--
                        </button>
                      )} */}
                    </div>

                    {/* SUB DEPENDENCY */}
                    <SubDependency
                      control={control}
                      register={register}
                      watch={watch}
                      headerName={headerName}
                      index={index}
                      headersList={headersList}
                      trigger={trigger}
                      errors={errors}
                    />
                  </div>
                );
              })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DependencyBuilder;
