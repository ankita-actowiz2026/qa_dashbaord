export const getRuleName = (ruleType: string) => {
  if (ruleType === "required") return "Required";
  if (ruleType === "data_type") return "Data Type";
  if (ruleType === "data_length") return "Length type";
  if (ruleType === "regex") return "Regex";
  if (ruleType === "data_redundant") return "Data redundant and threshold";
  if (ruleType === "date_format") return "Date format";
  if (ruleType === "fixed_header") return "Fixed Value";
  if (ruleType === "cell_start_with") return "Cell start with";
  if (ruleType === "cell_end_with") return "Cell end with";
  if (ruleType === "not_match_found") return "Blocked value";
  if (ruleType === "dependency") return "Dependency";
};
export const DATA_TYPE_OPTIONS = [
  { value: "string", label: "String" },
  { value: "alphabetic", label: "Alphabetic" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
];
export const RULE_OPTIONS = [
  { value: "required", label: "Required" },
  { value: "data_type", label: "Data Type" },
  { value: "data_length", label: "Data Length" },
  {
    value: "date_format",
    label: "Date Format",
    show: (ctx) => ctx.currentDataType === "date",
  },
  { value: "data_redundant", label: "Data Redundant & Threshold" },
  { value: "regex", label: "Patern Configuration" },
  { value: "fixed_header", label: "Fixed Value" },
  { value: "cell_start_with", label: "Cell Start With" },
  { value: "cell_end_with", label: "Cell End With" },
  { value: "not_match_found", label: "Blocked Value" },
  { value: "dependency", label: "Dependency" },
];
export const RULE_LABELS = {
  required: "Required",
  data_type: "Data Type",
  data_length: "Length",
  date_format: "Date Format",
  data_redundant: "Redundant Value",
  regex: "Regex",
  fixed_header: "Fixed Value",
  not_match_found: "Blocked value",
  cell_end_with: "Cell End With",
  cell_start_with: "Cell Start With",
  dependency: "",
};

export const date_format_options = [
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM-DD-YYYY",
  "YYYY/MM/DD",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD HH:mm:ss",
  "DD-MM-YYYY HH:mm:ss",
  "MM/DD/YYYY HH:mm:ss",
  "YYYY-MM-DDTHH:mm:ss",
  "DD-MM-YYYY h:i:s a",
  "MM/DD/YYYY h:i a",
  "YYYY-MM-DD h:i:s A",
  "DD MMM YYYY",
  "MMM DD, YYYY",
  "MMMM DD, YYYY",
  "DD Month YYYY",
  "DD-MM-YY",
  "MM/DD/YY",
  "DD_MM_YYYY",
  "MM_DD_YYYY",
  "YYYY_MM_DD",
  "DD_MM_YYYY h:i:s a",
  "MM_DD_YYYY h:i:s a",
  "YYYY_MM_DD h:i:s a",
  "DD_MM_YYYY HH:mm:ss",
  "MM_DD_YYYY HH:mm:ss",
  "YYYY_MM_DD HH:mm:ss",
];
