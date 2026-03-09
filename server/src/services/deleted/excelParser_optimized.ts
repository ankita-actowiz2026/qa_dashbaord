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

export const parseExcelFileStream = async (
  filePath: string,
  columnConfig: ColumnRule[]
) => {

  /* ---------------------------------- */
  /* Regex compiled once (performance)  */
  /* ---------------------------------- */

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const specialCharRegex = /[^a-zA-Z0-9]/;
  const junkRegex = /[^a-zA-Z0-9\s@._-]/;

  /* ---------------------------------- */
  /* Helper Functions                   */
  /* ---------------------------------- */

  const getCellValue = (cell: any): string => {

    if (!cell) return "";

    if (typeof cell === "object") {

      if (cell.richText)
        return cell.richText.map((t: any) => t.text).join("").trim();

      if (cell.text)
        return String(cell.text).trim();

      if (cell.result)
        return String(cell.result).trim();

      if (cell.hyperlink)
        return String(cell.text).trim();
    }

    return String(cell).trim();
  };

  const pushError = (
    columnStat: any,
    row: number,
    column: string,
    type: string,
    message: string
  ) => {

    columnStat.invalid_records++;

    if (columnStat.error_msg.length < 50) {
      columnStat.error_msg.push({
        row,
        column,
        error_type: type,
        error_description: message
      });
    }
  };

  /* ---------------------------------- */
  /* Build Rule Map                     */
  /* ---------------------------------- */

  const ruleMap = new Map<string, ColumnRule>();

  columnConfig.forEach(col => {

    if (col.predefined_values) {
      col.predefined_values = col.predefined_values.map(v =>
        String(v).trim().toLowerCase()
      );
    }

    ruleMap.set(col.name, col);

  });

  /* ---------------------------------- */
  /* Duplicate Tracker                  */
  /* ---------------------------------- */

  const duplicateTracker = new Map<string, Set<string>>();

  columnConfig.forEach(col => {

    if (!col.is_allow_duplicate) {
      duplicateTracker.set(col.name, new Set());
    }

  });

  /* ---------------------------------- */
  /* Stats                              */
  /* ---------------------------------- */

  let headers: string[] = [];
  let headerInitialized = false;

  let total_records = 0;
  let valid_records = 0;
  let invalid_records = 0;

  const columnStats: Record<string, any> = {};

  /* ---------------------------------- */
  /* Excel Streaming Reader             */
  /* ---------------------------------- */
  const clear_data: any[] = [];

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    entries: "emit",
    sharedStrings: "cache",
    hyperlinks: "ignore"
  });

  for await (const worksheet of workbook) {

    for await (const row of worksheet) {

      const values = row.values as any[];

      /* ---------------------------------- */
      /* HEADER                             */
      /* ---------------------------------- */

      if (!headerInitialized) {

        headers = values.slice(1).map(v => getCellValue(v));

        headers.forEach(h => {

          columnStats[h] = {
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

        headerInitialized = true;
        continue;
      }

      total_records++;

      const rowNumber = row.number;
      let rowValid = true;
      const rowData: any = {};

      for (let i = 1; i <= headers.length; i++) {

        const columnName = headers[i - 1];
        const rule = ruleMap.get(columnName);

        if (!rule) continue;

        const columnStat = columnStats[columnName];

        const value = values[i];
        const strValue = getCellValue(value);
        rowData[columnName] = strValue;

        let columnValid = true;

        if (strValue !== "")
          columnStat.total_records++;

        /* ---------------------------------- */
        /* REQUIRED                           */
        /* ---------------------------------- */

        if (rule.is_mandatory && !strValue) {

          columnStat.missing_required_count++;

          pushError(
            columnStat,
            rowNumber,
            columnName,
            "Missing Required",
            `${columnName} is mandatory`
          );

          columnValid = false;
          rowValid = false;

          continue;
        }

        if (!strValue) continue;

        /* ---------------------------------- */
        /* NUMBER                             */
        /* ---------------------------------- */

        if (rule.type === "Number") {

          const num = Number(strValue);

          if (isNaN(num)) {

            columnStat.datatype_error_count++;

            pushError(
              columnStat,
              rowNumber,
              columnName,
              "Datatype Error",
              `${columnName} must be number`
            );

            columnValid = false;
            rowValid = false;

          } else {

            if (rule.min_length !== null && num < rule.min_length!) {

              pushError(
                columnStat,
                rowNumber,
                columnName,
                "Range Error",
                `${columnName} must be >= ${rule.min_length}`
              );

              columnValid = false;
              rowValid = false;
            }

            if (rule.max_length !== null && num > rule.max_length!) {

              pushError(
                columnStat,
                rowNumber,
                columnName,
                "Range Error",
                `${columnName} must be <= ${rule.max_length}`
              );

              columnValid = false;
              rowValid = false;
            }

          }

        }

        /* ---------------------------------- */
        /* DATE                               */
        /* ---------------------------------- */

        if (rule.type === "Date") {

          let jsDate: Date;

          if (typeof value === "number") {

            const excelEpoch = new Date(1899, 11, 30);
            jsDate = new Date(excelEpoch.getTime() + value * 86400000);

          } else {

            jsDate = new Date(strValue);

          }

          if (isNaN(jsDate.getTime())) {

            columnStat.datatype_error_count++;

            pushError(
              columnStat,
              rowNumber,
              columnName,
              "Datatype Error",
              `${columnName} invalid date`
            );

            columnValid = false;
            rowValid = false;

          }

        }

        /* ---------------------------------- */
        /* EMAIL                              */
        /* ---------------------------------- */

        if (rule.type === "Email") {

          if (!emailRegex.test(strValue)) {

            columnStat.datatype_error_count++;

            pushError(
              columnStat,
              rowNumber,
              columnName,
              "Datatype Error",
              "Invalid email"
            );

            columnValid = false;
            rowValid = false;
          }

        }

        /* ---------------------------------- */
        /* SPECIAL CHAR                       */
        /* ---------------------------------- */

        if (rule.block_special_chars && specialCharRegex.test(strValue)) {

          columnStat.junk_character_count++;

          pushError(
            columnStat,
            rowNumber,
            columnName,
            "Special Character",
            `${columnName} contains special characters`
          );

          columnValid = false;
          rowValid = false;

        }

        /* ---------------------------------- */
        /* JUNK                               */
        /* ---------------------------------- */

        if (rule.not_allow_junk && junkRegex.test(strValue)) {

          columnStat.junk_character_count++;

          pushError(
            columnStat,
            rowNumber,
            columnName,
            "Junk Character",
            `${columnName} contains junk`
          );

          columnValid = false;
          rowValid = false;

        }

        /* ---------------------------------- */
        /* BLOCKED WORD                       */
        /* ---------------------------------- */

        if (rule.blocked_words?.length) {

          const hasBlocked = rule.blocked_words.some(w =>
            strValue.toLowerCase().includes(w.toLowerCase())
          );

          if (hasBlocked) {

            pushError(
              columnStat,
              rowNumber,
              columnName,
              "Blocked Word",
              `${strValue} contains blocked word`
            );

            columnValid = false;
            rowValid = false;
          }

        }

        /* ---------------------------------- */
        /* PREDEFINED                         */
        /* ---------------------------------- */

        if (
          rule.predefined_values &&
          !rule.predefined_values.includes(strValue.toLowerCase())
        ) {

          pushError(
            columnStat,
            rowNumber,
            columnName,
            "Predefined Value Error",
            `${strValue} not allowed`
          );

          columnValid = false;
          rowValid = false;
        }

        /* ---------------------------------- */
        /* DUPLICATE                          */
        /* ---------------------------------- */

        if (!rule.is_allow_duplicate) {

          const tracker = duplicateTracker.get(columnName)!;

          if (tracker.has(strValue)) {

            columnStat.duplicate_count++;

            pushError(
              columnStat,
              rowNumber,
              columnName,
              "Duplicate",
              `${columnName} duplicated`
            );

            columnValid = false;
            rowValid = false;

          } else {
            tracker.add(strValue);
          }

        }

        if (columnValid && strValue !== "")
          columnStat.valid_records++;

      }

      if (rowValid){
        valid_records++;
        clear_data.push(rowData);
      }
      else
        invalid_records++;

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