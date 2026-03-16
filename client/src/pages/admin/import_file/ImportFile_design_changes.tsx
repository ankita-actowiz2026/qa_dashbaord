import React, { useState } from "react";
import FixedHeaderManager from "./FixedHeaderManager";
import CellStartWithManager from "./CellStartWithManager";

import * as XLSX from "xlsx";
import axios from "axios";
import { useForm } from "react-hook-form";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
type HeaderType = {
  name: string;
};

const allowedExtensions = [".xlsx", ".xls", ".csv", ".json"];

const dataTypes = ["string", "int", "float", "boolean", "date", "email"];

const date_format_options = [
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM-DD-YYYY",
  "YYYY/MM/DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD HH:mm:ss",
  "DD-MM-YYYY HH:mm:ss",
  "MM/DD/YYYY HH:mm:ss",
  "YYYY-MM-DDTHH:mm:ss",
  "DD-MM-YYYY h:i:s a",
  "MM/DD/YYYY h:i a",
  "YYYY-MM-DD h:i:s A",
  "DD MMM YYYY",
  "MMM DD, YYYY",
  "MMMM DD, YYYY",
  "DD Month YYYY",
  "DD-MM-YY",
  "MM/DD/YY",
  "DD_MM_YYYY",
  "MM_DD_YYYY",
  "YYYY_MM_DD",
  "DD_MM_YYYY h:i:s a",
  "MM_DD_YYYY h:i:s a",
  "YYYY_MM_DD h:i:s a",
  "DD_MM_YYYY HH:mm:ss",
  "MM_DD_YYYY HH:mm:ss",
  "YYYY_MM_DD HH:mm:ss",
];
const default_length_validation_value = "variable";

const def_var_min_len_str = 1;
const def_var_max_len_str = 500;

const def_var_min_len_num = 1;
const def_var_max_len_num = 15;

const def_var_min_len_date = new Date(
  new Date().setFullYear(new Date().getFullYear() - 1),
)
  .toISOString()
  .slice(0, 16);

const def_var_max_len_date = new Date().toISOString().slice(0, 16);

const def_fixed_length_str = 100;
const def_fixed_length_num = 15;

const def_fixed_date = new Date().toISOString().slice(0, 16);
const def_cell_contains_value = 1;

const def_str_regex = ".*";
const def_boolean_regex = "^(true|false)$";
const def_int_regex = "^-?\\d+$";
const def_float_regex = "^-?\\d+(\\.\\d+)?$";
const def_email_regex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const def_date_regex = "^\\d{4}-\\d{2}-\\d{2}";

const ImportFile: React.FC = () => {
  const {
    register,
    control,
    watch,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      def_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  });
  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fixedHeaderInputs, setFixedHeaderInputs] = useState<any>({});
  const [cellStartWithInputs, setCellStartWithInputs] = useState<any>({});

  const handleFixedHeaderInputChange = (headerName: string, value: string) => {
    setFixedHeaderInputs((prev: any) => ({
      ...prev,
      [headerName]: value,
    }));
  };
  const handleCellStartWithInputChange = (
    headerName: string,
    value: string,
  ) => {
    setCellStartWithInputs((prev: any) => ({
      ...prev,
      [headerName]: value,
    }));
  };
  const addFixedHeader = (headerName: string, fields: any[], append: any) => {
    const value = fixedHeaderInputs[headerName]?.trim();

    if (!value) {
      setError(`${headerName}.fixed_header_input`, {
        message: "Value required",
      });
      return;
    }

    const exists = fields.some(
      (f) => f.value?.toLowerCase() === value.toLowerCase(),
    );

    if (exists) {
      setError(`${headerName}.fixed_header_input`, {
        message: "Header already exists",
      });
      return;
    }

    clearErrors(`${headerName}.fixed_header_input`);

    append({ value });

    setFixedHeaderInputs((prev: any) => ({
      ...prev,
      [headerName]: "",
    }));
  };
  const addCellStartWith = (headerName: string, fields: any[], append: any) => {
    const value = cellStartWithInputs[headerName]?.trim();

    if (!value) {
      setError(`${headerName}.cell_start_with_input`, {
        message: "Value required",
      });
      return;
    }

    const exists = fields.some(
      (f) => f.value?.toLowerCase() === value.toLowerCase(),
    );

    if (exists) {
      setError(`${headerName}.cell_start_with_input`, {
        message: "Header already exists",
      });
      return;
    }

    clearErrors(`${headerName}.cell_start_with_input`);

    append({ value });

    setCellStartWithInputs((prev: any) => ({
      ...prev,
      [headerName]: "",
    }));
  };
  const validateFile = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    return allowedExtensions.includes(ext);
  };

  const readHeaders = async (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (ext === ".json") {
      const text = await file.text();
      const json = JSON.parse(text);

      if (Array.isArray(json) && json.length > 0) {
        const keys = Object.keys(json[0]);
        setHeaders(keys.map((k) => ({ name: k, type: "string" })));
      }
      return;
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headerRow: any = json[0];

    const headerList = headerRow.map((h: string) => ({
      name: h,
      type: "string",
    }));

    setHeaders(headerList);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!validateFile(selectedFile)) {
      alert("Only .xlsx, .xls, .csv, .json files allowed");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);

    await readHeaders(selectedFile);
  };
  const getRegexByType = (type: string) => {
    switch (type) {
      case "string":
        return def_str_regex;
      case "boolean":
        return def_boolean_regex;
      case "int":
        return def_int_regex;
      case "float":
        return def_float_regex;
      case "email":
        return def_email_regex;
      case "date":
        return def_date_regex;
      default:
        return def_str_regex;
    }
  };
  const cancelFixedHeader = (headerName: string) => {
    setFixedHeaderInputs((prev) => ({
      ...prev,
      [headerName]: "",
    }));
  };
  const cancelCellStartWith = (headerName: string) => {
    setCellStartWithInputs((prev) => ({
      ...prev,
      [headerName]: "",
    }));
  };

  const onSubmit = async (data: any) => {
    const payload: any = {};

    headers.forEach((header) => {
      const row = data[header.name];

      if (row.length_validation_type === "variable") {
        if (!row.min_length || !row.max_length) {
          alert(`Min and Max values required for ${header.name}`);
          return;
        }
      }

      if (row.length_validation_type === "fixed") {
        if (!row.min_length) {
          alert(`Fixed value required for ${header.name}`);
          return;
        }
      }

      payload[header.name] = {
        data_type: row?.data_type || "string",
        has_empty: row?.has_empty || false,
        length_validation_type: row?.length_validation_type || "variable",
        min_length: row?.min_length || null,
        max_length: row?.max_length || null,
        cell_contains: row?.cell_contains,
        cell_contains_value: row?.cell_contains
          ? row?.cell_contains_value
          : null,
        data_redundant_threshold: row?.data_redundant_threshold,
        data_redundant_value: row?.data_redundant_threshold
          ? row?.data_redundant_value
          : null,

        fixed_header: row?.fixed_header?.map((v: any) => v.value) || [],
        cell_start_with: row?.cell_start_with?.map((v: any) => v.value) || [],
        date_format:
          row?.data_type === "date"
            ? row?.def_date_format || "YYYY-MM-DD HH:mm:ss"
            : null,
      };
    });

    console.log("Payload:", payload);

    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    formData.append("columnConfig", JSON.stringify(payload));

    const response = await axios.post(`${BACKEND_URL}/api/qa_file`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(response.data);
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-7xl bg-white shadow-xl rounded-2xl px-4 sm:px-8 py-6">
        {/* Title */}

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Import File</h1>
          <p className="text-gray-500">
            Upload a file and map column data types
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Upload Box */}

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-4 w-full max-w-md mx-auto  rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
            <span className="text-gray-600 font-medium">
              Click to upload file
            </span>

            <span className="text-sm text-gray-400 mt-1">
              .xlsx, .xls, .csv, .json supported
            </span>

            <input
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
              onChange={onFileChange}
            />
          </label>

          {fileName && (
            <p className="text-center text-sm text-green-600 mt-3">
              Uploaded: {fileName}
            </p>
          )}

          {/* Header Mapping */}

          {headers.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Column Settings
              </h2>

              <div className="space-y-6">
                {headers.map((header, index) => {
                  const dataType =
                    watch(`${header.name}.data_type`) || "string";

                  const validationType =
                    watch(`${header.name}.length_validation_type`) ||
                    default_length_validation_value;

                  const cellContains = watch(`${header.name}.cell_contains`);

                  const regexValue = getRegexByType(dataType);
                  const redundantValue = watch(
                    `${header.name}.data_redundant_value`,
                  );
                  const selectedDataType = watch(`${header.name}.data_type`);
                  return (
                    <div
                      key={header.name}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden w-full"
                    >
                      {/* Header Name */}

                      <div className="bg-gray-100 px-4 py-2 border-b">
                        <h3 className="font-semibold text-gray-700">
                          {index + 1}. {header.name}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {/* Data Type */}

                        <div>
                          <label className="text-sm">Data Type</label>

                          <select
                            className="border p-2 w-full rounded"
                            defaultValue="string"
                            {...register(`${header.name}.data_type`)}
                          >
                            <option value="string">string</option>
                            <option value="int">int</option>
                            <option value="float">float</option>
                            <option value="boolean">boolean</option>
                            <option value="date">date</option>
                            <option value="email">email</option>
                          </select>
                        </div>
                        {selectedDataType === "date" && (
                          <div className="mt-3">
                            <label className="text-sm font-semibold">
                              Date Format
                            </label>

                            <select
                              {...register(`${header.name}.def_date_format`)}
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
                        {/* Allow Empty */}

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            {...register(`${header.name}.has_empty`)}
                          />
                          Allow Empty
                        </label>

                        {/* Validation Type */}

                        <div className="flex items-center gap-6 flex-nowrap whitespace-nowrap">
                          <label className="text-sm font-medium">
                            Length Validation
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="variable"
                              defaultChecked
                              {...register(
                                `${header.name}.length_validation_type`,
                              )}
                            />
                            Variable
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="fixed"
                              {...register(
                                `${header.name}.length_validation_type`,
                              )}
                            />
                            Fixed
                          </label>
                        </div>

                        {/* VARIABLE VALIDATION */}

                        {validationType === "variable" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* STRING / BOOLEAN / EMAIL */}

                            {["string", "boolean", "email"].includes(
                              dataType,
                            ) && (
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

                            {["int", "float"].includes(dataType) && (
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
                                    type="datetime-local"
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
                                    type="datetime-local"
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
                              type={
                                dataType === "date"
                                  ? "datetime-local"
                                  : "number"
                              }
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
                        <div className="grid grid-cols-2 gap-4 items-start">
                          {/* Checkbox */}

                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="accent-blue-600"
                              {...register(`${header.name}.cell_contains`)}
                            />
                            Cell Contains
                          </label>

                          {/* Value textbox */}

                          {cellContains && (
                            <div>
                              <input
                                type="text"
                                defaultValue={regexValue}
                                placeholder="Enter regex value"
                                className="border p-2 w-full rounded"
                                {...register(
                                  `${header.name}.cell_contains_value`,
                                  {
                                    required: "Value is required",

                                    validate: (value) => {
                                      if (!value) return "Value is required";

                                      try {
                                        new RegExp(value);
                                      } catch {
                                        return "Invalid regex pattern";
                                      }

                                      return true;
                                    },
                                  },
                                )}
                              />

                              {/* Error Message */}

                              {errors?.[header.name]?.cell_contains_value && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors[header.name].cell_contains_value
                                      .message
                                  }
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* DATA REDUNDANT SECTION */}

                        <div className="grid grid-cols-2 gap-4">
                          {/* redundant value */}

                          <div>
                            <label className="text-sm">
                              Data Redundant Value
                            </label>

                            <input
                              type="text"
                              placeholder="Enter redundant value"
                              className="border p-2 w-full rounded"
                              {...register(
                                `${header.name}.data_redundant_value`,
                              )}
                            />
                          </div>

                          {/* redundant threshold */}

                          <div>
                            <label className="text-sm">
                              Data Redundant Threshold
                            </label>

                            <input
                              type="number"
                              placeholder="Enter threshold"
                              className="border p-2 w-full rounded"
                              {...register(
                                `${header.name}.data_redundant_threshold`,
                                {
                                  validate: (value) => {
                                    if (redundantValue && !value) {
                                      return "Threshold required when redundant value exists";
                                    }

                                    if (
                                      value &&
                                      !Number.isInteger(Number(value))
                                    ) {
                                      return "Threshold must be integer";
                                    }

                                    return true;
                                  },
                                },
                              )}
                            />

                            {(errors as any)?.[header.name]
                              ?.data_redundant_threshold && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  (errors as any)[header.name]
                                    .data_redundant_threshold.message
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <FixedHeaderManager
                          headerName={header.name}
                          control={control}
                          register={register}
                          watch={watch}
                          errors={errors}
                          fixedHeaderInputs={fixedHeaderInputs}
                          handleFixedHeaderInputChange={
                            handleFixedHeaderInputChange
                          }
                          addFixedHeader={addFixedHeader}
                          cancelFixedHeader={cancelFixedHeader}
                        />
                        <CellStartWithManager
                          headerName={header.name}
                          control={control}
                          register={register}
                          watch={watch}
                          errors={errors}
                          cellStartWithInputs={cellStartWithInputs}
                          handleCellStartWithInputChange={
                            handleCellStartWithInputChange
                          }
                          addCellStartWith={addCellStartWith}
                          cancelCellStartWith={cancelCellStartWith}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
              >
                Submit Mapping
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ImportFile;
