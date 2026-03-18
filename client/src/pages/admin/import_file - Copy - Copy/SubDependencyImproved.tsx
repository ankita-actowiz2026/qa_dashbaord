import React, { useEffect, useMemo, useCallback } from "react";
import { useFieldArray } from "react-hook-form";
import SubDependencyRow from "./SubDependencyRow";

const DEFAULT_SUB_DEP = {
  headers: [],
  condition: "true", // ✅ default as per requirement
  value: "",
};

const SubDependencyImproved = ({
  control,
  register,
  headerName,
  index,
  headersList,
  trigger,
  errors,

  setValue, // ✅ IMPORTANT
}) => {
  const subPath = useMemo(
    () => `${headerName}.dependencies.${index}.subDependencies`,
    [headerName, index],
  );

  // ✅ unregister when removed (important for validation)
  const { fields, append, remove } = useFieldArray({
    control,
    name: subPath,
    shouldUnregister: true,
    rules: {
      minLength: {
        value: 1,
        message: "At least one sub dependency is required",
      },
    },
  });

  // ✅ add new sub dependency
  const handleAdd = useCallback(() => {
    append(DEFAULT_SUB_DEP);
  }, [append]);

  // ✅ INIT only when dependency enabled
  useEffect(() => {
    if (fields.length === 0) {
      append(DEFAULT_SUB_DEP);
    }
  }, [fields.length, append]);

  // ✅ CLEAR when dependency disabled

  return (
    <div className="mt-3 space-y-2">
      {fields.map((sub, subIndex) => (
        <SubDependencyRow
          key={sub.id}
          control={control}
          register={register}
          headerName={headerName}
          index={index}
          subPath={subPath}
          subIndex={subIndex}
          headersList={headersList}
          trigger={trigger}
          errors={errors}
          remove={remove}
          totalFields={fields.length}
          setValue={setValue}
        />
      ))}

      {/* ADD BUTTON */}
      {
        <button
          type="button"
          onClick={handleAdd}
          className="bg-blue-500 text-white px-2 py-1 rounded"
        >
          + Add Sub Dependency
        </button>
      }
    </div>
  );
};

export default React.memo(SubDependencyImproved);
