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
    <div>
      {/* DATA TYPE */}
      <div>
        <label className="text-sm">Data Type</label>

        <select
          className="border p-2 w-full rounded"
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
        <div className="mt-3">
          <label className="text-sm font-semibold">Date Format</label>

          <select
            {...register(`${headerName}.def_date_format`)}
            className="border p-2 rounded w-full"
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
