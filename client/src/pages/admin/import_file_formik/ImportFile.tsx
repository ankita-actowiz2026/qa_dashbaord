import React, { useState, useEffect } from "react";
import { DEFAULTS } from "./defaultValues";
import ValidationRow from "./ValidationRow";
import ValidationResult from "./ValidationResult";
import * as XLSX from "xlsx";
import axios from "axios";
import { Formik, Form, FieldArray, Field, getIn } from "formik";
import * as Yup from "yup";

const {
  allowedExtensions,
  dataTypes,
  date_format_options,
  default_length_validation_value,
} = DEFAULTS;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type HeaderType = { name: string };

const ImportFile: React.FC = () => {
  const [headers, setHeaders] = useState<HeaderType[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "danger" | "">("");
  const [responseData, setResponseData] = useState<any>(null);
  const [requestData, setRequestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

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
        }
        return;
      }
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setHeaders((json[0] || []).map((h: string) => ({ name: h })));
    } catch {
      setMsg("Invalid file format");
      setMsgType("danger");
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!validateFile(selectedFile)) {
      alert("Only .xlsx, .xls, .csv, .json files allowed");
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    await readHeaders(selectedFile);
  };

  // Initial form values
  const initialValues = {
    def_date_format: "YYYY-MM-DD HH:mm:ss",
    def_dep: "true",
    headers: headers.map((h) => ({
      name: h.name,
      data_type: "string",
      has_empty: false,
      length_validation_type: "variable",
      min_length: "",
      max_length: "",
      cell_contains: "",
      cell_contains_value: "",
      data_redundant_threshold: false,
      data_redundant_value: "",
      fixed_header: [] as { value: string }[],
      cell_start_with: [] as { value: string }[],
      cell_end_with: [] as { value: string }[],
      not_match_found: [] as { value: string }[],
      has_dependency: false,
      dependency_condition: "yes",
      dependency_value: "",
      dependencies: [] as any[],
    })),
  };

  // Yup validation
  const validationSchema = Yup.object({
    headers: Yup.array().of(
      Yup.object().shape({
        name: Yup.string().required(),
        data_type: Yup.string().required(),
        min_length: Yup.number().when("length_validation_type", {
          is: "variable",
          then: Yup.number().required("Min length required"),
        }),
        max_length: Yup.number().when("length_validation_type", {
          is: "variable",
          then: Yup.number().required("Max length required"),
        }),
        fixed_header: Yup.array().of(
          Yup.object().shape({
            value: Yup.string().required("Fixed header required"),
          }),
        ),
        cell_start_with: Yup.array().of(
          Yup.object().shape({
            value: Yup.string().required("Cell start with required"),
          }),
        ),
        cell_end_with: Yup.array().of(
          Yup.object().shape({
            value: Yup.string().required("Cell end with required"),
          }),
        ),
        not_match_found: Yup.array().of(
          Yup.object().shape({
            value: Yup.string().required("Blocked required"),
          }),
        ),
        dependencies: Yup.array().of(
          Yup.object().shape({
            condition: Yup.string().required(),
            value: Yup.string().when("condition", {
              is: "other",
              then: Yup.string().required("Value required for 'other'"),
              otherwise: Yup.string(),
            }),
            subDependencies: Yup.array().of(
              Yup.object().shape({
                condition: Yup.string().required(),
                value: Yup.string().when("condition", {
                  is: "other",
                  then: Yup.string().required(
                    "Value required for 'other' sub-dependency",
                  ),
                  otherwise: Yup.string(),
                }),
                headers: Yup.array().of(Yup.string()),
              }),
            ),
          }),
        ),
      }),
    ),
  });

  const onSubmit = async (values: typeof initialValues) => {
    try {
      const payload: any = {};
      values.headers.forEach((row) => {
        payload[row.name] = {
          ...row,
          fixed_header: row.fixed_header.map((v) => v.value),
          cell_start_with: row.cell_start_with.map((v) => v.value),
          cell_end_with: row.cell_end_with.map((v) => v.value),
          not_match_found: row.not_match_found.map((v) => v.value),
          date_format: row.data_type === "date" ? row.def_date_format : null,
        };
      });

      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("columnConfig", JSON.stringify(payload));

      let result = "";
      for (let [key, value] of formData.entries()) {
        result += `${key}: ${value}\n`;
      }
      setRequestData(result);

      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/qa_file`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setResponseData(response.data);
    } catch (error: any) {
      setMsg(error.response?.data?.message || "Submission failed");
      setMsgType("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-slate-200">
      <div className="w-full max-w-7xl bg-white shadow-xl rounded-2xl px-4 sm:px-8 py-6">
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

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Import File</h1>
          <p className="text-gray-500">
            Upload a file and map column data types
          </p>
        </div>

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
          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ values, errors, setFieldValue }) => (
              <Form>
                <FieldArray name="headers">
                  {() =>
                    values.headers.map((header, index) => (
                      <ValidationRow
                        key={header.name}
                        header={header}
                        index={index}
                        values={values}
                        errors={errors}
                        setFieldValue={setFieldValue}
                        dataTypes={dataTypes}
                        date_format_options={date_format_options}
                      />
                    ))
                  }
                </FieldArray>

                <div className="flex justify-center mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 block mx-auto"
                  >
                    {loading ? "Processing..." : "Save"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}

        {requestData}
        {responseData && <ValidationResult response={responseData} />}
      </div>
    </div>
  );
};

export default ImportFile;
