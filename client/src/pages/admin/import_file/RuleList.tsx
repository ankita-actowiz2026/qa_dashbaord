type Props = {
  rules: Rule[];
  currentRules: Rule[];
  onEdit: (rule: Rule, index: number) => void;
  onDelete: (index: number) => void;
};

const RuleList: React.FC<Props> = ({
  rules,
  currentRules,
  onEdit,
  onDelete,
}) => {
  const formatText = (text: string) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";

  return (
    <div className="space-y-3">
      {rules
        .filter((rule) => rule.type !== "date_format")
        .map((rule, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-4 py-3 border rounded-lg bg-gray-50"
          >
            {/* ACTIONS */}
          </div>
        ))}
    </div>
  );
};

export default RuleList;
