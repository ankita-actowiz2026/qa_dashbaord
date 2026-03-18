import React, { useMemo, useCallback } from "react";
import { useWatch, Controller } from "react-hook-form";

const SubDependencyRow = ({
  control,
  register,
  headerName,
  index,
  subPath,
  subIndex,
  headersList,
  trigger,
  errors,
  remove,
  totalFields,
}) => {
  console.log(headersList);
  // ✅ memoized paths (BIG improvement in large forms)
  const basePath = useMemo(() => `${subPath}.${subIndex}`, [subPath, subIndex]);

  const conditionPath = `${basePath}.condition`;
  const headersPath = `${basePath}.headers`;
  const valuePath = `${basePath}.value`;

  // ✅ scoped watch
  const subCondition = useWatch({
    control,
    name: conditionPath,
  });

  const selectedHeaders = useWatch({
    control,
    name: headersPath,
  });

  // ✅ filter once (not every render loop)
  const filteredHeaders = useMemo(
    () => headersList.filter((h) => h !== headerName),
    [headersList, headerName],
  );

  // ✅ stable handlers
  const handleSelectChange = useCallback(
    (e, fieldOnChange) => {
      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
      fieldOnChange(selected);
      trigger(headersPath);
    },
    [trigger, headersPath],
  );

  const handleBlur = useCallback(() => {
    trigger(headersPath);
  }, [trigger, headersPath]);

  const handleRemove = useCallback(() => {
    remove(subIndex);
  }, [remove, subIndex]);

  // ✅ stable validation
  const validateValue = useCallback(
    (val) => {
      if (subCondition === "other" && !val) {
        return "Other value is required";
      }

      if (val && (!selectedHeaders || selectedHeaders.length === 0)) {
        return "Header required";
      }

      return true;
    },
    [subCondition, selectedHeaders],
  );

  // ✅ clean error extraction
  const headerError =
    errors?.[headerName]?.dependencies?.[index]?.subDependencies?.[subIndex]
      ?.headers?.message;

  const valueError =
    errors?.[headerName]?.dependencies?.[index]?.subDependencies?.[subIndex]
      ?.value?.message;

  return (
    <div className="flex gap-4 flex-wrap items-start">
      {/* MULTISELECT */}
      <div className="flex flex-col">
        <Controller
          control={control}
          name={headersPath}
          rules={{
            validate: (val) =>
              !val || val.length === 0
                ? "Atleast one value is required to select"
                : true,
          }}
          render={({ field }) => (
            <select
              multiple
              className="border border-gray-400 p-2 w-36 rounded"
              value={field.value || []}
              onChange={(e) => handleSelectChange(e, field.onChange)}
              onBlur={handleBlur}
            >
              {filteredHeaders.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          )}
        />

        {headerError && (
          <p className="text-red-500 text-sm mt-1">{headerError}</p>
        )}
      </div>

      {/* RADIO */}
      <div className="flex items-center gap-2">
        <label>
          <input type="radio" value="true" {...register(conditionPath)} />
          True
        </label>

        <label>
          <input type="radio" value="other" {...register(conditionPath)} />
          Other
        </label>
      </div>

      {/* TEXTBOX */}
      <div className="flex flex-col">
        <input
          type="text"
          placeholder="Value"
          disabled={subCondition !== "other"}
          {...register(valuePath, {
            validate: validateValue,
          })}
          className="border border-gray-400 p-1 rounded"
        />

        {valueError && (
          <p className="text-red-500 text-sm mt-1">{valueError}</p>
        )}
      </div>

      {/* DELETE */}
      {totalFields > 1 && (
        <button type="button" onClick={handleRemove} className="text-red-500">
          ✕
        </button>
      )}
    </div>
  );
};

export default React.memo(SubDependencyRow);
