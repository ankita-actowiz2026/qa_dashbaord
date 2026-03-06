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

  const ruleMap: Record<string, ColumnRule> = {};

  columnConfig.forEach((col) => {
    ruleMap[col.name] = col;
  });
console.log(ruleMap)
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

  let duplicate_count = 0;
  let missing_required_count = 0;
  let datatype_error_count = 0;
  let junk_character_count = 0;

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
      total_records++;

      let rowValid = true;
      const rowData: any = {};
      
      for (let i = 1; i <= headers.length; i++) {

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
        // ✅ ADD DATE VALIDATION HERE
if (rule.type === "Date") {

  const excelEpoch = new Date(1899, 11, 30);
  const jsDate = new Date(excelEpoch.getTime() + value * 86400000);

  const month = String(jsDate.getMonth() + 1).padStart(2, "0");
  const day = String(jsDate.getDate()).padStart(2, "0");
  const year = jsDate.getFullYear();
  let strValue=`${month}-${day}-${year}`
  
// MM-DD-YYYY format check // in xlsx file dd-mm-yyyy
  const dateRegex = /^(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])-\d{4}$/;
  
  if (!dateRegex.test(strValue)) {

    datatype_error_count++;
    rowValid = false;

    error_msg.push({
      row: rowNumber,
      column: columnName,
      error_type: "Datatype Error",
      error_description: `${columnName} must be in MM-DD-YYYY format`
    });

    continue;
  }
  const dateValue = new Date(strValue);
  if (isNaN(dateValue.getTime())) {

    datatype_error_count++;
    rowValid = false;

    error_msg.push({
      row: rowNumber,
      column: columnName,
      error_type: "Datatype Error222",
      error_description: `${columnName} must be a valid date`
    });

  } else {

    // MIN DATE CHECK
    if (rule.min_date && dateValue < new Date(rule.min_date)) {

      rowValid = false;

      error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Date Range Error",
        error_description: `${columnName} must be after ${rule.min_date}`
      });

    }

    // MAX DATE CHECK
    if (rule.max_date && dateValue > new Date(rule.max_date)) {

      rowValid = false;

      error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Date Range Error",
        error_description: `${columnName} must be before ${rule.max_date}`
      });

    }

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

        // SPECIAL CHAR//@ # $ % & * - _ .
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
        if (rule.allow_alpha_numeric) {

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
        //._- not allow
        if (rule.not_allow_junk) {
  const junkRegex = /[^a-zA-Z0-9\s@._-]/;

  if (junkRegex.test(strValue)) {

    rowValid = false;
    junk_character_count++;

    error_msg.push({
      row: rowNumber,
      column: columnName,
      error_type: "Junk Character",
      error_description: `${columnName} contains junk characters`
    });

  }

}
        
        // LENGTH
        if (rule.type === "Number") {
          const numValue = Number(strValue);
          
          if (isNaN(numValue)) {
            rowValid = false;
            error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Datatype Error---n",
              error_description: `${columnName} must be a valid number`
            });

          } else {
            // Minimum range check
            
             
             // Minimum check
            if (rule.min_length !== null && numValue < rule.min_length) {

              rowValid = false;

              error_msg.push({
                row: rowNumber,
                column: columnName,
                error_type: "Range Error---n",
                error_description: `${columnName} must be >= ${rule.min_length}`
              });

            }

            // Maximum check
            if (rule.max_length !== null && numValue > rule.max_length) {

              rowValid = false;

              error_msg.push({
                row: rowNumber,
                column: columnName,
                error_type: "Range Error---n",
                error_description: `${columnName} must be <= ${rule.max_length}`
              });

            }


          
         

        }

        }
        else{
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
            error_type: "Value is not as per predefined Value",
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
    break;
  }

  return {
    total_records,
    valid_records,
    invalid_records,
    duplicate_count,
    missing_required_count,
    datatype_error_count,
    junk_character_count,
    error_msg,
    clear_data
  };
};