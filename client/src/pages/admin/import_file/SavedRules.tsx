import { Calendar } from "lucide-react";
import { FileText } from "lucide-react";
import { ListChecks } from "lucide-react";
import {
  Save,
  Layers,
  RefreshCw,
  Plus,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { FiEdit, FiSave } from "react-icons/fi";
import { MdClear } from "react-icons/md";
import { useState, useRef, useEffect } from "react";

import toast from "react-hot-toast";

import apiClient from "../../../services/apiClient";

interface SavedRulesProps {
  hasRules: boolean;
  fileName?: string;
  currentRules?: Record<string, any>;
  onRuleSelect?: (rules: Record<string, any>) => void;
  rulesData?: Record<string, any>;
  headers?: string[];
}

const SavedRules: React.FC<SavedRulesProps> = ({
  hasRules,
  fileName,
  currentRules,
  onRuleSelect,
  headers,
}) => {
  const [savedRules, setSavedRules] = useState<any[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [ruleName, setRuleName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMode, setUpdateMode] = useState<"choice" | "add" | "update">(
    "choice",
  );
  const [open, setOpen] = useState(false);
  const onClose = () => {
    setShowSaveInput(false);
    setShowUpdateModal(false); // ✅ ADD THIS
    setUpdateMode("choice");
  };
  const closeSaveModal = () => {
    setShowSaveInput(false);
  };
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".dropdown")) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateMode("choice");
  };
  const fetchSavedRules = async () => {
    try {
      const response = await apiClient.get(`admin/api/validation-rules`, {
        withCredentials: true,
      });
      setSavedRules(response.data.data);
    } catch (error) {
      console.error("Error fetching saved rules:", error);
    }
  };

  const handleSaveRule = async () => {
    if (!ruleName.trim()) {
      toast.error("Feed name is required");
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post(
        `admin/api/validation-rules`,
        {
          file_name: fileName,
          feed_name: ruleName.trim(),
          rules: currentRules,
        },
        { withCredentials: true },
      );

      toast.success("Rule saved successfully");

      // ✅ update dropdown instantly
      setSavedRules(response.data.data);

      // reset
      setRuleName("");
      setShowSaveInput(false);
      closeUpdateModal();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save rule");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateRule = async () => {
    if (!selectedRuleId) return;

    try {
      setLoading(true);

      const response = await apiClient.put(
        `admin/api/validation-rules/${selectedRuleId}`,
        {
          file_name: fileName,
          rules: currentRules,
        },
        { withCredentials: true },
      );

      toast.success("Rule updated successfully");

      // ✅ update dropdown instantly
      setSavedRules(response.data.data);
      console.log(response.data.data);

      // close modal
      setShowUpdateModal(false);
      setUpdateMode("choice");
      setRuleName("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };
  const handleLoadRule = async () => {
    if (!selectedRuleId) return;
    const rule = savedRules.find((r) => r.id.toString() === selectedRuleId);
    if (rule && onRuleSelect) {
      onRuleSelect(rule.rules);
      toast.success(`Loaded: ${rule.rule_name}`);
    }
  };

  useEffect(() => {
    fetchSavedRules();
  }, []);
  const ruleCount = currentRules ? Object.keys(currentRules).length : 0;
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl shadow-base">
        {/* Header Section */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-500" />
              <div className="text-2xl font-semibold text-gray-700 font-size-lg">
                Rule Manager
              </div>
              {ruleCount > 0 && (
                <span className="px-2 py-0.5 text-base font-medium bg-blue-100 text-blue-700 rounded-full">
                  {ruleCount} {ruleCount === 1 ? "rule" : "rules"}
                </span>
              )}
            </div>

            {hasRules && !selectedRuleId && (
              <button
                onClick={() => setShowSaveInput(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-base font-medium text-sidebarSecondary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200"
              >
                <Plus size={20} />
                Save Rule
              </button>
            )}

            {hasRules && selectedRuleId && selectedRuleId !== "" && (
              <button
                onClick={() => {
                  setShowUpdateModal(true);
                  setUpdateMode("choice");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-base font-medium text-sidebarSecondary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200"
              >
                <FiEdit size={20} />
                Update Rule
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Rule Selection Area */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
              <label className="text-sm font-bold tracking-wider text-gray-700 uppercase">
                Load Existing Rule
              </label>
              {savedRules.length > 0 && (
                <span className="px-2 py-0.5 text-base font-medium bg-gray-100 text-gray-600 rounded-full">
                  {savedRules.length} available
                </span>
              )}
            </div>

            <div className="relative dropdown">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-4 py-3 transition-all duration-200 bg-white border-2 border-gray-200 shadow-sm rounded-xl hover:border-blue-400 focus:border-blue-500 focus:outline-none hover:shadow-md"
              >
                <span
                  className={`text-base ${selectedRuleId ? "text-gray-800 font-medium" : "text-gray-400"}`}
                >
                  {selectedRuleId
                    ? savedRules.find((r) => r._id === selectedRuleId)
                        ?.feed_name
                    : "Select a saved rule..."}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="absolute z-20 w-full mt-2 overflow-auto duration-200 bg-white border border-gray-200 shadow-2xl rounded-xl max-h-80 animate-in slide-in-from-top-2">
                  {savedRules.map((rule, idx) => (
                    <div
                      key={rule._id}
                      onClick={() => {
                        setSelectedRuleId(rule._id);
                        setOpen(false);
                        const ruleKeys = Object.keys(rule.rules || {});
                        const fileHeaders = headers || [];
                        const missingHeaders = ruleKeys.filter(
                          (key) => !fileHeaders.includes(key),
                        );
                        if (missingHeaders.length > 0) {
                          setSelectedRuleId("");

                          toast.error(
                            `Can not load rule as headers are missing: ${missingHeaders.join(", ")}`,
                          );
                          return;
                        }
                        onRuleSelect?.(rule.rules);
                        toast.success(
                          `Rule Loaded successfully: ${rule.feed_name}`,
                        );
                      }}
                      className={`p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration- ${
                        idx !== savedRules.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 text-base font-bold text-gray-800">
                            {rule.feed_name}
                          </div>
                          <div className="flex items-center gap-3 text-base text-gray-500">
                            <span className="flex items-center gap-1">
                              <span>
                                <Calendar size={14} className="text-gray-400" />
                              </span>{" "}
                              {new Date(rule.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>
                                <ListChecks
                                  size={14}
                                  className="text-gray-400"
                                />
                              </span>{" "}
                              {Object.keys(rule.rules || {}).length} rules
                            </span>
                            <span className="flex items-center gap-1">
                              <span>
                                <FileText size={14} className="text-blue-500" />
                              </span>{" "}
                              {rule.file_name}
                            </span>
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Empty state message */}
            {savedRules.length === 0 && (
              <div className="flex items-center gap-3 p-4 mt-3 border border-red-200 shadow-sm bg-red-50 rounded-xl">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    No rules found
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Rule Modal - Modern Design */}
      {showSaveInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center duration-200 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={onClose}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-[500px] max-w-[90%] rounded-2xl shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-sidebarSecondary"></div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Save Rule Configuration
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
              >
                <MdClear size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Feed Name Input */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">
                  Feed Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., product_feed, user_data, inventory"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                  autoFocus
                />
                <p className="mt-1.5 text-base text-gray-500">
                  This will be used to identify your rule set
                </p>
              </div>

              {/* File Name Display */}
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <label className="block mb-2 text-base font-semibold tracking-wider text-gray-500 uppercase">
                  Associated File
                </label>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 text-base bg-white border border-gray-200 rounded">
                    {fileName || "No file selected"}
                  </code>
                </div>
              </div>

              {/* Rules Preview */}
              {currentRules && Object.keys(currentRules).length > 0 && (
                <div className="p-3 border border-blue-100 rounded-lg bg-blue-50">
                  <p className="mb-2 text-base font-medium text-blue-800">
                    Headers rules to be saved:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(currentRules).map((header, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-base bg-white text-blue-700 rounded border border-blue-200"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={onClose}
                className="inline-flex  px-6 py-3 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50  active:scale-[0.98] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={loading}
                className="inline-flex  px-6 py-3 text-lg font-medium bg-sidebarSecondary  text-white rounded-lg shadow-md hover:shadow-lg hover:bg-sidebarSecondaryHover active:scale-[0.98] transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={20} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Rule"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal - Modern Design */}
      {showUpdateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center duration-200 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={closeUpdateModal}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-[500px] max-w-[90%] rounded-2xl shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 rounded-full bg-sidebarSecondary"></div>

                <h2 className="text-2xl font-semibold text-gray-800">
                  Update Rule
                </h2>
              </div>
              <button
                onClick={closeUpdateModal}
                className="p-1 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
              >
                <MdClear size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {updateMode === "choice" && (
                <>
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-blue-50">
                      <Layers className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-800">
                      Rule contains {ruleCount}{" "}
                      {ruleCount === 1 ? "column" : "columns"}
                    </h3>
                    <>{fileName}</>
                    <p className="text-base text-gray-500">
                      How would you like to proceed?
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      // selectedRuleId
                      // onClick={() => setUpdateMode("add")}
                      onClick={() => {
                        setShowSaveInput(true);
                        setShowUpdateModal(false);
                      }}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-medium text-white transition-all shadow-md bg-sidebarSecondary rounded-xl hover:shadow-lg hover:bg-sidebarSecondaryHover"
                    >
                      <Plus size={20} />
                      Save New
                    </button>

                    <button
                      onClick={handleUpdateRule}
                      className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-medium text-white transition-all bg-green-500 rounded-xl hover:bg-green-600"
                    >
                      <FiSave size={20} />
                      Update Existing
                    </button>
                  </div>
                </>
              )}

              {updateMode === "add" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1.5">
                      New Feed Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="e.g., product_feed, user_data, inventory"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setUpdateMode("choice")}
                      className="flex-1 px-4 py-2 text-base font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSaveRule}
                      className="flex-1 px-4 py-2 text-base font-medium text-white transition-colors rounded-lg bg-sidebarSecondary hover:bg-sidebarSecondaryHover"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SavedRules;
