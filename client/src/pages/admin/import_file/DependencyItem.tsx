import React, { useMemo, useCallback } from "react";
import { useWatch } from "react-hook-form";
import SubDependency from "./SubDependency";

const DependencyItem = ({
  field,
  index,
  depPath,
  headerName,
  control,
  register,
  headersList,
  trigger,
  errors,
}) => {
  console.log("DependencyItem start");
  console.log(headersList);
  console.log("DependencyItem end");
  // ✅ watch only this field
  const condition = useWatch({
    control,
    name: `${depPath}.${index}.condition`,
  });

  // ✅ memoized paths (avoid string recreation)
  const conditionPath = useMemo(
    () => `${depPath}.${index}.condition`,
    [depPath, index],
  );

  const valuePath = useMemo(
    () => `${depPath}.${index}.value`,
    [depPath, index],
  );

  // ✅ memoized validation (stable reference)
  const validateValue = useCallback(
    (val) => {
      if (condition === "other" && !val) {
        return "Other value is required";
      }
      return true;
    },
    [condition],
  );

  // ✅ safe error extraction (clean + readable)
  const errorMessage =
    errors?.[headerName]?.dependencies?.[index]?.value?.message;

  return (
    <div className="border p-3 rounded">
      <div className="flex items-center gap-4 flex-wrap">
        {/* TRUE */}
        <label className="flex items-center gap-1">
          <input type="radio" value="true" {...register(conditionPath)} />
          True
        </label>

        {/* OTHER */}
        <label className="flex items-center gap-1">
          <input type="radio" value="other" {...register(conditionPath)} />
          Other Value
        </label>

        {/* TEXTBOX */}
        <input
          type="text"
          placeholder="Enter value"
          disabled={condition !== "other"}
          {...register(valuePath, {
            validate: validateValue,
          })}
          className="border border-gray-400 p-1 rounded"
        />

        {/* ERROR */}
        {errorMessage && (
          <div className="w-full">
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* SUB DEPENDENCY */}
      <SubDependency
        control={control}
        register={register}
        headerName={headerName}
        index={index}
        headersList={headersList}
        trigger={trigger}
        errors={errors}
      />
    </div>
  );
};

// ✅ prevents unnecessary re-renders
export default React.memo(DependencyItem);
