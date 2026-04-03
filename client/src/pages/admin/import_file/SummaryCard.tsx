import { CheckCircle, XCircle, Info } from "lucide-react";

const SummaryCard = ({ title, value, success, error }: any) => {
  const isSuccess = success;
  const isError = error;

  const bgStyle = isSuccess
    ? "bg-green-50 border-green-100"
    : isError
      ? "bg-red-50 border-red-100"
      : "bg-gray-50 border-gray-200";

  const textColor = isSuccess
    ? "text-green-600"
    : isError
      ? "text-red-600"
      : "text-gray-800";

  const Icon = isSuccess ? CheckCircle : isError ? XCircle : Info;

  return (
    <div
      className={`relative p-4 rounded-2xl border ${bgStyle} shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Top Accent Line */}
      <div
        className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl ${
          isSuccess ? "bg-green-500" : isError ? "bg-red-500" : "bg-gray-300"
        }`}
      />

      {/* Content */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
        </div>

        {/* Icon */}
        <div
          className={`p-2 rounded-xl ${
            isSuccess
              ? "bg-green-100 text-green-600"
              : isError
                ? "bg-red-100 text-red-600"
                : "bg-gray-200 text-gray-600"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
