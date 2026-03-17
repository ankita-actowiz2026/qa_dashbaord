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

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        {/* Checkbox + Label */}
        <label className="text-sm font-semibold mr-2">
          <input type="checkbox" {...register(`${headerName}.cell_contains`)} />
          Cell Contains (Regex)
        </label>
      </div>

      {/* Input */}
      {cellContains && (
        <div>
          <input
            type="text"
            defaultValue={regexValue}
            placeholder="Enter regex value"
            className="border border-gray-400 p-2 w-full rounded"
            {...register(`${headerName}.cell_contains_value`, {
              required: "Value is required",
              validate: (value: string) => {
                if (!value) return "Value is required";

                try {
                  new RegExp(value);
                } catch {
                  return "Invalid regex pattern";
                }

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
