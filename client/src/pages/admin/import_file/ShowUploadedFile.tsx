import React from "react";
import { FaUpload } from "react-icons/fa";
import { FiGrid, FiRefreshCw, FiCheckCircle, FiLoader } from "react-icons/fi";

type Props = {
  fileName: string;
  headers: string[];
  onReset: () => void;
  onValidate: () => void;
  hasRules: boolean;
  validating: boolean;
};

const ShowUploadedFile: React.FC<Props> = ({
  fileName,
  headers,
  onReset,
  onValidate,
  hasRules,
  validating,
}) => {
  return (
    <div className="relative p-6 transition-all duration-200 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-lg">
      {/* 🔹 Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-sidebar rounded-t-2xl" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* 🔹 LEFT SIDE → File Info */}
        <div className="flex items-center min-w-0 gap-4">
          {/* Icon */}
          <div className="p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <FaUpload className="text-sidebar" size={20} />
          </div>

          {/* File Details */}
          <div className="min-w-0">
            <p className="text-base text-gray-500">Uploaded File</p>

            <p className="text-lg font-semibold text-gray-900 truncate">
              {fileName || "No file"}
            </p>

            {/* Header Count */}
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-base font-medium text-sidebarSecondary bg-blue-50 rounded-full">
                <FiGrid className="text-xs" />
                {headers?.length || 0} Headers
              </span>
            </div>
          </div>
        </div>

        {/* 🔹 RIGHT SIDE → Buttons */}
        <div className="flex flex-wrap justify-end gap-3">
          {/* Change File */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium transition-all duration-200 bg-white border border-gray-300 rounded-lg text-sidebar hover:bg-gray-50 hover:border-gray-400 active:scale-95"
          >
            <FiRefreshCw className="text-xl" />
            <span>Change File</span>
          </button>

          {/* Validate Data */}
          <button
            type="button"
            onClick={onValidate}
            disabled={!hasRules || validating}
            className={`px-5 py-2 text-lg font-medium rounded-lg transition-all duration-200 flex items-center gap-2
              ${
                hasRules && !validating
                  ? "bg-sidebar text-white hover:shadow-lg hover:bg-sidebarHover active:scale-95"
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
  );
};

export default ShowUploadedFile;
