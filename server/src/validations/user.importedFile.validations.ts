import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { RULE_TO_STATS_MAP } from "../utils/importFileDefaultColumnStats";

import ApiError from "../utils/api.error";
import { param } from "express-validator";
import { ColumnRule, ColumnStats } from "../interface/importedFile.interface";
import { ErrorBuffer } from "../utils/errorBuffer";
const debug = 1;

const stringRegex = /^.*$/s;
const alphabeticsRegex = /^[a-zA-Z ]*$/;
const integerRegex = /^-?\d+$/;
const numberRegex = /^-?\d+(\.\d+)?$/;
const validBooleanValues = new Set([
  "true",
  "yes",
  "enabled",
  "1",
  "false",
  "no",
  "disabled",
  "0",
]);
export const extractDependencyColumns = (columnConfig: Record<string, any>) => {
  const dependencyCols = new Set<string>();

  Object.values(columnConfig).forEach((col: any) => {
    const dependency = col?.dependency;
    if (!dependency) return;

    const mainColumn = col.name?.trim(); // ✅ normalize

    Object.keys(dependency).forEach((key) => {
      // ❌ skip main column safely
      if (key.trim() === mainColumn) return;

      // ✅ split and add sub dependency columns
      key.split(",").forEach((k) => {
        const trimmed = k.trim();

        // ❌ skip if accidentally same as main column
        if (trimmed === mainColumn) return;

        if (trimmed) dependencyCols.add(trimmed);
      });
    });
  });

  return Array.from(dependencyCols);
};
export const createColumnStatsFromRules = (
  rules: any,
  dependency_option = "add_dependency",
): ColumnStats => {
  const baseStats: any = {
    total_records: 0,
    valid_records: 0,
    invalid_records: 0,
    error_msg: [],
  };

  Object.keys(rules).forEach((ruleKey) => {
    if (dependency_option == "not_add_dependency" && ruleKey == "dependency") {
      return;
    }

    const statKeys = RULE_TO_STATS_MAP[ruleKey];

    if (statKeys) {
      statKeys.forEach((key) => {
        baseStats[key] = 0;
      });
    }
  });

  return baseStats;
};
export const validateId = [param("id").isMongoId().withMessage("Invalid ID")];
export const validateAdd = [];
export const validateEdit = [];
//if (columnName == "Id") console.log(columnValid);
export const prepareColumnRules = (ruleMap: Record<string, ColumnRule>) => {
  for (const rule of Object.values(ruleMap)) {
    if (rule.fixed_header !== undefined && rule.fixed_header !== null) {
      rule.fixed_header_value = String(rule.fixed_header).replace(/^'/, "");
      // some time inpt text has ' then node will truncate it. truncate from my rule.fixed_header also.
    }
    if (rule.cell_start_with) {
      rule.cell_start_with_value = String(rule.cell_start_with).replace(
        /^'/,
        "",
      );
    }

    if (rule.cell_end_with?.length) {
      rule.cell_end_with_normalized = rule.cell_end_with.map((v) =>
        //String(v).trim().toLowerCase(),
        String(v),
      );
    }

    if (rule.not_match_found?.length) {
      rule.not_match_found_normalized = rule.not_match_found.map(
        (w: string) =>
          //w.trim().toLowerCase(),
          w,
      );
    }

    if (rule.data_redundant_threshold) {
      rule.redundantCounter = new Map<string, number>();
    }

    if (rule.data_type === "date" && rule.date_format) {
      rule.dateRegex = buildDateRegex(rule.date_format);
    }
    if (rule.cell_contains && rule.cell_contains_value) {
      const regexString = rule.cell_contains_value;

      const match = regexString.match(/^\/(.+)\/([a-z]*)$/);

      if (match) {
        const pattern = match[1];
        const flags = match[2]; // includes 'i'

        rule.cellContainsRegex = new RegExp(pattern, flags);
      } else {
        // fallback (if plain pattern without / /)
        rule.cellContainsRegex = new RegExp(regexString, "u");
      }
    }
    if (rule.cell_start_with) {
      rule.cellStartWithMessage = String(rule.cell_start_with);
    }
    if (rule.not_match_found) {
      rule.blockwordsMessage = rule.not_match_found.join(", ");
    }
    if (rule.cell_end_with) {
      rule.cellEndWithMessage = rule.cell_end_with.join(", ");
    }
    if (rule.fixed_header) {
      rule.fixedHeaderMessage = String(rule.fixed_header);
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
export const getCellValue = (cell: any, dataType?: string): string => {
  if (cell === null || cell === undefined) return "";

  // ✅ Only convert to date if column expects date

  if (dataType === "date" && typeof cell === "number") {
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
      return String(cell.text);
    }

    if (cell.result) {
      return String(cell.result);
    }
  }

  return String(cell);
};

export const parseDateByFormat = (
  value: string,
  format: string,
): Date | null => {
  try {
    const monthMap: Record<string, number> = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };

    const tokens = value.match(/[A-Za-z]+|\d+/g);
    const formatTokens = format.match(/[A-Za-z]+/g);

    if (!tokens || !formatTokens) return null;

    let day = 1;
    let month = 0;
    let year = 1970;
    let hour = 0;
    let minute = 0;
    let second = 0;

    for (let i = 0; i < formatTokens.length; i++) {
      const f = formatTokens[i];
      const v = tokens[i];

      if (!v) continue;

      switch (f) {
        case "DD":
          day = Number(v);
          break;

        case "MM":
          month = Number(v) - 1;
          break;

        case "YYYY":
          year = Number(v);
          break;

        case "YY":
          year = 2000 + Number(v);
          break;

        case "HH":
        case "h":
          hour = Number(v);
          break;

        case "mm":
        case "i":
          minute = Number(v);
          break;

        case "ss":
        case "s":
          second = Number(v);
          break;

        case "MMM":
        case "MMMM":
        case "Month":
          month = monthMap[v.toLowerCase()];
          break;
      }
    }

    return new Date(year, month, day, hour, minute, second);
  } catch {
    return null;
  }
};
export const buildDateRegex = (format: string): RegExp => {
  const map: Record<string, string> = {
    YYYY: "\\d{4}",
    YY: "\\d{2}",
    MM: "(0[1-9]|1[0-2])",
    DD: "(0[1-9]|[12][0-9]|3[01])",

    HH: "([01][0-9]|2[0-3])",
    mm: "[0-5][0-9]",
    ss: "[0-5][0-9]",

    h: "(0?[1-9]|1[0-2])",
    i: "[0-5][0-9]",
    s: "[0-5][0-9]",

    a: "(am|pm)",
    A: "(AM|PM)",

    MMMM: "(January|February|March|April|May|June|July|August|September|October|November|December)",

    MMM: "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)",
  };

  const tokenRegex = /YYYY|YY|MMMM|MMM|MM|DD|HH|mm|ss|h|i|s|a|A/g;

  const regex = "^" + format.replace(tokenRegex, (match) => map[match]) + "$";

  return new RegExp(regex, "i");
};
const normalizeValue = (value: any, dataType: string) => {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  return value;
};
export const validateRow = (
  rowData: Record<string, any>,
  rowNumber: number,
  headers: string[],
  ruleMap: Record<string, any>,
  columnStats: any,
  errorBuffer: ErrorBuffer,
  fileType: string = "",
) => {
  let rowValid = true;

  for (let i = 0; i < headers.length; i++) {
    let datatype_validation_checked = 0;
    const columnName = headers[i];

    const rule = ruleMap[columnName];

    if (!rule) continue;
    const dataType = rule.data_type;

    const columnStat = columnStats[columnName];

    if (!columnStat) continue;
    let columnValid = true;

    const markInvalid = () => {
      if (columnValid) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
    };
    let rawValue = rowData[columnName];

    const displayValue = getCellValue(rawValue, dataType);
    //const strValue = String(displayValue).trim();
    const strValue = String(displayValue);
    const strValueOriginal = rawValue;
    const normalizedValue = strValue;

    if (strValue !== "") {
      columnStat.total_records++;
    }

    //has_empty

    if (rule.is_required && strValue === "") {
      columnStat.empty_count++;
      markInvalid();
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Empty Data",
          error_description: `The ${columnName} field is required`,
        });

      errorBuffer.add([
        rowNumber,
        columnName,
        "Empty Data",
        `The ${columnName} field is required`,
      ]);
    }

    // ✅ datatype check FIRST
    if (
      ["csv", "xls", "xlsx"].includes(fileType) &&
      (dataType === "integer" || dataType === "float") &&
      rawValue !== null &&
      rawValue !== undefined &&
      rawValue !== "" &&
      typeof rawValue !== "number"
    ) {
      datatype_validation_checked = 1;
      columnStat.datatype_error_count++;
      markInvalid();

      errorBuffer.add([
        rowNumber,
        columnName,
        "Datatype Error",
        `${columnName} must be a ${dataType}, but got string (${strValueOriginal ?? "Value"})`,
      ]);

      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Datatype Error",
          error_description: `${columnName} must be a ${dataType}, but got string (${strValueOriginal ?? "Value"})`,
        });
    }

    if (rule.cellContainsRegex) {
      const value = String(strValue);

      rule.cellContainsRegex.lastIndex = 0; // 🔥 fix

      if (!rule.cellContainsRegex.test(value)) {
        columnStat.regex_pattern_error_count++;
        markInvalid();
        if (debug == 1)
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Regex Pattern Error",
            error_description: `${strValue ?? "Value"} does not match required format ${rule.cellContainsRegex}`,
          });
        errorBuffer.add([
          rowNumber,
          columnName,
          "Regex Pattern Error",
          `${strValue ?? "Value"} does not match required format ${rule.cellContainsRegex}`,
        ]);
      }
    }

    if (dataType != undefined) {
      let is_error = 0;
      let error_msg = "";
      if (dataType === "string" || dataType === "alphabetic") {
        const regexResult =
          dataType === "string"
            ? stringRegex.test(strValue)
            : alphabeticsRegex.test(strValue);

        if (!regexResult) {
          is_error = 1;
          error_msg = `${strValue} does not match ${dataType} format`;
        }
      } else if (
        (dataType === "integer" || dataType === "float") &&
        strValue !== null &&
        strValue !== "" &&
        datatype_validation_checked == 0
      ) {
        const regexResult =
          dataType === "integer"
            ? integerRegex.test(String(strValue).trim())
            : numberRegex.test(String(strValue).trim());
        if (!regexResult) {
          is_error = 1;
          error_msg = `${strValue} is not a valid ${dataType}`;
        }
      } else if (dataType === "boolean") {
        //const value = String(strValue).trim().toLowerCase();
        const value = String(strValue);
        if (!validBooleanValues.has(value.toLowerCase())) {
          is_error = 1;
          error_msg = `${strValue} is not a valid boolean value`;
        }
      } else if (dataType === "date" && rule.dateRegex) {
        if (!rule.dateRegex.test(strValue)) {
          is_error = 1;
          error_msg = `${strValueOriginal ?? "value"} does not match format ${rule.date_format}`;
        }
      }

      if (is_error == 1) {
        columnStat.datatype_error_count++;
        markInvalid();
        errorBuffer.add([rowNumber, columnName, "Datatype Error", error_msg]);

        if (debug == 1)
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Datatype Error",
            error_description: error_msg,
          });
      }
    }
    // }

    //for number type, also check min/max length if specified
    if (
      rule.length_validation_type != null &&
      rule.length_validation_type != undefined
    ) {
      let is_error = 0;
      let error_msg = "";
      const numValue = +strValue;

      const isInvalidNumber = Number.isNaN(numValue);

      if (dataType === "float" || dataType === "integer") {
        if (isInvalidNumber) {
          is_error = 1;
          error_msg = `${strValueOriginal ?? "Value"}  must be between ${rule.min_length} and ${rule.max_length}`;
        } else if (rule.length_validation_type === "variable") {
          if (rule.min_length !== null && numValue < rule.min_length) {
            is_error = 1;
            error_msg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and ${rule.max_length}`;
          }

          if (rule.max_length !== null && numValue > rule.max_length) {
            is_error = 1;
            error_msg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and ${rule.max_length}`;
          }
        } else if (rule.length_validation_type === "fixed") {
          if (rule.min_length !== null && strValue !== rule.min_length) {
            is_error = 1;
            error_msg = `${strValueOriginal ?? "Value"} must be exactly ${rule.min_length}`;
          }
        }
      } else if (
        dataType === undefined ||
        dataType === "string" ||
        dataType === "boolean" ||
        dataType === "alphabetic"
      ) {
        const strLen = strValue.length;

        // VARIABLE LENGTH (min / max)
        if (rule.length_validation_type === "variable") {
          if (rule.min_length !== null && strLen < rule.min_length) {
            is_error = 1;
            error_msg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and  ${rule.max_length} characters`;
          } else if (rule.max_length !== null && strLen > rule.max_length) {
            is_error = 1;
            error_msg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and  ${rule.max_length} characters`;
          }
        }

        // FIXED LENGTH
        else if (rule.length_validation_type === "fixed") {
          if (rule.min_length !== null && strLen !== Number(rule.min_length)) {
            is_error = 1;
            error_msg = `${strValueOriginal ?? "Value"} must be exactly ${rule.min_length} characters`;
          }
        }
      } else if (dataType === "date") {
        // Range validation
        const currentDate = parseDateByFormat(strValue, rule.date_format);

        if (
          currentDate &&
          rule.min_length &&
          (rule.length_validation_type === "fixed" ||
            (rule.length_validation_type === "variable" && rule.max_length))
        ) {
          // parse min/max using fixed format %d-%m-%Y
          const parseFixedDate = (dateStr: string) => {
            const parts = dateStr.split("-");
            if (parts.length !== 3) return null;

            const day = Number(parts[2]);
            const month = Number(parts[1]) - 1;
            const year = Number(parts[0]);

            return new Date(year, month, day);
          };

          if (rule.length_validation_type === "fixed") {
            const fixedDate = rule.min_length
              ? parseFixedDate(rule.min_length)
              : null;

            if (fixedDate) {
              // normalize both dates (remove time)
              const inputDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
              );

              const compareDate = new Date(
                fixedDate.getFullYear(),
                fixedDate.getMonth(),
                fixedDate.getDate(),
              );

              if (inputDate.getTime() !== compareDate.getTime()) {
                is_error = 1;
                error_msg = `${strValueOriginal ?? "Value"} must be exactly ${rule.min_length}`;
              }
            }
          } else if (rule.length_validation_type === "variable") {
            const minDate = rule.min_length
              ? parseFixedDate(rule.min_length)
              : null;
            const maxDate = rule.max_length
              ? parseFixedDate(rule.max_length)
              : null;

            // remove time from currentDate
            const inputDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
            );

            if (
              (minDate && inputDate.getTime() < minDate.getTime()) ||
              (maxDate && inputDate.getTime() > maxDate.getTime())
            ) {
              is_error = 1;
              error_msg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and ${rule.max_length}`;
            }
          }
        }
      }
      if (is_error == 1) {
        markInvalid();
        columnStat.length_validation_error_count++;
        errorBuffer.add([
          rowNumber,
          columnName,
          "Data Length Error",
          error_msg,
        ]);
        if (debug == 1)
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Data Length Error",
            error_description: error_msg,
          });
      }
    }
    // DUPLICATE
    if (rule.data_redundant_threshold && rule.redundantCounter) {
      const threshold = Number(rule.data_redundant_threshold);

      // Determine if we should track this value
      const shouldTrack =
        rule.data_redundant_value === "" ||
        strValue === rule.data_redundant_value;

      if (shouldTrack) {
        const valueKey = rule.data_redundant_value || strValue;

        const newCount = (rule.redundantCounter.get(valueKey) || 0) + 1;
        rule.redundantCounter.set(valueKey, newCount);

        if (newCount > threshold) {
          columnStat.redundant_error_count++;
          columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          const errorMsg = `${strValue} exceeded allowed repetition (${threshold})`;

          errorBuffer.add([
            rowNumber,
            columnName,
            "Redundant Value Error",
            errorMsg,
          ]);

          if (debug == 1) {
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Redundant Value Error",
              error_description: errorMsg,
            });
          }
        }
      }
    }

    if (
      rule.fixed_header_value !== undefined &&
      strValue !== rule.fixed_header_value
    ) {
      markInvalid();
      columnStat.fixed_header_error_count++;

      errorBuffer.add([
        rowNumber,
        columnName,
        "Fixed Value Error",
        `Invalid fixed value: ${strValue}. Only ${rule.fixedHeaderMessage} is allowed`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Fixed Value Error",
          error_description: `Invalid fixed value: ${strValue}. Only ${rule.fixedHeaderMessage} is allowed`,
        });
    }

    if (
      rule.cell_start_with_value !== undefined &&
      !normalizedValue.startsWith(rule.cell_start_with_value)
    ) {
      markInvalid();
      columnStat.cell_start_with_error_count++;
      errorBuffer.add([
        rowNumber,
        columnName,
        "Start With Error",
        `Invalid start value: ${strValue}. It must start with ${rule.cellStartWithMessage}.`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Start With Error",
          error_description: `Invalid start value: ${strValue}. It must start with ${rule.cellStartWithMessage}.`,
        });
    }

    //end with
    if (
      rule.cell_end_with_normalized?.length &&
      !rule.cell_end_with_normalized.some((suffix) =>
        normalizedValue.endsWith(suffix),
      )
    ) {
      markInvalid();
      columnStat.cell_end_with_error_count++;

      errorBuffer.add([
        rowNumber,
        columnName,
        "End With Error",
        `Invalid end value: ${strValue}. It must end with ${rule.cellEndWithMessage}`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "End With Error",
          error_description: `Invalid end value: ${strValue}. It must end with ${rule.cellEndWithMessage}`,
        });
    }
    if (
      rule.not_match_found_normalized?.length &&
      rule.not_match_found_normalized.some((word) =>
        normalizedValue.includes(word),
      )
    ) {
      markInvalid();
      columnStat.blocked_word_error_count++;

      errorBuffer.add([
        rowNumber,
        columnName,
        "Blocked Word",
        `Blocked word ${rule.blockwordsMessage} found in ${strValue}`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Blocked Word",
          error_description: `Blocked word ${rule.blockwordsMessage} found in ${strValue}`,
        });
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

      const currentValue = String(rowData[currentKey] ?? "");
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
          columnStat.dependancy_error_count++;
          errorBuffer.add([
            rowNumber,
            columnName,
            "Dependency Error",
            `${col} must be ${
              nextCondition === true ? "not empty" : nextCondition
            } because ${currentKey} is ${currentCondition == true ? "required" : currentCondition}`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: col,
              error_type: "Dependency Error",
              error_description: `${col} must be ${
                nextCondition === true ? "not empty" : nextCondition
              }  because ${currentKey} is ${currentCondition == true ? "required" : currentCondition}`,
            });
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
