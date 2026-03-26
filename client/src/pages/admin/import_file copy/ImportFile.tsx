import React, { useState, useEffect, useRef } from "react";
import { DEFAULTS } from "./defaultValues"; // adjust path
import ValidationRow from "./ValidationRow";
import ValidationResult from "./ValidationResult";
import { FaFileCircleCheck } from "react-icons/fa6";
import { FiUpload } from "react-icons/fi";

import { InfoTooltip } from "../../../utils/ToolTips";
import axios from "axios";
import { useForm } from "react-hook-form";
const buildDependencyPayload = (data: any) => {
  const result: Record<string, any> = {};

  Object.keys(data).forEach((header) => {
    const field = data[header];
    const hasDependency = field?.has_dependency;
    if (!hasDependency) return; // ✅ KEY FIX
    const parentCondition = field?.dependency_condition;
    const parentValue = field?.dependency_value;
    const subDeps = field?.sub_dependencies || [];

    if (!parentCondition) return;

    if (parentCondition === "yes") {
      result[header] = true;
    } else if (parentCondition === "no" && parentValue) {
      result[header] = parentValue.trim();
    }

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

const {
  allowedExtensions,
  dataTypes,
  date_format_options,
  default_length_validation_value,
  def_str_regex,
  def_alphabetic_regex,
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
const gridClass = `
grid grid-cols-1 gap-3   /* 📱 Mobile: stacked */

md:grid-cols-[1fr_1fr_80px_1fr]   /* 📲 Tablet: simplified */
lg:grid-cols-[2fr_1.2fr_100px_1fr_4fr_80px] /* 💻 Desktop */

items-start md:items-center
px-4 md:px-5 py-2
w-full
`;
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
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit", // ✅ important

    reValidateMode: "onChange", // ✅ important
    defaultValues: {
      def_date_format: "YYYY-MM-DD HH:mm:ss",
      def_dep: "true",
    },
  });
  const msgRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fixedHeaderInputs, setFixedHeaderInputs] = useState<any>({});
  const [cellStartWithInputs, setCellStartWithInputs] = useState<any>({});
  const [cellEndWithInputs, setCellEndWithInputs] = useState<any>({});
  const [notMatchFoundInputs, setNotMatchFoundInputs] = useState<any>({});
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const [responseData, setResponseData] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const getRegexByType = React.useCallback(
    (type: string) => {
      switch (type) {
        case "string":
          return def_str_regex;
        case "alphabetic":
          return def_alphabetic_regex;
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
      def_alphabetic_regex,
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

  // const readHeaders = async (file: File) => {
  //   try {
  //     const ext = file.name.split(".").pop()?.toLowerCase();

  //     if (ext === "json") {
  //       const json = JSON.parse(await file.text());
  //       if (Array.isArray(json) && json.length > 0) {
  //         setHeaders(Object.keys(json[0]).map((name) => ({ name })));
  //       } else {
  //         setHeaders([]);
  //       }
  //       return;
  //     }

  //     const buffer = await file.arrayBuffer();
  //     const workbook = XLSX.read(buffer, { type: "array" });

  //     const sheet = workbook.Sheets[workbook.SheetNames[0]];
  //     const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  //     setHeaders((json[0] || []).map((h: string) => ({ name: h })));
  //   } catch (err) {
  //     setHeaders([]);
  //     setMsg("Invalid file format");
  //     setMsgType("danger");
  //   }
  // };
  const readHeaderFromServer = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/qa_file/read_header`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Example: if API returns headers array
      const newHeaders = response.data.data.map((h) => ({ name: h }));

      reset();
      setHeaders(newHeaders);

      setResponseData(null);
      setRequestData(null);
    } catch (error: any) {
      reset();
      setHeaders([]);
      if (error?.response?.data?.message || error?.message) {
        setMsg(error?.response?.data?.message || error?.message);
      } else if (error.message?.includes("ERR_UPLOAD_FILE_CHANGED")) {
        setMsg("File was changed. Please re-select and upload again.");
      } else if (error.request) {
        setMsg("Something get wrong. Please upload file again");
      }
    } finally {
      setLoading(false);
    }
  };
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setHeaders([]);
    setMsg("");
    setMsgType("");

    if (!validateFile(selectedFile)) {
      setMsg("Invalid file type");
      setMsgType("danger");
      setResponseData(null);
      setRequestData(null);
      setFile(null);
      setFileName("");
      // ✅ Clear so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);

    try {
      await readHeaderFromServer(selectedFile);
    } catch {
      setHeaders([]);
      setMsg("Failed to read file");
      setMsgType("danger");
    }

    // ✅ VERY IMPORTANT: clear after success too
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  // const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   console.log("change");
  //   const selectedFile = e.target.files?.[0];
  //   if (!selectedFile) return;
  //   setHeaders([]);
  //   setMsg("");
  //   setMsgType("");
  //   if (!validateFile(selectedFile)) {
  //     setMsg("Invalid file type");
  //     setMsgType("danger");
  //     return;
  //   }

  //   setFile(selectedFile);
  //   setFileName(selectedFile.name);

  //   try {
  //     await readHeaderFromServer(selectedFile);
  //   } catch {
  //     setHeaders([]); // extra safety

  //     setMsg("Failed to read file");
  //     setMsgType("danger");
  //   }
  // };
  const onError = (errors: any) => {
    setResponseData(null);
    setRequestData(null);
  };
  const onSubmit = async (data: any) => {
    try {
      // ✅ STEP 1: trigger validation FIRST
      const isValid = await trigger();

      if (!isValid) {
        return;
      }

      // ✅ STEP 2: now safe to process data
      const payload: any = {};

      // ✅ build dependency ONLY ONCE (not inside loop)
      const dependency = buildDependencyPayload(data);
      const firstDependencyKey = Object.keys(dependency)[0];

      for (const header of headers) {
        const row = data[header.name];

        // 🔒 your existing validations
        // if (row.length_validation_type === "variable") {
        //   if (!row.min_length || !row.max_length) {
        //     alert(`Min and Max values required for ${header.name}`);
        //     return;
        //   }
        // }

        // if (row.length_validation_type === "fixed") {
        //   if (!row.min_length) {
        //     alert(`Fixed value required for ${header.name}`);
        //     return;
        //   }
        // }

        payload[header.name] = {
          data_type: row?.data_type || "string",
          has_empty: !row?.has_empty,
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

          ...(header.name === firstDependencyKey && { dependency }),
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
    } catch (error: any) {
      if (error?.response?.data?.message || error?.message) {
        setMsg(error?.response?.data?.message || error?.message);
      } else if (error.message?.includes("ERR_UPLOAD_FILE_CHANGED")) {
        setMsg("File was changed. Please re-select and upload again.");
      } else if (error.request) {
        setMsg("Something get wrong. Please upload file again");
      }
      setMsgType("danger");
      setResponseData(null);
      setRequestData(null);
      setHeaders([]);
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
  useEffect(() => {
    if (msg && msgType !== "success") {
      msgRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      msgRef.current?.focus();
    }
  }, [msg, msgType]);
  const formHelpers = {
    register,
    watch,
    errors,
    control,
    trigger,
    setValue,
    getValues,
    setError,
    clearErrors,
  };
  return (
    <div className="w-full min-h-screen flex justify-center bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {msg && (
          <div
            ref={msgRef}
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            Import File
          </h1>
          <p className="text-gray-500">
            Upload a file and map column data types
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
          {/* Upload Box */}

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 md:p-8 text-center cursor-pointer hover:border-black transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                onFileChange({ target: { files: [file] } });
              }
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="flex flex-col items-center  text-gray-600">
              <FiUpload className="text-2xl sm:text-3xl md:text-4xl" />

              <p className="font-medium">Drag & drop file here</p>

              <p className="text-sm text-gray-400">
                or click to upload (.xlsx, .xls, .csv, .json)
              </p>
            </div>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* Loader OUTSIDE */}
          {loading && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-sm">Processing file...</p>
              </div>
            </div>
          )}

          {fileName && (
            <p className="text-center text-sm text-blue-600 mt-3 break-all px-2">
              Uploaded: {fileName}
            </p>
          )}
          {headers.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Please add validation rules for headers.
              </h2>

              <div className="bg-white border border-gray-300 rounded-xl overflow-x-auto md:overflow-visible scrollbar-thin">
                {/* <div
                  className="hidden md:grid  md:grid-cols-[1.5fr_1fr_80px_1.5fr_3fr_80px]
  lg:grid-cols-[2fr_1.2fr_100px_1.8fr_3fr_100px] items-center px-4 md:px-5 h-12 md:h-14 gap-2 md:gap-4 bg-gray-700 border-b border-gray-400 text-xs md:text-sm lg:text-[15px] font-semibold text-gray-100 rounded-t-lg tracking-wide shadow-sm"
                > */}

                <div
                  className={`${gridClass} h-12 md:h-14 bg-gray-700 text-gray-100 font-semibold`}
                >
                  <div className="min-w-0 flex items-center ">Header Name</div>
                  <div className="min-w-0 flex items-center gap-1">
                    Data Type
                    <span className="hidden md:inline-flex">
                      [1
                      <InfoTooltip
                        id="data-type-tooltip"
                        text="Select the type of data expected in this column (e.g., string, integer, date ). This helps validate the input format."
                        tooltip_type="heading"
                      />
                    </span>
                  </div>
                  <div className="min-w-0 flex items-center justify-center gap-1">
                    Required{" "}
                    <span className="hidden md:inline-flex">
                      [2
                      <InfoTooltip
                        id="allow-empty-tooltip"
                        text="Enable this if the field can be left blank. Disable it to make the field mandatory."
                        tooltip_type="heading"
                      />
                    </span>
                  </div>
                  <div className="min-w-0 flex items-center justify-center  gap-1">
                    Regex{" "}
                    <span className="hidden md:inline-flex">
                      [3
                      <InfoTooltip
                        id="cell-contains-tooltip"
                        text="Define a pattern that the cell value must match using regular expressions (advanced validation)."
                        tooltip_type="heading"
                      />
                    </span>
                  </div>
                  <div className="min-w-0 flex items-center gap-1">
                    Length
                    <span className="hidden md:inline-flex">
                      [4
                      <InfoTooltip
                        id="data-length-tooltip"
                        text="Choose whether the value length can vary within a range or must be exactly a fixed number of characters."
                        tooltip_type="heading"
                      />
                    </span>
                  </div>
                  <div></div>
                </div>
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
                    gridClass={gridClass}
                  />
                ))}
              </div>

              <div className="flex justify-center mt-6">
                <button
                  disabled={loading}
                  type="submit"
                  className="mt-6 w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    "Processing..."
                  ) : (
                    <>
                      <FaFileCircleCheck className="text-lg" />
                      Validate File
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        {responseData && <ValidationResult response={responseData} />}
        {/* {requestData} */}
      </div>
    </div>
  );
};

export default ImportFile;
