import React, { useState, useEffect } from "react";
import { DEFAULTS } from "./defaultValues"; // adjust path
import ValidationRow from "./ValidationRow";
import ValidationResult from "./ValidationResult";
import * as XLSX from "xlsx";

import axios from "axios";
import { useForm } from "react-hook-form";
const buildDependencyPayload = (data: any) => {
  const result: Record<string, any> = {};

  Object.keys(data).forEach((header) => {
    const field = data[header];

    const parentCondition = field?.dependency_condition;
    const parentValue = field?.dependency_value;
    const subDeps = field?.sub_dependencies || [];

    // ❌ skip if no dependency
    if (!parentCondition) return;

    // ✅ MAIN HEADER VALUE
    if (parentCondition === "yes") {
      result[header] = true;
    } else if (parentCondition === "no" && parentValue) {
      result[header] = parentValue.trim();
    }

    // ✅ SUB DEPENDENCIES
    subDeps.forEach((sub: any) => {
      if (!sub.headers || sub.headers.length === 0) return;

      const key = sub.headers.join(",");

      if (sub.condition === "true") {
        result[key] = true;
      } else if (sub.condition === "other" && sub.value) {
        result[key] = sub.value.trim();
      }
    });
  });

  return result;
};
const buildDependencyPayload123 = (data) => {
  const result = {};
  Object.keys(data).forEach((header) => {
    const row = data[header];

    if (!row?.has_dependency) return;

    if (row.dependency_condition === "yes") {
      result[header] = true;
    } else {
      result[header] = Number(row.dependency_value);
    }
  });
  return result;
};

const buildDependencyPayload1 = (data) => {
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
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    mode: "onSubmit", // ✅ important

    reValidateMode: "onChange", // ✅ important
    defaultValues: {
      def_date_format: "YYYY-MM-DD HH:mm:ss",
      def_dep: "true",
    },
  });

  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fixedHeaderInputs, setFixedHeaderInputs] = useState<any>({});
  const [cellStartWithInputs, setCellStartWithInputs] = useState<any>({});
  const [cellEndWithInputs, setCellEndWithInputs] = useState<any>({});
  const [notMatchFoundInputs, setNotMatchFoundInputs] = useState<any>({});
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const [responseData, setResponseData] = useState(null); // <-- store response here
  const [requestData, setRequestData] = useState(null); // <-- store response here
  const [loading, setLoading] = useState(false);
  const getRegexByType = React.useCallback(
    (type: string) => {
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
    },
    [
      def_str_regex,
      def_boolean_regex,
      def_int_regex,
      def_float_regex,
      def_email_regex,
      def_date_regex,
    ],
  );

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => {
        setMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);
  const formatLabel = (str: string) =>
    str
      .replace(/_/g, " ") // replace all underscores
      .toLowerCase() // make everything lowercase
      .replace(/^./, (c) => c.toUpperCase()); // capitalize first letter
  const multiValueInputs = {
    fixed_header: [
      fixedHeaderInputs,
      setFixedHeaderInputs,
      "fixed_header_input",
    ],
    cell_start_with: [
      cellStartWithInputs,
      setCellStartWithInputs,
      "cell_start_with_input",
    ],
    cell_end_with: [
      cellEndWithInputs,
      setCellEndWithInputs,
      "cell_end_with_input",
    ],
    not_match_found: [
      notMatchFoundInputs,
      setNotMatchFoundInputs,
      "not_match_found_input",
    ],
  };

  // handle change
  const handleMultiValueRulesInputChange = (
    headerName: string,
    value: string,
    inputType: string,
  ) => {
    const [state, setState] = multiValueInputs[inputType];
    setState({ ...state, [headerName]: value });
  };
  const [multiValueErrors, setMultiValueErrors] = useState<{
    [key: string]: { [headerName: string]: string };
  }>({});
  // cancel
  // const cancelMultiValueRules = (headerName: string, inputType: string) => {
  //   // Clear the input
  //   const [, setState] = multiValueInputs[inputType];
  //   setState((prev) => ({ ...prev, [headerName]: "" }));

  //   // Clear the error for this header
  //   setMultiValueErrors((prev) => ({
  //     ...prev,
  //     [inputType]: { ...prev[inputType], [headerName]: "" },
  //   }));
  // };

  // add
  const addMultiValueRules = (
    headerName: string,
    fields: any[],
    append: any,
    inputType: string,
    errorMsgLabel: string,
  ) => {
    const [state, setState, errorField] = multiValueInputs[inputType];
    const value = state[headerName]?.trim();
    console.log("add multiple call");
    if (!value) {
      setError(`${headerName}.${errorField}`, {
        message: `${errorMsgLabel} is required`,
      });
      return;
    }

    const exists = fields.some(
      (f) => f.value?.toLowerCase() === value.toLowerCase(),
    );
    if (exists) {
      setError(`${headerName}.${errorField}`, {
        message: `${errorMsgLabel}  already exists`,
      });
      return;
    }

    clearErrors(`${headerName}.${errorField}`);
    append({ value });
    setState((prev) => ({ ...prev, [headerName]: "" }));
  };

  ///////////////////////start multi value select
  // const handleMultiValueRulesInputChange = (
  //   headerName: string,
  //   value: string,
  //   inputType: string,
  // ) => {
  //   if (inputType == "fixed_header") {
  //     setFixedHeaderInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: value,
  //     }));
  //   } else if (inputType == "cell_start_with") {
  //     setCellStartWithInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: value,
  //     }));
  //   } else if (inputType == "cell_end_with") {
  //     setCellEndWithInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: value,
  //     }));
  //   } else if (inputType == "not_match_found") {
  //     setNotMatchFoundInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: value,
  //     }));
  //   }
  // };

  // const addMultiValueRules = (
  //   headerName: string,
  //   fields: any[],
  //   append: any,
  //   inputType: string,
  // ) => {
  //   if (inputType == "fixed_header") {
  //     const value = fixedHeaderInputs[headerName]?.trim();

  //     if (!value) {
  //       setError(`${headerName}.fixed_header_input`, {
  //         message: "Fixed header is required",
  //       });
  //       return;
  //     }

  //     const exists = fields.some(
  //       (f) => f.value?.toLowerCase() === value.toLowerCase(),
  //     );

  //     if (exists) {
  //       setError(`${headerName}.fixed_header_input`, {
  //         message: "Fixed header is already exists",
  //       });
  //       return;
  //     }

  //     clearErrors(`${headerName}.fixed_header_input`);

  //     append({ value });

  //     setFixedHeaderInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: "",
  //     }));
  //   } else if (inputType == "cell_start_with") {
  //     const value = cellStartWithInputs[headerName]?.trim();

  //     if (!value) {
  //       setError(`${headerName}.cell_start_with_input`, {
  //         message: "Cell start with is required",
  //       });
  //       return;
  //     }

  //     const exists = fields.some(
  //       (f) => f.value?.toLowerCase() === value.toLowerCase(),
  //     );

  //     if (exists) {
  //       setError(`${headerName}.cell_start_with_input`, {
  //         message: "Cell start with is already exists",
  //       });
  //       return;
  //     }

  //     clearErrors(`${headerName}.cell_start_with_input`);

  //     append({ value });

  //     setCellStartWithInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: "",
  //     }));
  //   } else if (inputType == "cell_end_with") {
  //     const value = cellEndWithInputs[headerName]?.trim();

  //     if (!value) {
  //       setError(`${headerName}.cell_end_with_input`, {
  //         message: "Cell end with is required",
  //       });
  //       return;
  //     }

  //     const exists = fields.some(
  //       (f) => f.value?.toLowerCase() === value.toLowerCase(),
  //     );

  //     if (exists) {
  //       setError(`${headerName}.cell_end_with_input`, {
  //         message: "Cell end with already exists",
  //       });
  //       return;
  //     }

  //     clearErrors(`${headerName}.cell_end_with_input`);

  //     append({ value });

  //     setCellEndWithInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: "",
  //     }));
  //   } else if (inputType == "not_match_found") {
  //     const value = notMatchFoundInputs[headerName]?.trim();

  //     if (!value) {
  //       setError(`${headerName}.not_match_found_input`, {
  //         message: "Blocked is required",
  //       });
  //       return;
  //     }

  //     const exists = fields.some(
  //       (f) => f.value?.toLowerCase() === value.toLowerCase(),
  //     );

  //     if (exists) {
  //       setError(`${headerName}.not_match_found_input`, {
  //         message: "Blocked already exists",
  //       });
  //       return;
  //     }

  //     clearErrors(`${headerName}.not_match_found_input`);

  //     append({ value });

  //     setNotMatchFoundInputs((prev: any) => ({
  //       ...prev,
  //       [headerName]: "",
  //     }));
  //   }
  // };
  const cancelMultiValueRules = (headerName: string, inputType: string) => {
    if (inputType == "fixed_header") {
      setFixedHeaderInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
      clearErrors(`${headerName}.fixed_header_input`);
    } else if (inputType == "cell_start_with") {
      setCellStartWithInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
      clearErrors(`${headerName}.cell_start_with_input`);
    } else if (inputType == "cell_end_with") {
      setCellEndWithInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
      clearErrors(`${headerName}.cell_end_with_input`);
    } else if (inputType == "not_match_found") {
      setNotMatchFoundInputs((prev) => ({
        ...prev,
        [headerName]: "",
      }));
      clearErrors(`${headerName}.not_match_found_input`);
    }
  };
  ///////////////////////end multi value select
  const validateFile = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    return allowedExtensions.includes(ext);
  };

  const readHeaders = async (file: File) => {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "json") {
        const json = JSON.parse(await file.text());
        if (Array.isArray(json) && json.length > 0) {
          setHeaders(Object.keys(json[0]).map((name) => ({ name })));
        } else {
          setHeaders([]);
        }
        return;
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      setHeaders((json[0] || []).map((h: string) => ({ name: h })));
    } catch (err) {
      setHeaders([]);
      setMsg("Invalid file format");
      setMsgType("danger");
    }
  };

  // const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedFile = e.target.files?.[0];

  //   if (!selectedFile) return;

  //   if (!validateFile(selectedFile)) {
  //     alert("Only .xlsx, .xls, .csv, .json files allowed");
  //     return;
  //   }

  //   setFile(selectedFile);
  //   setFileName(selectedFile.name);

  //   await readHeaders(selectedFile);
  // };
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setHeaders([]);
    setMsg("");
    setMsgType("");
    if (!validateFile(selectedFile)) {
      setMsg("Invalid file type");
      setMsgType("danger");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);

    try {
      await readHeaders(selectedFile);
    } catch {
      setHeaders([]); // extra safety

      setMsg("Failed to read file");
      setMsgType("danger");
    }
  };

  const onSubmit = async (data: any) => {
    try {
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

      const formData = new FormData();

      if (file) {
        formData.append("file", file);
      }

      formData.append("columnConfig", JSON.stringify(payload));

      /////
      let result = "";
      for (let [key, value] of formData.entries()) {
        result += `${key}: ${value}\n`;
      }
      setRequestData(result);
      ///
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/qa_file`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setResponseData(response.data);

      console.log(response.data);
    } catch (error: any) {
      console.log(error);
      setMsg(error.response?.data?.message || "Login failed");
      setMsgType("danger");
    } finally {
      setLoading(false);
    }
  };
  const headersList = React.useMemo(
    () => headers.map((h) => h.name),
    [headers],
  );
  const multiValueProps = {
    fixedHeaderInputs,
    cellStartWithInputs,
    cellEndWithInputs,
    notMatchFoundInputs,
    handleMultiValueRulesInputChange,
    addMultiValueRules,
    cancelMultiValueRules,
  };

  const formHelpers = {
    register,
    watch,
    errors,
    control,
    trigger,
    setValue,
    getValues,
  };
  return (
    <div className="w-full min-h-full flex justify-center">
      <div className="w-full bg-white shadow-xl rounded-2xl px-4 sm:px-8 py-6 ">
        {msg && (
          <div
            className={`text-center mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
              msgType === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {msg}
          </div>
        )}
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
          {headers.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Please add validation rules for following headers
              </h2>

              {/* <div className="space-y-6"> */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {headers.map((header, index) => (
                  <ValidationRow
                    key={header.name}
                    header={header}
                    index={index}
                    {...multiValueProps}
                    {...formHelpers}
                    dataTypes={dataTypes}
                    date_format_options={date_format_options}
                    getRegexByType={getRegexByType}
                    default_length_validation_value={
                      default_length_validation_value
                    }
                    headersList={headersList}
                  />
                ))}
              </div>

              <div className="flex justify-center mt-6">
                <button
                  disabled={loading}
                  type="submit"
                  className="mt-6 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 block mx-auto"
                >
                  {loading ? "Processing..." : "Save"}
                </button>
              </div>
            </>
          )}
        </form>
        {requestData}
        {responseData && <ValidationResult response={responseData} />}
      </div>
    </div>
  );
};

export default ImportFile;
