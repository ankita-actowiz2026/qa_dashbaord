import React, { useEffect } from "react";
import { useFieldArray, useWatch } from "react-hook-form";
import SubDependency from "./SubDependency";

const DependencyBuilder = ({
  headerName,
  headersList,
  control,
  register,
  watch,
  trigger,
  errors,
  setValue,
}) => {
  const depPath = `${headerName}.dependencies`;

  const { fields, append, remove } = useFieldArray({
    control,
    name: depPath,
  });

  const isEnabled = useWatch({
    control,
    name: `${headerName}.has_dependency`,
    defaultValue: false,
  });
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
  const condition = useWatch({
    control, // ✅ pass your control from useForm
    name: `${depPath}.0.condition`, // the field you want to watch
    defaultValue: "true", // optional default
  });
  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        {/* Checkbox */}
        <label className="text-sm font-semibold mr-2">
          <input
            type="checkbox"
            {...register(`${headerName}.has_dependency`)}
            className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
          />
          Add Dependency
        </label>
        {/* MAIN UI */}sssssssssss
        {isEnabled && fields[0] && (
          <div className="mt-3 space-y-4">
            <div key={fields[0].id} className="border p-3 rounded">
              {/* MAIN CONDITION */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* TRUE */}
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="true"
                    {...register(`${depPath}.0.condition`)}
                  />
                  True
                </label>

                {/* OTHER */}
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="other"
                    {...register(`${depPath}.0.condition`)}
                  />
                  Other Value
                </label>

                {/* TEXTBOX */}
                <input
                  type="text"
                  placeholder="Enter value"
                  disabled={condition !== "other"}
                  {...register(`${depPath}.0.value`, {
                    validate: (val) => {
                      const condition = watch(`${depPath}.0.condition`);
                      if (
                        condition === "other" &&
                        (!val || val.trim() === "")
                      ) {
                        return "For other dependency, value is required";
                      }
                      return true;
                    },
                  })}
                  onBlur={() => trigger(`${depPath}.0.value`)}
                  className="border border-gray-400 p-1 rounded"
                />

                {/* ERROR MESSAGE */}
                {errors?.[headerName]?.dependencies?.[0]?.value && (
                  <p className="text-red-500 text-sm">
                    {errors[headerName].dependencies[0].value.message}
                  </p>
                )}
              </div>

              {/* SUB DEPENDENCY */}
              <SubDependency
                control={control}
                register={register}
                watch={watch}
                headerName={headerName}
                index={0}
                headersList={headersList}
                trigger={trigger}
                errors={errors}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DependencyBuilder;
