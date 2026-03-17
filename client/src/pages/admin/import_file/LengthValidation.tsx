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
  header: [];
  dataType: string;
  validationType: string;
  register: any;
  errors: any;
};

const LengthValidation = ({
  header,
  dataType,
  validationType,
  register,
  errors,
}: Props) => {
  const stringTypes = ["string", "boolean", "email"];
  const numberTypes = ["int", "float"];

  return (
    <>
      {" "}
      {/* Validation Type */}
      <div>
        <label className="text-sm font-medium">Length Validation</label>

        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="variable"
              defaultChecked
              {...register(`${header.name}.length_validation_type`)}
            />
            Variable
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="fixed"
              {...register(`${header.name}.length_validation_type`)}
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
                <label className="text-sm">Min Length</label>

                <input
                  type="number"
                  defaultValue={def_var_min_len_str}
                  className="border p-2 w-full rounded"
                  {...register(`${header.name}.min_length`, {
                    required: "Min length is required",
                  })}
                />

                {errors?.[header.name]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].min_length.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm">Max Length</label>

                <input
                  type="number"
                  defaultValue={def_var_max_len_str}
                  className="border p-2 w-full rounded"
                  {...register(`${header.name}.max_length`, {
                    required: "Max length is required",
                  })}
                />

                {errors?.[header.name]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].max_length.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* NUMBER */}

          {numberTypes.includes(dataType) && (
            <>
              <div>
                <label className="text-sm">Min Value</label>

                <input
                  type="number"
                  defaultValue={def_var_min_len_num}
                  className="border p-2 w-full rounded"
                  {...register(`${header.name}.min_length`, {
                    required: "Min value required",
                  })}
                />

                {errors?.[header.name]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].min_length.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm">Max Value</label>

                <input
                  type="number"
                  defaultValue={def_var_max_len_num}
                  className="border p-2 w-full rounded"
                  {...register(`${header.name}.max_length`, {
                    required: "Max value required",
                  })}
                />

                {errors?.[header.name]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].max_length.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* DATE */}

          {dataType === "date" && (
            <>
              <div>
                <label className="text-sm">Min Date</label>

                <input
                  type="date"
                  defaultValue={def_var_min_len_date}
                  className="border p-2 w-full rounded"
                  {...register(`${header.name}.min_length`, {
                    required: "Min date required",
                  })}
                />

                {errors?.[header.name]?.min_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].min_length.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm">Max Date</label>

                <input
                  type="date"
                  defaultValue={def_var_max_len_date}
                  className="border p-2 w-full rounded"
                  {...register(`${header.name}.max_length`, {
                    required: "Max date required",
                  })}
                />

                {errors?.[header.name]?.max_length && (
                  <p className="text-red-500 text-xs">
                    {errors[header.name].max_length.message}
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
          <label className="text-sm">Fixed Value</label>

          <input
            type={dataType === "date" ? "date" : "number"}
            defaultValue={
              dataType === "date"
                ? def_fixed_date
                : dataType === "string"
                  ? def_fixed_length_str
                  : def_fixed_length_num
            }
            className="border p-2 w-full rounded"
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
    </>
  );
};

export default LengthValidation;
