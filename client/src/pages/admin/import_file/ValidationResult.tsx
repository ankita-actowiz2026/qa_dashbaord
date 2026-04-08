import ColumnDetailRow from "./ColumnDetailRow";
import apiClient from "../../../services/apiClient";
import { useState, useMemo, useEffect } from "react";
import { FiCheckCircle } from "react-icons/fi";

import SummaryCard from "./SummaryCard";
import { useNavigate } from "react-router-dom";
import { FaUpload } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { CheckCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const ignoreColumns = [
  "total_records",
  "valid_records",
  "invalid_records",
  "error_msg",
  "unique_values",
  "unique_records",
  "invalid_row_numbers",
  "error_rows",
];
const getFilteredColumns = (columnStats: any) => {
  return Object.entries(columnStats).filter(([_, stats]: any) =>
    Object.entries(stats).some(([key, value]) => !ignoreColumns.includes(key)),
  );
};

const ValidationResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const responseData = location.state?.responseData;
  const requestData = location.state?.requestData;
  const fileName = location.state?.fileName;
  const dbFileName = location.state?.dbFileName;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fileName = dbFileName.split("/").pop();
        const res = await apiClient.get(
          `admin/api/qa_file/validation-response/${fileName}`,
        );
        console.log(res.data.data.column_wise_stats);
        setColumn_wise_stats(res.data.data.column_wise_stats);
      } catch (err) {
        console.error(err);
        // setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [loading, setLoading] = useState(false);
  const [column_wise_stats, setColumn_wise_stats] = useState<any>({});
  if (!responseData) {
    return (
      <div className="p-6 text-center text-gray-500">No data available</div>
    );
  }
  const {
    total_rows = 0,
    valid_rows = 0,
    invalid_rows = 0,
  } = responseData?.data || {};

  const filteredColumns = useMemo(
    () => getFilteredColumns(column_wise_stats),
    [column_wise_stats],
  );
  const dependencyColumnSet = useMemo(() => {
    const set = new Set();

    Object.values(requestData || {}).forEach((rule: any) => {
      if (!rule?.dependency) return;

      const keys = Object.keys(rule.dependency);

      // ❌ ignore first key (parent)
      const childKeys = keys.slice(1);

      childKeys.forEach((key) => {
        key.split(",").forEach((col: string) => {
          set.add(col.trim());
        });
      });
    });

    return set;
  }, [requestData]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const fileName = dbFileName.split("/").pop();
      const res = await apiClient.get(
        `admin/api/qa_file/download/${fileName}`, // 👈 your API
        {
          responseType: "blob", // 🔥 IMPORTANT
        },
      );

      // Create file URL
      const url = window.URL.createObjectURL(new Blob([res.data]));

      // Create temp link
      const link = document.createElement("a");
      link.href = url;

      // Extract file name
      const cleanFileName = fileName?.split("/").pop() || "report.xlsx";

      link.setAttribute("download", cleanFileName);

      document.body.appendChild(link);
      link.click();

      link.remove();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto ">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-transparent md:text-5xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text">
                Validation Results
              </h1>
              <p className="flex items-center gap-2 text-slate-500">
                <FiCheckCircle className="text-green-500" />
                Data quality report for your uploaded file
              </p>
            </div>

            {/* File info badge - make it more visual */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 border rounded-full shadow-sm bg-white/80 backdrop-blur-sm border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-base text-slate-600">
                    {fileName || "No file selected"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/admin/import_file")}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 rounded-full hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FaUpload className="transition-colors text-slate-500 group-hover:text-blue-500" />
                <span className="font-medium text-slate-700 group-hover:text-blue-600">
                  Upload New
                </span>
              </button>
            </div>
          </div>
        </div>
        {/* 🔹 TOP SUMMARY */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <SummaryCard title="Total Records" value={total_rows} />
            <SummaryCard title="Valid Records" value={valid_rows} success />
            <SummaryCard title="Invalid Records" value={invalid_rows} error />
          </div>
        </div>
        <div className="flex justify-end mb-6">
          <button
            onClick={handleDownload}
            className="relative inline-flex items-center gap-3 px-8 py-3 overflow-hidden font-medium text-white transition-all duration-300 shadow-lg group bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-sidebarSecondary to-sidebarSecondaryHover"></div>
            <FiDownload className="relative z-10 text-lg transition-transform group-hover:scale-110" />
            <span className="relative z-10">Download Full Report</span>
          </button>
        </div>
        {/* 🔹 COLUMN LIST */}
        <div className="overflow-hidden bg-white border border-gray-100 shadow-lg rounded-2xl">
          <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-white border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                  <div className="w-1.5 h-7 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  Column Analysis
                </h2>
                <p className="mt-1 text-base text-slate-500">
                  Detailed validation results for each column
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 text-base font-medium text-blue-700 rounded-full bg-blue-50">
                  {filteredColumns.length} columns analyzed
                </div>
              </div>
            </div>
          </div>

          {/* BODY */}
          {/* Grid Header */}
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full border-collapse">
              <thead className="border-b-2 bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[5%] whitespace-nowrap">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[15%] whitespace-nowrap">
                    Headers
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[6%] whitespace-nowrap">
                    Total
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[8%] whitespace-nowrap">
                    QC Pass
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[8%] whitespace-nowrap">
                    QC Fail
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[6%] whitespace-nowrap">
                    Empty Rows
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[10%] whitespace-nowrap">
                    Reasons
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[8%] whitespace-nowrap">
                    Unique %
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[8%] whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[8%] whitespace-nowrap">
                    QC Fail %
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[13%]  whitespace-nowrap">
                    No. of Row ID
                  </th>
                  <th className="px-3 py-3 text-left text-base font-bold text-slate-600 uppercase tracking-wider w-[5%]  whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredColumns.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 mb-4 rounded-full bg-green-50">
                          <CheckCircle className="text-green-500" size={48} />
                        </div>
                        <p className="mb-2 text-xl font-bold text-green-600">
                          🎉 All validations passed!
                        </p>
                        <p className="text-gray-500">
                          No issues were found in your uploaded data. Your file
                          looks great!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredColumns.map(([col, stats]: any, index: number) => (
                    <ColumnDetailRow
                      key={col}
                      col={col}
                      stats={stats}
                      index={index}
                      total_rows={total_rows}
                      colRules={requestData?.[col] || {}}
                      dependencyColumnSet={dependencyColumnSet}
                      // ... other props
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
export default ValidationResult;
