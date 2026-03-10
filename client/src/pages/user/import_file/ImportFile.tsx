import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router";
import * as XLSX from "xlsx";

import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const COLUMN_TYPES = ["Text", "Number", "Decimal", "Date", "Email", "Boolean"];
interface ErrorMsg {
  row: number;
  column: string;
  error_type: string;
  error_description: string;
}

interface ImportResult {
  total_rows: number;
  valid_records: number;
  invalid_records: number;
  duplicate_count: number;
  missing_required_count: number;
  datatype_error_count: number;
  junk_character_count: number;
  error_msg: ErrorMsg[];
}
// Yup validation schema with file and column mappings validation
const schema = yup.object({
  file: yup
    .mixed<FileList>()
    .required("File is required")
    .test("fileRequired", "File is required", (value) => {
      return value && value.length > 0;
    })
    .test(
      "fileType",
      "Only .csv, .xlsx, .xls and .json files are allowed",
      (value) => {
        if (!value || value.length === 0) return false;

        const file = value[0];
        const allowedExtensions = ["csv", "xlsx", "xls", "json"];
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        return allowedExtensions.includes(fileExtension || "");
      },
    ),
  columnMappings: yup
    .object()
    .required("Column mappings are required")
    .test("allMapped", "All columns must have a type selected", (value) => {
      if (!value) return false;
      return Object.values(value).every(
        (type) => type && type.trim().length > 0,
      );
    }),
});

// Yup validation schema for date ranges
const createDateRangeSchema = () =>
  yup.object().shape({
    dateRanges: yup
      .object()
      .test(
        "dateRangesValid",
        "Date range validation failed",
        function (value) {
          if (!value) return true;

          // This will be overridden with actual values during validation
          return true;
        },
      ),
  });

// Helper function to validate date ranges using Yup
const validateDateRangesWithYup = async (
  columns: string[],
  columnMappings: Record<string, string>,
  dateMinValue: Record<string, string>,
  dateMaxValue: Record<string, string>,
): Promise<Record<string, string>> => {
  const errors: Record<string, string> = {};

  for (const col of columns) {
    if (columnMappings[col] === "Date") {
      console.log("11-->" + dateMinValue[col] + "===" + dateMaxValue[col]);
      const minDateValue = dateMinValue[col]?.trim();
      const maxDateValue = dateMaxValue[col]?.trim();

      // If both dates are provided, validate that minDate < maxDate
      if (minDateValue && maxDateValue) {
        // Check if dates are valid
        if (isNaN(new Date(minDateValue).getTime())) {
          errors[col] = "Minimum date must be a valid date";
          continue;
        }
        if (isNaN(new Date(maxDateValue).getTime())) {
          errors[col] = "Maximum date must be a valid date";
          continue;
        }

        // Check order
        if (new Date(minDateValue) >= new Date(maxDateValue)) {
          errors[col] = "Minimum date must be less than Maximum date";
        }
      }
    }
  }

  return errors;
};

// Helper function to get date 1 year before today in YYYY-MM-DD format
const getOneYearBeforeToday = (): string => {
  const today = new Date();
  const oneYearAgo = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate(),
  );
  const year = oneYearAgo.getFullYear();
  const month = String(oneYearAgo.getMonth() + 1).padStart(2, "0");
  const day = String(oneYearAgo.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function ImportFile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(
    {},
  );
  const [isMandatory, setIsMandatory] = useState<Record<string, boolean>>({});
  const [isAllowDuplicate, setIsAllowDuplicate] = useState<
    Record<string, boolean>
  >({});
  const [blockSpecialChars, setBlockSpecialChars] = useState<
    Record<string, boolean>
  >({});
  const [allowAlphaNumeric, setAllowAlphaNumeric] = useState<
    Record<string, boolean>
  >({});
  const [lengthType, setLengthType] = useState<
    Record<string, "variable" | "fixed">
  >({});
  const [minLength, setMinLength] = useState<Record<string, string>>({});
  const [maxLength, setMaxLength] = useState<Record<string, string>>({});
  const [fixedLength, setFixedLength] = useState<Record<string, string>>({});
  const [lengthErrors, setLengthErrors] = useState<Record<string, string>>({});
  const [blockedWords, setBlockedWords] = useState<Record<string, string[]>>(
    {},
  );
  const [blockedWordInput, setBlockedWordInput] = useState<
    Record<string, string>
  >({});
  const [predefinedValues, setPredefinedValues] = useState<
    Record<string, string[]>
  >({});
  const [predefinedValueInput, setPredefinedValueInput] = useState<
    Record<string, string>
  >({});
  const [dateMinValue, setDateMinValue] = useState<Record<string, string>>({});
  const [dateMaxValue, setDateMaxValue] = useState<Record<string, string>>({});
  const [numberMinValue, setNumberMinValue] = useState<Record<string, string>>(
    {},
  );
  const [numberMaxValue, setNumberMaxValue] = useState<Record<string, string>>(
    {},
  );
  const [numberRangeErrors, setNumberRangeErrors] = useState<
    Record<string, string>
  >({});
  const [dateRangeErrors, setDateRangeErrors] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
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

      const ext = file.name.split(".").pop()?.toLowerCase();

      if (!["xlsx", "xls"].includes(ext || "")) return;

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, { type: "array" });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // ✅ Read only first row
      const headerRow = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0,
      }) as any[];

      if (!headerRow.length) return;

      const cols: string[] = headerRow[0];

      setColumns(cols);

      // Initialize default configs
      const mappings: Record<string, string> = {};
      const mandatory: Record<string, boolean> = {};
      const allowDuplicate: Record<string, boolean> = {};
      const blockSpecial: Record<string, boolean> = {};
      const alphaNumeric: Record<string, boolean> = {};
      const lenType: Record<string, "variable" | "fixed"> = {};

      const minLen: Record<string, string> = {};
      const maxLen: Record<string, string> = {};
      const fixedLen: Record<string, string> = {};

      const blockedWordsInit: Record<string, string[]> = {};
      const predefinedValuesInit: Record<string, string[]> = {};

      const dateMinVal: Record<string, string> = {};
      const dateMaxVal: Record<string, string> = {};

      const numberMinVal: Record<string, string> = {};
      const numberMaxVal: Record<string, string> = {};

      cols.forEach((col) => {
        mappings[col] = "Text";
        mandatory[col] = false;
        allowDuplicate[col] = true;
        blockSpecial[col] = false;
        alphaNumeric[col] = false;
        lenType[col] = "variable";

        minLen[col] = "";
        maxLen[col] = "";
        fixedLen[col] = "";

        blockedWordsInit[col] = [];
        predefinedValuesInit[col] = [];

        dateMinVal[col] = "";
        dateMaxVal[col] = "";

        numberMinVal[col] = "";
        numberMaxVal[col] = "";
      });

      setColumnMappings(mappings);
      setIsMandatory(mandatory);
      setIsAllowDuplicate(allowDuplicate);
      setBlockSpecialChars(blockSpecial);
      setAllowAlphaNumeric(alphaNumeric);
      setLengthType(lenType);

      setMinLength(minLen);
      setMaxLength(maxLen);
      setFixedLength(fixedLen);

      setBlockedWords(blockedWordsInit);
      setPredefinedValues(predefinedValuesInit);

      setDateMinValue(dateMinVal);
      setDateMaxValue(dateMaxVal);

      setNumberMinValue(numberMinVal);
      setNumberMaxValue(numberMaxVal);

      setDateRangeErrors({});

      setValue("columnMappings", mappings);
    } catch (error) {
      console.error("Error reading file:", error);

      setColumns([]);
      setColumnMappings({});
      setIsMandatory({});
      setIsAllowDuplicate({});
      setBlockSpecialChars({});
      setAllowAlphaNumeric({});
      setLengthType({});
      setMinLength({});
      setMaxLength({});
      setFixedLength({});
      setLengthErrors({});
      setBlockedWords({});
      setBlockedWordInput({});
      setPredefinedValues({});
      setPredefinedValueInput({});
    } finally {
      setLoading(false);
    }
  };
  const handleColumnMappingChange = (column: string, value: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [column]: value,
    }));

    if (value === "Date") {
      setDateMinValue((prev) => ({
        ...prev,
        [column]: getOneYearBeforeToday(),
      }));

      setDateMaxValue((prev) => ({
        ...prev,
        [column]: getTodayDate(),
      }));
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

    // Reset text-specific validations if type is not Text
    if (type !== "Text") {
      const updatedBlockSpecial = { ...blockSpecialChars };
      const updatedAlphaNumeric = { ...allowAlphaNumeric };
      delete updatedBlockSpecial[column];
      delete updatedAlphaNumeric[column];
      setBlockSpecialChars(updatedBlockSpecial);
      setAllowAlphaNumeric(updatedAlphaNumeric);
    }

    // Reset length-related values if type is not in allowed list
    const allowedLengthTypes = ["Text", "Number", "Decimal", "Email"];
    if (!allowedLengthTypes.includes(type)) {
      const updatedLengthType = { ...lengthType };
      const updatedMinLength = { ...minLength };
      const updatedMaxLength = { ...maxLength };
      const updatedFixedLength = { ...fixedLength };
      delete updatedLengthType[column];
      delete updatedMinLength[column];
      delete updatedMaxLength[column];
      delete updatedFixedLength[column];
      setLengthType(updatedLengthType);
      setMinLength(updatedMinLength);
      setMaxLength(updatedMaxLength);
      setFixedLength(updatedFixedLength);
    }
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

  const handleBlockSpecialCharsChange = (column: string, checked: boolean) => {
    const updated = {
      ...blockSpecialChars,
      [column]: checked,
    };
    setBlockSpecialChars(updated);
  };

  const handleAllowAlphaNumericChange = (column: string, checked: boolean) => {
    const updated = {
      ...allowAlphaNumeric,
      [column]: checked,
    };
    setAllowAlphaNumeric(updated);
  };

  const handleLengthTypeChange = (
    column: string,
    type: "variable" | "fixed",
  ) => {
    const updated = {
      ...lengthType,
      [column]: type,
    };
    setLengthType(updated);
    // Clear error when user changes length type
    if (lengthErrors[column]) {
      const updatedErrors = { ...lengthErrors };
      delete updatedErrors[column];
      setLengthErrors(updatedErrors);
    }
  };

  const handleMinLengthChange = (column: string, value: string) => {
    const updated = {
      ...minLength,
      [column]: value,
    };
    setMinLength(updated);
    // Clear error when user starts typing
    if (lengthErrors[column]) {
      const updatedErrors = { ...lengthErrors };
      delete updatedErrors[column];
      setLengthErrors(updatedErrors);
    }
  };

  const handleMaxLengthChange = (column: string, value: string) => {
    const updated = {
      ...maxLength,
      [column]: value,
    };
    setMaxLength(updated);
    // Clear error when user starts typing
    if (lengthErrors[column]) {
      const updatedErrors = { ...lengthErrors };
      delete updatedErrors[column];
      setLengthErrors(updatedErrors);
    }
  };

  const handleFixedLengthChange = (column: string, value: string) => {
    const updated = {
      ...fixedLength,
      [column]: value,
    };
    setFixedLength(updated);
    // Clear error when user starts typing
    if (lengthErrors[column]) {
      const updatedErrors = { ...lengthErrors };
      delete updatedErrors[column];
      setLengthErrors(updatedErrors);
    }
  };

  const handleAddBlockedWord = (column: string) => {
    const word = blockedWordInput[column]?.trim();
    if (word) {
      const updated = {
        ...blockedWords,
        [column]: [...(blockedWords[column] || []), word],
      };
      setBlockedWords(updated);
      // Clear the input field
      const updatedInput = { ...blockedWordInput };
      updatedInput[column] = "";
      setBlockedWordInput(updatedInput);
    }
  };

  const handleRemoveBlockedWord = (column: string, index: number) => {
    const updated = {
      ...blockedWords,
      [column]: blockedWords[column].filter((_, i) => i !== index),
    };
    setBlockedWords(updated);
  };

  const handleBlockedWordInputChange = (column: string, value: string) => {
    const updated = {
      ...blockedWordInput,
      [column]: value,
    };
    setBlockedWordInput(updated);
  };

  const handleAddPredefinedValue = (column: string) => {
    const value = predefinedValueInput[column]?.trim();
    if (value) {
      const updated = {
        ...predefinedValues,
        [column]: [...(predefinedValues[column] || []), value],
      };
      setPredefinedValues(updated);
      // Clear the input field
      const updatedInput = { ...predefinedValueInput };
      updatedInput[column] = "";
      setPredefinedValueInput(updatedInput);
    }
  };

  const handleRemovePredefinedValue = (column: string, index: number) => {
    const updated = {
      ...predefinedValues,
      [column]: predefinedValues[column].filter((_, i) => i !== index),
    };
    setPredefinedValues(updated);
  };

  const handlePredefinedValueInputChange = (column: string, value: string) => {
    const updated = {
      ...predefinedValueInput,
      [column]: value,
    };
    setPredefinedValueInput(updated);
  };

  const handleDateMinChange = (column: string, value: string) => {
    const updated = {
      ...dateMinValue,
      [column]: value,
    };
    setDateMinValue(updated);
    // Clear error if user starts editing
    if (dateRangeErrors[column]) {
      const updatedErrors = { ...dateRangeErrors };
      delete updatedErrors[column];
      setDateRangeErrors(updatedErrors);
    }
  };

  const handleDateMaxChange = (column: string, value: string) => {
    const updated = {
      ...dateMaxValue,
      [column]: value,
    };
    setDateMaxValue(updated);
    // Clear error if user starts editing
    if (dateRangeErrors[column]) {
      const updatedErrors = { ...dateRangeErrors };
      delete updatedErrors[column];
      setDateRangeErrors(updatedErrors);
    }
  };
  const handleNumberMinChange = (column: string, value: string) => {
    const updated = {
      ...numberMinValue,
      [column]: value,
    };
    setNumberMinValue(updated);

    if (numberRangeErrors[column]) {
      const updatedErrors = { ...numberRangeErrors };
      delete updatedErrors[column];
      setNumberRangeErrors(updatedErrors);
    }
  };

  const handleNumberMaxChange = (column: string, value: string) => {
    const updated = {
      ...numberMaxValue,
      [column]: value,
    };
    setNumberMaxValue(updated);

    if (numberRangeErrors[column]) {
      const updatedErrors = { ...numberRangeErrors };
      delete updatedErrors[column];
      setNumberRangeErrors(updatedErrors);
    }
  };
  const validateLengthFields = (): boolean => {
    const errors: Record<string, string> = {};
    const allowedLengthTypes = [
      "Text",
      "Email",
      "Boolean",
      "Number",
      "Decimal",
    ];

    columns.forEach((col) => {
      if (!allowedLengthTypes.includes(columnMappings[col])) return;

      //  if (columnMappings[col] === "Number" || columnMappings[col] === "Decimal") {
      //   const min = numberMinValue[col]?.trim();
      //   const max = numberMaxValue[col]?.trim();

      //   if (!min || !max) {
      //     errors[col] = "Min and Max length are required11111";
      //     return;
      //   }

      //   if (isNaN(Number(min)) || isNaN(Number(max))) {
      //     errors[col] = "Length must be numbers";
      //     return;
      //   }

      //   if (Number(min) <= 0 || Number(max) <= 0) {
      //     errors[col] = "Length must be positive";
      //     return;
      //   }

      //   if (Number(max) < Number(min)) {
      //     errors[col] = "Max length must be >= Min length";
      //     return;
      //   }
      // }

      if (lengthType[col] === "variable") {
        const max = fixedLength[col]?.trim(); // using fixedLength as variable length input

        if (!max) {
          errors[col] = "Variable length is required";
          return;
        }

        if (isNaN(Number(max)) || Number(max) <= 0) {
          errors[col] = "Variable length must be a positive number";
          return;
        }
      }

      if (lengthType[col] === "fixed") {
        const min = minLength[col]?.trim();
        const max = maxLength[col]?.trim();

        if (!min || !max) {
          errors[col] = "Min and Max length are required11111";
          return;
        }

        if (isNaN(Number(min)) || isNaN(Number(max))) {
          errors[col] = "Length must be numbers";
          return;
        }

        if (Number(min) <= 0 || Number(max) <= 0) {
          errors[col] = "Length must be positive";
          return;
        }

        if (Number(max) < Number(min)) {
          errors[col] = "Max length must be >= Min length";
          return;
        }
      }
    });

    setLengthErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateDateRanges = (): boolean => {
    const errors: Record<string, string> = {};

    columns.forEach((col) => {
      // Only validate if column type is Date
      console.log(columnMappings[col]);
      if (columnMappings[col] === "Date") {
        console.log("222-->" + dateMinValue[col] + "===" + dateMaxValue[col]);

        const minDate = dateMinValue[col]?.trim();
        const maxDate = dateMaxValue[col]?.trim();

        // If both dates are provided, validate the order
        if (minDate && maxDate) {
          // Check if max date > min date
          if (new Date(maxDate) <= new Date(minDate)) {
            errors[col] = "Minimum date must be less than Maximum date";
            return;
          }
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setDateRangeErrors(errors);
      return false;
    }

    setDateRangeErrors({});
    return true;
  };
  const validateNumberRanges = (): boolean => {
    const errors: Record<string, string> = {};

    for (const col of columns) {
      const type = columnMappings[col];

      // Only validate Number and Decimal
      if (type !== "Number" && type !== "Decimal") continue;

      const minRaw = numberMinValue[col];
      const maxRaw = numberMaxValue[col];

      const min = minRaw !== undefined && minRaw !== "" ? Number(minRaw) : null;
      const max = maxRaw !== undefined && maxRaw !== "" ? Number(maxRaw) : null;

      // Validate min number
      if (minRaw && isNaN(min)) {
        errors[col] = "Minimum value must be a valid number";
        continue;
      }

      // Validate max number
      if (maxRaw && isNaN(max)) {
        errors[col] = "Maximum value must be a valid number";
        continue;
      }

      // Validate range
      if (min !== null && max !== null && min >= max) {
        errors[col] = "Min value must be less than Max value";
        continue;
      }
    }

    setNumberRangeErrors(errors);

    return Object.keys(errors).length === 0;
  };
  const onSubmit = async (data: any) => {
    try {
      // Validate length fields first
      const validateResult = true; // validateLengthFields()

      // Validate date ranges with Yup
      const dateRangeYupErrors = await validateDateRangesWithYup(
        columns,
        columnMappings,
        dateMinValue,
        dateMaxValue,
      );
      if (Object.keys(dateRangeYupErrors).length > 0) {
        setDateRangeErrors(dateRangeYupErrors);
        return;
      }
      const validateDateRangeResult = validateDateRanges();
      const validateNumberRangeResult = validateNumberRanges();
      // Validate date ranges (runtime validation)
      alert(validateNumberRangeResult);
      if (
        validateResult === false ||
        validateDateRangeResult === false ||
        validateNumberRangeResult === false
      ) {
        return;
      }

      const columnConfig = columns.map((col) => {
        const config: any = {
          name: col,
          type: columnMappings[col],
          is_mandatory: isMandatory[col],
          is_allow_duplicate: isAllowDuplicate[col],
        };

        // Add text-specific validations if type is Text
        if (columnMappings[col] === "Text") {
          config.block_special_chars = blockSpecialChars[col] || false;
          config.allow_alpha_numeric = allowAlphaNumeric[col] || false;
        }

        // Add length configuration if type supports it
        // Add length configuration if type supports it
        const allowedLengthTypes = ["Text", "Email", "Boolean"];

        if (allowedLengthTypes.includes(columnMappings[col])) {
          config.length_type = lengthType[col] ?? "variable";

          // VARIABLE LENGTH → single max length
          if (lengthType[col] === "variable") {
            config.max_length = fixedLength[col]
              ? parseInt(fixedLength[col])
              : null;
          }

          // FIXED LENGTH → min and max
          if (lengthType[col] === "fixed") {
            config.min_length = minLength[col]
              ? parseInt(minLength[col])
              : null;

            config.max_length = maxLength[col]
              ? parseInt(maxLength[col])
              : null;
          }
        }

        // Add blocked words if any
        if (blockedWords[col] && blockedWords[col].length > 0) {
          config.blocked_words = blockedWords[col];
        }

        // Add predefined values if any
        if (predefinedValues[col] && predefinedValues[col].length > 0) {
          config.predefined_values = predefinedValues[col];
        }

        // Add date range if type is Date
        if (columnMappings[col] === "Date") {
          console.log("333-->" + dateMinValue[col] + "===" + dateMaxValue[col]);

          config.min_date = dateMinValue[col] || null;
          config.max_date = dateMaxValue[col] || null;
        }
        if (
          columnMappings[col] === "Number" ||
          columnMappings[col] === "Decimal"
        ) {
          config.min_length = numberMinValue[col]
            ? Number(numberMinValue[col])
            : null;

          config.max_length = numberMaxValue[col]
            ? Number(numberMaxValue[col])
            : null;
        }
        return config;
      });

      console.log("Form data submitted:", {
        file: data.file[0].name,
        columnConfig,
      });

      const formData = new FormData();
      formData.append("file", data.file[0]);
      console.log(columnConfig);
      formData.append("columnConfig", JSON.stringify(columnConfig));
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
      console.log("+++++++++");
      console.log(response.data.data);
      console.log("+++++++++");
      setResult(response.data.data);
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
          <label
            htmlFor="file"
            className="block text-sm font-semibold mb-2 text-gray-700"
          >
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
                    <label className="text-xs font-semibold text-gray-600 w-20">
                      Type:
                    </label>
                    <select
                      value={columnMappings[column] || "Text"}
                      onChange={(e) =>
                        handleColumnTypeChange(column, e.target.value)
                      }
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
                        onChange={(e) =>
                          handleMandatoryChange(column, e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">
                        Mandatory
                      </span>
                    </label>

                    {/* Allow Duplicate Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_allow_duplicate"
                        checked={isAllowDuplicate[column] || false}
                        onChange={(e) =>
                          handleAllowDuplicateChange(column, e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">
                        Allow Duplicate
                      </span>
                    </label>
                  </div>

                  {/* Text-Specific Validation Checkboxes */}
                  {columnMappings[column] === "Text" && (
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-200 bg-blue-50 p-3 rounded">
                      {/* Block Special Characters Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="block_special_chars"
                          checked={blockSpecialChars[column] || false}
                          onChange={(e) =>
                            handleBlockSpecialCharsChange(
                              column,
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          Block Special Characters
                        </span>
                      </label>

                      {/* Allow Alpha Numeric Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="allow_alpha_numeric"
                          checked={allowAlphaNumeric[column] || false}
                          onChange={(e) =>
                            handleAllowAlphaNumericChange(
                              column,
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          Allow Alpha Numeric
                        </span>
                      </label>
                    </div>
                  )}
                  {/* Number / Decimal Range */}
                  {(columnMappings[column] === "Number" ||
                    columnMappings[column] === "Decimal") && (
                    <div className="pt-2 border-t border-gray-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min Value"
                          value={numberMinValue[column] || ""}
                          onChange={(e) =>
                            handleNumberMinChange(column, e.target.value)
                          }
                          className="border p-1 rounded text-sm w-30"
                        />

                        <input
                          type="number"
                          placeholder="Max Value"
                          value={numberMaxValue[column] || ""}
                          onChange={(e) =>
                            handleNumberMaxChange(column, e.target.value)
                          }
                          className="border p-1 rounded text-sm w-30"
                        />
                      </div>

                      {numberRangeErrors[column] && (
                        <p className="text-red-500 text-xs">
                          {numberRangeErrors[column]}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Length Configuration */}
                  {["Text", "Email"].includes(columnMappings[column]) && (
                    <div className="pt-2 border-t border-gray-200 bg-green-50 p-3 rounded space-y-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        Length Configuration
                      </div>

                      {/* Radio Buttons */}
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`length_type_${column}`}
                            value="variable"
                            checked={lengthType[column] === "variable"}
                            onChange={(e) =>
                              handleLengthTypeChange(column, "variable")
                            }
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-gray-700">
                            Variable Length
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`length_type_${column}`}
                            value="fixed"
                            checked={lengthType[column] === "fixed"}
                            onChange={(e) =>
                              handleLengthTypeChange(column, "fixed")
                            }
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-gray-700">
                            Fixed Length
                          </span>
                        </label>
                      </div>

                      {/* Variable Length Inputs */}
                      {lengthType[column] === "variable" && (
                        <input
                          type="number"
                          placeholder="Max Length"
                          value={fixedLength[column] || ""}
                          onChange={(e) =>
                            handleFixedLengthChange(column, e.target.value)
                          }
                          className="border p-1 rounded text-sm w-30"
                        />
                      )}

                      {lengthType[column] === "fixed" && (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={minLength[column] || ""}
                            onChange={(e) =>
                              handleMinLengthChange(column, e.target.value)
                            }
                            className="border p-1 rounded text-sm w-30"
                          />

                          <input
                            type="number"
                            placeholder="Max"
                            value={maxLength[column] || ""}
                            onChange={(e) =>
                              handleMaxLengthChange(column, e.target.value)
                            }
                            className="border p-1 rounded text-sm w-30"
                          />
                        </div>
                      )}

                      {/* Length Validation Error */}
                      {lengthErrors[column] && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                          ⚠️ {lengthErrors[column]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Date Min/Max Values - Only for Date type */}
                  {columnMappings[column] === "Date" && (
                    <div className="pt-2 border-t border-gray-200 bg-orange-50 p-3 rounded space-y-3">
                      <div className="text-xs font-semibold text-gray-700">
                        Date Range
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-600 block mb-1">
                            Minimum Date
                          </label>
                          <input
                            type="date"
                            value={dateMinValue[column] || ""}
                            onChange={(e) =>
                              handleDateMinChange(column, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-600 block mb-1">
                            Maximum Date
                          </label>
                          <input
                            type="date"
                            value={dateMaxValue[column] || ""}
                            onChange={(e) =>
                              handleDateMaxChange(column, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      {/* Date Range Validation Error */}
                      {dateRangeErrors[column] && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                          ⚠️ {dateRangeErrors[column]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Block Specific Words - Only for Text, Email, Boolean */}
                  {["Text", "Email", "Boolean"].includes(
                    columnMappings[column],
                  ) && (
                    <div className="pt-2 border-t border-gray-200 bg-yellow-50 p-3 rounded space-y-3">
                      <div className="text-xs font-semibold text-gray-700">
                        Block Specific Words
                      </div>

                      {/* Input and Add Button */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={blockedWordInput[column] || ""}
                          onChange={(e) =>
                            handleBlockedWordInputChange(column, e.target.value)
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddBlockedWord(column);
                            }
                          }}
                          placeholder="Enter word and press Enter or click Add"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-yellow-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddBlockedWord(column)}
                          className="px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded hover:bg-yellow-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Display List of Blocked Words */}
                      {blockedWords[column] &&
                        blockedWords[column].length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {blockedWords[column].map((word, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 bg-yellow-200 px-2 py-1 rounded text-xs text-gray-700"
                              >
                                <span>{word}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveBlockedWord(column, index)
                                  }
                                  className="text-red-600 hover:text-red-800 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Allow Only Predefined Values - Only for Text, Email, Boolean */}
                  {["Text", "Email", "Boolean"].includes(
                    columnMappings[column],
                  ) && (
                    <div className="pt-2 border-t border-gray-200 bg-purple-50 p-3 rounded space-y-3">
                      <div className="text-xs font-semibold text-gray-700">
                        Allow Only Predefined Values
                      </div>

                      {/* Input and Add Button */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={predefinedValueInput[column] || ""}
                          onChange={(e) =>
                            handlePredefinedValueInputChange(
                              column,
                              e.target.value,
                            )
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddPredefinedValue(column);
                            }
                          }}
                          placeholder="Enter value and press Enter or click Add"
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddPredefinedValue(column)}
                          className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded hover:bg-purple-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Display List of Predefined Values */}
                      {predefinedValues[column] &&
                        predefinedValues[column].length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {predefinedValues[column].map((value, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 bg-purple-200 px-2 py-1 rounded text-xs text-gray-700"
                              >
                                <span>{value}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePredefinedValue(column, index)
                                  }
                                  className="text-red-600 hover:text-red-800 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
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
      {result && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">File Summary</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Total Rows</p>
              <p className="text-lg font-bold">{result.total_rows}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Valid Records</p>
              <p className="text-lg font-bold text-green-600">
                {result.valid_records}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Invalid Records</p>
              <p className="text-lg font-bold text-red-600">
                {result.invalid_records}
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Duplicate Count</p>
              <p className="text-lg font-bold">{result.duplicate_count}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Missing Required</p>
              <p className="text-lg font-bold">
                {result.missing_required_count}
              </p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Datatype Errors</p>
              <p className="text-lg font-bold">{result.datatype_error_count}</p>
            </div>

            <div className="bg-pink-50 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">Junk Characters</p>
              <p className="text-lg font-bold">{result.junk_character_count}</p>
            </div>
          </div>
        </div>
      )}
      {result?.error_msg?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Validation Errors</h2>

          <div className="overflow-x-auto border rounded-lg shadow">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Column</th>
                  <th className="px-4 py-3">Error Type</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {result.error_msg.map((err, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{err.row}</td>
                    <td className="px-4 py-2">{err.column}</td>

                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                        {err.error_type}
                      </span>
                    </td>

                    <td className="px-4 py-2">{err.error_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export default ImportFile;
