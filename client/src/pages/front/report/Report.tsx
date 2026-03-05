import React, { useState, useEffect } from 'react';
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ReportData {
  _id: string;
  user_id: string;
  user_name: string;
  file_name: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  duplicate_count: number;
  missing_required_count: number;
  datatype_error_count: number;
  junk_character_count: number;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    data: ReportData[];
    total: number;
    page: number;
    limit: number;
  };
}

function Report() {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [exporting, setExporting] = useState<{summary: boolean, clean: boolean}>({summary: false, clean: false});

  // Fetch report data
  const fetchReportData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const tokenData = JSON.parse(localStorage.getItem("user_data") || "{}"); 

      const response = await axios.get(
        `${BACKEND_URL}/api/report?page=${page}&limit=${limit}`,{ headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          }}
      );

      if (response.data.success) {
        setReportData(response.data.data.data);
        setCurrentPage(response.data.data.page);
        setTotalPages(Math.ceil(response.data.data.total / limit));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch report data');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export summary PDF
  const handleExportSummary = async (importedFileId: string) => {
    try {
      setExporting({...exporting, summary: true});
      const tokenData = JSON.parse(localStorage.getItem("user_data") || "{}"); 

      const response = await axios.get(
        `${BACKEND_URL}/api/report/download_summary/${importedFileId}`,{ headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          }}
      );

      if (response.data.success && response.data.data.pdfUrl) {
        window.open(response.data.data.pdfUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to export summary');
      console.error('Error exporting summary:', err);
    } finally {
      setExporting({...exporting, summary: false});
    }
  };

  // Export clean data
  const handleExportCleanData = async (importedFileId: string) => {
    try {
      setExporting({...exporting, clean: true});
      const tokenData = JSON.parse(localStorage.getItem("user_data") || "{}"); 

      const response = await axios.get(
        `${BACKEND_URL}/api/report/download_clean_data/${importedFileId}`,{ headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          }}
      );

      if (response.data.success && response.data.data.dataUrl) {
        window.open(response.data.data.dataUrl, '_blank');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to export clean data');
      console.error('Error exporting clean data:', err);
    } finally {
      setExporting({...exporting, clean: false});
    }
  };

  useEffect(() => {
    fetchReportData(currentPage);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchReportData(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Reports</h1>
          <p className="text-gray-600">View and manage your imported file reports</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">No data available</div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">                     
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">File Name</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Total</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Valid</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Invalid</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Duplicate</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Missing Req</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Datatype Err</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Junk Char</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created At</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, index) => (
                      <tr
                        key={row._id}
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">{row.user_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">{row.file_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium">{row.total_records}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium text-green-600">{row.valid_records}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium text-red-600">{row.invalid_records}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium text-orange-600">{row.duplicate_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium text-yellow-600">{row.missing_required_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium text-red-600">{row.datatype_error_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-medium text-red-600">{row.junk_character_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-center space-x-2 flex justify-center gap-2">
                          <button
                            onClick={() => handleExportSummary(row._id)}
                            disabled={exporting.summary}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-xs whitespace-nowrap transition-colors"
                            title="Export Summary as PDF"
                          >
                            {exporting.summary ? 'Exporting...' : 'Summary'}
                          </button>
                          <button
                            onClick={() => handleExportCleanData(row._id)}
                            disabled={exporting.clean}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 text-xs whitespace-nowrap transition-colors"
                            title="Export Clean Data as XLSX"
                          >
                            {exporting.clean ? 'Exporting...' : 'Clean Data'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of{' '}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Report;