import React, { useState, useEffect } from "react";
import MultiValueRules from "./MultiValueRules";
import { DEFAULTS } from "./defaultValues"; // adjust path
import { InfoTooltip } from "../../../utils/ToolTips";
import { useWatch } from "react-hook-form";
import SubDependencyLatest from "./SubDependencyLatest";
import type { ValidationRowProps } from "../../../interface/importFile.interface";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FiX } from "react-icons/fi";

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
  def_alphabetic_regex,
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
  clearErrors,
}) => {
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [savedDependency, setSavedDependency] = useState(null);
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
      alphabetic: def_alphabetic_regex,
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
    //setValue(`${basePath}.cell_contains_value`, regexMap[dataType] || "", {
    //  shouldValidate: true,
    //});
    const { min, max } = getDefaultLengths();
    setValue(`${basePath}.min_length`, min);
    if (max !== undefined) setValue(`${basePath}.max_length`, max);
  }, [dataType, basePath, setValue, getDefaultLengths, regexMap]);
  //const inputClass =    "border border-gray-300 rounded-md px-2 py-1 text-sm w-full focus:ring-2 focus:ring-blue-200";
  const inputClass =
    "rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none";
  const checkboxClass = inputClass + " w-4 h-4";
  const textboxClass = inputClass + "  px-2 py-1 text-sm focus:outline-none";
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

  useEffect(() => {
    const existing = getValues(header.name);

    // ✅ Only set defaults if empty (first time)
    if (!existing || Object.keys(existing).length === 0) {
      setValue(`${header.name}.has_dependency`, false);
      setValue(`${header.name}.dependency_condition`, "yes");
      setValue(`${header.name}.dependency_value`, "");
      setValue(`${header.name}.sub_dependencies`, []);
    }
  }, []);

  const handleCancelDependency = () => {
    if (savedDependency) {
      Object.entries(savedDependency).forEach(([key, value]) => {
        setValue(`${header.name}.${key}`, value);
      });
    } else {
      // reset to default
      setValue(`${header.name}.has_dependency`, false);
      setValue(`${header.name}.dependency_condition`, "yes");
      setValue(`${header.name}.dependency_value`, "");
      setValue(`${header.name}.sub_dependencies`, []);
    }

    setShowDependencyModal(false);
  };
  return (
    // <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_60px_1.5fr_3.5fr_60px] items-center  px-5 py-3 gap-4 sm:gap-6 border-b border-gray-300 hover:bg-[#dde1e6] transition-colors duration-150 last:border-b-0">
    <div className="border-b border-gray-300 group hover:bg-gray-200 transition">
      <div
        className="
       hidden md:grid
      grid-cols-[1.5fr_1fr_60px_1.5fr_3.5fr_60px]
      items-center
      px-5
      min-h-[56px]
      gap-4"
      >
        <div>
          <span className="block text-xs text-gray-500 lg:hidden">Header</span>
          <div className="font-medium text-gray-800 truncate">
            {" "}
            {header.name
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())}
          </div>
        </div>

        {/*DataTypeSection start  */}
        <div className="w-full">
          <label className="block text-xs text-gray-500 mb-1 lg:hidden">
            Data Type
          </label>
          <select
            className={`${inputClass}  px-2 py-1 text-sm focus:outline-none w-28`}
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
            className={`${checkboxClass}`}
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
            className={`${checkboxClass}`}
          />

          {cellContains && (
            <div className="flex flex-col ml-2">
              <input
                type="text"
                defaultValue={defaultValue}
                placeholder="Enter regex value"
                className={`${textboxClass} w-32`}
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
            </div>
          )}
        </div>
        {/* LengthValidation start  */}
        <div className="flex flex-col gap-1">
          {/* ROW 1 */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Radios */}
            <div className="flex items-center gap-2 min-w-[100px] h-full justify-left">
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

              <label className="flex items-center gap-2 text-sm font-semibold">
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

            {/* VARIABLE */}
            {validationType === "variable" && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Min</span>
                <input
                  type={dataType === "date" ? "date" : "number"}
                  className={`${inputClass} w-[7.5rem]`}
                  {...register(`${header.name}.min_length`, {
                    required: "Min length is required",
                  })}
                />

                <span className="text-sm font-semibold">Max</span>
                <input
                  type={dataType === "date" ? "date" : "number"}
                  className={`${inputClass} w-[7.5rem]`}
                  {...register(`${header.name}.max_length`, {
                    required: "Max length is required",
                  })}
                />
              </div>
            )}

            {/* FIXED */}
            {validationType === "fixed" && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  Fixed{" "}
                  {["integer", "boolean", "float", "date"].includes(dataType)
                    ? "Value"
                    : "Length"}
                </span>

                <input
                  type={dataType === "date" ? "date" : "number"}
                  className={`${inputClass} ${
                    dataType === "date" ? "w-[7.5rem]" : "w-24"
                  }`}
                  {...register(`${header.name}.min_length`, {
                    required: "Value is required",
                  })}
                />
              </div>
            )}
          </div>

          {/* ROW 2: ERRORS */}
          <div className="flex gap-2">
            <div className="min-w-[140px]" /> {/* aligns with radios */}
            {validationType === "variable" && (
              <div className="flex gap-10">
                <div className="w-32">
                  {errors?.[header.name]?.min_length && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[header.name].min_length.message}
                    </p>
                  )}
                </div>

                <div className="w-32">
                  {errors?.[header.name]?.max_length && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[header.name].max_length.message}
                    </p>
                  )}
                </div>
              </div>
            )}
            {validationType === "fixed" && (
              <div className="w-32">
                {errors?.[header.name]?.min_length && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[header.name].min_length.message}
                  </p>
                )}
              </div>
            )}
          </div>
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
      </div>
      {isExpanded && (
        <div className="px-5 py-4">
          {/* DataRedundantSection start */}
          <div className="flex flex-col gap-4 mb-1">
            {/* Redundant Value */}
            {dataType === "date" && (
              <div className="w-full">
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  Date Format{" "}
                  <InfoTooltip
                    id="date-format-tooltip"
                    text="Select the format in which dates should appear. Example: YYYY-MM-DD → 2025-12-25"
                    tooltip_type="listing"
                  />
                </label>

                <select
                  {...register(`${header.name}.def_date_format`)}
                  className={`${inputClass} w-[180px]`}
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
                    tooltip_type="listing"
                  />
                </label>

                <input
                  type="text"
                  placeholder="Enter redundant value"
                  className={`${textboxClass} w-[180px]`}
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
                    tooltip_type="listing"
                  />
                </label>

                <input
                  type="number"
                  placeholder="Enter threshold value"
                  className={`${textboxClass} w-[180px]`}
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

          <button
            type="button"
            onClick={() => {
              if (savedDependency) {
                // ✅ restore saved values
                Object.entries(savedDependency).forEach(([key, value]) => {
                  setValue(`${header.name}.${key}`, value);
                });
              } else {
                // ✅ first time defaults
                setValue(`${header.name}.has_dependency`, false);
                setValue(`${header.name}.dependency_condition`, "yes");
                setValue(`${header.name}.dependency_value`, "");
                setValue(`${header.name}.sub_dependencies`, []);
              }

              setShowDependencyModal(true);
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded mt-4"
          >
            Add Dependency
          </button>
          {showDependencyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-white w-[550px] max-h-[80vh] rounded-xl shadow-xl flex flex-col overflow-hidden">
                {" "}
                {/* HEADER */}
                <div className="flex items-center justify-between border-b px-5 py-3">
                  <h2 className="font-semibold text-lg">
                    Dependency Configuration
                  </h2>

                  <button
                    onClick={handleCancelDependency}
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                  >
                    <FiX
                      size={20}
                      className="text-gray-500 hover:text-red-500"
                    />
                  </button>
                </div>
                <div className="p-5 overflow-y-auto">
                  {/* CHECKBOX */}
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      {...register(`${header.name}.has_dependency`, {
                        onChange: (e) => {
                          const checked = e.target.checked;
                          clearErrors([
                            `${header.name}.dependency_value`,
                            `${header.name}.sub_dependencies`,
                          ]);
                          if (!checked) {
                            setValue(
                              `${header.name}.dependency_condition`,
                              "yes",
                            );
                            setValue(`${header.name}.dependency_value`, "");
                            setValue(`${header.name}.sub_dependencies`, []);
                          }
                        },
                      })}
                    />
                    Add Dependency
                  </label>

                  {hasDependency && (
                    <div className="mt-4 ml-3">
                      {/* ROW: RADIO + TEXTBOX */}
                      <div className="flex items-start gap-6">
                        {/* RADIO */}
                        <div className="flex items-center gap-4 mt-1">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              value="yes"
                              {...register(
                                `${header.name}.dependency_condition`,
                                {
                                  onChange: () => {
                                    setValue(
                                      `${header.name}.dependency_value`,
                                      "",
                                    );
                                    clearErrors(
                                      `${header.name}.dependency_value`,
                                    );
                                  },
                                },
                              )}
                            />
                            Required
                          </label>

                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              value="no"
                              {...register(
                                `${header.name}.dependency_condition`,
                              )}
                            />
                            Other value
                          </label>
                        </div>

                        {/* TEXTBOX */}
                        <div className="flex flex-col">
                          <input
                            type="text"
                            placeholder="Enter value"
                            disabled={condition !== "no"}
                            className={`${inputClass} border px-2 py-1 rounded`}
                            {...register(`${header.name}.dependency_value`, {
                              validate: (val) => {
                                if (condition === "no" && !val?.trim()) {
                                  return "Value is required when 'Other Value' is selected";
                                }
                                return true;
                              },
                            })}
                          />

                          {/* ERROR BELOW TEXTBOX */}
                          <p className="text-red-500 text-xs mt-1 min-h-[16px]">
                            {errors?.[header.name]?.dependency_value?.message}
                          </p>
                        </div>
                      </div>

                      {/* SUB DEPENDENCY */}
                      <SubDependencyLatest
                        control={control}
                        register={register}
                        headerName={header.name}
                        headersList={headersList}
                        trigger={trigger}
                        setValue={setValue}
                        inputClass={inputClass}
                        clearErrors={clearErrors}
                      />
                    </div>
                  )}
                </div>
                {/* ACTION BUTTONS */}
                <div className="flex justify-center gap-3 px-5 py-4 border-t">
                  <button
                    type="button"
                    className="bg-gray-600 text-white px-4 py-2 rounded"
                    onClick={handleCancelDependency}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const isChecked = getValues(
                        `${header.name}.has_dependency`,
                      );

                      // ✅ If unchecked → clear everything
                      if (!isChecked) {
                        setSavedDependency(null);

                        setValue(`${header.name}.dependency_condition`, "yes");
                        setValue(`${header.name}.dependency_value`, "");
                        setValue(`${header.name}.sub_dependencies`, []);

                        setShowDependencyModal(false);
                        return;
                      }

                      // ✅ Validate
                      const valid = await trigger([
                        `${header.name}.dependency_value`,
                        `${header.name}.sub_dependencies`,
                      ]);

                      if (!valid) return;

                      // ✅ Save snapshot
                      const data = getValues(`${header.name}`);

                      setSavedDependency({
                        has_dependency: data.has_dependency,
                        dependency_condition: data.dependency_condition,
                        dependency_value: data.dependency_value,
                        sub_dependencies: data.sub_dependencies,
                      });

                      setShowDependencyModal(false);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ValidationRow);
