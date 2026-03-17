import React, { useState, useEffect } from "react";
import MultiValueRules from "./MultiValueRules";
import DependencyBuilder from "./DependencyBuilder";
import { DEFAULTS } from "./defaultValues"; // adjust path

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
} = DEFAULTS;
interface HeaderValidationCardProps {
  header: any;
  index: number;
  register: any;
  watch: any;
  errors: any;
  control: any;
  trigger: any;
  dataTypes: any[];
  date_format_options: any[];
  getRegexByType: (type: string) => string;
  default_length_validation_value: string;
  fixedHeaderInputs: any[];
  cellStartWithInputs: any[];
  cellEndWithInputs: any[];
  notMatchFoundInputs: any[];
  handleMultiValueRulesInputChange: any;
  addMultiValueRules: any;
  cancelMultiValueRules: any;
  setValue: any;
}

const ValidationRow: React.FC<HeaderValidationCardProps> = ({
  header,
  index,
  register,
  watch,
  errors,
  control,
  trigger,
  dataTypes,
  date_format_options,
  getRegexByType,
  default_length_validation_value,
  fixedHeaderInputs,
  cellStartWithInputs,
  cellEndWithInputs,
  notMatchFoundInputs,
  handleMultiValueRulesInputChange,
  addMultiValueRules,
  cancelMultiValueRules,
  setValue,
}) => {
  const formValues = watch();
  const headerValues = formValues?.[header.name] || {};
  const dataType = headerValues.data_type || "string";
  //const validationType =    headerValues.length_validation_type || default_length_validation_value;
  const stringTypes = ["string", "boolean", "email"];
  const numberTypes = ["integer", "float"];
  const multiValueRulesConfig = [
    { inputType: "fixed_header", inputs: fixedHeaderInputs },
    { inputType: "cell_start_with", inputs: cellStartWithInputs },
    { inputType: "cell_end_with", inputs: cellEndWithInputs },
    { inputType: "not_match_found", inputs: notMatchFoundInputs },
  ];
  const selectedDataType = watch(`${header.name}.data_type`);

  const cellContains = watch(`${header.name}.cell_contains`);
  const regexValue = getRegexByType(dataType);
  const redundantValue = watch(`${header.name}.data_redundant_value`);
  const validationType = watch(`${header.name}.length_validation_type`);

  const [defaultValue, setDefaultValue] = useState("");
  console.log("validation row");
  const regexMap = {
    string: def_str_regex,
    boolean: def_boolean_regex,
    integer: def_int_regex,
    float: def_float_regex,
    email: def_email_regex,
    date: def_date_regex,
  };

  useEffect(() => {
    console.log(def_var_min_len_date + "~~~~~~~~~~~~~~>" + selectedDataType);
    if (setValue) {
      setValue(`${header.name}.cell_contains_value`, regexMap[dataType] || "");
    }
  }, [dataType]);
  useEffect(() => {
    console.log("validationType==>" + validationType);
    console.log("selectedDataType==>" + selectedDataType);
    if (selectedDataType === "date") {
      if (validationType == "fixed") {
        setValue(`${header.name}.min_length`, def_fixed_date);
      } else {
        setValue(`${header.name}.min_length`, def_var_min_len_date);
        setValue(`${header.name}.max_length`, def_var_max_len_date);
      }
    } else if (numberTypes.includes(selectedDataType)) {
      if (validationType == "fixed") {
        setValue(`${header.name}.min_length`, def_fixed_length_num);
      } else {
        setValue(`${header.name}.min_length`, def_var_min_len_num);
        setValue(`${header.name}.max_length`, def_var_max_len_num);
      }
    } else {
      if (validationType == "fixed") {
        setValue(`${header.name}.min_length`, def_fixed_length_str);
      } else {
        setValue(`${header.name}.min_length`, def_var_min_len_str);
        setValue(`${header.name}.max_length`, def_var_max_len_str);
      }
    }
  }, [selectedDataType, validationType]);
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
            <label className="text-sm font-semibold mr-2">Data Type</label>

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

          {selectedDataType === "date" && (
            <div>
              <label className="text-sm font-semibold mr-2">Date Format</label>

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
            <label className="text-sm font-semibold flex items-center">
              <input
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
                type="checkbox"
                {...register(`${header.name}.has_empty`)}
              />
              Allow Empty
            </label>
          </div>
        </div>
        {/* AllowEmpty end */}
        {/* CellContainsSection start */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {/* Checkbox + Label */}
            <label className="text-sm font-semibold mr-2">
              <input
                type="checkbox"
                {...register(`${header.name}.cell_contains`)}
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
              />
              Cell Contains (Regex)
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
          <label className="text-sm font-medium whitespace-nowrap">
            Data Length
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
                  {def_var_min_len_date}
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
            <label className="text-sm font-semibold mr-2">
              Data Redundant Value
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
            <label className="text-sm font-semibold mr-2">
              Data Redundant Threshold
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

                  if (value && !Number.isInteger(Number(value))) {
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

        {multiValueRulesConfig.map((rule) => (
          <MultiValueRules
            key={rule.inputType}
            headerName={header.name}
            control={control}
            register={register}
            watch={watch}
            errors={errors}
            multiValueRulesInputs={rule.inputs}
            handleMultiValueRulesInputChange={handleMultiValueRulesInputChange}
            addMultiValueRules={addMultiValueRules}
            cancelMultiValueRules={cancelMultiValueRules}
            inputType={rule.inputType}
          />
        ))}
        <DependencyBuilder
          headerName={header.name}
          headersList={Object.keys(formValues || {})}
          control={control}
          register={register}
          watch={watch}
          trigger={trigger}
          errors={errors}
        />
      </div>
    </div>
  );
};

export default ValidationRow;
