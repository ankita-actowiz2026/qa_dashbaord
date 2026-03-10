import ExcelJS from "exceljs";

interface ColumnRule {
  name: string;
  type: string;
  is_mandatory?: boolean;
  is_allow_duplicate?: boolean;
  block_special_chars?: boolean;
  allow_alpha_numeric?: boolean;
  min_length?: number | null;
  max_length?: number | null;
  blocked_words?: string[];
  predefined_values?: string[];
}

interface ErrorMsg {
  row: number;
  column: string;
  error_type: string;
  error_description: string;
}

export const parseExcelFileStream = async (
  filePath: string,
  columnConfig: ColumnRule[]
) => {

  const ruleMap: Record<string, ColumnRule> = {};

  columnConfig.forEach((col) => {
    ruleMap[col.name] = col;
  });

  const duplicateTracker: Record<string, Set<any>> = {};

  columnConfig.forEach((col) => {
    if (!col.is_allow_duplicate) {
      duplicateTracker[col.name] = new Set();
    }
  });

  let headers: string[] = [];
  let headerInitialized = false;

  let total_rows = 0;
  let valid_records = 0;
  let invalid_records = 0;

  let duplicate_count = 0;
  let missing_required_count = 0;
  let datatype_error_count = 0;

  const error_msg: ErrorMsg[] = [];
  const clear_data: any[] = [];

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    sharedStrings: "cache",
    hyperlinks: "ignore",
  });

  for await (const worksheet of workbook) {

    for await (const row of worksheet) {

      const values = row.values as any[];

      // HEADER
      if (!headerInitialized) {
        headers = values.slice(1).map((h) => String(h).trim());
        headerInitialized = true;
        continue;
      }

      const rowNumber = row.number;
      total_rows++;

      let rowValid = true;
      const rowData: any = {};

      for (let i = 1; i < values.length; i++) {

        const columnName = headers[i - 1];
        const rule = ruleMap[columnName];

        if (!rule) continue;

        const value = values[i];
        const strValue = value ? String(value).trim() : "";

        rowData[columnName] = strValue;

        // REQUIRED
        if (rule.is_mandatory && !strValue) {

          missing_required_count++;
          rowValid = false;

          error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Missing Required",
            error_description: `${columnName} is mandatory`
          });

          continue;
        }

        if (!strValue) continue;

        // TYPE
        if (rule.type === "Number") {

          if (isNaN(Number(strValue))) {

            datatype_error_count++;
            rowValid = false;

            error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Datatype Error",
              error_description: `${columnName} must be a number`
            });

          }

        }

        if (rule.type === "Email") {

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailRegex.test(strValue)) {

            datatype_error_count++;
            rowValid = false;

            error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Datatype Error",
              error_description: "Invalid email format"
            });

          }

        }

        // SPECIAL CHAR
        if (rule.block_special_chars) {

          const regex = /[^a-zA-Z0-9]/;

          if (regex.test(strValue)) {

            rowValid = false;

            error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Special Character",
              error_description: `${columnName} contains special characters`
            });

          }

        }

        // LENGTH
        if (rule.min_length && strValue.length < rule.min_length) {

          rowValid = false;

          error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Length Error",
            error_description: `Minimum length ${rule.min_length}`
          });

        }

        if (rule.max_length && strValue.length > rule.max_length) {

          rowValid = false;

          error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Length Error",
            error_description: `Maximum length ${rule.max_length}`
          });

        }

        // BLOCKED WORD
        if (rule.blocked_words?.includes(strValue)) {

          rowValid = false;

          error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Blocked Word",
            error_description: `${strValue} is not allowed`
          });

        }

        // PREDEFINED
        if (
          rule.predefined_values &&
          rule.predefined_values.length > 0 &&
          !rule.predefined_values.includes(strValue)
        ) {

          rowValid = false;

          error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Invalid Value",
            error_description: `${strValue} not allowed`
          });

        }

        // DUPLICATE
        if (!rule.is_allow_duplicate) {

          const tracker = duplicateTracker[columnName];

          if (tracker.has(strValue)) {

            duplicate_count++;
            rowValid = false;

            error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Duplicate",
              error_description: `${columnName} duplicated`
            });

          } else {
            tracker.add(strValue);
          }

        }

      }

      if (rowValid) {

        valid_records++;
        clear_data.push(rowData);

      } else {

        invalid_records++;

      }

    }

  }

  return {
    total_rows,
    valid_records,
    invalid_records,
    duplicate_count,
    missing_required_count,
    datatype_error_count,
    error_msg,
    clear_data
  };
};