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
export const buildDateRegex = (format: string): RegExp => {
  let pattern = format;

  pattern = pattern.replace("%Y", "(\\d{4})"); // Year
  pattern = pattern.replace("%m", "(0[1-9]|1[0-2])"); // Month
  pattern = pattern.replace("%d", "(0[1-9]|[12][0-9]|3[01])"); // Day

  pattern = pattern.replace("%H", "([01][0-9]|2[0-3])"); // 24h
  pattern = pattern.replace("%h", "(0[1-9]|1[0-2])"); // 12h

  pattern = pattern.replace("%i", "([0-5][0-9])"); // Minutes
  pattern = pattern.replace("%s", "([0-5][0-9])"); // Seconds

  // handle AM/PM if present
  pattern = pattern.replace("with am/pm", "(AM|PM|am|pm)");

  return new RegExp(`^${pattern}$`);
};

export const validateRow = (
  rowData: any,
  rowNumber: number,
  headers: string[],
  ruleMap: Record<string, ColumnRule>,
  columnStats: any,
  duplicateTracker: Record<string, Set<any>>,
) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let rowValid = true;

  for (const columnName of headers) {
    let invalid_set = 0;
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
      console.log("[[" + columnValid);
      if (columnValid == true) {
        //set this condition coz if colom has multiple validsation failed then invalid count was incremented so wrong invalid count was coming
        columnStat.invalid_records++;
      }

      columnValid = false;
      rowValid = false;

      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Missing Required",
        error_description: `${columnName} is mandatory`,
      });

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
        if (columnStat.error_msg.length < 50) {
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Pattern Error",
            error_description: `${strValue} does not match email format`,
          });
        }
      }
    } else if (rule.cell_contains && rule.cell_contains_value) {
      const regex = new RegExp(rule.cell_contains_value);

      if (!regex.test(strValue)) {
        columnStat.datatype_error_count++;
        if (columnValid == true) columnStat.invalid_records++;
        columnStat.datatype_error_count++;
        columnValid = false;
        rowValid = false;

        if (columnStat.error_msg.length < 50) {
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Pattern Error",
            error_description: `${strValue} does not match required format`,
          });
        }
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
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Range Error",
            error_description: `${columnName} must be >= ${rule.min_length}`,
          });
        }

        if (rule.max_length !== null && numValue > rule.max_length) {
          if (columnValid == true) columnStat.invalid_records++;
          columnValid = false;
          rowValid = false;
          columnStat.length_validation_error_count++;

          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Range Error",
            error_description: `${columnName} must be <= ${rule.max_length}`,
          });
        }
      } else if (rule.length_validation_type === "fixed") {
        const digitLength = strValue.toString().length;

        if (rule.min_length !== null && digitLength !== rule.min_length) {
          if (columnValid == true) columnStat.invalid_records++;
          columnValid = false;
          rowValid = false;

          columnStat.length_validation_error_count++;
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Length Error",
            error_description: `${columnName} must be exactly ${rule.min_length} digits`,
          });
        }
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

          if (columnStat.error_msg.length < 50) {
            columnStat.error_msg.push({
              row: rowNumber,
              column: columnName,
              error_type: "Redundant Value Error",
              error_description: `${strValue} exceeded allowed repetition (${rule.data_redundant_threshold})`,
            });
          }
        }
      }
    }

    if (rule.data_type === "date" && rule.dateRegex) {
      if (!rule.dateRegex.test(strValue)) {
        columnStat.datatype_error_count++;
        columnStat.invalid_records++;

        columnValid = false;
        rowValid = false;
        columnStat.date_format_error_count++;
        if (columnStat.error_msg.length < 50) {
          columnStat.error_msg.push({
            row: rowNumber,
            column: columnName,
            error_type: "Date Format Error",
            error_description: `${strValue} does not match format ${rule.date_format}`,
          });
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
      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Fixed Header Value Error",
        error_description: `${strValue} not allowed`,
      });
    }
    // START WITH
    const normalizedValue = strValue.trim().toLowerCase();
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
      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "Start With Error",
        error_description: `${strValue} must start with ${rule.cell_start_with.join(", ")}`,
      });
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

      columnStat.error_msg.push({
        row: rowNumber,
        column: columnName,
        error_type: "End With Error",
        error_description: `${strValue} must end with ${rule.cell_end_with.join(", ")}`,
      });
    }
    console.log(columnName);
    if (columnName == "Id") {
      console.log("+++++++++++++++");
      console.log(rule.not_match_found_normalized);
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
      if (columnStat.error_msg.length < 50) {
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Blocked Word",
          error_description: `${strValue} contains blocked word`,
        });
      }
    }

    //if (columnName == "Id") console.log(columnValid + "=++==" + strValue);
    if (columnValid && strValue !== "") {
      columnStat.valid_records++;
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
