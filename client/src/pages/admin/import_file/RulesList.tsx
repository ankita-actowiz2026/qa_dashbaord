import React from "react";
import { GoDotFill } from "react-icons/go";

type RuleItem = {
  label: string;
  value: string;
  errorMsg?: string;
};

type Props = {
  rules: RuleItem[];
};

const RulesList: React.FC<Props> = ({ rules }) => {
  if (!rules || rules.length === 0) {
    return <div className="text-base text-green-600">No rules applied</div>;
  }

  return (
    <div className="space-y-2">
      {rules.map((rule, i) => (
        <div
          key={i}
          className="flex flex-col gap-1 px-3 py-2 border rounded-lg bg-gray-50"
        >
          {/* 🔹 Top Row */}
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-700">
              {rule.label}
            </span>

            <span className="text-base font-semibold text-gray-900 text-right max-w-[60%] break-words">
              {rule.value}
            </span>
          </div>

          {/* 🔹 Error Message */}
          {rule.errorMsg && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <GoDotFill size={10} />
              {rule.errorMsg}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RulesList;
