import React, { useEffect, useState, useRef } from "react";

import toast from "react-hot-toast";
import { Save, FolderOpen } from "lucide-react";
import apiClient from "../../../services/apiClient";
import { MdClear } from "react-icons/md";
import RuleList from "./RuleList";

interface SavedRulesProps {
  hasRules: boolean;
  fileName?: string;
  currentRules?: Record<string, any>;
  onRuleSelect?: (rules: Record<string, any>) => void;
  rulesData?: Record<string, any>;
}

const SavedRules: React.FC<SavedRulesProps> = ({
  hasRules,
  fileName,
  currentRules,
  onRuleSelect,
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
  const onClose = () => {
    setShowSaveInput(false);
    setShowUpdateModal(false); // ✅ ADD THIS
    setUpdateMode("choice");
  };
  const closeSaveModal = () => {
    setShowSaveInput(false);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateMode("choice");
  };
  const fetchSavedRules = async () => {
    try {
      const response = await apiClient.get(`admin/api/file_rule`, {
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
      alert("add call");
      const response = await apiClient.post(
        `admin/api/file_rule`,
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
      alert("update call");
      const response = await apiClient.put(
        `admin/api/file_rule/${selectedRuleId}`,
        {
          file_name: fileName,
          feed_name: ruleName || "Updated Rule",
          rules: currentRules,
        },
        { withCredentials: true },
      );

      toast.success("Rule updated successfully");

      // ✅ update dropdown instantly
      setSavedRules(response.data.data);

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

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50">
        {/* Load Rule Dropdown */}
        {JSON.stringify(currentRules)}
        <select
          value={selectedRuleId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedRuleId(id);

            const selectedRule = savedRules.find(
              (r) => r._id.toString() === id,
            );

            if (selectedRule && onRuleSelect) {
              onRuleSelect(selectedRule.rules); // ✅ update parent rulesData
              toast.success(`Loaded: ${selectedRule.feed_name}`);
            }
          }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Load saved rule...</option>
          {savedRules.length > 0 ? (
            savedRules.map((rule) => (
              <option key={rule._id} value={rule._id}>
                {rule.feed_name}
              </option>
            ))
          ) : (
            <option value="__empty" disabled>
              -- No rules found --
            </option>
          )}
        </select>

        {/* Save Rule */}
        {/* {hasRules && (
        <>
          {showSaveInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Rule name"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveRule}
                disabled={loading}
                className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowSaveInput(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
            >
              <Save size={14} />
              Save Current Rules
            </button>
          )}
        </>
      )} */}
        {hasRules && selectedRuleId && selectedRuleId !== "" && (
          <button
            onClick={() => {
              setShowUpdateModal(true);
              setUpdateMode("choice");
            }}
            className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
          >
            Update Rule
          </button>
        )}
        {hasRules && !selectedRuleId && (
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
          >
            <Save size={14} />
            Add Rule
          </button>
        )}
      </div>
      {showUpdateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={closeUpdateModal}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-[500px] rounded-xl shadow-xl relative p-6"
          >
            {/* Close button */}
            <button
              onClick={closeUpdateModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <MdClear size={18} />
            </button>

            {/* STEP 1: CHOICE */}
            {updateMode === "choice" && (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  Rule contains {Object.keys(currentRules || {}).length} columns
                </h2>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUpdateMode("add")}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Add New
                  </button>

                  <button
                    onClick={handleUpdateRule}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                  >
                    Update Existing
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: ADD NEW */}
            {updateMode === "add" && (
              <>
                <h2 className="text-lg font-semibold mb-4">Add New Rule</h2>

                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Enter feed name"
                  className="w-full border rounded px-3 py-2 mb-4"
                />

                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Save
                </button>
              </>
            )}

            {/* STEP 3: UPDATE EXISTING */}
          </div>
        </div>
      )}
      {showSaveInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-[500px] rounded-xl shadow-xl relative p-6"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <MdClear size={18} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Save Rule
            </h2>

            {/* Feed Name */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Feed Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Enter feed name"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* File Name */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                File Name
              </label>
              <p className="text-sm bg-gray-100 px-3 py-2 rounded-lg">
                {fileName}
                {JSON.stringify(currentRules)}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveRule}
                disabled={loading}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SavedRules;
