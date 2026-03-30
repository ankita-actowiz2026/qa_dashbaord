import React, { useState, useRef } from "react";
import ValidationResult from "./ValidationResult";
import { FiUpload } from "react-icons/fi";
import { FaUpload, FaPlay } from "react-icons/fa";

import ShowValidationRules from "./ShowValidationRules";

import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "../../../services/apiClient";

type HeaderType = {
  name: string;
};
const ImportFile: React.FC = () => {
  const [validating, setValidating] = useState(false);
  const [rulesData, setRulesData] = useState<Record<string, any>>({});
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

  const handleReset = () => {
    setHeaders([]);
    setRulesData({});
    setFile(null);
    setFileName("");
    setResponseData(null); // 👈 IMPORTANT
    reset(); // react-hook-form reset
  };
  const msgRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const [responseData, setResponseData] = useState(null);
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ["xlsx", "csv", "xls", "json"].includes(ext || "");
  };

  const readHeaderFromServer = async (file: File) => {
    const formData = new FormData();
    if (!file) {
      toast.error("No file selected");
      return;
    }

    formData.append("file", file);

    setLoading(true);

    try {
      const response = await apiClient.post(
        `admin/api/qa_file/read_header`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      reset();
      setHeaders(response.data.data);
      setResponseData(null);
      setRequestData(null);
    } catch (error: any) {
      reset();
      setHeaders([]);
      setRulesData({});
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Error reading file",
      );
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    setResponseData(null);
    setRequestData(null);
  };
  const onSubmit = async (data: any) => {};
  const handleFile = async (selectedFile: File) => {
    setHeaders([]);
    setRulesData({});

    if (!validateFile(selectedFile)) {
      toast.error("Invalid file type");
      setResponseData(null);
      setRequestData(null);
      setFile(null);
      setFileName("");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);

    try {
      await readHeaderFromServer(selectedFile);
    } catch {
      setHeaders([]);
      setRulesData({});
      toast.error("Failed to read file");
    }

    // clear input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const hasRules = Object.keys(rulesData).length > 0;
  const handleRunValidation = async () => {
    try {
      const formData = new FormData();
      if (!file) {
        toast.error("No file selected");
        return;
      }
      setValidating(true);

      formData.append("file", file);

      // attach rules JSON
      formData.append("columnConfig", JSON.stringify(rulesData));

      const response = await apiClient.post(`admin/api/qa_file`, formData, {
        withCredentials: true,
      });
      toast.success("Validation completed successfully.");
      setRequestData(rulesData);
      setResponseData(response.data);
      console.log("Validation Response:", response.data);
    } catch (error: any) {
      console.error("Validation Error:", error);

      const message = error?.response?.data?.message || "Validation failed";

      toast.error(message);
    } finally {
      setValidating(false);
    }
  };
  return (
    <div className="bg-gray-50">
      <div className="px-4 pb-6 mx-auto sm:px-6 lg:px-8">
        {/* Title */}
        {!responseData ? (
          <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
            {/* Upload Box */}
            {headers.length === 0 ? (
              <div>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl md:text-4xl">
                    Import File
                  </h1>
                  <p className="text-gray-500">
                    Upload a file and map column data types
                  </p>
                </div>
                <div
                  className="px-4 py-3 text-center transition border-2 border-gray-300 border-dashed cursor-pointer rounded-xl sm:px-6 sm:py-4 md:px-8 md:py-5 hover:border-black"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center text-gray-600">
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>

                {/* Loader OUTSIDE */}
                {loading && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-white rounded-full sm:w-12 sm:h-12 border-t-transparent animate-spin"></div>
                      <p className="text-sm text-white">Processing file...</p>
                    </div>
                  </div>
                )}

                {fileName && (
                  <p className="px-2 mt-3 text-sm text-center text-blue-600 break-all">
                    Uploaded: {fileName}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4 px-5 py-4 mt-6 border border-gray-200 shadow-sm md:flex-row md:items-center md:justify-between bg-white/80 backdrop-blur rounded-2xl">
                  {/* LEFT SIDE → File Info */}
                  <div className="flex items-center min-w-0 gap-4">
                    {/* File Icon */}
                    <div className="p-3 text-blue-600 bg-blue-100 rounded-xl">
                      <FaUpload className="text-xl text-black" />
                    </div>

                    {/* File Details */}
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Uploaded File</p>

                      <p className="text-gray-800 font-semibold truncate max-w-[220px] sm:max-w-sm">
                        {fileName}
                      </p>

                      {/* Header Count Badge */}
                      <div className="mt-1">
                        <span className="inline-block px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-full">
                          {headers.length} Headers Detected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE → Buttons */}
                  <div className="flex flex-wrap justify-end gap-3">
                    {/* Upload New File */}
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex items-center gap-2 bg-black border border-gray-300 text-white py-2.5 px-5 rounded-xl font-medium hover:bg-gray-700 hover:shadow-sm transition-all duration-200"
                    >
                      <FaUpload className="text-sm" />
                      Upload New file
                    </button>

                    {/* Run Validation */}
                    <button
                      onClick={handleRunValidation}
                      type="button"
                      disabled={!hasRules || validating}
                      className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold shadow-sm transition-all duration-200
        ${
          hasRules && !validating
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:scale-105"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
                    >
                      <FaPlay className="text-sm" />
                      {validating ? "Validating..." : "Run Validation"}
                    </button>
                  </div>
                </div>
                <ShowValidationRules
                  headers={headers}
                  onRulesChange={setRulesData}
                ></ShowValidationRules>
              </>
            )}
          </form>
        ) : (
          <>
            <ValidationResult
              responseData={responseData}
              onUploadNew={handleReset}
            />
            {/* {requestData} */}
          </>
        )}
      </div>
    </div>
  );
};

export default ImportFile;
