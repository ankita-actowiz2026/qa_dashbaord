import { Tooltip } from "react-tooltip";
import { FiInfo } from "react-icons/fi";

type InfoTooltipProps = {
  id: string;
  text: string;
};

export const InfoTooltip = ({ id, text }: InfoTooltipProps) => {
  return (
    <>
      <span
        data-tooltip-id={id}
        data-tooltip-content={text}
        className="cursor-pointer text-gray-400 hover:text-gray-700 flex items-center"
      >
        <FiInfo size={14} />
      </span>

      <Tooltip id={id} />
    </>
  );
};
