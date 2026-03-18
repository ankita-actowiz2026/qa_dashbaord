import React, { useEffect, useMemo } from "react";
import { useFieldArray } from "react-hook-form";
import DependencyItem from "./DependencyItem";
import { InfoTooltip } from "../../../utils/ToolTips";
import { useWatch } from "react-hook-form";

const DEFAULT_DEPENDENCY = {
  condition: "true",
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
  watch,
  trigger,
  errors,
}) => {
  console.log("DEPENDANCY BUILDER start");
  console.log(headersList);
  console.log("DEPENDANCY BUILDER end");
  // ✅ memoized path (micro-optimization but good practice)
  const depPath = useMemo(() => `${headerName}.dependencies`, [headerName]);

  const { fields, append } = useFieldArray({
    control,
    name: depPath,
  });

  // ✅ scoped watch (no global re-render)
  const isEnabled = useWatch({
    control,
    name: `${headerName}.has_dependency`,
  });

  // ✅ safe initialization
  useEffect(() => {
    if (!isEnabled) return;

    if (fields.length === 0) {
      append(DEFAULT_DEPENDENCY);
    }
  }, [isEnabled, fields.length, append]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        {/* CHECKBOX */}
        <label className="text-sm font-semibold flex items-center gap-1">
          <input
            type="checkbox"
            {...register(`${headerName}.has_dependency`)}
            className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
          />
          Add Dependency
          <InfoTooltip
            id="dependancy-tooltip"
            text="You can add dependency and nested dependency"
          />
        </label>

        {/* MAIN UI */}
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DependencyBuilder);
