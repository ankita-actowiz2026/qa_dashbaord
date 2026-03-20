import React, { useState, useEffect } from "react";
import MultiValueRules from "./MultiValueRules";
import { DEFAULTS } from "./defaultValues"; // adjust path
import { InfoTooltip } from "../../../utils/ToolTips";
import { useWatch } from "react-hook-form";
import SubDependencyLatest from "./SubDependencyLatest";
import type { ValidationRowProps } from "../../../interface/importFile.interface";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
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
  const [isExpanded, setIsExpanded] = useState(false);
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
      {
        inputType: "fixed_header",
        inputs: fixedHeaderInputs,
        toolTips: "Only allow specific predefined values for this field.",
        errorMsgLabel: "Fixed header",
      },
      {
        inputType: "cell_start_with",
        inputs: cellStartWithInputs,
        toolTips:
          "Ensure the value starts with one of the specified characters or strings.",
        errorMsgLabel: "Cell start with",
      },
      {
        inputType: "cell_end_with",
        inputs: cellEndWithInputs,
        toolTips:
          "Ensure the value ends with one of the specified characters or strings.",
        errorMsgLabel: "Cell end with",
      },
      {
        inputType: "not_match_found",
        inputs: notMatchFoundInputs,
        toolTips: "Enter values that should not be allowed in this field.",
        errorMsgLabel: "Blocked data",
      },
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
  const inputClass =
    "border border-gray-300 rounded-md px-2 py-1 text-sm w-full focus:ring-2 focus:ring-blue-200";
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
        rule={rule}
        inputClass={inputClass}
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
    <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_60px_1fr_3.5fr_60px] items-center px-4 py-3 gap-4 sm:gap-6 border-b odd:bg-gray-300 hover:bg-red-200 even:bg-white last:border-b-0">
      <div>
        <span className="block text-xs text-gray-500 lg:hidden">Header</span>
        <div className="font-medium text-gray-800 truncate">{header.name}</div>
      </div>

      {/*DataTypeSection start  */}
      <div className="w-full">
        <label className="block text-xs text-gray-500 mb-1 lg:hidden">
          Data Type
        </label>
        <select
          className={`${inputClass} w-full sm:w-auto min-w-[120px]`}
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
      {/* DataTypeSection end */}
      {/* AllowEmpty start */}
      <div className="flex items-center justify-start lg:justify-center">
        <label className="text-xs text-gray-500 mr-2 lg:hidden">
          Allow Empty
        </label>
        <input
          className="w-4 h-4"
          type="checkbox"
          {...register(`${header.name}.has_empty`)}
        />
      </div>
      {/* AllowEmpty end */}
      {/* CellContainsSection start */}
      <div className="flex justify-center items-center">
        {/* Checkbox + Label */}

        <input
          type="checkbox"
          {...register(`${header.name}.cell_contains`)}
          className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
        />

        {cellContains && (
          <>
            <input
              type="text"
              defaultValue={defaultValue}
              placeholder="Enter regex value"
              className={`${inputClass} w-24`}
              {...register(`${header.name}.cell_contains_value`, {
                required: "Regex pattern is required",
                validate: (value: string) => {
                  if (!value) return "Regex pattern is required";

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
          </>
        )}
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1 text-sm font-semibold">
            <input
              type="radio"
              value="variable"
              defaultChecked
              {...register(`${header.name}.length_validation_type`, {
                onChange: () => {
                  setValue(`${header.name}.min_length`, "");
                  setValue(`${header.name}.max_length`, "");
                },
              })}
            />
            Variable
          </label>

          <label className="flex items-center gap-1 text-sm font-semibold">
            <input
              type="radio"
              value="fixed"
              {...register(`${header.name}.length_validation_type`, {
                onChange: () => {
                  setValue(`${header.name}.min_length`, "");
                  setValue(`${header.name}.max_length`, "");
                  setTimeout(() => {
                    trigger(`${header.name}.min_length`);
                    trigger(`${header.name}.max_length`);
                  }, 0);
                },
              })}
            />
            Fixed
          </label>
        </div>
        {/* VARIABLE VALIDATION */}
        {validationType === "variable" && (
          <div className="flex items-center gap-3">
            {/* STRING / BOOLEAN / EMAIL */}

            {stringTypes.includes(dataType) && (
              <>
                <span className="text-sm">Min</span>
                <input
                  type="number"
                  className={inputClass + "  w-20"}
                  {...register(`${header.name}.min_length`, {
                    required: "Min length is required",
                  })}
                />
                {errors?.[header.name]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].min_length.message}
                  </p>
                )}
                <span className="text-sm">Max</span>
                <input
                  type="number"
                  className={inputClass + " w-20"}
                  {...register(`${header.name}.max_length`, {
                    required: "Max length is required",
                  })}
                />

                {errors?.[header.name]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].max_length.message}
                  </p>
                )}
              </>
            )}

            {/* NUMBER */}

            {numberTypes.includes(dataType) && (
              <>
                <span className="text-sm">Min</span>
                <input
                  type="number"
                  className={inputClass + " w-20"}
                  {...register(`${header.name}.min_length`)}
                />
                {errors?.[header.name]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].min_length.message}
                  </p>
                )}
                <span className="text-sm">Max</span>
                <input
                  type="number"
                  className={inputClass + " w-20"}
                  {...register(`${header.name}.max_length`)}
                />

                {errors?.[header.name]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].max_length.message}
                  </p>
                )}
              </>
            )}

            {/* DATE */}

            {dataType === "date" && (
              <>
                <span className="text-sm">Min</span>
                <input
                  type="date"
                  // defaultValue={def_var_min_len_date}
                  className={inputClass}
                  {...register(`${header.name}.min_length`, {
                    required: "Min date required",
                  })}
                />
                {errors?.[header.name]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].min_length.message}
                  </p>
                )}
                <span className="text-sm">Max</span>
                <input
                  type="date"
                  // defaultValue={def_var_max_len_date}
                  className={inputClass}
                  {...register(`${header.name}.max_length`, {
                    required: "Max date required",
                  })}
                />
                {errors?.[header.name]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].max_length.message}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {/* FIXED VALIDATION */}
        {validationType === "fixed" && (
          <div className="flex items-center gap-3 whitespace-nowrap">
            {" "}
            <span className="text-sm">
              Fixed{" "}
              {["integer", "boolean", "float", "date"].includes(dataType)
                ? "Value"
                : "Length"}
            </span>
            <input
              type={dataType === "date" ? "date" : "number"}
              className={`${inputClass} ${dataType === "date" ? "w-24" : "w-20"}`}
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
      </div>
      {/* LengthValidation end  */}
      <div
        className="text-right cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <FiChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <FiChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </div>
      {isExpanded && (
        <div className="col-span-6 bg-gray-50 p-4">
          {/* DataRedundantSection start */}
          <div className="flex flex-col gap-4 mb-1">
            {/* Redundant Value */}
            {dataType === "date" && (
              <div className="w-full">
                <label className="text-sm font-semibold flex items-center gap-1 mb-1">
                  Date Format{" "}
                  <InfoTooltip
                    id="date-format-tooltip"
                    text="Select the format in which dates should appear. Example: YYYY-MM-DD → 2025-12-25"
                  />
                </label>

                <select
                  {...register(`${header.name}.def_date_format`)}
                  className={`${inputClass} w-[150px]`}
                >
                  {date_format_options.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-4 gap-6 mt-1">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  Data Redundant Value
                  <InfoTooltip
                    id="data-redundant-tooltip"
                    text="Specify values that are considered repeated or unnecessary."
                  />
                </label>

                <input
                  type="text"
                  placeholder="Enter redundant value"
                  className={`${inputClass} w-[150px]`}
                  {...register(`${header.name}.data_redundant_value`)}
                />
              </div>

              {/* Threshold */}
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  Data Redundant Threshold
                  <InfoTooltip
                    id="data-redundant-threshold-tooltip"
                    text="Set how many times a value can repeat before it is considered redundant."
                  />
                </label>

                <input
                  type="number"
                  placeholder="Enter threshold"
                  className={`${inputClass} w-[150px]`}
                  {...register(`${header.name}.data_redundant_threshold`, {
                    validate: (value: string) => {
                      if (redundantValue && !value) {
                        return "Threshold is required when redundant values are specified.";
                      }

                      if (value && !/^\d+$/.test(value)) {
                        return "Threshold must be a valid number. ";
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
          </div>
          {/* DataRedundantSection end */}
          <div className="grid grid-cols-4 gap-6 mt-1">
            {multiValueRulesComponents}
          </div>

          {/* depe */}
          <div>
            {/* Add Dependency */}
            <label className="text-sm font-semibold flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                {...register(`${header.name}.has_dependency`, {
                  onChange: (e) => {
                    const checked = e.target.checked;

                    if (!checked) {
                      // ✅ reset all dependency-related fields
                      setValue(`${header.name}.dependency_condition`, "");
                      setValue(`${header.name}.dependency_value`, "");
                      setValue(`${header.name}.sub_dependencies`, []);
                    }
                  },
                })}
              />
              Add Dependency
              <InfoTooltip
                id="add dependancy-tooltip"
                text="Add conditions where this field depends on another field's value."
              />
            </label>

            {hasDependency && (
              <div className="ml-5">
                <div className="mt-2 flex items-start gap-4">
                  {/* ✅ RADIO GROUP (center vertically) */}
                  <div className="flex items-center gap-4">
                    {/* YES */}
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        value="yes"
                        defaultChecked
                        {...register(`${header.name}.dependency_condition`, {
                          onChange: () => {
                            setValue(`${header.name}.dependency_value`, "");
                          },
                        })}
                      />
                      Required
                    </label>

                    {/* NO */}
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        value="no"
                        {...register(`${header.name}.dependency_condition`)}
                      />
                      Other value
                    </label>
                  </div>
                  {/* TEXTBOX */}
                  <div className="flex flex-col justify-center">
                    <input
                      type="text"
                      placeholder="Enter value"
                      disabled={condition !== "no"}
                      className={inputClass}
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
                      <p className="text-red-500 text-xs mt-1">
                        {errors[header.name].dependency_value.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <InfoTooltip
                      id="dependant-parent-tooltip"
                      text="Select Yes to make this field mandatory when the condition is applied. Select Other to apply this rule only when the field matches a specific value."
                    />
                  </div>
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ValidationRow);
