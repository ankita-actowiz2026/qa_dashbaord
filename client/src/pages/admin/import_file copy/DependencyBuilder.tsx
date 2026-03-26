import React from "react";
import { useWatch } from "react-hook-form";

const DependencyBuilder = ({ headerName, register, control, errors }) => {
  const hasDependency = useWatch({
    control,
    name: `${headerName}.has_dependency`,
  });

  const condition = useWatch({
    control,
    name: `${headerName}.dependency_condition`,
    defaultValue: "yes",
  });

  return (
    <div className="mt-4">
      {/* Add Dependency */}
      <label className="text-sm font-semibold flex items-center gap-2">
        <input type="checkbox" {...register(`${headerName}.has_dependency`)} />
        Add Dependency
      </label>

      {hasDependency && (
        <div className="mt-2 flex items-center gap-4">
          {/* YES */}
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="yes"
              defaultChecked
              {...register(`${headerName}.dependency_condition`)}
            />
            Yes
          </label>

          {/* NO */}
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="no"
              {...register(`${headerName}.dependency_condition`)}
            />
            No
          </label>

          {/* TEXTBOX */}
          {condition}
          <input
            type="number"
            placeholder="Enter value"
            disabled={condition !== "no"}
            className="border border-gray-400 p-1 rounded"
            {...register(`${headerName}.dependency_value`, {
              validate: (value) => {
                if (condition === "no" && !value) {
                  return "for no value value is required";
                }
                return true;
              },
            })}
          />

          {errors?.[headerName]?.dependency_value && (
            <p className="text-red-500 text-xs">
              {errors[headerName].dependency_value.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(DependencyBuilder);
