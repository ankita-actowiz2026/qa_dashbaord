import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";
import * as XLSX from "xlsx";

import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Yup validation schema with file validation
const schema = yup.object({
  file: yup
    .mixed<FileList>()
    .required("File is required")
    .test("fileRequired", "File is required", (value) => {
      return value && value.length > 0;
    })
    .test("fileType", "Only .csv and .xlsx files are allowed", (value) => {
      if (!value || value.length === 0) return false;

      const file = value[0];
      const allowedExtensions = ["csv", "xlsx"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      return allowedExtensions.includes(fileExtension || "");
    }),
});

function ImportFile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  // Function to read file and extract columns
  const readFileColumns = async (file: File) => {
    try {
      setLoading(true);
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (fileExtension === "xlsx") {
        // Read Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const cols = Object.keys(jsonData[0]);
          setColumns(cols);
        }
      } else if (fileExtension === "csv") {
        // Read CSV file
        const text = await file.text();
        const lines = text.split("\n");
        if (lines.length > 0) {
          const headers = lines[0].split(",").map((col) => col.trim());
          setColumns(headers);
        }
      }
    } catch (error) {
      console.error("Error reading file:", error);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files?.[0] || null;
    setSelectedFile(file);

    // Update form value and trigger validation
    if (files) {
      setValue("file", files);
      trigger("file");
      // Read file columns
      readFileColumns(file);
    }
  };

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
              onChange={handleFileChange}
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

        {/* Columns Preview */}
        {loading && (
          <div className="flex items-center justify-center">
            <p className="text-gray-600 text-sm">Reading file columns...</p>
          </div>
        )}

        {columns.length > 0 && !loading && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Total Columns: {columns.length}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="bg-white px-3 py-2 rounded border border-gray-300 text-xs text-gray-700"
                >
                  <span className="font-semibold text-blue-600">{index + 1}.</span> {column}
                </div>
              ))}
            </div>
          </div>
        )}

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
