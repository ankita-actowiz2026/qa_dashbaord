import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";
import * as XLSX from "xlsx";

import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const COLUMN_TYPES = ["Text", "Number", "Decimal", "Date", "Email", "Boolean"];

// Yup validation schema with file and column mappings validation
const schema = yup.object({
  file: yup
    .mixed<FileList>()
    .required("File is required")
    .test("fileRequired", "File is required", (value) => {
      return value && value.length > 0;
    })
    .test("fileType", "Only .csv, .xlsx, .xls and .json files are allowed", (value) => {
      if (!value || value.length === 0) return false;

      const file = value[0];
      const allowedExtensions = ["csv", "xlsx", "xls", "json"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      return allowedExtensions.includes(fileExtension || "");
    }),
  columnMappings: yup
    .object()
    .required("Column mappings are required")
    .test("allMapped", "All columns must have a type selected", (value) => {
      if (!value) return false;
      return Object.values(value).every((type) => type && type.trim().length > 0);
    }),
});

function ImportFile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [isMandatory, setIsMandatory] = useState<Record<string, boolean>>({});
  const [isAllowDuplicate, setIsAllowDuplicate] = useState<Record<string, boolean>>({});
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
    defaultValues: {
      columnMappings: {},
    },
  });

  // Function to read file and extract columns
  const readFileColumns = async (file: File) => {
    try {
      setLoading(true);
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (fileExtension === "xlsx" || fileExtension === "xls") {
        // Read Excel file (both XLSX and XLS)
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length > 0) {
          const cols = Object.keys(jsonData[0]);
          setColumns(cols);
          
          // Initialize column mappings with default "Text"
          const mappings: Record<string, string> = {};
          const mandatory: Record<string, boolean> = {};
          const allowDuplicate: Record<string, boolean> = {};
          cols.forEach((col) => {
            mappings[col] = "Text";
            mandatory[col] = false;
            allowDuplicate[col] = true;
          });
          setColumnMappings(mappings);
          setIsMandatory(mandatory);
          setIsAllowDuplicate(allowDuplicate);
          setValue("columnMappings", mappings);
        }
      } else if (fileExtension === "csv") {
        // Read CSV file
        const text = await file.text();
        const lines = text.split("\n");
        if (lines.length > 0) {
          const headers = lines[0].split(",").map((col) => col.trim());
          setColumns(headers);
          
          // Initialize column mappings with default "Text"
          const mappings: Record<string, string> = {};
          const mandatory: Record<string, boolean> = {};
          const allowDuplicate: Record<string, boolean> = {};
          headers.forEach((col) => {
            mappings[col] = "Text";
            mandatory[col] = false;
            allowDuplicate[col] = true;
          });
          setColumnMappings(mappings);
          setIsMandatory(mandatory);
          setIsAllowDuplicate(allowDuplicate);
          setValue("columnMappings", mappings);
        }
      } else if (fileExtension === "json") {
        // Read JSON file
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Handle both array and object JSON formats
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        if (dataArray.length > 0 && typeof dataArray[0] === "object") {
          const cols = Object.keys(dataArray[0]);
          setColumns(cols);
          
          // Initialize column mappings with default "Text"
          const mappings: Record<string, string> = {};
          const mandatory: Record<string, boolean> = {};
          const allowDuplicate: Record<string, boolean> = {};
          cols.forEach((col) => {
            mappings[col] = "Text";
            mandatory[col] = false;
            allowDuplicate[col] = true;
          });
          setColumnMappings(mappings);
          setIsMandatory(mandatory);
          setIsAllowDuplicate(allowDuplicate);
          setValue("columnMappings", mappings);
        }
      }
    } catch (error) {
      console.error("Error reading file:", error);
      setColumns([]);
      setColumnMappings({});
      setIsMandatory({});
      setIsAllowDuplicate({});
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

  const handleColumnTypeChange = (column: string, type: string) => {
    const updatedMappings = {
      ...columnMappings,
      [column]: type,
    };
    setColumnMappings(updatedMappings);
    setValue("columnMappings", updatedMappings);
    trigger("columnMappings");
  };

  const handleMandatoryChange = (column: string, checked: boolean) => {
    const updated = {
      ...isMandatory,
      [column]: checked,
    };
    setIsMandatory(updated);
  };

  const handleAllowDuplicateChange = (column: string, checked: boolean) => {
    const updated = {
      ...isAllowDuplicate,
      [column]: checked,
    };
    setIsAllowDuplicate(updated);
  };

  const onSubmit = async (data: any) => {
    try {
      const columnConfig = columns.map((col) => ({
        name: col,
        type: columnMappings[col],
        is_mandatory: isMandatory[col],
        is_allow_duplicate: isAllowDuplicate[col],
      }));

      console.log("Form data submitted:", {
        file: data.file[0].name,
        columnConfig,
      });

      const formData = new FormData();
      formData.append("file", data.file[0]);
      formData.append("columnConfig", JSON.stringify(columnConfig));

      const response = await axios.post(
        `${BACKEND_URL}/api/import/upload`,
        formData,
        {
          withCredentials: true,
        },
      );

      console.log("File uploaded successfully:", response.data);
      // Handle success - redirect or show message
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Import File</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* File Input */}
        <div>
          <label htmlFor="file" className="block text-sm font-semibold mb-2 text-gray-700">
            Upload File (.xlsx, .xls, .csv or .json)
          </label>

          <div className="relative">
            <input
              id="file"
              type="file"
              {...register("file")}
              accept=".xlsx,.xls,.csv,.json"
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
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Column Mappings ({columns.length} columns)
            </h3>
            <div className="space-y-4">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded border border-gray-300 space-y-3"
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                      {index + 1}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {column}
                      </p>
                    </div>
                  </div>

                  {/* Type Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600 w-20">Type:</label>
                    <select
                      value={columnMappings[column] || "Text"}
                      onChange={(e) => handleColumnTypeChange(column, e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm bg-white hover:border-blue-400 focus:outline-none focus:border-blue-500"
                    >
                      {COLUMN_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                    {/* Mandatory Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_mandatory"
                        checked={isMandatory[column] || false}
                        onChange={(e) => handleMandatoryChange(column, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">Mandatory</span>
                    </label>

                    {/* Allow Duplicate Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_allow_duplicate"
                        checked={isAllowDuplicate[column] || false}
                        onChange={(e) => handleAllowDuplicateChange(column, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">Allow Duplicate</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Error */}
            {errors.columnMappings && (
              <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
                ⚠️ {errors.columnMappings.message}
              </p>
            )}
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
