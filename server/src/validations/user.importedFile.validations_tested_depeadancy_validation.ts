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
    const rule = ruleMap[columnName];
    if (!rule) continue;

    const columnStat = columnStats[columnName];
    let columnValid = true;

    const strValue = rowData[columnName] ?? "";

    if (strValue !== "") {
      columnStat.total_records++;
    }

    // REQUIRED CHECK
    if (!rule.has_empty && !strValue) {
      columnStat.missing_required_count++;

      if (columnValid === true) {
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

    // EMAIL VALIDATION
    if (rule.data_type === "email") {
      if (!emailRegex.test(strValue)) {
        columnStat.datatype_error_count++;

        if (columnValid === true) columnStat.invalid_records++;

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
    }

    // REGEX VALIDATION
    else if (rule.cell_contains && rule.cell_contains_value) {
      const regex = new RegExp(rule.cell_contains_value);

      if (!regex.test(strValue)) {
        columnStat.datatype_error_count++;

        if (columnValid === true) columnStat.invalid_records++;

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
    console.log(dependencyEntries);
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

          if (columnStat.error_msg.length < 50) {
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
