import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { FiEdit, FiTrash2, FiSave } from "react-icons/fi";
import { MdClear } from "react-icons/md";

type Props = {
  label: string;
  values: string[];
  onChange: (val: string[]) => void;
  label_style?: string;
};

const TagInputRule: React.FC<Props> = ({
  label,
  values,
  onChange,
  label_style,
}) => {
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = useCallback(() => {
    if (!input.trim()) {
      toast.error(`Please enter ${label.toLowerCase()}`);
      return;
    }

    if (values.includes(input.trim())) {
      toast.error(`${label} already exists`);
      return;
    }
    if (input.length > 100) {
      toast.error("Max 100 characters allowed");
      return;
    }
    onChange([...values, input.trim()]);
    setInput("");
    toast.success(`${label} added`);
  }, [input, values, onChange, label]);

  const handleDelete = (idx: number) => {
    const updated = [...values];
    updated.splice(idx, 1);
    onChange(updated);
    toast.success(`${label} deleted`);
  };

  const handleSaveEdit = (idx: number) => {
    if (!editValue.trim()) {
      toast.error("Value cannot be empty");
      return;
    }
    if (input.length > 100) {
      toast.error("Max 100 characters allowed");
      return;
    }
    const trimmed = editValue;

    const isDuplicate = values.some((val, i) => i !== idx && val === trimmed);

    if (isDuplicate) {
      toast.error(`${label} already exists`);
      return;
    }
    const updated = [...values];
    updated[idx] = editValue.trim();
    onChange(updated);

    setEditIndex(null);
    toast.success(`${label} updated`);
  };
  const textbox_style =
    "w-full px-4 py-2.5 mt-1.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sidebar focus:border-sidebar bg-gray-50 transition-all duration-200";
  return (
    <div className="px-6 py-1 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50/30">
      {/* INPUT */}
      <div>
        <label className={label_style}>{label}</label>
        <div className="space-y-3 ">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter ${label}`}
              className={textbox_style}
            />

            <button
              onClick={handleAdd}
              className="p-2.5 text-white bg-gradient-to-r from-sidebarSecondary to-sidebarSecondaryHover rounded-xl hover:sidebarSecondaryHover  hover:shadow-md active:scale-95 transition-all duration-200"
            >
              <FaPlus className="w-4 h-4" />
            </button>

            {input && (
              <button
                onClick={() => setInput("")}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <MdClear size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <div className="pt-0 mb-0 space-y-2 overflow-y-auto max-h-40">
        {" "}
        {values && values.length > 0 && (
          <div className="pt-1 pt-2 pb-0 border-t border-gray-50">
            <label className={label_style}>
              Existing {label.toLocaleLowerCase()}
            </label>
          </div>
        )}
        {values.map((item, idx) => (
          <div
            key={item}
            className="flex items-center justify-between px-3 py-3 border rounded-lg bg-gray-50"
          >
            {editIndex === idx ? (
              <div className="flex w-full gap-2">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={textbox_style}
                />

                <button
                  onClick={() => handleSaveEdit(idx)}
                  className="text-base text-green-600"
                >
                  <FiSave size={18} />
                </button>

                <button
                  onClick={() => setEditIndex(null)}
                  className="text-base text-gray-500"
                >
                  <MdClear size={18}></MdClear>
                </button>
              </div>
            ) : (
              <>
                <span className="text-base">{item}</span>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditIndex(idx);
                      setEditValue(item);
                    }}
                    className="text-base text-sidebarSecondary"
                  >
                    <FiEdit size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(idx)}
                    className="text-base text-red-500"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagInputRule;
