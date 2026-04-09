import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { RULE_TO_STATS_MAP } from "../utils/importFileDefaultColumnStats";

import ApiError from "../utils/api.error";
import { param } from "express-validator";
import { ColumnRule, ColumnStats } from "../interface/importedFile.interface";
import { DBBuffer } from "../utils/DBBuffer";
const debug = 0;
const dateTimeRegex =
  /^(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4})(\s+(\d{1,2}:\d{1,2}(:\d{1,2})?(\s*[AP]M)?))?$/i;
const stringRegex = /^.*$/s;
const alphabeticsRegex = /^[a-zA-Z ]*$/;
const integerRegex = /^-?\d+$/;
const numberRegex = /^-?\d+\.\d+$/;
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
    unique_records: 0,

    // ✅ ADD THESE
    unique_values: new Set(),

    error_msg: [],

    error_rows: {
      empty: [],
      datatype: [],
      regex: [],
      redundant: [],
      fixed_header: [],
      start_with: [],
      end_with: [],
      length: [],
      blocked: [],
      dependency: [],
    },
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

    if (rule.cell_end_with) {
      rule.cell_end_with_value = String(rule.cell_end_with);
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

    const dataTypes = Array.isArray(rule.data_type)
      ? rule.data_type
      : [rule.data_type];

    if (dataTypes.includes("date") && rule.date_format) {
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
      rule.cellEndWithMessage = String(rule.cell_end_with);
    }
    if (rule.fixed_header) {
      rule.fixedHeaderMessage = String(rule.fixed_header);
    }
    rule.data_types_new = Array.isArray(rule.data_type)
      ? rule.data_type
      : rule.data_type
        ? [rule.data_type]
        : [];
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
    // 🔥 1. ExcelJS evaluated value
    if (cell.value !== undefined) {
      if (typeof cell.value === "boolean") {
        return cell.value ? "true" : "false";
      }
      return String(cell.value);
    }

    // 🔥 2. FORMULA (your case)
    if (cell.formula) {
      const formula = String(cell.formula).toLowerCase();

      if (formula === "false()" || formula === "false") {
        return "false";
      }

      if (formula === "true()" || formula === "true") {
        return "true";
      }

      // fallback
      return formula;
    }

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

export const validateRow = (
  rowData: Record<string, any>,
  rowNumber: number,
  headers: string[],
  ruleMap: Record<string, any>,
  columnStats: any,

  dbBuffer: DBBuffer,
  fileType: string = "",
) => {
  let rowValid = true;
  const excelTypes = new Set(["csv", "xls", "xlsx"]);
  const isExcel = excelTypes.has(fileType);
  const dependentColumns = new Set<string>();

  Object.values(ruleMap).forEach((rule: any) => {
    if (!rule?.dependency) return;

    const entries = Object.entries(rule.dependency);

    if (entries.length < 2) return;

    const parentKey = entries[0][0];
    const childKey = entries[1][0];

    childKey.split(",").forEach((col: string) => {
      dependentColumns.add(col.trim());
    });
  });

  for (let i = 0; i < headers.length; i++) {
    let datatype_validation_checked = 0;
    const columnName = headers[i];
    const rule = ruleMap[columnName];
    const isDependent = dependentColumns.has(columnName);

    const shouldProcess = rule || isDependent;

    if (!shouldProcess) continue;
    const dataType = rule?.data_types_new;
    const columnStat = columnStats[columnName];

    if (!columnStat) continue;
    let columnValid = true;

    const markInvalid = () => {
      if (columnValid) {
        columnStat.invalid_records++;
      }
      columnValid = false;
      rowValid = false;
    };
    let rawValue = rowData[columnName];

    const primaryType = Array.isArray(dataType) ? dataType[0] : dataType;

    const displayValue = getCellValue(rawValue, primaryType);
    //const displayValue = getCellValue(rawValue, dataType);
    //const strValue = String(displayValue).trim();
    const strValue = String(displayValue);
    const strValueOriginal = rawValue;

    // console.log("+++++++++++");
    // console.log(strValue);
    // console.log(strValueOriginal);
    // console.log("+++++++++++");
    const normalizedValue = strValue;

    if (strValue !== "") {
      columnStat.total_records++;
      columnStat.unique_values.add(strValue);
      columnStat.unique_records = columnStat.unique_values.size;
    }

    //has_empty
    if (rule) {
      // console.log("=======start");
      // console.log(rule.data_types_new);
      // console.log("======= end");
      if (rule.is_required) {
        if (strValue === "") {
          columnStat.empty_count++;

          pushError({ columnStat, ruleKey: "empty", rowNumber });
          markInvalid();

          const errorMsg = `The ${columnName} field is required`;

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Empty Data",
            errorMsg,
          });
        }
      }
      if (rule.cellContainsRegex) {
        const value = String(strValue);
        rule.cellContainsRegex.lastIndex = 0;
        if (!rule.cellContainsRegex.test(value)) {
          columnStat.regex_pattern_error_count++;
          markInvalid();
          pushError({ columnStat, ruleKey: "regex", rowNumber });

          const errorMsg = `${strValue || "Value"} does not match required format ${rule.cellContainsRegex}`;
          // if (debug == 1)
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Regex Pattern Error",
          //     error_description: errorMsg,
          //   });
          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Regex Pattern Error",
            errorMsg,
          });
        }
      }

      if (rule.data_types_new.length > 0) {
        let isError = false;

        // ✅ Ensure

        var errorMsg = `${
          strValueOriginal ?? strValue
        } does not match allowed data types (${dataType.join(", ")})`;
        // ✅ OR validation (any type should pass)
        const isValid = dataType.some((type) => {
          switch (type) {
            case "string":
              return stringRegex.test(strValue);

            case "alphabetic":
              return alphabeticsRegex.test(strValue);

            case "boolean":
              return validBooleanValues.has(strValue.toLowerCase());

            case "date": {
              return dateTimeRegex.test(strValue);
            }
            case "integer":
              // Excel special case
              if (isExcel && typeof rawValue !== "number") {
                return false;
              }

              return integerRegex.test(strValue);

            case "float":
              if (isExcel && typeof rawValue !== "number") {
                return false;
              }
              return numberRegex.test(strValue);

            default:
              return false;
          }
        });

        // ❌ If NONE matched → error
        if (!isValid) {
          isError = true;
        }

        // 🔥 FINAL ERROR HANDLING
        if (isError) {
          columnStat.datatype_error_count++;
          markInvalid();

          pushError({ columnStat, ruleKey: "datatype", rowNumber });

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Datatype Error",
            errorMsg,
          });
          // if (debug == 1) {
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Datatype Error",
          //     error_description: errorMsg,
          //   });
          // }
        }
      }
      if (rule.date_format != undefined) {
        let isError = false;
        let errorMsg = `${strValueOriginal ?? "value"} does not match daeformat ${rule.date_format}`;
        const isValid = rule.dateRegex.test(strValue);
        if (!isValid) {
          isError = true;
        }
        // 🔥 FINAL ERROR HANDLING
        if (isError) {
          columnStat.date_format_error_count++;
          markInvalid();
          pushError({ columnStat, ruleKey: "datatype", rowNumber });

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Date Format Error",
            errorMsg,
          });
          // if (debug == 1) {
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Date Format Error",
          //     error_description: errorMsg,
          //   });
          // }
        }
      }
      //for number type, also check min/max length if specified
      if (
        rule.length_validation_type != null &&
        rule.length_validation_type != undefined
      ) {
        let is_error = 0;
        let errorMsg = "";
        const numValue = +strValue;

        const isInvalidNumber = Number.isNaN(numValue);

        if (
          rule.data_types_new.includes("float") ||
          rule.data_types_new.includes("integer")
        ) {
          if (isInvalidNumber) {
            is_error = 1;
            errorMsg = `${strValueOriginal ?? "Value"}  must be between ${rule.min_length} and ${rule.max_length}`;
          } else if (rule.length_validation_type === "variable") {
            if (rule.min_length !== null && numValue < rule.min_length) {
              is_error = 1;
              errorMsg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and ${rule.max_length}`;
            }

            if (rule.max_length !== null && numValue > rule.max_length) {
              is_error = 1;
              errorMsg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and ${rule.max_length}`;
            }
          } else if (rule.length_validation_type === "fixed") {
            if (rule.min_length !== null && strValue !== rule.min_length) {
              is_error = 1;
              errorMsg = `${strValueOriginal ?? "Value"} must be exactly ${rule.min_length}`;
            }
          }
        } else if (
          rule.data_types_new.length === 0 ||
          ["string", "boolean", "alphabetic"].some((t) => rule.data_types_new.includes(t))
        ) {
          const strLen = strValue.length;

          if (rule.length_validation_type === "variable") {
            if (rule.min_length !== null && strLen < rule.min_length) {
              is_error = 1;
              errorMsg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and ${rule.max_length} in length`;
            } else if (rule.max_length !== null && strLen > rule.max_length) {
              is_error = 1;
              errorMsg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and  ${rule.max_length} length`;
            }
          } else if (rule.length_validation_type === "fixed") {
            if (
              rule.min_length !== null &&
              strLen !== Number(rule.min_length)
            ) {
              is_error = 1;
              errorMsg = `${strValueOriginal ?? "Value"} must be exactly ${rule.min_length} length`;
            }
          }
        } else if (rule.data_types_new.includes("date")) {
          const currentDate = parseDateByFormat(
            strValue,
            rule.date_format || "DD-MM-YYYY",
          );

          if (
            currentDate &&
            rule.min_length &&
            (rule.length_validation_type === "fixed" ||
              (rule.length_validation_type === "variable" && rule.max_length))
          ) {
            const parseFixedDate = (dateStr: string) => {
              const parts = dateStr.split("-");
              if (parts.length !== 3) return null;

              const day = Number(parts[2]);
              const month = Number(parts[1]) - 1;
              const year = Number(parts[0]);

              return new Date(year, month, day);
            };

            if (rule.length_validation_type === "fixed") {
              if (strValue == "") {
                is_error = 1;
                errorMsg = `${strValueOriginal ?? "Value"} must be exactly ++ ${rule.min_length}`;
              } else {
                const fixedDate = rule.min_length
                  ? parseFixedDate(rule.min_length)
                  : null;

                if (fixedDate) {
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
                    errorMsg = `${strValueOriginal ?? "Value"} must be exactly ${rule.min_length}`;
                  }
                }
              }
            } else if (rule.length_validation_type === "variable") {
              const minDate = rule.min_length
                ? parseFixedDate(rule.min_length)
                : null;
              const maxDate = rule.max_length
                ? parseFixedDate(rule.max_length)
                : null;

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
                errorMsg = `${strValueOriginal ?? "Value"} must be between ${rule.min_length} and ${rule.max_length}`;
              }
            }
          }
        }

        if (is_error == 1) {
          markInvalid();
          pushError({ columnStat, ruleKey: "length", rowNumber });

          columnStat.length_validation_error_count++;

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Data Length Error",
            errorMsg,
          });
          // if (debug == 1)
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Data Length Error",
          //     error_description: errorMsg,
          //   });
        }
      }

      if (rule.fixed_header_value !== undefined) {
        if (strValue !== rule.fixed_header_value) {
          markInvalid();
          pushError({ columnStat, ruleKey: "fixed_header", rowNumber });

          columnStat.fixed_header_error_count++;
          const errorMsg = `Invalid fixed value: ${strValue}. Only ${rule.fixedHeaderMessage} is allowed`;

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Fixed Value Error",
            errorMsg,
          });
          // if (debug == 1)
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Fixed Value Error",
          //     error_description: `Invalid fixed value: ${strValue}. Only ${rule.fixedHeaderMessage} is allowed`,
          //   });
        }
      }

      if (rule.cell_start_with_value !== undefined) {
        if (!normalizedValue.startsWith(rule.cell_start_with_value)) {
          markInvalid();
          pushError({ columnStat, ruleKey: "start_with", rowNumber });

          columnStat.cell_start_with_error_count++;
          const errorMsg = `Invalid start value: ${strValue}. It must start with ${rule.cellStartWithMessage}.`;

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Start With Error",
            errorMsg,
          });
          // if (debug == 1)
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Start With Error",
          //     error_description: `Invalid start value: ${strValue}. It must start with ${rule.cellStartWithMessage}.`,
          //   });
        }
      }

      //end with
      if (rule.cell_end_with_value?.length) {
        if (!normalizedValue.endsWith(rule.cell_end_with_value)) {
          markInvalid();
          pushError({ columnStat, ruleKey: "end_with", rowNumber });

          columnStat.cell_end_with_error_count++;
          const errorMsg = `Invalid end value: ${strValue}. It must end with ${rule.cellEndWithMessage}`;

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "End With Error",
            errorMsg,
          });
          // if (debug == 1)
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "End With Error",
          //     error_description: errorMsg,
          //   });
        }
      }
      if (rule.not_match_found_normalized?.length) {
        if (
          rule.not_match_found_normalized?.length &&
          rule.not_match_found_normalized.some((word) =>
            normalizedValue.includes(word),
          )
        ) {
          markInvalid();
          pushError({ columnStat, ruleKey: "blocked", rowNumber });

          columnStat.blocked_word_error_count++;
          const errorMsg = `Blocked word ${rule.blockwordsMessage} found in ${strValue}`;

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Blocked Word",
            errorMsg,
          });

          // if (debug == 1)
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Blocked Word",
          //     error_description: `Blocked word ${rule.blockwordsMessage} found in ${strValue}`,
          //   });
        }
      }
    }
    // DUPLICATE
    if (rule && rule.data_redundant_threshold && rule.redundantCounter) {
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
          markInvalid();
          pushError({ columnStat, ruleKey: "redundant", rowNumber });

          const errorMsg = `${strValue} exceeded allowed repetition (${threshold})`;

          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Redundant Value Error",
            errorMsg,
          });
          // if (debug == 1) {
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: columnName,
          //     error_type: "Redundant Value Error",
          //     error_description: errorMsg,
          //   });
          // }
        }
      }
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

      // ✅ Check parent condition
      if (currentCondition === true) {
        conditionMatched = currentValue !== "";
      } else {
        conditionMatched = String(currentValue) === String(currentCondition);
      }

      if (!conditionMatched) break;

      // ✅ Validate dependent columns
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

          // ✅ prevent duplicate counting per row
          if (!columnStat.invalid_row_numbers.includes(rowNumber)) {
            columnStat.invalid_records++;

            if (columnStat.valid_records > 0) {
              columnStat.valid_records--;
            }

            columnStat.invalid_row_numbers.push(rowNumber);
          }

          columnStat.dependancy_error_count++;

          // ✅ track dependency error rows
          if (!columnStat.error_rows.dependency.includes(rowNumber)) {
            columnStat.error_rows.dependency.push(rowNumber);
          }

          // errorBuffer.add([
          //   rowNumber,
          //   col,
          //   "Dependency Error",
          //   `${col} must be ${
          //     nextCondition === true ? "not empty" : nextCondition
          //   } because ${currentKey} is ${
          //     currentCondition === true ? "required" : currentCondition
          //   }`,
          // ]);
          dbBuffer.add({
            rowNumber,
            columnName,
            errorType: "Dependency Error",
            errorMsg: `${col} must be ${
              nextCondition === true ? "not empty" : nextCondition
            } because ${currentKey} is ${
              currentCondition === true ? "required" : currentCondition
            }`,
          });
          // if (debug == 1) {
          //   columnStat.error_msg.push({
          //     row: rowNumber,
          //     column: col,
          //     error_type: "Dependency Error",
          //     error_description: `${col} must be ${
          //       nextCondition === true ? "not empty" : nextCondition
          //     } because ${currentKey} is ${
          //       currentCondition === true ? "required" : currentCondition
          //     }`,
          //   });
          // }
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

const pushError = ({
  columnStat,
  ruleKey,
  rowNumber,
}: {
  columnStat: any;
  ruleKey: keyof typeof columnStat.error_rows;
  rowNumber: number;
}) => {
  if (!columnStat.error_rows[ruleKey]) {
    columnStat.error_rows[ruleKey] = [];
  }

  if (!columnStat.error_rows[ruleKey].includes(rowNumber)) {
    columnStat.error_rows[ruleKey].push(rowNumber);
  }
};
