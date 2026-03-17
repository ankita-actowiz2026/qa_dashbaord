import React from "react";

const DataTypeSection = ({
  headerName,
  register,
  watch,
  dataTypes,
  date_format_options,
}) => {
  // ✅ watch only required field (optimized)
  const selectedDataType = watch(`${headerName}.data_type`);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* DATA TYPE */}
      <div>
        <label className="text-sm font-semibold mr-2">Data Type</label>

        <select
          className="border border-gray-400 p-2 w-full rounded"
          defaultValue="string"
          {...register(`${headerName}.data_type`)}
        >
          {dataTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* DATE FORMAT */}
      {selectedDataType === "date" && (
        <div>
          <label className="text-sm font-semibold mr-2">Date Format</label>

          <select
            {...register(`${headerName}.def_date_format`)}
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
  );
};

export default DataTypeSection;
