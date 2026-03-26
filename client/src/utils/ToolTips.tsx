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
        className="relative z-50 cursor-pointer text-gray-400 flex items-center"
      >
        <FiInfo size={14} />
      </span>
      <Tooltip
        id={id}
        place="top"
        positionStrategy="fixed"
        style={{
          zIndex: 9999,
          maxWidth: "220px",
          whiteSpace: "normal",
        }}
      />{" "}
    </>
  );
};
