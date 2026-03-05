import { FaFileExcel, FaFilePdf } from "react-icons/fa";

interface ReportRowProps {
  row: any;
  exportingSummary: boolean;
  exportingClean: boolean;
  onExportSummary: (id: string) => void;
  onExportClean: (id: string) => void;
}

function ReportRow({
  row,
  exportingSummary,
  exportingClean,
  onExportSummary,
  onExportClean,
}: ReportRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-100 transition-colors">
      <td className="px-6 py-4 text-sm">{row.user_name}</td>
      <td className="px-6 py-4 text-sm">{row.user_email}</td>

      <td className="px-6 py-4 text-sm truncate max-w-xs">
        {row.file_name}
      </td>

      <td className="px-6 py-4 text-center font-medium">
        {row.total_records}
      </td>

      <td className="px-6 py-4 text-center text-green-600 font-medium">
        {row.valid_records}
      </td>

      <td className="px-6 py-4 text-center text-red-600 font-medium">
        {row.invalid_records}
      </td>

      <td className="px-6 py-4 text-center text-orange-600 font-medium">
        {row.duplicate_count}
      </td>

      <td className="px-6 py-4 text-center text-yellow-600 font-medium">
        {row.missing_required_count}
      </td>

      <td className="px-6 py-4 text-center text-red-600 font-medium">
        {row.datatype_error_count}
      </td>

      <td className="px-6 py-4 text-center text-red-600 font-medium">
        {row.junk_character_count}
      </td>

      <td className="px-6 py-4 text-gray-600">
        {new Date(row.createdAt).toLocaleDateString()}
      </td>

      <td className="px-6 py-4 flex justify-center gap-2">

        {/* PDF Button */}
        <button
          onClick={() => onExportSummary(row._id)}
          disabled={exportingSummary}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          title="Export Summary"
        >
          {exportingSummary ? "..." : <FaFilePdf size={18} />}
        </button>

        {/* XLSX Button */}
        <button
          onClick={() => onExportClean(row._id)}
          disabled={exportingClean || row.clean_data_total === 0}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          title="Download Clean Data"
        >
          {exportingClean ? "..." : <FaFileExcel size={18} />}
        </button>

      </td>
    </tr>
  );
}

export default ReportRow;