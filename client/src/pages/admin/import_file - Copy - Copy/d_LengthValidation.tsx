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
} = DEFAULTS;
type Props = {
  headerName: string;
  dataType: string;
  validationType: string;
  register: any;
  errors: any;
};

const LengthValidation = ({
  headerName,
  dataType,
  validationType,
  register,
  errors,
}: Props) => {
  const stringTypes = ["string", "boolean", "email"];
  const numberTypes = ["int", "float"];
  console.log("LengthValidation");
  return (
    <>
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
              {...register(`${headerName}.length_validation_type`)}
            />
            Variable
          </label>

          <label className="text-sm font-semibold mr-2">
            <input
              type="radio"
              value="fixed"
              {...register(`${headerName}.length_validation_type`)}
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
                <label className="text-sm font-semibold mr-2">Min Length</label>

                <input
                  type="number"
                  defaultValue={def_var_min_len_str}
                  className="border border-gray-400 p-2 w-full rounded"
                  {...register(`${headerName}.min_length`, {
                    required: "Min length is required",
                  })}
                />

                {errors?.[headerName]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[headerName].min_length.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold mr-2">Max Length</label>

                <input
                  type="number"
                  defaultValue={def_var_max_len_str}
                  className="border border-gray-400 p-2 w-full rounded"
                  {...register(`${headerName}.max_length`, {
                    required: "Max length is required",
                  })}
                />

                {errors?.[headerName]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[headerName].max_length.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* NUMBER */}

          {numberTypes.includes(dataType) && (
            <>
              <div>
                <label className="text-sm font-semibold mr-2">Min Value</label>

                <input
                  type="number"
                  defaultValue={def_var_min_len_num}
                  className="border  border-gray-400 p-2 w-full rounded"
                  {...register(`${headerName}.min_length`, {
                    required: "Min value required",
                  })}
                />

                {errors?.[headerName]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[headerName].min_length.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold mr-2">Max Value</label>

                <input
                  type="number"
                  defaultValue={def_var_max_len_num}
                  className="border  border-gray-400 p-2 w-full rounded"
                  {...register(`${headerName}.max_length`, {
                    required: "Max value required",
                  })}
                />

                {errors?.[headerName]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[headerName].max_length.message}
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

                <input
                  type="date"
                  defaultValue={def_var_min_len_date}
                  className="border border-gray-400 p-2 w-full rounded"
                  {...register(`${headerName}.min_length`, {
                    required: "Min date required",
                  })}
                />

                {errors?.[headerName]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[headerName].min_length.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold mr-2">Max Date</label>

                <input
                  type="date"
                  defaultValue={def_var_max_len_date}
                  className="border border-gray-400 p-2 w-full rounded"
                  {...register(`${headerName}.max_length`, {
                    required: "Max date required",
                  })}
                />

                {errors?.[headerName]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[headerName].max_length.message}
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
            defaultValue={
              dataType === "date"
                ? def_fixed_date
                : dataType === "string"
                  ? def_fixed_length_str
                  : def_fixed_length_num
            }
            className="border border-gray-400 p-2 w-full rounded"
            {...register(`${headerName}.min_length`, {
              required: "Value is required",
            })}
          />

          {errors?.[headerName]?.min_length && (
            <p className="text-red-500 text-xs">
              {errors[headerName].min_length.message}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default LengthValidation;
