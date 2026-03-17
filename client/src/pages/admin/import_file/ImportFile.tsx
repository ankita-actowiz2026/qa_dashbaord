import React, { useState } from "react";
import { DEFAULTS } from "./defaultValues"; // adjust path
import DataTypeSection from "./DataTypeSection";
import MultiValueRules from "./MultiValueRules";
import DependencyBuilder from "./DependencyBuilder";
import LengthValidation from "./LengthValidation";
import CellContainsSection from "./CellContainsSection";
import DataRedundantSection from "./DataRedundantSection";
import * as XLSX from "xlsx";
import axios from "axios";
import { useForm } from "react-hook-form";
const {
  allowedExtensions,
  dataTypes,
  date_format_options,
  default_length_validation_value,
  def_str_regex,
  def_boolean_regex,
  def_int_regex,
  def_float_regex,
  def_email_regex,
  def_date_regex,
} = DEFAULTS;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
type HeaderType = {
  name: string;
};

const ImportFile: React.FC = () => {
  const {
    register,
    control,
    watch,
    setError,
    clearErrors,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onSubmit", // ✅ required
    reValidateMode: "onChange", // ✅ important
    defaultValues: {
      def_date_format: "YYYY-MM-DD HH:mm:ss",
      def_dep: "true",
    },
  });
  console.log("rerender");
  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fixedHeaderInputs, setFixedHeaderInputs] = useState<any>({});
  const [cellStartWithInputs, setCellStartWithInputs] = useState<any>({});
  const [cellEndWithInputs, setCellEndWithInputs] = useState<any>({});
  const [notMatchFoundInputs, setNotMatchFoundInputs] = useState<any>({});

  ///////////////////////start multi value select
  const handleMultiValueRulesInputChange = (
    headerName: string,
    value: string,
    inputType: string,
  ) => {
    if (inputType == "fixed_header") {
      setFixedHeaderInputs((prev: any) => ({
        ...prev,
        [headerName]: value,
      }));
    } else if (inputType == "cell_start_with") {
      setCellStartWithInputs((prev: any) => ({
        ...prev,
        [headerName]: value,
      }));
    } else if (inputType == "cell_end_with") {
      setCellEndWithInputs((prev: any) => ({
        ...prev,
        [headerName]: value,
      }));
    } else if (inputType == "not_match_found") {
      setNotMatchFoundInputs((prev: any) => ({
        ...prev,
        [headerName]: value,
      }));
    }
  };

  const addMultiValueRules = (
    headerName: string,
    fields: any[],
    append: any,
    inputType: string,
  ) => {
    if (inputType == "fixed_header") {
      const value = fixedHeaderInputs[headerName]?.trim();

      if (!value) {
        setError(`${headerName}.fixed_header_input`, {
          message: "Please add fixed header value",
        });
        return;
      }

      const exists = fields.some(
        (f) => f.value?.toLowerCase() === value.toLowerCase(),
      );

      if (exists) {
        setError(`${headerName}.fixed_header_input`, {
          message: "Fixed header value is already exists",
        });
        return;
      }

      clearErrors(`${headerName}.fixed_header_input`);

      append({ value });

      setFixedHeaderInputs((prev: any) => ({
        ...prev,
        [headerName]: "",
      }));
    } else if (inputType == "cell_start_with") {
      const value = cellStartWithInputs[headerName]?.trim();

      if (!value) {
        setError(`${headerName}.cell_start_with_input`, {
          message: "Please add cell start with value",
        });
        return;
      }

      const exists = fields.some(
        (f) => f.value?.toLowerCase() === value.toLowerCase(),
      );

      if (exists) {
        setError(`${headerName}.cell_start_with_input`, {
          message: "Cell start with value already exists",
        });
        return;
      }

      clearErrors(`${headerName}.cell_start_with_input`);

      append({ value });

      setCellStartWithInputs((prev: any) => ({
        ...prev,
        [headerName]: "",
      }));
    } else if (inputType == "cell_end_with") {
      const value = cellEndWithInputs[headerName]?.trim();

      if (!value) {
        setError(`${headerName}.cell_end_with_input`, {
          message: "Please add cell end with value",
        });
        return;
      }

      const exists = fields.some(
        (f) => f.value?.toLowerCase() === value.toLowerCase(),
      );

      if (exists) {
        setError(`${headerName}.cell_end_with_input`, {
          message: "Cell end with value already exists",
        });
        return;
      }

      clearErrors(`${headerName}.cell_end_with_input`);

      append({ value });

      setCellEndWithInputs((prev: any) => ({
        ...prev,
        [headerName]: "",
      }));
    } else if (inputType == "not_match_found") {
      const value = notMatchFoundInputs[headerName]?.trim();

      if (!value) {
        setError(`${headerName}.not_match_found_input`, {
          message: "Please add blocked value",
        });
        return;
      }

      const exists = fields.some(
        (f) => f.value?.toLowerCase() === value.toLowerCase(),
      );

      if (exists) {
        setError(`${headerName}.not_match_found_input`, {
          message: "Blocked  value already exists",
        });
        return;
      }

      clearErrors(`${headerName}.not_match_found_input`);

      append({ value });

      setNotMatchFoundInputs((prev: any) => ({
        ...prev,
        [headerName]: "",
      }));
    }
  };
  const cancelMultiValueRules = (headerName: string, inputType: string) => {
    if (inputType == "fixed_header") {
      setFixedHeaderInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
    } else if (inputType == "cell_start_with") {
      setCellStartWithInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
    } else if (inputType == "cell_end_with") {
      setCellEndWithInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
    } else if (inputType == "not_match_found") {
      setNotMatchFoundInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
    }
  };
  ///////////////////////end multi value select
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
  const buildDependencyPayload = (data) => {
    const result = {};

    Object.keys(data).forEach((header) => {
      const field = data[header];

      if (!field?.has_dependency) return;

      field.dependencies?.forEach((dep) => {
        // ✅ MAIN HEADER VALUE
        result[header] = dep.condition === "true" ? true : dep.value;

        // ✅ SUB DEPENDENCIES
        dep.subDependencies?.forEach((sub) => {
          if (!sub.headers || sub.headers.length === 0) return;

          const key = sub.headers.join(",");

          result[key] = sub.condition === "true" ? true : sub.value;
        });
      });
    });

    return result;
  };
  const onSubmit = async (data: any) => {
    // ✅ STEP 1: trigger validation FIRST
    const isValid = await trigger();

    if (!isValid) {
      console.log("Validation failed");
      return; // ⛔ STOP submit
    }

    // ✅ STEP 2: now safe to process data
    const payload: any = {};

    // ✅ build dependency ONLY ONCE (not inside loop)
    const dependency = buildDependencyPayload(data);

    for (const header of headers) {
      const row = data[header.name];

      // 🔒 your existing validations
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
        cell_end_with: row?.cell_end_with?.map((v: any) => v.value) || [],
        not_match_found: row?.not_match_found?.map((v: any) => v.value) || [],

        date_format:
          row?.data_type === "date"
            ? row?.def_date_format || "YYYY-MM-DD HH:mm:ss"
            : null,

        dependency, // ✅ correct place
      };
    }

    console.log("Payload:", payload);

    const formData = new FormData();

    if (file) {
      formData.append("file", file);
    }

    formData.append("columnConfig", JSON.stringify(payload));

    alert("Submitting");

    const response = await axios.post(`${BACKEND_URL}/api/qa_file`, formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(response.data);
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-gradient-to-br from-blue-50 to-indigo-100 border border-pink-500">
      <div className="w-full max-w-7xl bg-white shadow-xl rounded-2xl px-4 sm:px-8 py-6 border border-yellow-500">
        {/* Title */}

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Import File</h1>
          <p className="text-gray-500">
            Upload a file and map column data types
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Upload Box */}

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
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
                Headers validation
              </h2>

              {/* <div className="space-y-6"> */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {headers.map((header, index) => {
                  const formValues = watch();
                  const headerValues = formValues?.[header.name] || {};

                  const dataType = headerValues.data_type || "string";
                  const validationType =
                    headerValues.length_validation_type ||
                    default_length_validation_value;
                  const cellContains = headerValues.cell_contains;
                  const redundantValue = headerValues.data_redundant_value;
                  const selectedDataType = headerValues.data_type;
                  const regexValue = getRegexByType(dataType);
                  const multiValueRulesConfig = [
                    {
                      inputType: "fixed_header",
                      inputs: fixedHeaderInputs,
                    },
                    {
                      inputType: "cell_start_with",
                      inputs: cellStartWithInputs,
                    },
                    {
                      inputType: "cell_end_with",
                      inputs: cellEndWithInputs,
                    },
                    {
                      inputType: "not_match_found",
                      inputs: notMatchFoundInputs,
                    },
                  ];
                  return (
                    <div
                      key={header.name}
                      className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden"
                    >
                      {/* Header Name */}

                      <div className="bg-gray-300 px-4 py-2 border-b">
                        <h3 className="font-semibold text-gray-700">
                          {index + 1}. {header.name}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <DataTypeSection
                          headerName={header.name}
                          register={register}
                          watch={watch}
                          dataTypes={dataTypes}
                          date_format_options={date_format_options}
                        />

                        {/* Allow Empty */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold mr-2">
                              <input
                                className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
                                type="checkbox"
                                {...register(`${header.name}.has_empty`)}
                              />
                              Allow Empty
                            </label>
                          </div>
                        </div>
                        <CellContainsSection
                          headerName={header.name}
                          register={register}
                          watch={watch}
                          errors={errors}
                          getRegexByType={getRegexByType}
                          dataType={dataType}
                        />
                        <LengthValidation
                          header={header}
                          dataType={dataType}
                          validationType={validationType}
                          register={register}
                          errors={errors}
                        />

                        {/* DATA REDUNDANT SECTION */}

                        <DataRedundantSection
                          headerName={header.name}
                          register={register}
                          errors={errors}
                          watch={watch}
                        />

                        {multiValueRulesConfig.map((rule) => (
                          <MultiValueRules
                            key={rule.inputType}
                            headerName={header.name}
                            control={control}
                            register={register}
                            watch={watch}
                            errors={errors}
                            multiValueRulesInputs={rule.inputs}
                            handleMultiValueRulesInputChange={
                              handleMultiValueRulesInputChange
                            }
                            addMultiValueRules={addMultiValueRules}
                            cancelMultiValueRules={cancelMultiValueRules}
                            inputType={rule.inputType}
                          />
                        ))}

                        <DependencyBuilder
                          headerName={header.name}
                          headersList={headers.map((h) => h.name)}
                          control={control}
                          register={register}
                          watch={watch}
                          trigger={trigger}
                          errors={errors}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  className="mt-6 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 block mx-auto"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ImportFile;
