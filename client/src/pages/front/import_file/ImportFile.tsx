import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";

import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Yup validation schema with file validation
const schema = yup.object().shape({
  file: yup
    .mixed()
    .required("File is required")
    .test(
      "fileSize",
      "File size must be less than 5MB",
      (value) => {
        if (!value) return false;
        return value[0]?.size <= 5 * 1024 * 1024; // 5MB
      }
    )
    .test(
      "fileType",
      "Only .xlsx and .csv files are allowed",
      (value) => {
        if (!value) return false;
        const file = value[0];
        const allowedExtensions = ["xlsx", "csv"];
        const fileExtension = file?.name.split(".").pop()?.toLowerCase();
        return allowedExtensions.includes(fileExtension);
      }
    ),
});

function ImportFile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const fileValue = watch("file");

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append("file", data.file[0]);

      const response = await axios.post(
        `${BACKEND_URL}/api/import/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("File uploaded successfully:", response.data);
      // Handle success - redirect or show message
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Import File</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* File Input */}
        <div>
          <label htmlFor="file" className="block text-sm font-semibold mb-2 text-gray-700">
            Upload File (.xlsx or .csv)
          </label>

          <div className="relative">
            <input
              id="file"
              type="file"
              {...register("file")}
              accept=".xlsx,.csv"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] || null);
              }}
            />

            {/* Custom File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <p className="text-blue-600 font-medium">
                  {selectedFile ? selectedFile.name : "Click to upload file"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 5MB
                </p>
              </div>
            </button>
          </div>

          {/* Error Message */}
          {errors.file && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              ⚠️ {errors.file.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Import File
        </button>
      </form>
    </div>
  );
}
export default ImportFile;
