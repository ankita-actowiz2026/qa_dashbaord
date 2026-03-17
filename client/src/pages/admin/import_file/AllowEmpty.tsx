import React from "react";

const AllowEmpty = ({ headerName, register }) => {
  console.log("AllowEmpty");
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-semibold flex items-center">
          <input
            className="w-4 h-4 text-blue-600 border-gray-400 rounded mr-2"
            type="checkbox"
            {...register(`${headerName}.has_empty`)}
          />
          Allow Empty
        </label>
      </div>
    </div>
  );
};

export default AllowEmpty;
