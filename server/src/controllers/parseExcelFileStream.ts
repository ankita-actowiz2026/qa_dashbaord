import ExcelJS from "exceljs";

const parseExcelFileStream = async (filePath: string, columnConfig: any[]) => {

  const ruleMap: Record<string, any> = {};
  columnConfig.forEach(col => {
    ruleMap[col.name] = col;
  });

  const duplicateTracker: Record<string, Set<any>> = {};

  const result = {
    total_records: 0,
    valid_records: 0,
    invalid_records: 0,
    duplicate_count: 0,
    missing_required_count: 0,
    datatype_error_count: 0,
    junk_character_count: 0,
    success_rows: [] as any[],
    errors: [] as any[]
  };

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    sharedStrings: "cache",
    hyperlinks: "ignore",
  });

  let headers: string[] = [];

  for await (const worksheet of workbook) {

    for await (const row of worksheet) {

      const values = row.values as any[];

      // Skip first empty index
      values.shift();

      // Header Row
      if (row.number === 1) {
        headers = values;
        continue;
      }

      result.total_records++;

      let rowData: any = {};
      let rowValid = true;

      for (let i = 0; i < headers.length; i++) {

        const columnName = headers[i];
        const value = values[i];
        const rule = ruleMap[columnName];

        if (!rule) continue;

        rowData[columnName] = value;

        // Mandatory check
        if (rule.is_mandatory && (!value || value === "")) {
          result.missing_required_count++;
          rowValid = false;
          continue;
        }

        if (!value) continue;

        // Type Validation
        if (rule.type === "Number") {
          if (isNaN(Number(value))) {
            result.datatype_error_count++;
            rowValid = false;
          }
        }

        if (rule.type === "Email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            result.datatype_error_count++;
            rowValid = false;
          }
        }

        // Special character block
        if (rule.block_special_chars) {
          const regex = /[^a-zA-Z0-9]/;
          if (regex.test(value)) {
            result.junk_character_count++;
            rowValid = false;
          }
        }

        // Alpha numeric check
        if (rule.allow_alpha_numeric) {
          const regex = /^[a-zA-Z0-9]+$/;
          if (!regex.test(value)) {
            result.junk_character_count++;
            rowValid = false;
          }
        }

        // Length validation
        if (rule.min_length && value.length < rule.min_length) {
          rowValid = false;
        }

        if (rule.max_length && value.length > rule.max_length) {
          rowValid = false;
        }

        // Blocked words
        if (rule.blocked_words?.includes(value)) {
          result.junk_character_count++;
          rowValid = false;
        }

        // Predefined values
        if (rule.predefined_values?.length) {
          if (!rule.predefined_values.includes(value)) {
            rowValid = false;
          }
        }

        // Duplicate check
        if (!rule.is_allow_duplicate) {

          if (!duplicateTracker[columnName]) {
            duplicateTracker[columnName] = new Set();
          }

          if (duplicateTracker[columnName].has(value)) {
            result.duplicate_count++;
            rowValid = false;
          } else {
            duplicateTracker[columnName].add(value);
          }
        }
      }

      if (rowValid) {
        result.valid_records++;
        result.success_rows.push(rowData);
      } else {
        result.invalid_records++;
        result.errors.push({
          row: row.number,
          data: rowData
        });
      }

    }

  }

  return result;
};
export default parseExcelFileStream;