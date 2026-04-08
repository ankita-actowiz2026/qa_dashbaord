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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
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
    setUploadedFileName("");
    setRulesData({});
    setFile(null);
    setFileName("");
    setRequestData(null);
    reset(); // react-hook-form reset
  };

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
      // setHeaders(response.data.data);
      // setUploadedFileName(response.data.filePath);
      navigate("/admin/import_file/show_imported_data", {
        state: {
          headers: response.data.data,
          filePath: response.data.filePath,
          fileName: file.name,
        },
      });

      setRequestData(null);
    } catch (error: any) {
      reset();
      setHeaders([]);
      setRulesData({});
      setUploadedFileName("");
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
    setUploadedFileName("");
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
      setUploadedFileName("");
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
      if (!file) {
        toast.error("Please select file");
        return;
      }
      setValidating(true);
      const updatedRulesData = Object.fromEntries(
        Object.entries(rulesData).map(([key, value]) => {
          const { name, ...rest } = value; // remove "name"
          return [key, rest];
        }),
      );
      const formData = {
        columnConfig: JSON.stringify(updatedRulesData),
        fileName: uploadedFileName,
      };
      const response = await apiClient.post(`admin/api/qa_file`, formData, {
        withCredentials: true,
      });
      toast.success("Validation completed successfully");
      navigate("/admin/import_file/validation_result", {
        state: {
          responseData: response.data,
          requestData: rulesData,
          fileName: fileName,
          dbFileName: uploadedFileName,
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
      <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
        {/* Upload Box */}

        <div className="p-8 mx-auto bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="mb-8 text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Upload File
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              Upload your file to configure validation rules and analyze data
              quality
            </p>
          </div>
          <div
            className="p-10 transition border-2 border-gray-300 border-dashed cursor-pointer rounded-xl bg-gray-50 hover:border-sidebar hover:bg-sidebar/10"
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

              <p className="mt-2 text-2xl font-semibold text-gray-700">
                Drag & Drop File Here
              </p>
              <p className="text-lg text-gray-400">OR Click To Browse</p>
              <p className="mt-3 text-lg text-gray-400">
                Supports .xlsx, .xls, .csv, .json Only
              </p>
            </div>

            {/* Hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              disabled={loading}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {/* Loader OUTSIDE */}
          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 pointer-events-auto">
                {/* Animated ring with custom colors */}
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#3F4D67] border-r-[#424649] animate-spin"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent border-b-[#3F4D67] border-l-[#424649] animate-spin animation-delay-150"
                    style={{ animationDuration: "0.8s" }}
                  ></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-[#3F4D67] to-[#424649] animate-pulse"></div>
                </div>

                {/* Pulsing text */}
                <div className="relative">
                  <p className="text-sm font-semibold bg-gradient-to-r from-[#3F4D67] to-[#424649] bg-clip-text text-transparent animate-pulse">
                    Processing...
                  </p>
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#3F4D67] to-[#424649] rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {fileName && (
            <p className="px-2 mt-3 text-base text-center break-all text-sidebar">
              Uploaded: {fileName}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ImportFile;
