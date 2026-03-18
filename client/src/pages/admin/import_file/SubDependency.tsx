import React, { useEffect, useMemo, useCallback } from "react";
import { useFieldArray } from "react-hook-form";
import SubDependencyRow from "./SubDependencyRow";

// ✅ stable constant (good)
const DEFAULT_SUB_DEP = {
  headers: [],
  condition: "true",
  value: "",
};

const SubDependency = ({
  control,
  register,
  headerName,
  index,
  headersList,
  trigger,
  errors,
}) => {
  // ✅ memoized path (important in large forms)
  const subPath = useMemo(
    () => `${headerName}.dependencies.${index}.subDependencies`,
    [headerName, index],
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: subPath,
  });

  // ✅ stable append handler
  const handleAdd = useCallback(() => {
    append(DEFAULT_SUB_DEP);
  }, [append]);

  // ✅ safe initialization (runs only when needed)
  useEffect(() => {
    if (fields.length === 0) {
      append(DEFAULT_SUB_DEP);
    }
  }, [fields.length, append]);

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
        />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="bg-blue-500 text-white px-2 rounded"
      >
        + Add Sub Dependency
      </button>
    </div>
  );
};

// ✅ prevents unnecessary re-renders
export default React.memo(SubDependency);
