import React, { useState, useEffect } from "react";
import MultiValueRules from "./MultiValueRules";
import { DEFAULTS } from "./defaultValues"; // adjust path
import { InfoTooltip } from "../../../utils/ToolTips";
import { useWatch } from "react-hook-form";
import SubDependencyLatest from "./SubDependencyLatest";
import type { ValidationRowProps } from "../../../interface/importFile.interface";
const {
  def_var_min_len_str,
  def_var_max_len_str,
  def_var_min_len_num,
  def_var_max_len_num,
  def_var_min_len_date,
  def_var_max_len_date,
  def_fixed_length_str,
  def_fixed_length_num,
  def_fixed_date,
  def_str_regex,
  def_boolean_regex,
  def_int_regex,
  def_float_regex,
  def_email_regex,
  def_date_regex,
  stringTypes,
  numberTypes,
} = DEFAULTS;

const ValidationRow: React.FC<ValidationRowProps> = ({
  header,
  index,
  register,
  errors,
  control,
  trigger,
  setValue,
  getValues,
  fixedHeaderInputs,
  cellStartWithInputs,
  cellEndWithInputs,
  notMatchFoundInputs,
  handleMultiValueRulesInputChange,
  addMultiValueRules,
  cancelMultiValueRules,
  dataTypes,
  date_format_options,
  headersList,
}) => {
  const [defaultValue, setDefaultValue] = useState("");
  const basePath = `${header.name}`;

  const values = useWatch({ control, name: basePath }) || {};
  const hasDependency = useWatch({
    control,
    name: `${basePath}.has_dependency`,
  });
  const condition = useWatch({
    control,
    name: `${basePath}.dependency_condition`,
    defaultValue: "yes",
  });
  const multiValueRulesConfig = React.useMemo(
    () => [
      { inputType: "fixed_header", inputs: fixedHeaderInputs },
      { inputType: "cell_start_with", inputs: cellStartWithInputs },
      { inputType: "cell_end_with", inputs: cellEndWithInputs },
      { inputType: "not_match_found", inputs: notMatchFoundInputs },
    ],
    [
      fixedHeaderInputs,
      cellStartWithInputs,
      cellEndWithInputs,
      notMatchFoundInputs,
    ],
  );
  const dataType = values?.data_type || "string";
  const validationType = values?.length_validation_type || "variable";
  const cellContains = values?.cell_contains;
  const redundantValue = values?.data_redundant_value;

  const regexMap = React.useMemo(
    () => ({
      string: def_str_regex,
      boolean: def_boolean_regex,
      integer: def_int_regex,
      float: def_float_regex,
      email: def_email_regex,
      date: def_date_regex,
    }),
    [],
  );
  const getDefaultLengths = React.useCallback(() => {
    if (dataType === "date") {
      return validationType === "fixed"
        ? { min: def_fixed_date }
        : { min: def_var_min_len_date, max: def_var_max_len_date };
    }

    if (numberTypes.includes(dataType)) {
      return validationType === "fixed"
        ? { min: def_fixed_length_num }
        : { min: def_var_min_len_num, max: def_var_max_len_num };
    }

    return validationType === "fixed"
      ? { min: def_fixed_length_str }
      : { min: def_var_min_len_str, max: def_var_max_len_str };
  }, [dataType, validationType]);
  useEffect(() => {
    setValue(`${basePath}.cell_contains_value`, regexMap[dataType] || "", {
      shouldValidate: true,
    });
    const { min, max } = getDefaultLengths();
    setValue(`${basePath}.min_length`, min);
    if (max !== undefined) setValue(`${basePath}.max_length`, max);
  }, [dataType, basePath, setValue, getDefaultLengths, regexMap]);

  const multiValueRulesComponents = React.useMemo(() => {
    return multiValueRulesConfig.map((rule) => (
      <MultiValueRules
        key={rule.inputType}
        headerName={header.name}
        control={control}
        register={register}
        errors={errors}
        multiValueRulesInputs={rule.inputs}
        handleMultiValueRulesInputChange={handleMultiValueRulesInputChange}
        addMultiValueRules={addMultiValueRules}
        cancelMultiValueRules={cancelMultiValueRules}
        inputType={rule.inputType}
      />
    ));
  }, [
    multiValueRulesConfig,
    header.name,
    control,
    register,
    errors,
    handleMultiValueRulesInputChange,
    addMultiValueRules,
    cancelMultiValueRules,
  ]);

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gray-300 px-4 py-2 border-b">
        <h3 className="font-semibold text-gray-700">
          {index + 1}. {header.name}
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/*DataTypeSection start  */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold flex items-center gap-1">
              <span>Data Type</span>
              <InfoTooltip
                id="data-type-tooltip"
                text="Please Select data type"
              />
            </label>

            <select
              className="border border-gray-400 p-2 w-full rounded"
              defaultValue="string"
              {...register(`${header.name}.data_type`)}
            >
              {dataTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {dataType === "date" && (
            <div>
              <label className="text-sm font-semibold flex items-center gap-1">
                Date Format{" "}
                <InfoTooltip
                  id="date-format-tooltip"
                  text="Please date format in which you want to pass date"
                />
              </label>

              <select
                {...register(`${header.name}.def_date_format`)}
                className="border border-gray-400 p-2 w-full rounded"
              >
                {date_format_options.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {/* DataTypeSection end */}
        {/* AllowEmpty start */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold flex items-center gap-1">
              <input
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
                type="checkbox"
                {...register(`${header.name}.has_empty`)}
              />
              Allow Empty{" "}
              <InfoTooltip
                id="allow-empty-tooltip"
                text="Select checkbox to allow empty for given filed"
              />
            </label>
          </div>
        </div>
        {/* AllowEmpty end */}
        {/* CellContainsSection start */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {/* Checkbox + Label */}
            <label className="text-sm font-semibold flex items-center gap-1">
              <input
                type="checkbox"
                {...register(`${header.name}.cell_contains`)}
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
              />
              Cell Contains (Regex){" "}
              <InfoTooltip
                id="cell-contains-tooltip"
                text="for you want to apply regex on this colom"
              />
            </label>
          </div>

          {/* Input */}
          {cellContains && (
            <div>
              <input
                type="text"
                defaultValue={defaultValue}
                placeholder="Enter regex value"
                className="border border-gray-400 p-2 w-full rounded"
                {...register(`${header.name}.cell_contains_value`, {
                  required: "Regex pattern is required",
                  validate: (value: string) => {
                    if (!value) return "Regex pattern is required";

                    // try {
                    //   new RegExp(value);
                    // } catch {
                    //   return "Invalid regex pattern";
                    // }

                    return true;
                  },
                })}
              />

              {/* Error */}
              {errors?.[header.name]?.cell_contains_value && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[header.name].cell_contains_value.message}
                </p>
              )}
            </div>
          )}
        </div>
        {/* CellContainsSection end */}
        {/* LengthValidation start */}
        {/* Validation Type */}
        <div className="flex items-center gap-6">
          <label className="text-sm font-semibold flex items-center gap-1">
            Data Length
            <InfoTooltip id="data-length-tooltip" text="Data Length" />
          </label>

          <div className="flex gap-4">
            <label className="text-sm font-semibold mr-2">
              <input
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
                type="radio"
                value="variable"
                defaultChecked
                {...register(`${header.name}.length_validation_type`)}
              />
              Variable
            </label>

            <label className="text-sm font-semibold mr-2">
              <input
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
                type="radio"
                value="fixed"
                {...register(`${header.name}.length_validation_type`)}
              />
              Fixed
            </label>
          </div>
        </div>
        {/* VARIABLE VALIDATION */}
        {validationType === "variable" && (
          <div className="grid grid-cols-2 gap-3">
            {/* STRING / BOOLEAN / EMAIL */}

            {stringTypes.includes(dataType) && (
              <>
                <div>
                  <label className="text-sm font-semibold mr-2">
                    Min Length
                  </label>

                  <input
                    type="number"
                    defaultValue={def_var_min_len_str}
                    className="border border-gray-400 p-2 w-full rounded"
                    {...register(`${header.name}.min_length`, {
                      required: "Min length is required",
                    })}
                  />

                  {errors?.[header.name]?.min_length && (
                    <p className="text-red-500 text-xs">
                      {errors[header.name].min_length.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold mr-2">
                    Max Length
                  </label>

                  <input
                    type="number"
                    defaultValue={def_var_max_len_str}
                    className="border border-gray-400 p-2 w-full rounded"
                    {...register(`${header.name}.max_length`, {
                      required: "Max length is required",
                    })}
                  />

                  {errors?.[header.name]?.max_length && (
                    <p className="text-red-500 text-xs">
                      {errors[header.name].max_length.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* NUMBER */}

            {numberTypes.includes(dataType) && (
              <>
                <div>
                  <label className="text-sm font-semibold mr-2">
                    Min Value
                  </label>

                  <input
                    type="number"
                    defaultValue={def_var_min_len_num}
                    className="border  border-gray-400 p-2 w-full rounded"
                    {...register(`${header.name}.min_length`, {
                      required: "Min value required",
                    })}
                  />

                  {errors?.[header.name]?.min_length && (
                    <p className="text-red-500 text-xs">
                      {errors[header.name].min_length.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold mr-2">
                    Max Value
                  </label>

                  <input
                    type="number"
                    defaultValue={def_var_max_len_num}
                    className="border  border-gray-400 p-2 w-full rounded"
                    {...register(`${header.name}.max_length`, {
                      required: "Max value required",
                    })}
                  />

                  {errors?.[header.name]?.max_length && (
                    <p className="text-red-500 text-xs">
                      {errors[header.name].max_length.message}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* DATE */}

            {dataType === "date" && (
              <>
                <div>
                  <label className="text-sm font-semibold mr-2">Min Date</label>
                  <input
                    type="date"
                    // defaultValue={def_var_min_len_date}
                    className="border border-gray-400 p-2 w-full rounded"
                    {...register(`${header.name}.min_length`, {
                      required: "Min date required",
                    })}
                  />

                  {errors?.[header.name]?.min_length && (
                    <p className="text-red-500 text-xs">
                      {errors[header.name].min_length.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold mr-2">Max Date</label>

                  <input
                    type="date"
                    // defaultValue={def_var_max_len_date}
                    className="border border-gray-400 p-2 w-full rounded"
                    {...register(`${header.name}.max_length`, {
                      required: "Max date required",
                    })}
                  />

                  {errors?.[header.name]?.max_length && (
                    <p className="text-red-500 text-xs">
                      {errors[header.name].max_length.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {/* FIXED VALIDATION */}
        {validationType === "fixed" && (
          <div>
            <label className="text-sm font-semibold mr-2">Fixed value</label>

            <input
              type={dataType === "date" ? "date" : "number"}
              // defaultValue={
              //   dataType === "date"
              //     ? def_fixed_date
              //     : dataType === "string"
              //       ? def_fixed_length_str
              //       : def_fixed_length_num
              // }
              className="border border-gray-400 p-2 w-full rounded"
              {...register(`${header.name}.min_length`, {
                required: "Value is required",
              })}
            />

            {errors?.[header.name]?.min_length && (
              <p className="text-red-500 text-xs">
                {errors[header.name].min_length.message}
              </p>
            )}
          </div>
        )}
        {/* LengthValidation end  */}
        {/* DataRedundantSection start */}
        <div className="grid grid-cols-2 gap-4">
          {/* Redundant Value */}
          <div>
            <label className="text-sm font-semibold flex items-center gap-1">
              Data Redundant Value
              <InfoTooltip
                id="data-redundant-tooltip"
                text="Data Redundant Value"
              />
            </label>

            <input
              type="text"
              placeholder="Enter redundant value"
              className="border border-gray-400 p-2 rounded w-full"
              {...register(`${header.name}.data_redundant_value`)}
            />
          </div>

          {/* Threshold */}
          <div>
            <label className="text-sm font-semibold flex items-center gap-1">
              Data Redundant Threshold
              <InfoTooltip
                id="data-redundant-threshold-tooltip"
                text="Data Redundant Threshold"
              />
            </label>

            <input
              type="number"
              placeholder="Enter threshold"
              className="border border-gray-400 p-2 rounded w-full"
              {...register(`${header.name}.data_redundant_threshold`, {
                validate: (value: string) => {
                  if (redundantValue && !value) {
                    return "Threshold required when redundant value exists";
                  }

                  if (value && !/^\d+$/.test(value)) {
                    return "Threshold must be integer";
                  }

                  return true;
                },
              })}
            />

            {/* Error */}
            {errors?.[header.name]?.data_redundant_threshold && (
              <p className="text-red-500 text-xs mt-1">
                {errors[header.name].data_redundant_threshold.message}
              </p>
            )}
          </div>
        </div>
        {/* DataRedundantSection end */}

        {multiValueRulesComponents}

        {/* depe */}
        <div className="mt-4">
          {/* Add Dependency */}
          <label className="text-sm font-semibold flex items-center gap-2">
            <input
              type="checkbox"
              {...register(`${header.name}.has_dependency`)}
            />
            Add Dependency
          </label>

          {hasDependency && (
            <>
              <div className="mt-2 flex items-center gap-4">
                {/* YES */}
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="yes"
                    defaultChecked
                    {...register(`${header.name}.dependency_condition`)}
                  />
                  Yes
                </label>

                {/* NO */}
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="no"
                    {...register(`${header.name}.dependency_condition`)}
                  />
                  Other
                </label>

                {/* TEXTBOX */}

                <input
                  type="text"
                  placeholder="Enter value"
                  disabled={condition !== "no"}
                  className="border border-gray-400 p-1 rounded"
                  {...register(`${header.name}.dependency_value`, {
                    validate: (value) => {
                      if (condition === "no" && !value) {
                        return "for no value value is required";
                      }
                      return true;
                    },
                  })}
                />

                {errors?.[header.name]?.dependency_value && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].dependency_value.message}
                  </p>
                )}
              </div>

              <SubDependencyLatest
                control={control}
                register={register}
                headerName={header.name}
                index={index}
                headersList={headersList}
                trigger={trigger}
                setValue={setValue}
                getValues={getValues}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ValidationRow);
