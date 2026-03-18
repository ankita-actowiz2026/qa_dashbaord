type Props = {
  headerName: string;
  register: any;
  errors: any;
  watch: any;
};

const DataRedundantSection = ({
  headerName,
  register,
  errors,
  watch,
}: Props) => {
  const redundantValue = watch(`${headerName}.data_redundant_value`);
  console.log("DataRedundantSection");
  return (
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
          {...register(`${headerName}.data_redundant_value`)}
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
          {...register(`${headerName}.data_redundant_threshold`, {
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
        {errors?.[headerName]?.data_redundant_threshold && (
          <p className="text-red-500 text-xs mt-1">
            {errors[headerName].data_redundant_threshold.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default DataRedundantSection;
