import React, { useMemo, useState, useEffect } from "react";
import { useWatch } from "react-hook-form";
import { FiTrash2, FiEdit } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";

const SubDependencyLatest = ({
  headerName,
  headersList,
  onSaveList,
  inputClass,
  control,
  setValue,
}) => {
  const subPath = `${headerName}.sub_dependencies`;
  const subDependencies = useWatch({
    control,
    name: subPath,
    defaultValue: [],
  });

  const savedList = Array.isArray(subDependencies) ? subDependencies : [];
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [error, setError] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    headers: [],
    condition: "true",
    value: "",
  });

  /* ===================== */
  /* FILTER HEADERS */
  /* ===================== */
  const filteredHeaders = useMemo(() => {
    return headersList.filter((h) => h !== headerName);
  }, [headersList, headerName]);

  /* ===================== */
  /* VALIDATION */
  /* ===================== */
  const validate = () => {
    const errors = {};

    if (!formData.headers || formData.headers.length === 0) {
      errors.headers = "Please select at least one column";
    }

    if (formData.condition === "other" && !formData.value?.trim()) {
      errors.value = "Value is required for some other value";
    }

    return errors;
  };

  /* ===================== */
  /* RESET */
  /* ===================== */
  const resetForm = () => {
    setFormData({
      headers: [],
      condition: "true",
      value: "",
    });
    setError({});
    setEditIndex(null);
    setShowForm(false);
  };

  /* ===================== */
  /* ADD CLICK */
  /* ===================== */
  const handleAdd = () => {
    setShowForm(true);
    setEditIndex(null);

    setFormData({
      headers: [],
      condition: "true",
      value: "",
    });

    setError({});
  };

  /* ===================== */
  /* SAVE */
  /* ===================== */
  const handleSave = () => {
    const err = validate();

    if (Object.keys(err).length > 0) {
      setError(err);
      return;
    }

    const updated = [...savedList, formData];

    setValue(subPath, updated);
    onSaveList && onSaveList(updated);

    setSuccessMsg("Sub dependency added successfully");

    resetForm();
  };

  /* ===================== */
  /* DELETE */
  /* ===================== */
  const handleDelete = (index) => {
    if (window.confirm("Are you sure to selete this dependency?")) {
      const updated = savedList.filter((_, i) => i !== index);

      setValue(subPath, updated);
      onSaveList && onSaveList(updated);

      setSuccessMsg("Sub dependency deleted successfully");
    }
  };

  /* ===================== */
  /* EDIT */
  /* ===================== */
  const handleEdit = (item, index) => {
    setShowForm(true);
    setEditIndex(index);

    setFormData({
      headers: item.headers || [],
      condition: item.condition || "true",
      value: item.value || "",
    });

    setError({});
  };

  /* ===================== */
  /* UPDATE */
  /* ===================== */
  const handleUpdate = () => {
    if (editIndex === null) return;

    const err = validate();

    if (Object.keys(err).length > 0) {
      setError(err);
      return;
    }

    const updated = [...savedList];
    updated[editIndex] = formData;

    setValue(subPath, updated);
    onSaveList && onSaveList(updated);

    setSuccessMsg("Sub dependency updated successfully");

    resetForm();
  };
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [successMsg]);
  return (
    <div className="border rounded-xl bg-white shadow-md overflow-hidden  border-gray-300 ">
      {/* ===================== */}
      {/* HEADER */}
      {/* ===================== */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-gray-50 to-gray-00 border-b">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Sub Dependencies
          </h3>
          <p className="text-xs text-gray-500">
            Configure sub-level dependency rules
          </p>
        </div>
        {/* ===================== */}
        {/* ADD BUTTON */}
        {/* ===================== */}
        {!showForm && (
          <div className="flex items-center">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-1"
              title="Add sub dependancy"
            >
              <FaPlus size={14} />
            </button>
          </div>
        )}
      </div>
      {successMsg && (
        <div className="bg-green-100 text-green-700 px-3 py-2 rounded text-sm flex justify-center">
          {successMsg}
        </div>
      )}

      {/* ===================== */}
      {/* FORM */}
      {/* ===================== */}
      {showForm && (
        <div className="p-4 bg-gray-50 space-y-4 border-b">
          {/* ROW: MULTISELECT + RADIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* MULTISELECT */}
            <div>
              <label className="font-semibold text-sm">Select Columns *</label>

              <select
                multiple
                className={`${inputClass} border p-2 w-full mt-1`}
                value={formData.headers}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  );
                  setFormData({ ...formData, headers: selected });
                }}
              >
                {filteredHeaders.map((h, i) => (
                  <option key={i} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              {error.headers && (
                <p className="text-red-500 text-xs mt-1">{error.headers}</p>
              )}
            </div>

            {/* CONDITION + TEXTBOX */}
            <div>
              <label className="font-semibold text-sm">Condition *</label>

              {/* RADIO */}
              <div className="flex flex-wrap gap-3 mt-1">
                {" "}
                <span className="block md:hidden text-xs text-gray-500">
                  Condition
                </span>
                <label className="flex items-center gap-1">
                  <span className="block md:hidden text-xs text-gray-500">
                    Value
                  </span>
                  <input
                    type="radio"
                    checked={formData.condition === "true"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        condition: "true",
                        value: "",
                      })
                    }
                  />
                  Value Required
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={formData.condition === "other"}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        condition: "other",
                        value: "",
                      })
                    }
                  />
                  Some Other Value
                </label>
              </div>

              {/* TEXTBOX BELOW RADIO */}
              <input
                type="text"
                placeholder="Enter value"
                disabled={formData.condition !== "other"}
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className={`${inputClass} border p-2 w-full mt-3 ${
                  formData.condition !== "other" ? "bg-gray-100" : ""
                }`}
              />
              {error.value && (
                <p className="text-red-500 text-xs mt-1">{error.value}</p>
              )}
            </div>
          </div>

          {/* ERROR */}
          {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            {editIndex !== null ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Update
                </button>

                <button
                  onClick={resetForm}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>

                <button
                  onClick={resetForm}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* LIST */}
      {/* ===================== */}
      <div className="p-2 sm:p-3 space-y-3">
        {savedList.length === 0 ? (
          <p className="text-black text-sm flex justify-center">
            No sub dependencies found
          </p>
        ) : (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* HEADER ROW */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 bg-gray-300 text-sm font-semibold text-gray-700">
              <div className="col-span-5 ">Header Columns</div>
              <div className="col-span-3">Condition</div>
              <div className="col-span-2">Value</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* DATA ROWS */}
            {savedList.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-3 px-3 py-3 bg-white hover:bg-gray-50 border-t border-gray-200"
              >
                {/* HEADERS */}
                <div className="md:col-span-5 text-sm text-gray-800">
                  <span className="block md:hidden text-xs text-gray-500">
                    Headers
                  </span>
                  <span className="break-words">
                    {item.headers?.length ? item.headers.join(", ") : "-"}
                  </span>
                </div>

                {/* CONDITION */}
                <div className="col-span-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.condition === "true"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.condition === "true"
                      ? "Value Required"
                      : "Some Other Value"}
                  </span>
                </div>

                {/* VALUE */}
                <div className="col-span-2 text-sm text-gray-700">
                  {item.value || "-"}
                </div>

                {/* ACTIONS */}
                <div className="md:col-span-2 flex justify-start md:justify-end gap-3 mt-2 md:mt-0">
                  <button
                    onClick={() => handleEdit(item, index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiEdit size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(SubDependencyLatest);
