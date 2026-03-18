import React, { useEffect, useMemo, useCallback } from "react";
//import MultiValueRules from "./MultiValueRules";
//import SubDependencyLatest from "./SubDependencyLatest";
import { DEFAULTS } from "./defaultValues";
import { InfoTooltip } from "../../../utils/ToolTips";

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
  stringTypes,
  numberTypes,
  def_str_regex,
  def_boolean_regex,
  def_int_regex,
  def_float_regex,
  def_email_regex,
  def_date_regex,
} = DEFAULTS;

interface ValidationRowProps {
  header: any;
  index: number;
  values: any;
  errors: any;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  dataTypes: string[];
  date_format_options: string[];
  headersList: string[];
  multiValueRulesInputs: any;
  handleMultiValueRulesInputChange: any;
  addMultiValueRules: any;
  cancelMultiValueRules: any;
}

const ValidationRow: React.FC<ValidationRowProps> = ({
  header,
  index,
  values,
  errors,
  setFieldValue,
  dataTypes,
  date_format_options,
  headersList,
  multiValueRulesInputs,
  handleMultiValueRulesInputChange,
  addMultiValueRules,
  cancelMultiValueRules,
}) => {
  const basePath = header.name;
  const current = values[basePath] || {};
  const dataType = current.data_type || "string";
  const validationType = current.length_validation_type || "variable";
  const cellContains = current.cell_contains;
  const hasDependency = current.has_dependency || false;
  const condition = current.dependency_condition || "yes";

  const regexMap = useMemo(
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

  const getDefaultLengths = useCallback(() => {
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

  // Update default values for min/max length
  useEffect(() => {
    const { min, max } = getDefaultLengths();
    setFieldValue(`${basePath}.min_length`, min);
    if (max !== undefined) setFieldValue(`${basePath}.max_length`, max);
    setFieldValue(`${basePath}.cell_contains_value`, regexMap[dataType] || "");
  }, [getDefaultLengths, basePath, setFieldValue, dataType, regexMap]);

  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gray-300 px-4 py-2 border-b">
        <h3 className="font-semibold text-gray-700">
          {index + 1}. {header.name}
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Data Type Section */}
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
              value={current.data_type}
              onChange={(e) =>
                setFieldValue(`${basePath}.data_type`, e.target.value)
              }
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
                className="border border-gray-400 p-2 w-full rounded"
                value={current.def_date_format}
                onChange={(e) =>
                  setFieldValue(`${basePath}.def_date_format`, e.target.value)
                }
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

        {/* Allow Empty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold flex items-center gap-1">
              <input
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
                type="checkbox"
                checked={current.has_empty || false}
                onChange={(e) =>
                  setFieldValue(`${basePath}.has_empty`, e.target.checked)
                }
              />
              Allow Empty
            </label>
          </div>
        </div>

        {/* Cell Contains */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold flex items-center gap-1">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
                checked={current.cell_contains || false}
                onChange={(e) =>
                  setFieldValue(`${basePath}.cell_contains`, e.target.checked)
                }
              />
              Cell Contains (Regex)
            </label>
          </div>
          {cellContains && (
            <div>
              <input
                type="text"
                placeholder="Enter regex value"
                value={current.cell_contains_value || ""}
                onChange={(e) =>
                  setFieldValue(
                    `${basePath}.cell_contains_value`,
                    e.target.value,
                  )
                }
                className="border border-gray-400 p-2 w-full rounded"
              />
              {errors?.[basePath]?.cell_contains_value && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[basePath].cell_contains_value}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Length Validation */}
        <div className="flex items-center gap-6">
          <label className="text-sm font-semibold flex items-center gap-1">
            Data Length
          </label>
          <div className="flex gap-4">
            <label className="text-sm font-semibold mr-2">
              <input
                type="radio"
                value="variable"
                checked={validationType === "variable"}
                onChange={() =>
                  setFieldValue(
                    `${basePath}.length_validation_type`,
                    "variable",
                  )
                }
              />
              Variable
            </label>
            <label className="text-sm font-semibold mr-2">
              <input
                type="radio"
                value="fixed"
                checked={validationType === "fixed"}
                onChange={() =>
                  setFieldValue(`${basePath}.length_validation_type`, "fixed")
                }
              />
              Fixed
            </label>
          </div>
        </div>

        {/* MultiValueRules */}
        {/* {multiValueRulesInputs.map((rule) => (
          <MultiValueRules
            key={rule.inputType}
            headerName={header.name}
            multiValueRulesInputs={rule.inputs}
            handleMultiValueRulesInputChange={handleMultiValueRulesInputChange}
            addMultiValueRules={addMultiValueRules}
            cancelMultiValueRules={cancelMultiValueRules}
            setFieldValue={setFieldValue}
          />
        ))} */}

        {/* Dependency */}
        {/* <div className="mt-4">
          <label className="text-sm font-semibold flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasDependency}
              onChange={(e) =>
                setFieldValue(`${basePath}.has_dependency`, e.target.checked)
              }
            />
            Add Dependency
          </label>

          {hasDependency && (
            <>
              <div className="mt-2 flex items-center gap-4">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="yes"
                    checked={condition === "yes"}
                    onChange={() =>
                      setFieldValue(`${basePath}.dependency_condition`, "yes")
                    }
                  />
                  Yes
                </label>

                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    value="no"
                    checked={condition === "no"}
                    onChange={() =>
                      setFieldValue(`${basePath}.dependency_condition`, "no")
                    }
                  />
                  Other
                </label>

                {condition === "no" && (
                  <input
                    type="text"
                    placeholder="Enter value"
                    value={current.dependency_value || ""}
                    onChange={(e) =>
                      setFieldValue(
                        `${basePath}.dependency_value`,
                        e.target.value,
                      )
                    }
                    className="border border-gray-400 p-1 rounded"
                  />
                )}
              </div>

              <SubDependencyLatest
                headerName={header.name}
                values={values}
                errors={errors}
                setFieldValue={setFieldValue}
                headersList={headersList}
              />
            </>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default React.memo(ValidationRow);
