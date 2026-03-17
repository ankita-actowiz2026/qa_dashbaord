type Props = {
  headerName: string;
  redundantValue: string;
  register: any;
  errors: any;
};

const RedundantValidation = ({
  headerName,
  redundantValue,
  register,
  errors,
}: Props) => {
  console.log("RedundantValidation");
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* redundant value */}

        <div>
          <label className="text-sm font-semibold mr-2">
            Data Redundant Value
          </label>

          <input
            type="text"
            placeholder="Enter redundant value"
            className="border border-gray-400 p-2 w-full rounded"
            {...register(`${header.name}.data_redundant_value`)}
          />
        </div>

        {/* redundant threshold */}

        <div>
          <label className="text-sm font-semibold mr-2">
            Data Redundant Threshold
          </label>

          <input
            type="number"
            placeholder="Enter threshold"
            className="border p-2 w-full rounded"
            {...register(`${header.name}.data_redundant_threshold`, {
              validate: (value) => {
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

          {(errors as any)?.[header.name]?.data_redundant_threshold && (
            <p className="text-red-500 text-xs mt-1">
              {(errors as any)[header.name].data_redundant_threshold.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedundantValidation;
