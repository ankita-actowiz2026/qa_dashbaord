import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { FiEdit, FiTrash2, FiSave } from "react-icons/fi";
import { MdClear } from "react-icons/md";

type Props = {
  label: string;
  values: string[];
  onChange: (val: string[]) => void;
};

const TagInputRule: React.FC<Props> = ({ label, values, onChange }) => {
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = useCallback(() => {
    if (!input.trim()) {
      toast.error(`Please enter ${label}`);
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
    toast.success(`${label} Deleted`);
  };

  const handleSaveEdit = (idx: number) => {
    if (!editValue.trim()) {
      toast.error("Value cannot be empty");
      return;
    }

    const updated = [...values];
    updated[idx] = editValue.trim();
    onChange(updated);

    setEditIndex(null);
    toast.success("Updated");
  };

  return (
    <div className="space-y-4">
      {/* INPUT */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Enter ${label}`}
          className="flex-1 px-3 py-2 text-base border rounded-lg"
        />

        <button
          onClick={handleAdd}
          className="px-3 py-2 text-base text-white bg-blue-600 rounded-lg"
        >
          <FaPlus className="w-4 h-4" />
        </button>

        {input && (
          <button onClick={() => setInput("")} className="text-gray-500">
            <MdClear size={18} />
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="space-y-2 overflow-y-auto max-h-40">
        {values.map((item, idx) => (
          <div
            key={item}
            className="flex items-center justify-between px-3 py-2 border rounded-lg bg-gray-50"
          >
            {editIndex === idx ? (
              <div className="flex w-full gap-2">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-2 py-1 text-base border rounded"
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
                    className="text-base text-blue-600"
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
