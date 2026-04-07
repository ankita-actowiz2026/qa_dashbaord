import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, FolderOpen } from "lucide-react";
import apiClient from "../../../services/apiClient";

interface SavedRulesProps {
  hasRules: boolean;
  fileName?: string;
  currentRules?: Record<string, any>;
  onRuleSelect?: (rules: Record<string, any>) => void;
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

  const fetchSavedRules = async () => {
    try {
      const response = await apiClient.get(`admin/api/file_rule`, {
        withCredentials: true,
      });
      setSavedRules(response.data.rules || response.data || []);
    } catch (error) {
      console.error("Error fetching saved rules:", error);
    }
  };

  const handleSaveRule = async () => {
    if (!ruleName.trim()) {
      toast.error("Please enter a rule name");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(
        `admin/api/file_rule`,
        {
          file_name: fileName,
          rule_name: ruleName.trim(),
          rules: currentRules,
        },
        { withCredentials: true },
      );

      toast.success("Rule saved successfully");
      setRuleName("");
      setShowSaveInput(false);
      await fetchSavedRules();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save rule");
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
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50">
      {/* Load Rule Dropdown */}
      <select
        value={selectedRuleId}
        onChange={(e) => setSelectedRuleId(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="">Load saved rule...</option>
        {/* {savedRules.map((rule) => (
          <option key={rule.id} value={rule.id}>
            {rule.rule_name}
          </option>
        ))} */}
      </select>

      <button
        onClick={handleLoadRule}
        disabled={!selectedRuleId}
        className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        <FolderOpen size={14} />
        Load
      </button>

      {/* Save Rule */}
      {hasRules && (
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
      )}
    </div>
  );
};

export default SavedRules;
