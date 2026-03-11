import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import Post from "../models/importedFile.model";
import ApiError from "../utils/api.error";
import { param } from "express-validator";
import { ColumnRule } from "../interface/importedFile.interface";

export const validateId = [param("id").isMongoId().withMessage("Invalid ID")];
export const validateAdd = [];
export const validateEdit = [];
//if (columnName == "Id") console.log(columnValid);
export const prepareColumnRules = (ruleMap: Record<string, ColumnRule>) => {
  for (const rule of Object.values(ruleMap)) {
    if (rule.fixed_header?.length) {
      rule.fixed_header_set = new Set(
        rule.fixed_header.map((v: string) => v.trim().toLowerCase()),
      );
    }

    if (rule.cell_start_with?.length) {
      rule.cell_start_with_normalized = rule.cell_start_with.map((v) =>
        String(v).trim().toLowerCase(),
      );
    }

    if (rule.cell_end_with?.length) {
      rule.cell_end_with_normalized = rule.cell_end_with.map((v) =>
        String(v).trim().toLowerCase(),
      );
    }

    if (rule.not_match_found?.length) {
      rule.not_match_found_normalized = rule.not_match_found.map((w: string) =>
        w.trim().toLowerCase(),
      );
    }

    if (rule.data_redundant_threshold) {
      rule.redundantCounter = new Map<string, number>();
    }

    if (rule.data_type === "date" && rule.date_format) {
      rule.dateRegex = buildDateRegex(rule.date_format);
    }
  }
};
export const excelDateToJSDate = (serial: number) => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date = new Date(utc_value * 1000);
  return date;
};

export const formatDate = (date: Date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};
export const getCellValue = (cell: any): string => {
  if (cell === null || cell === undefined) return "";

  // Excel date number
  if (typeof cell === "number" && cell > 20000 && cell < 60000) {
    const jsDate = excelDateToJSDate(cell);
    return formatDate(jsDate);
  }

  if (typeof cell === "object") {
    if (cell.richText) {
      return cell.richText
        .map((t: any) => t.text)
        .join("")
        .trim();
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
// export const generateFileName = () => {
//   const now = new Date();

//   const mm = String(now.getMonth() + 1).padStart(2, "0");
//   const dd = String(now.getDate()).padStart(2, "0");
//   const yyyy = now.getFullYear();

//   const hh = String(now.getHours()).padStart(2, "0");
//   const mi = String(now.getMinutes()).padStart(2, "0");
//   const ss = String(now.getSeconds()).padStart(2, "0");

//   return `data_${mm}${dd}${yyyy}${hh}${mi}${ss}.ndjson`;
// };
export const parseDateByFormat = (
  dateStr: string,
  format: string,
): Date | null => {
  try {
    const parts: any = {};

    const tokens = {
      "%d": "(\\d{2})",
      "%m": "(\\d{2})",
      "%Y": "(\\d{4})",
    };

    let regexPattern = format;

    Object.entries(tokens).forEach(([k, v]) => {
      regexPattern = regexPattern.replace(k, v);
    });

    const regex = new RegExp(`^${regexPattern}`);
    const match = dateStr.match(regex);

    if (!match) return null;

    let index = 1;

    if (format.includes("%d")) {
      parts.day = parseInt(match[index++]);
    }

    if (format.includes("%m")) {
      parts.month = parseInt(match[index++]);
    }

    if (format.includes("%Y")) {
      parts.year = parseInt(match[index++]);
    }

    return new Date(parts.year, parts.month - 1, parts.day);
  } catch {
    return null;
  }
};
export const buildDateRegex = (format: string): RegExp => {
  let pattern = format;

  const replacements: Record<string, string> = {
    "%Y": "(\\d{4})",
    "%m": "(0[1-9]|1[0-2])",
    "%d": "(0[1-9]|[12][0-9]|3[01])",

    H: "([01][0-9]|2[0-3])", // 24 hour
    h: "(0[1-9]|1[0-2])", // 12 hour
    i: "([0-5][0-9])", // minutes
    s: "([0-5][0-9])", // seconds

    "am/pm": "(AM|PM|am|pm)",
  };

  Object.keys(replacements).forEach((key) => {
    pattern = pattern.replace(key, replacements[key]);
  });

  return new RegExp(`^${pattern}$`);
};

export const validateRow = (
  rowData: any,
  rowNumber: number,
  headers: string[],
  ruleMap: Record<string, ColumnRule>,
  columnStats: any,
  duplicateTracker: Record<string, Set<any>>,
  totalsSheet: any,
  errorSheet: any,
) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validBooleanValues = ["true", "false", "1", "0", "yes", "no", "y", "n"];
  let rowValid = true;

  for (const columnName of headers) {
    const rule = ruleMap[columnName];
    if (!rule) continue;

    const columnStat = columnStats[columnName];
    let columnValid = true;

    const strValue = rowData[columnName] ?? "";
    if (strValue !== "") {
      columnStat.total_records++;
    }
    //has_empty

    if (!rule.has_empty && !strValue) {
      columnStat.missing_required_count++;
      if (columnValid == true) {
        //set this condition coz if colom has multiple validsation failed then invalid count was incremented so wrong invalid count was coming
        columnStat.invalid_records++;
      }

      columnValid = false;
      rowValid = false;

      // columnStat.error_msg.push({
      //   row: rowNumber,
      //   column: columnName,
      //   error_type: "Missing Required",
      //   error_description: `${columnName} is mandatory`,
      // });

      errorSheet
        .addRow([
          rowNumber,
          columnName,
          "Missing Required",
          `${columnName} is mandatory`,
        ])
        .commit();
      continue;
    }

    if (!strValue) continue;
    // EMAIL
    if (rule.data_type === "email") {
      if (!emailRegex.test(strValue)) {
        columnStat.datatype_error_count++;
        if (columnValid == true) columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;
        errorSheet
          .addRow([
            rowNumber,
            columnName,
            "Pattern Error",
            `${strValue} does not match email format`,
          ])
          .commit();
        // columnStat.error_msg.push({
        //   row: rowNumber,
        //   column: columnName,
        //   error_type: "Pattern Error",
        //   error_description: `${strValue} does not match email format`,
        // });
      }
    } else if (
      rule.data_type === "integer" &&
      strValue !== null &&
      strValue !== ""
    ) {
      const integerRegex = /^-?\d+$/;

      if (!integerRegex.test(String(strValue).trim())) {
        if (columnValid === true) columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;

        columnStat.datatype_error_count++;

        errorSheet
          .addRow([
            rowNumber,
            columnName,
            "Pattern Error",
            `${strValue} is not a valid integer`,
          ])
          .commit();
        // columnStat.error_msg.push({
        //   row: rowNumber,
        //   column: columnName,
        //   error_type: "Pattern Error",
        //   error_description: `${strValue} is not a valid integer`,
        // });
      }
    } else if (rule.cell_contains && rule.cell_contains_value) {
      const regex = new RegExp(rule.cell_contains_value, "u");

      if (!regex.test(strValue)) {
        columnStat.datatype_error_count++;
        if (columnValid == true) columnStat.invalid_records++;
        columnValid = false;
        rowValid = false;
        // columnStat.error_msg.push({
        //   row: rowNumber,
        //   column: columnName,
        //   error_type: "Pattern Error",
        //   error_description: `${strValue} does not match required format`,
        // });
        errorSheet
          .addRow([
            rowNumber,
            columnName,
            "Pattern Error",
            `${strValue} does not match required format`,
          ])
          .commit();
      }
    }

    //for number type, also check min/max length if specified
    if (rule.data_type === "number" || rule.data_type === "integer") {
      const numValue = Number(strValue);
      // Variable length validation (numeric range)
      if (rule.length_validation_type === "variable") {
        if (rule.min_length !== null && numValue < rule.min_length) {
          if (columnValid == true) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;
          columnStat.length_validation_error_count++;
          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Range Error",
              `${columnName} must be >= ${rule.min_length}`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: columnName,
          //   error_type: "Range Error",
          //   error_description: `${columnName} must be >= ${rule.min_length}`,
          // });
        }

        if (rule.max_length !== null && numValue > rule.max_length) {
          if (columnValid == true) columnStat.invalid_records++;
          columnValid = false;
          rowValid = false;
          columnStat.length_validation_error_count++;

          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Range Error",
              `${columnName} must be <= ${rule.max_length}`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: columnName,
          //   error_type: "Range Error",
          //   error_description: `${columnName} must be <= ${rule.max_length}`,
          // });
        }
      } else if (rule.length_validation_type === "fixed") {
        const digitLength = strValue.toString().length;

        if (rule.min_length !== null && digitLength !== rule.min_length) {
          if (columnValid == true) columnStat.invalid_records++;
          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Length Error",
              `${columnName} must be exactly ${rule.min_length} digits`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: columnName,
          //   error_type: "Length Error",
          //   error_description: `${columnName} must be exactly ${rule.min_length} digits`,
          // });
        }
      }
    } else if (rule.data_type === "string" || rule.data_type === "email") {
      const strLen = strValue.length;

      // VARIABLE LENGTH (min / max)
      if (rule.length_validation_type === "variable") {
        if (rule.min_length !== null && strLen < rule.min_length) {
          if (columnValid === true) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Length Error",
              `${columnName} must be at least ${rule.min_length} characters`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: columnName,
          //   error_type: "Length Error",
          //   error_description: `${columnName} must be at least ${rule.min_length} characters`,
          // });
        }

        if (rule.max_length !== null && strLen > rule.max_length) {
          if (columnValid === true) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Length Error",
              `${columnName} must be <= ${rule.max_length} characters`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: columnName,
          //   error_type: "Length Error",
          //   error_description: `${columnName} must be <= ${rule.max_length} characters`,
          // });
        }
      }

      // FIXED LENGTH
      else if (rule.length_validation_type === "fixed") {
        if (rule.min_length !== null && strLen !== rule.min_length) {
          if (columnValid === true) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Length Error",
              `${columnName} must be exactly ${rule.min_length} characters`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: columnName,
          //   error_type: "Length Error",
          //   error_description: `${columnName} must be exactly ${rule.min_length} characters`,
          // });
        }
      }
    }

    if (rule.data_type === "boolean") {
      const value = String(strValue).trim().toLowerCase();

      if (!validBooleanValues.includes(value)) {
        if (columnValid === true) columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;

        columnStat.datatype_error_count++;
        errorSheet
          .addRow([
            rowNumber,
            columnName,
            "Pattern Error",
            `${strValue} is not a valid boolean value`,
          ])
          .commit();
        // columnStat.error_msg.push({
        //   row: rowNumber,
        //   column: columnName,
        //   error_type: "Pattern Error",
        //   error_description: `${strValue} is not a valid boolean value`,
        // });
      }
    }
    // DUPLICATE
    if (rule.data_redundant_threshold && rule.redundantCounter) {
      const valueKey =
        rule.data_redundant_value !== null
          ? rule.data_redundant_value
          : strValue;

      // Only check specific value if defined
      if (
        rule.data_redundant_value === null ||
        strValue === rule.data_redundant_value
      ) {
        const currentCount = rule.redundantCounter.get(valueKey) || 0;
        const newCount = currentCount + 1;

        rule.redundantCounter.set(valueKey, newCount);

        if (newCount > rule.data_redundant_threshold) {
          columnStat.redundant_value++;
          columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;
          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Redundant Value Error",
              `${strValue} exceeded allowed repetition (${rule.data_redundant_threshold})`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: columnName,
          //   error_type: "Redundant Value Error",
          //   error_description: `${strValue} exceeded allowed repetition (${rule.data_redundant_threshold})`,
          // });
        }
      }
    }

    //if (rule.data_type === "date" && rule.dateRegex && !strValue) {
    if (rule.data_type === "date" && rule.dateRegex) {
      if (!rule.dateRegex.test(strValue)) {
        //columnStat.datatype_error_count++;
        columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;
        columnStat.date_format_error_count++;
        errorSheet
          .addRow([
            rowNumber,
            columnName,
            "Date Format Error",
            `${strValue} does not match format ${rule.date_format}`,
          ])
          .commit();
        // columnStat.error_msg.push({
        //   row: rowNumber,
        //   column: columnName,
        //   error_type: "Date Format Error",
        //   error_description: `${strValue} does not match format ${rule.date_format}`,
        // });
      } else {
        // RANGE VALIDATION
        if (rule.min_length || rule.max_length) {
          const currentDate = parseDateByFormat(strValue, rule.date_format);
          const minDate = rule.min_length
            ? parseDateByFormat(rule.min_length, rule.date_format)
            : null;

          const maxDate = rule.max_length
            ? parseDateByFormat(rule.max_length, rule.date_format)
            : null;

          if (currentDate) {
            if (
              (minDate && currentDate < minDate) ||
              (maxDate && currentDate > maxDate)
            ) {
              if (columnValid === true) columnStat.invalid_records++;
              columnStat.length_validation_error_count++;
              columnValid = false;
              rowValid = false;
              errorSheet
                .addRow([
                  rowNumber,
                  columnName,
                  "Range Error",
                  `${strValue} must be between ${rule.min_length} and ${rule.max_length}`,
                ])
                .commit();
              // columnStat.error_msg.push({
              //   row: rowNumber,
              //   column: columnName,
              //   error_type: "Range Error",
              //   error_description: `${strValue} must be between ${rule.min_length} and ${rule.max_length}`,
              // });
            }
          }
        }
      }
    }

    if (
      rule.fixed_header_set &&
      !rule.fixed_header_set.has(strValue.toLowerCase())
    ) {
      if (columnValid == true) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.fixed_header_error_count++;

      errorSheet
        .addRow([
          rowNumber,
          columnName,
          "Fixed Header Value Error",
          `${strValue} not allowed`,
        ])
        .commit();
      // columnStat.error_msg.push({
      //   row: rowNumber,
      //   column: columnName,
      //   error_type: "Fixed Header Value Error",
      //   error_description: `${strValue} not allowed`,
      // });
    }
    // START WITH
    const normalizedValue = String(strValue ?? "")
      .trim()
      .toLowerCase();
    if (
      rule.cell_start_with_normalized?.length &&
      !rule.cell_start_with_normalized.some((prefix) =>
        normalizedValue.startsWith(prefix),
      )
    ) {
      if (columnValid == true) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.cell_start_with_end_with_error_count++;
      errorSheet
        .addRow([
          rowNumber,
          columnName,
          "Start With Error",
          `${strValue} must start with ${rule.cell_start_with.join(", ")}`,
        ])
        .commit();
      // columnStat.error_msg.push({
      //   row: rowNumber,
      //   column: columnName,
      //   error_type: "Start With Error",
      //   error_description: `${strValue} must start with ${rule.cell_start_with.join(", ")}`,
      // });
    }

    //end with
    if (
      rule.cell_end_with_normalized?.length &&
      !rule.cell_end_with_normalized.some((suffix) =>
        normalizedValue.endsWith(suffix),
      )
    ) {
      if (columnValid == true) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.cell_start_with_end_with_error_count++;

      errorSheet
        .addRow([
          rowNumber,
          columnName,
          "End With Error",
          `${strValue} must end with ${rule.cell_end_with.join(", ")}`,
        ])
        .commit();
      // columnStat.error_msg.push({
      //   row: rowNumber,
      //   column: columnName,
      //   error_type: "End With Error",
      //   error_description: `${strValue} must end with ${rule.cell_end_with.join(", ")}`,
      // });
    }
    if (
      rule.not_match_found_normalized?.length &&
      rule.not_match_found_normalized.some((word) =>
        normalizedValue.includes(word),
      )
    ) {
      if (columnValid == true) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.blocked_word_error_count++;

      errorSheet
        .addRow([
          rowNumber,
          columnName,
          "Blocked Word",
          `${strValue} contains blocked word`,
        ])
        .commit();
      // columnStat.error_msg.push({
      //   row: rowNumber,
      //   column: columnName,
      //   error_type: "Blocked Word",
      //   error_description: `${strValue} contains blocked word`,
      // });
    }

    if (columnValid && strValue !== "") {
      columnStat.valid_records++;
    }
  }

  /*
  =========================
  DEPENDENCY VALIDATION
  =========================
  */

  for (const columnName of headers) {
    const rule = ruleMap[columnName];
    if (!rule?.dependency) continue;

    const dependencyEntries = Object.entries(rule.dependency);
    for (let i = 0; i < dependencyEntries.length - 1; i++) {
      const [currentKey, currentCondition] = dependencyEntries[i];
      const [nextKey, nextCondition] = dependencyEntries[i + 1];

      const currentValue = String(rowData[currentKey] ?? "").trim();
      const nextColumns = nextKey.split(",");

      let conditionMatched = false;

      if (currentCondition === true) {
        conditionMatched = currentValue !== "";
      } else {
        conditionMatched = String(currentValue) === String(currentCondition);
      }

      if (!conditionMatched) break;

      for (const col of nextColumns) {
        const value = String(rowData[col] ?? "").trim();
        const columnStat = columnStats[col];
        if (!columnStat) continue;

        let valid = true;

        if (nextCondition === true) {
          valid = value !== "";
        } else {
          valid = String(value) === String(nextCondition);
        }

        if (!valid) {
          rowValid = false;

          columnStat.invalid_records++;
          errorSheet
            .addRow([
              rowNumber,
              columnName,
              "Dependency Error",
              `${col} must be ${
                nextCondition === true ? "not empty" : nextCondition
              } because ${currentKey} is ${currentCondition}`,
            ])
            .commit();
          // columnStat.error_msg.push({
          //   row: rowNumber,
          //   column: col,
          //   error_type: "Dependency Error",
          //   error_description: `${col} must be ${
          //     nextCondition === true ? "not empty" : nextCondition
          //   } because ${currentKey} is ${currentCondition}`,
          // });
        }
      }
    }
  }

  return rowValid;
};
export const isRequestValidated = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      errors
        .array()
        .map((e) => e.msg)
        .join(", "),
      422,
    );
  }
  next();
};
