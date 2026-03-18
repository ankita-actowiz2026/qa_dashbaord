import React, { useEffect, useMemo } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import DependencyItem from "./DependencyItem";
import { InfoTooltip } from "../../../utils/ToolTips";

const DEFAULT_DEPENDENCY = {
  condition: "true", // ✅ default radio
  value: "",
  subDependencies: [
    {
      headers: [],
      condition: "true",
      value: "",
    },
  ],
};

const DependencyBuilder = ({
  headerName,
  headersList,
  control,
  register,
  trigger,
  errors,
  setValue, // ✅ IMPORTANT
}) => {
  // ✅ dynamic path
  const depPath = useMemo(() => `${headerName}.dependencies`, [headerName]);

  // ✅ field array with unregister (CRITICAL)
  const { fields, append } = useFieldArray({
    control,
    name: depPath,
    shouldUnregister: true,
  });

  // ✅ checkbox state
  const isEnabled = useWatch({
    control,
    name: `${headerName}.has_dependency`,
    defaultValue: false,
  });

  // ✅ CLEAR DATA when unchecked
  useEffect(() => {
    if (!isEnabled) {
      setValue(depPath, []); // ❗ remove all dependency data
    }
  }, [isEnabled, setValue, depPath]);

  // ✅ INIT when enabled
  useEffect(() => {
    if (!isEnabled) return;

    if (fields.length === 0) {
      append(DEFAULT_DEPENDENCY);
    }

    // ✅ trigger validation when enabled
    //trigger(depPath);
  }, [isEnabled, fields.length, append, trigger, depPath]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        {/* CHECKBOX */}
        <label className="text-sm font-semibold flex items-center gap-2">
          <input
            type="checkbox"
            {...register(`${headerName}.has_dependency`)}
            defaultChecked={false}
            className="w-4 h-4 text-blue-600 border-gray-400 rounded"
          />
          Add Dependency
          <InfoTooltip
            id="dependancy-tooltip"
            text="You can add dependency and nested dependency"
          />
        </label>

        {/* MAIN DEPENDENCY UI */}
        {isEnabled && fields.length > 0 && (
          <div className="mt-3 space-y-4">
            <DependencyItem
              field={fields[0]}
              index={0}
              depPath={depPath}
              headerName={headerName}
              control={control}
              register={register}
              headersList={headersList}
              trigger={trigger}
              errors={errors}
              isEnabled={isEnabled} // ✅ pass down
              setValue={setValue}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DependencyBuilder);
