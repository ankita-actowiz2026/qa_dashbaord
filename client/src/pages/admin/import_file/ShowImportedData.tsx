import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import ShowUploadedFile from "./ShowUploadedFile";
import ShowValidationRules from "./ShowValidationRules";
import apiClient from "../../../services/apiClient";

type LocationState = {
  headers: string[];
  filePath: string;
  fileName: string;
};

const ShowImportedData: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState;

  const headers = state?.headers || [];
  const filePath = state?.filePath || "";
  const fileName = state?.fileName || "";

  const [rulesData, setRulesData] = useState<Record<string, any>>({});
  const [validating, setValidating] = useState(false);

  // ✅ Handle refresh / direct access
  useEffect(() => {
    if (!state || !headers.length) {
      toast.error("No file data found. Please upload again.");
      navigate("/admin/import_file");
    }
  }, []);

  // ✅ Run validation API
  const handleRunValidation = async () => {
    try {
      if (!filePath) {
        toast.error("Missing file reference");
        return;
      }

      if (Object.keys(rulesData).length === 0) {
        toast.error("Please add at least one rule");
        return;
      }

      setValidating(true);

      // remove unnecessary "name" field
      const cleanedRules = Object.fromEntries(
        Object.entries(rulesData).map(([key, value]: any) => {
          const { name, ...rest } = value;
          return [key, rest];
        }),
      );

      const payload = {
        columnConfig: JSON.stringify(cleanedRules),
        fileName: filePath,
      };

      const response = await apiClient.post(`admin/api/qa_file`, payload, {
        withCredentials: true,
      });

      toast.success("Validation completed successfully");

      // ✅ Navigate to result page
      navigate("/admin/import_file/validation_result", {
        state: {
          responseData: response.data,
          requestData: rulesData,
          fileName,
        },
      });
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Validation failed";
      toast.error(msg);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* 🔹 Uploaded File Info */}
      <ShowUploadedFile
        fileName={fileName}
        headers={headers}
        onReset={() => navigate("/admin/import_file")}
        onValidate={handleRunValidation}
        hasRules={Object.keys(rulesData).length > 0}
        validating={validating}
      />

      {/* 🔹 Validation Rules UI */}
      {<ShowValidationRules headers={headers} onRulesChange={setRulesData} />}
    </div>
  );
};

export default ShowImportedData;
