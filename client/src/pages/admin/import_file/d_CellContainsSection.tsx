import { useEffect, useState } from "react";
import { DEFAULTS } from "./defaultValues"; // adjust path
const {
  def_str_regex,
  def_boolean_regex,
  def_int_regex,
  def_float_regex,
  def_email_regex,
  def_date_regex,
} = DEFAULTS;
type Props = {
  headerName: string;
  register: any;
  watch: any;
  errors: any;
  getRegexByType: (type: string) => string;
  dataType: string;
};

const CellContainsSection = ({
  headerName,
  register,
  watch,
  errors,
  getRegexByType,
  dataType,
}: Props) => {
  const cellContains = watch(`${headerName}.cell_contains`);
  const regexValue = getRegexByType(dataType);
  const [defaultValue, setDefaultValue] = useState("");
  console.log("CellContainsSection" + cellContains);
  const regexMap = {
    string: def_str_regex,
    boolean: def_boolean_regex,
    integer: def_int_regex,
    float: def_float_regex,
    email: def_email_regex,
    date: def_date_regex,
  };

  useEffect(() => {
    const regex = regexMap[dataType] || "";
    if (setValue) {
      setValue(`${headerName}.cell_contains_value`, regex); // updates the input value
    }
  }, [dataType, headerName, setValue]);
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        {/* Checkbox + Label */}
        <label className="text-sm font-semibold mr-2">
          <input
            type="checkbox"
            {...register(`${headerName}.cell_contains`)}
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
            {...register(`${headerName}.cell_contains_value`, {
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
          {errors?.[headerName]?.cell_contains_value && (
            <p className="text-red-500 text-xs mt-1">
              {errors[headerName].cell_contains_value.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CellContainsSection;
