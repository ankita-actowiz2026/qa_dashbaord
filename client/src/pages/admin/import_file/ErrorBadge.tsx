import { GoDotFill } from "react-icons/go";

type Props = {
  count: number;
  label: string;
};

const ErrorBadge = ({ count, label }: Props) => {
  const isSuccess = !count || count === 0;

  const getMessage = () => {
    if (isSuccess) return "No validation errors found";

    switch (label) {
      case "Length Type":
        return `${count} value${count > 1 ? "s" : ""} failed length validation`;

      case "Redundant Value":
        return `${count} duplicate value${count > 1 ? "s" : ""} found`;

      case "Regex":
        return `${count} value${count > 1 ? "s" : ""} did not match pattern`;

      case "Data Type":
        return `${count} value${count > 1 ? "s" : ""} have incorrect type`;

      case "fixed_header":
        return `${count} value${count > 1 ? "s" : ""} not in allowed values`;

      case "cell_start_with":
        return `${count} value${count > 1 ? "s" : ""} invalid prefix`;

      case "cell_end_with":
        return `${count} value${count > 1 ? "s" : ""} invalid suffix`;

      case "not_match_found":
        return `${count} blocked value${count > 1 ? "s" : ""} found`;

      case "is_required":
        return `${count} missing value${count > 1 ? "s" : ""}`;

      default:
        return `${count} validation error${count > 1 ? "s" : ""}`;
    }
  };

  return (
    <div
      className={`mt-2 text-base font-medium flex items-center gap-1 px-2 py-1 rounded ${
        isSuccess ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
      }`}
    >
      <GoDotFill size={10} />
      {getMessage()}
    </div>
  );
};

export default ErrorBadge;
