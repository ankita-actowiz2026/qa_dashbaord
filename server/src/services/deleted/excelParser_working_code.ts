import ExcelJS from "exceljs";

interface ColumnRule {
  name: string;
  type: string;
  is_mandatory?: boolean;
  is_allow_duplicate?: boolean;
  block_special_chars?: boolean;
  allow_alpha_numeric?: boolean;
  not_allow_junk?: boolean;
  min_length?: number | null;
  max_length?: number | null;
  max_date?: string | null;
  min_date?: string | null;
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
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const specialCharRegex = /[^a-zA-Z0-9]/;
  const junkRegex = /[^a-zA-Z0-9\s@._-]/;
  // 🔹 Extract correct value from ExcelJS cell
  const getCellValue = (cell: any): string => {

    if (cell === null || cell === undefined) return "";

    if (typeof cell === "object") {

      if (cell.richText) {
        return cell.richText.map((t: any) => t.text).join("").trim();
      }

      if (cell.text) {
        return String(cell.text).trim();
      }

      if (cell.result) {
        return String(cell.result).trim();
      }

    }

    return String(cell).trim();
  };

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

  let total_records = 0;
  let valid_records = 0;
  let invalid_records = 0;

  const clear_data: any[] = [];
  const columnStats: Record<string, any> = {};

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    entries: "emit",
    sharedStrings: "cache",
    hyperlinks: "ignore",
  });

  for await (const worksheet of workbook) {

    for await (const row of worksheet) {

      const values = row.values as any[];

      // HEADER
      if (!headerInitialized) {

        headers = values.slice(1).map((h) => getCellValue(h));

        headerInitialized = true;

        headers.forEach((header) => {

          columnStats[header] = {
            total_records: 0,
            valid_records: 0,
            invalid_records: 0,
            duplicate_count: 0,
            missing_required_count: 0,
            datatype_error_count: 0,
            junk_character_count: 0,
            error_msg: []
          };

        });

        continue;
      }

      total_records++;
      const rowNumber = row.number;

      let rowValid = true;
      const rowData: any = {};

      for (let i = 1; i <= headers.length; i++) {

        const columnName = headers[i - 1];
        const rule = ruleMap[columnName];
        if (!rule) continue;

        const columnStat = columnStats[columnName];

        let columnValid = true;

        const value = values[i];
        const strValue = getCellValue(value);

        rowData[columnName] = strValue;

        if (strValue !== "") {
          columnStat.total_records++;
        }

        // REQUIRED
        if (rule.is_mandatory && !strValue) {

          columnStat.missing_required_count++;
          columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          if (columnStat.error_msg.length < 50) {
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Missing Required",
              error_description: `${columnName} is mandatory`
            });
          }

          continue;
        }

        if (!strValue) continue;

        // NUMBER TYPE
        if (rule.type === "Number") {

          const numValue = Number(strValue);

          if (isNaN(numValue)) {

            columnStat.datatype_error_count++;
            columnStat.invalid_records++;

            columnValid = false;
            rowValid = false;

            if (columnStat.error_msg.length < 50) {
              columnStat.error_msg.push({
                row: rowNumber,
                column: columnName,
                error_type: "Datatype Error",
                error_description: `${columnName} must be a number`
              });
            }

          } else {

            if (rule.min_length !== null && numValue < rule.min_length) {

              columnStat.invalid_records++;
              columnValid = false;
              rowValid = false;

              columnStat.error_msg.push({
                row: rowNumber,
                column: columnName,
                error_type: "Range Error",
                error_description: `${columnName} must be >= ${rule.min_length}`
              });

            }

            if (rule.max_length !== null && numValue > rule.max_length) {

              columnStat.invalid_records++;
              columnValid = false;
              rowValid = false;

              columnStat.error_msg.push({
                row: rowNumber,
                column: columnName,
                error_type: "Range Error",
                error_description: `${columnName} must be <= ${rule.max_length}`
              });

            }

          }

        }

        // DATE TYPE
        // if (rule.type === "Date") {

        //   let dateValue = new Date(strValue);

        //   if (typeof value === "number") {
        //     const excelEpoch = new Date(1899, 11, 30);
        //     dateValue = new Date(excelEpoch.getTime() + value * 86400000);
        //   }

        //   if (isNaN(dateValue.getTime())) {

        //     columnStat.datatype_error_count++;
        //     columnStat.invalid_records++;

        //     columnValid = false;
        //     rowValid = false;

        //     columnStat.error_msg.push({
        //       row: rowNumber,
        //       column: columnName,
        //       error_type: "Datatype Error",
        //       error_description: `${columnName} must be valid date`
        //     });

        //   }

        // }
if (rule.type === "Date") {

  let jsDate: Date;

  // Excel numeric date
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    jsDate = new Date(excelEpoch.getTime() + value * 86400000);
  } 
  // If string date
  else {
    jsDate = new Date(value);
  }

  if (isNaN(jsDate.getTime())) {

    columnStat.datatype_error_count++;
    columnStat.invalid_records++;
    columnValid = false;
    rowValid = false;

    if (columnStat.error_msg.length < 50) {
      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Datatype Error",
        error_description: `${columnName} must be a valid date`
      });
    }

    continue;
  }

  // Convert to MM-DD-YYYY
  const month = String(jsDate.getMonth() + 1).padStart(2, "0");
  const day = String(jsDate.getDate()).padStart(2, "0");
  const year = jsDate.getFullYear();

  const formattedDate = `${month}-${day}-${year}`;

  // Format validation
  const dateRegex = /^(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])-\d{4}$/;

  if (!dateRegex.test(formattedDate)) {

    columnStat.datatype_error_count++;
    columnStat.invalid_records++;
    columnValid = false;
    rowValid = false;

    if (columnStat.error_msg.length < 50) {
      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Datatype Error",
        error_description: `${columnName} must be in MM-DD-YYYY format`
      });
    }

    continue;
  }

  const dateValue = new Date(formattedDate);

  // MIN DATE CHECK
  if (rule.min_date && dateValue < new Date(rule.min_date)) {

    columnStat.invalid_records++;
    columnValid = false;
    rowValid = false;

    if (columnStat.error_msg.length < 50) {
      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Date Range Error",
        error_description: `${columnName} must be after ${rule.min_date}`
      });
    }
  }

  // MAX DATE CHECK
  if (rule.max_date && dateValue > new Date(rule.max_date)) {

    columnStat.invalid_records++;
    columnValid = false;
    rowValid = false;

    if (columnStat.error_msg.length < 50) {
      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Date Range Error",
        error_description: `${columnName} must be before ${rule.max_date}`
      });
    }
  }

}
        // EMAIL
        if (rule.type === "Email") {
          if (!emailRegex.test(strValue)) {

            columnStat.datatype_error_count++;
            columnStat.invalid_records++;

            columnValid = false;
            rowValid = false;

            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Datatype Error",
              error_description: "Invalid email format"
            });

          }

        }

        // SPECIAL CHARACTER BLOCK
        if (rule.block_special_chars) {
          if (specialCharRegex.test(strValue)) {

            columnStat.junk_character_count++;
            columnStat.invalid_records++;

            columnValid = false;
            rowValid = false;

            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Special Character",
              error_description: `${columnName} contains special characters`
            });

          }

        }

        // JUNK CHARACTER
        if (rule.not_allow_junk) {
          if (junkRegex.test(strValue)) {

            columnStat.junk_character_count++;
            columnStat.invalid_records++;

            columnValid = false;
            rowValid = false;

            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Junk Character",
              error_description: `${columnName} contains junk characters`
            });

          }

        }

        // BLOCKED WORD
        if (rule.blocked_words?.length) {

          const hasBlockedWord = rule.blocked_words.some(word =>
            strValue.toLowerCase().includes(word.toLowerCase())
          );

          if (hasBlockedWord) {

            columnStat.invalid_records++;
            columnValid = false;
            rowValid = false;

            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Blocked Word",
              error_description: `${strValue} contains blocked word`
            });

          }

        }

        // PREDEFINED VALUES
        if (
          rule.predefined_values?.length &&
          !rule.predefined_values
            .map(v => String(v).trim().toLowerCase())
            .includes(strValue.toLowerCase())
        ) {

          columnStat.invalid_records++;
          columnValid = false;
          rowValid = false;

          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Predefined Value Error",
            error_description: `${strValue} not allowed`
          });

        }

        // DUPLICATE
        if (!rule.is_allow_duplicate) {

          const tracker = duplicateTracker[columnName];

          if (tracker.has(strValue)) {

            columnStat.duplicate_count++;
            columnStat.invalid_records++;

            columnValid = false;
            rowValid = false;

            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Duplicate",
              error_description: `${columnName} duplicated`
            });

          } else {
            tracker.add(strValue);
          }

        }

        if (columnValid && strValue !== "") {
          columnStat.valid_records++;
        }

      }

      if (rowValid) {
        valid_records++;
        clear_data.push(rowData);
      } else {
        invalid_records++;
      }

    }

    break;
  }

  return {
    total_records,
    valid_records,
    invalid_records,
    column_wise_stats: columnStats,
    clear_data,
    ruleMap
  };

};