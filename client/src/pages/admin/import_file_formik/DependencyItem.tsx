import React, { useMemo, useCallback, useEffect } from "react";
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
  errors,
  trigger,
  isEnabled, // ✅ IMPORTANT
  setValue,
}) => {
  // ✅ watch condition
  const condition = useWatch({
    control,
    name: `${depPath}.${index}.condition`,
    defaultValue: "true", // ✅ default
  });

  // ✅ paths
  const conditionPath = useMemo(
    () => `${depPath}.${index}.condition`,
    [depPath, index],
  );

  const valuePath = useMemo(
    () => `${depPath}.${index}.value`,
    [depPath, index],
  );

  // ✅ FINAL VALIDATION
  const validateValue = useCallback(
    (val) => {
      if (!isEnabled) return true;

      if (condition === "other" && (!val || val.trim() === "")) {
        return "for other dependancy value is required";
      }

      return true;
    },
    [condition, isEnabled],
  );

  // ✅ errors
  const valueError =
    errors?.[headerName]?.dependencies?.[index]?.value?.message;

  const conditionError =
    errors?.[headerName]?.dependencies?.[index]?.condition?.message;
  useEffect(() => {
    if (condition === "other") {
      setValue(valuePath, "");
      trigger(valuePath);
    } else {
      setValue(valuePath, "");
    }
  }, [condition, setValue, trigger, valuePath]);
  useEffect(() => {
    console.log("ERRORS:", errors);
  }, [errors]);
  return (
    <div className="border p-3 rounded">
      <div className="flex items-center gap-4 flex-wrap">
        {/* RADIO */}
        <div className="flex flex-col">
          <div className="flex gap-3">
            <label className="flex items-center gap-1">
              [[{valueError}]]
              <input
                type="radio"
                value="true"
                {...register(conditionPath, {
                  validate: (val) => {
                    if (!isEnabled) return true;
                    if (!val) {
                      return "+++for other dependancy value is required+++";
                    }
                    return true;
                  },
                })}
              />
              True
            </label>

            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="other"
                {...register(conditionPath, {
                  onChange: () => {
                    trigger(valuePath); // ✅ trigger textbox validation
                  },
                })}
              />
              Other Value
            </label>
          </div>

          {conditionError && (
            <p className="text-red-500 text-sm mt-1">{conditionError}</p>
          )}
        </div>

        {/* TEXTBOX */}
        <div className="flex flex-col">
          <input
            type="text"
            placeholder="Enter value"
            className={`border border-gray-400 p-1 rounded ${
              condition !== "other" ? "hidden" : ""
            }`}
            {...register(valuePath, {
              validate: validateValue,
            })}
          />

          {valueError && (
            <p className="text-red-500 text-sm mt-1">{valueError}</p>
          )}
        </div>
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
        isEnabled={isEnabled} // ✅ PASS DOWN
        setValue={setValue}
      />
    </div>
  );
};

export default React.memo(DependencyItem);
