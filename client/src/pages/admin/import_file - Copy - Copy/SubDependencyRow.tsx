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
  isEnabled, // ✅ IMPORTANT
  setValue,
}) => {
  const basePath = useMemo(() => `${subPath}.${subIndex}`, [subPath, subIndex]);

  const conditionPath = `${basePath}.condition`;
  const headersPath = `${basePath}.headers`;
  const valuePath = `${basePath}.value`;

  const subCondition = useWatch({
    control,
    name: conditionPath,
    defaultValue: "true", // ✅ default
  });

  const selectedHeaders = useWatch({
    control,
    name: headersPath,
    defaultValue: [],
  });

  const filteredHeaders = useMemo(
    () => headersList.filter((h) => h !== headerName),
    [headersList, headerName],
  );

  // ✅ MULTISELECT HANDLER
  const handleSelectChange = useCallback(
    (e, fieldOnChange) => {
      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
      fieldOnChange(selected);
      trigger(headersPath);
    },
    [trigger, headersPath],
  );

  const handleRemove = useCallback(() => {
    remove(subIndex);
  }, [remove, subIndex]);

  // ✅ FINAL VALIDATION
  const validateValue = useCallback(
    (val) => {
      if (!isEnabled) return true;

      if (subCondition === "other" && !val) {
        return "for other dependancy value is required";
      }

      if (val && (!selectedHeaders || selectedHeaders.length === 0)) {
        return "atleast one dependency is required";
      }

      return true;
    },
    [subCondition, selectedHeaders, isEnabled],
  );

  // ✅ ERRORS
  const baseError =
    errors?.[headerName]?.dependencies?.[index]?.subDependencies?.[subIndex];

  const headerError = baseError?.headers?.message;
  const valueError = baseError?.value?.message;
  const conditionError = baseError?.condition?.message;

  return (
    <div className="flex gap-4 flex-wrap items-start">
      {/* MULTISELECT */}
      <div className="flex flex-col">
        <Controller
          control={control}
          name={headersPath}
          defaultValue={[]}
          rules={{
            validate: (val) => {
              if (!isEnabled) return true;

              if (!Array.isArray(val) || val.length === 0) {
                return "atleast one dependency is required";
              }

              return true;
            },
          }}
          render={({ field }) => (
            <select
              multiple
              className="border border-gray-400 p-2 w-36 rounded"
              value={field.value || []}
              onChange={(e) => handleSelectChange(e, field.onChange)}
              //   onBlur={() => trigger(headersPath)}
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
      <div className="flex flex-col">
        <div className="flex gap-2">
          <label>
            <input
              type="radio"
              value="true"
              {...register(conditionPath, {
                validate: (val) => {
                  if (!isEnabled) return true;
                  if (!val) return "Condition is required";
                  return true;
                },
              })}
            />
            True
          </label>

          <label>
            <input
              type="radio"
              value="other"
              {...register(conditionPath, {
                validate: (val) => {
                  if (!isEnabled) return true;
                  if (!val) return "Condition is required";
                  return true;
                },
              })}
            />
            Other
          </label>
        </div>

        {conditionError && (
          <p className="text-red-500 text-sm">{conditionError}</p>
        )}
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
          //   onBlur={() => trigger(valuePath)}
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
