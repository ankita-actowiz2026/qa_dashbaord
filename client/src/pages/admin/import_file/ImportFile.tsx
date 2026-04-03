import React, { useState, useRef } from "react";

import { FiCheckCircle, FiLoader, FiUpload, FiGrid } from "react-icons/fi";
import { FaUpload, FaPlay } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";

import ShowValidationRules from "./ShowValidationRules";

import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "../../../services/apiClient";
const allowedTypes = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/json",
];

const getErrorMessage = (error: any) => {
  const msg =
    error?.response?.data?.message || error?.message || "Something went wrong";

  if (msg.includes("Top-level object should be an array")) {
    return "Invalid JSON format. Expected an array of objects.";
  }

  return msg;
};
type HeaderType = {
  name: string;
};

const ImportFile: React.FC = () => {
  const navigate = useNavigate();
  const [validating, setValidating] = useState(false);
  const [rulesData, setRulesData] = useState<Record<string, any>>({});
  const {
    handleSubmit,
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
    setRequestData(null);
    reset(); // react-hook-form reset
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateFile = (file: File) => {
    return allowedTypes.includes(file.type);
  };

  const readHeaderFromServer = async (file: File) => {
    const formData = new FormData();
    if (!file) {
      toast.error("Please select file");
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

      setRequestData(null);
    } catch (error: any) {
      reset();
      setHeaders([]);
      setRulesData({});
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    setRequestData(null);
  };
  const onSubmit = async (data: any) => {};
  const handleFile = async (selectedFile: File) => {
    setHeaders([]);
    setRulesData({});

    if (!validateFile(selectedFile)) {
      toast.error("Invalid file type. Only .xlsx, .csv, .json, .xls allowed");
      handleReset();
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
        toast.error("Please select file");
        return;
      }
      setValidating(true);

      formData.append("file", file);

      // attach rules JSON
      formData.append("columnConfig", JSON.stringify(rulesData));

      const response = await apiClient.post(`admin/api/qa_file`, formData, {
        withCredentials: true,
      });
      toast.success("Validation completed successfully");
      navigate("/admin/import_file/validation_result", {
        state: {
          responseData: response.data,
          requestData: rulesData,
          fileName: fileName,
        },
      });
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
    <div className="mt-6 space-y-6">
      {/* Title */}

      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
        {/* Upload Box */}
        {headers.length === 0 ? (
          <div className="p-8 mx-auto bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="mb-8 text-left">
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Upload File
              </h1>
              <p className="mt-2 text-base text-gray-500">
                Upload your file to configure validation rules and analyze data
                quality
              </p>
            </div>
            <div
              className="p-10 transition border-2 border-gray-300 border-dashed cursor-pointer rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-blue-50/20"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center text-gray-600">
                <FiUpload className="text-3xl text-gray-400 sm:text-4xl" />

                <p className="mt-2 font-semibold text-gray-700">
                  Drag & drop file here
                </p>
                <p className="text-sm text-gray-400">or click to browse</p>
                <p className="mt-3 text-xs text-gray-400">
                  Supports .xlsx, .xls, .csv, .json
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 p-8 bg-white shadow-2xl rounded-2xl">
                  <div className="w-12 h-12 border-4 border-blue-200 rounded-full border-t-blue-600 animate-spin"></div>
                  <p className="text-sm font-medium text-gray-700">
                    Processing your file...
                  </p>
                </div>
              </div>
            )}

            {fileName && (
              <p className="px-2 mt-3 text-base text-center text-blue-600 break-all">
                Uploaded: {fileName}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="relative p-6 transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-lg">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 rounded-t-2xl" />

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* LEFT SIDE → File Info */}
                <div className="flex items-center min-w-0 gap-4">
                  {/* Icon */}
                  <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <FaUpload className="text-blue-600" size={20} />
                  </div>

                  {/* File Details */}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Uploaded File</p>

                    <p className="font-semibold text-gray-900 truncate">
                      {fileName}
                    </p>

                    {/* Header Count */}
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
                        <FiGrid className="text-xs" />
                        {headers.length} Headers
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
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 active:scale-95"
                  >
                    <FiRefreshCw className="text-base" />
                    <span>Change File</span>
                  </button>

                  {/* Run Validation */}
                  <button
                    onClick={handleRunValidation}
                    type="button"
                    disabled={!hasRules || validating}
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2
  ${
    hasRules && !validating
      ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:shadow-lg hover:from-gray-800 hover:to-gray-700 active:scale-95"
      : "bg-gray-100 text-gray-400 cursor-not-allowed"
  }`}
                  >
                    {validating ? (
                      <>
                        <FiLoader className="animate-spin" size={16} />
                        Validating...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={16} />
                        Validate Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <ShowValidationRules
              headers={headers}
              onRulesChange={setRulesData}
            ></ShowValidationRules>
          </>
        )}
      </form>
    </div>
  );
};

export default ImportFile;
