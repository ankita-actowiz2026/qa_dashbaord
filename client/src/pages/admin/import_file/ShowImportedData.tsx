import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import ShowUploadedFile from "./ShowUploadedFile";
import ShowValidationRules from "./ShowValidationRules";
import apiClient from "../../../services/apiClient";
import SavedRules from "./SavedRules";
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
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      const response = await apiClient.post(`admin/api/qa_file`, payload, {
        withCredentials: true,
      });

      toast.success("Validation completed successfully");

      // ✅ Navigate to result page
      navigate("/admin/import_file/validation_result", {
        state: {
          responseData: response.data,
          requestData: cleanedRules,
          fileName,
        },
      });
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Validation failed";
      toast.error(msg);
    } finally {
      setValidating(false);
      setLoading(false);
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
      <SavedRules
        hasRules={Object.keys(rulesData).length > 0}
        fileName={fileName}
        currentRules={rulesData}
        onRuleSelect={(selectedRules) => {
          setRulesData(selectedRules);
          toast.success("Rules loaded successfully");
        }}
      />
      {/* 🔹 Validation Rules UI */}
      {<ShowValidationRules headers={headers} onRulesChange={setRulesData} />}
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
    </div>
  );
};

export default ShowImportedData;
