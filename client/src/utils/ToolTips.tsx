import { Tooltip } from "react-tooltip";
import { FiInfo } from "react-icons/fi";

type InfoTooltipProps = {
  id: string;
  text: string;
  tooltip_type: string;
};

export const InfoTooltip = ({
  id,
  text,
  tooltip_type = "heading",
}: InfoTooltipProps) => {
  return (
    <>
      <span
        data-tooltip-id={id}
        data-tooltip-content={text}
        className={`cursor-pointer text-gray-400 flex items-center ${
          tooltip_type === "heading"
            ? "hover:text-gray-300"
            : "hover:text-gray-700"
        }`}
      >
        <FiInfo size={14} />
      </span>

      <Tooltip id={id} />
    </>
  );
};
