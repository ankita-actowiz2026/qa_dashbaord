import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import ApiError from "../utils/api.error";
import { param } from "express-validator";
import { ColumnRule, ColumnStats } from "../interface/importedFile.interface";
import { ErrorBuffer } from "../utils/errorBuffer";
const debug = 1;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const integerRegex = /^-?\d+$/;
const validBooleanValues = new Set([
  "true",
  "false",
  "TRUE",
  "FALSE",
  "1",
  "0",
  "yes",
  "no",
  "y",
  "n",
  "YES",
  "NO",
  "Y",
  "N",
]);
export const validateId = [param("id").isMongoId().withMessage("Invalid ID")];
export const validateAdd = [];
export const validateEdit = [];
//if (columnName == "Id") console.log(columnValid);
export const prepareColumnRules = (ruleMap: Record<string, ColumnRule>) => {
  for (const rule of Object.values(ruleMap)) {
    if (rule.fixed_header?.length) {
      rule.fixed_header_set = new Set(
        //rule.fixed_header.map((v: string) => v.trim().toLowerCase()),
        rule.fixed_header.map((v: string) => v),
      );
    }

    if (rule.cell_start_with?.length) {
      rule.cell_start_with_normalized = rule.cell_start_with.map((v) =>
        //String(v).trim().toLowerCase(),
        String(v),
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
      rule.cellContainsRegex = new RegExp(rule.cell_contains_value, "u");
    }
    if (rule.cell_start_with) {
      rule.cellStartWithMessage = rule.cell_start_with.join(", ");
    }
    if (rule.cell_end_with) {
      rule.cellEndWithMessage = rule.cell_end_with.join(", ");
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
  errorBuffer: ErrorBuffer,
) => {
  let rowValid = true;

  for (let i = 0; i < headers.length; i++) {
    const columnName = headers[i];
    const rule = ruleMap[columnName];
    if (!rule) continue;
    const dataType = rule.data_type;

    const columnStat = columnStats[columnName];
    if (!columnStat) continue;
    let columnValid = true;

    const strValue = rowData[columnName] ?? "";
    const normalizedValue = strValue;
    if (strValue !== "") {
      columnStat.total_records++;
    }
    //has_empty

    if (!rule.has_empty && strValue === "") {
      columnStat.empty_count++;
      if (columnValid) columnStat.invalid_records++; //set this condition coz if colom has multiple validsation failed then invalid count was incremented so wrong invalid count was coming

      columnValid = false;
      rowValid = false;
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Empty Data",
          error_description: `${columnName} is mandatory`,
        });

      errorBuffer.add([
        rowNumber,
        columnName,
        "Empty Data",
        `${columnName} is mandatory`,
      ]);

      continue;
    }

    if (strValue === "") continue;
    // EMAIL
    if (dataType === "email") {
      if (!emailRegex.test(strValue)) {
        columnStat.datatype_error_count++;
        if (columnValid) columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;
        errorBuffer.add([
          rowNumber,
          columnName,
          "Datatype Error",
          `${strValue} does not match email format`,
        ]);

        if (debug == 1)
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Datatype Error",
            error_description: `${strValue} does not match email format`,
          });
      }
    } else if (dataType === "integer" && strValue !== null && strValue !== "") {
      if (!integerRegex.test(String(strValue).trim())) {
        if (columnValid === true) columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;

        columnStat.datatype_error_count++;

        errorBuffer.add([
          rowNumber,
          columnName,
          "Datatype Error",
          `${strValue} is not a valid integer`,
        ]);

        if (debug == 1)
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Datatype Error",
            error_description: `${strValue} is not a valid integer`,
          });
      }
    }
    //pattern checking
    // if (rule.cell_contains && rule.cell_contains_value) {
    //   const regex = new RegExp(rule.cell_contains_value, "u");

    if (rule.cellContainsRegex && !rule.cellContainsRegex.test(strValue)) {
      columnStat.pattern_error_count++;
      if (columnValid) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Pattern Error",
          error_description: `${strValue} does not match required format`,
        });
      errorBuffer.add([
        rowNumber,
        columnName,
        "Pattern Error",
        `${strValue} does not match required format`,
      ]);
    }
    // }

    //for number type, also check min/max length if specified
    if (dataType === "float" || dataType === "integer") {
      const numValue = +strValue;
      // Variable length validation (numeric range)
      if (rule.length_validation_type === "variable") {
        if (rule.min_length !== null && numValue < rule.min_length) {
          if (columnValid) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;
          columnStat.length_validation_error_count++;
          errorBuffer.add([
            rowNumber,
            columnName,
            "Data Length Error",
            `${columnName} must be >= ${rule.min_length}`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Data Length Error",
              error_description: `${columnName} must be >= ${rule.min_length}`,
            });
        }

        if (rule.max_length !== null && numValue > rule.max_length) {
          if (columnValid) columnStat.invalid_records++;
          columnValid = false;
          rowValid = false;
          columnStat.length_validation_error_count++;

          errorBuffer.add([
            rowNumber,
            columnName,
            "Data Length Error",
            `${columnName} must be <= ${rule.max_length}`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Data Length Error",
              error_description: `${columnName} must be <= ${rule.max_length}`,
            });
        }
      } else if (rule.length_validation_type === "fixed") {
        const digitLength = strValue.toString().length;
        //console.log(digitLength + "===" + rule.min_length);
        if (rule.min_length !== null && strValue !== rule.min_length) {
          if (columnValid) columnStat.invalid_records++;
          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorBuffer.add([
            rowNumber,
            columnName,
            "Data Length Error",
            `${columnName} must be exactly ${rule.min_length}`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Data Length Error",
              error_description: `${columnName} must be exactly ${rule.min_length}`,
            });
        }
      }
    } else if (
      dataType === "string" ||
      dataType === "email" ||
      dataType === "boolean"
    ) {
      const strLen = strValue.length;

      // VARIABLE LENGTH (min / max)
      if (rule.length_validation_type === "variable") {
        if (rule.min_length !== null && strLen < rule.min_length) {
          if (columnValid === true) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorBuffer.add([
            rowNumber,
            columnName,
            "Length Error",
            `${columnName} must be at least ${rule.min_length} characters`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Length Error",
              error_description: `${columnName} must be at least ${rule.min_length} characters`,
            });
        }

        if (rule.max_length !== null && strLen > rule.max_length) {
          if (columnValid === true) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorBuffer.add([
            rowNumber,
            columnName,
            "Data Length Error",
            `${columnName} must be <= ${rule.max_length} characters`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Data Length Error",
              error_description: `${columnName} must be <= ${rule.max_length} characters`,
            });
        }
      }

      // FIXED LENGTH
      else if (rule.length_validation_type === "fixed") {
        //if (columnName == "URL") console.log(strLen + "!==" + rule.min_length);
        if (rule.min_length !== null && strLen !== Number(rule.min_length)) {
          if (columnValid === true) columnStat.invalid_records++;

          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          errorBuffer.add([
            rowNumber,
            columnName,
            "Data Length Error",
            `${columnName} must be exactly ${rule.min_length} characters`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Data Length Error",
              error_description: `${columnName} must be exactly ${rule.min_length} characters`,
            });
        }
      }
    }

    // if (dataType === "boolean") {
    //   //const value = String(strValue).trim().toLowerCase();
    //   const value = String(strValue);

    //   if (!validBooleanValues.has(value)) {
    //     if (columnValid === true) columnStat.invalid_records++;

    //     columnValid = false;
    //     rowValid = false;

    //     columnStat.datatype_error_count++;
    //     errorBuffer.add([
    //       rowNumber,
    //       columnName,
    //       "Datatype Error",
    //       `${strValue} is not a valid boolean value`,
    //     ]);
    //     if (debug == 1)
    //       columnStat.error_msg.push({
    //         row: rowNumber,
    //         column: columnName,
    //         error_type: "Datatype Error",
    //         error_description: `${strValue} is not a valid boolean value`,
    //       });
    //   }
    // }
    // DUPLICATE
    if (rule.data_redundant_threshold && rule.redundantCounter) {
      const threshold = Number(rule.data_redundant_threshold);

      // Determine if we should track this value
      const shouldTrack =
        rule.data_redundant_value === "" ||
        strValue === rule.data_redundant_value;

      if (shouldTrack) {
        // const valueKey =
        //   rule.data_redundant_value !== ""
        //     ? rule.data_redundant_value
        //     : strValue;
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

    //if (dataType  === "date" && rule.dateRegex && !strValue) {
    if (dataType === "date" && rule.dateRegex) {
      if (!rule.dateRegex.test(strValue)) {
        if (columnValid) columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;
        columnStat.date_format_error_count++;
        errorBuffer.add([
          rowNumber,
          columnName,
          "Date Format Error",
          `${strValue} does not match format ${rule.date_format}`,
        ]);
        if (debug == 1)
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Date Format Error",
            error_description: `${strValue} does not match format ${rule.date_format}`,
          });
      } else {
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
              console.log(inputDate.getTime() + "!==" + compareDate.getTime());
              if (inputDate.getTime() !== compareDate.getTime()) {
                console.log("invalid");
                if (columnValid) columnStat.invalid_records++;
                columnStat.length_validation_error_count++;
                columnValid = false;
                rowValid = false;
                if (debug == 1)
                  columnStat.error_msg.push({
                    row: rowNumber,
                    column: columnName,
                    error_type: "Data Length Error",
                    error_description: `${strValue} must be exactly ${rule.min_length}`,
                  });
                errorBuffer.add([
                  rowNumber,
                  columnName,
                  "Data Length Error",
                  `${strValue} must be exactly ${rule.min_length}`,
                ]);
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
            if (columnName == "Scrape_DateTime") {
              console.log("Input date-->" + inputDate);
              console.log(minDate + "==min max date=" + maxDate);
            }

            if (
              (minDate && inputDate.getTime() < minDate.getTime()) ||
              (maxDate && inputDate.getTime() > maxDate.getTime())
            ) {
              if (columnValid) columnStat.invalid_records++;
              columnStat.length_validation_error_count++;
              columnValid = false;
              rowValid = false;

              errorBuffer.add([
                rowNumber,
                columnName,
                "Data Length Error",
                `${strValue} must be between ${rule.min_length} and ${rule.max_length}`,
              ]);
              if (debug == 1)
                columnStat.error_msg.push({
                  row: rowNumber,
                  column: columnName,
                  error_type: "Data Length Error",
                  error_description: `${strValue} must be between ${rule.min_length} and ${rule.max_length}`,
                });
            }
          }
        }
      }
    }
    // if (rule.fixed_header_set &&!rule.fixed_header_set.has(strValue.toLowerCase())) {
    if (rule.fixed_header_set && !rule.fixed_header_set.has(strValue)) {
      if (columnValid) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.fixed_header_error_count++;

      errorBuffer.add([
        rowNumber,
        columnName,
        "Fixed Header Value Error",
        `${strValue} not allowed`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Fixed Header Value Error",
          error_description: `${strValue} not allowed`,
        });
    }
    // START WITH
    // const normalizedValue = String(strValue ?? "")
    //   .trim()
    //   .toLowerCase();

    if (
      rule.cell_start_with_normalized?.length &&
      !rule.cell_start_with_normalized.some((prefix) =>
        normalizedValue.startsWith(prefix),
      )
    ) {
      if (columnValid) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.cell_start_with_end_with_error_count++;
      errorBuffer.add([
        rowNumber,
        columnName,
        "Start With Error",
        `${strValue} must start with ${rule.cellStartWithMessage}`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Start With Error",
          error_description: `${strValue} must start with ${rule.cellStartWithMessage}`,
        });
    }

    //end with
    if (
      rule.cell_end_with_normalized?.length &&
      !rule.cell_end_with_normalized.some((suffix) =>
        normalizedValue.endsWith(suffix),
      )
    ) {
      if (columnValid) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.cell_start_with_end_with_error_count++;

      errorBuffer.add([
        rowNumber,
        columnName,
        "End With Error",
        `${strValue} must end with ${rule.cellEndWithMessage}`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "End With Error",
          error_description: `${strValue} must end with ${rule.cellEndWithMessage}`,
        });
    }
    if (
      rule.not_match_found_normalized?.length &&
      rule.not_match_found_normalized.some((word) =>
        normalizedValue.includes(word),
      )
    ) {
      if (columnValid) columnStat.invalid_records++;
      columnValid = false;
      rowValid = false;
      columnStat.blocked_word_error_count++;

      errorBuffer.add([
        rowNumber,
        columnName,
        "Blocked Word",
        `${strValue} contains blocked word`,
      ]);
      if (debug == 1)
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Blocked Word",
          error_description: `${strValue} contains blocked word`,
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
          columnStat.dependancy_error_count++;
          errorBuffer.add([
            rowNumber,
            columnName,
            "Dependency Error",
            `${col} must be ${
              nextCondition === true ? "not empty" : nextCondition
            } because ${currentKey} is ${currentCondition}`,
          ]);
          if (debug == 1)
            columnStat.error_msg.push({
              row: rowNumber,
              column: col,
              error_type: "Dependency Error",
              error_description: `${col} must be ${
                nextCondition === true ? "not empty" : nextCondition
              } because ${currentKey} is ${currentCondition}`,
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
