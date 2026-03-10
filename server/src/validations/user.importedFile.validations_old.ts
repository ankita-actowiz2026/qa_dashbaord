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

  // =============================
  // Find dependency rule
  // =============================

  let dependencyKeys: string[] = [];

  for (const rule of Object.values(ruleMap)) {
    if (rule.dependency) {
      dependencyKeys = Object.keys(rule.dependency);
      break;
    }
  }

  // =============================
  // Dependency Validation
  // =============================

  if (dependencyKeys.length > 0) {
    for (let i = 0; i < dependencyKeys.length; i++) {
      const parentKey = dependencyKeys[i];
      const parentValue = rowData[parentKey];

      if (!parentValue) continue;

      const nextKey = dependencyKeys[i + 1];
      if (!nextKey) continue;

      const dependentFields = nextKey.split(",");

      for (const field of dependentFields) {
        const value = rowData[field];

        if (!value) {
          const columnStat = columnStats[field];
          if (!columnStat) continue;

          columnStat.invalid_records++;
          columnStat.dependency_error = (columnStat.dependency_error || 0) + 1;

          rowValid = false;

          if (columnStat.error_msg.length < 50) {
            columnStat.error_msg.push({
              row: rowNumber,
              column: field,
              error_type: "Dependency Error",
              error_description: `${field} must be filled because ${parentKey} has value`,
            });
          }
        }
      }
    }
  }

  // =============================
  // Column Validation
  // =============================

  for (const columnName of headers) {
    const rule = ruleMap[columnName];
    if (!rule) continue;

    const columnStat = columnStats[columnName];
    let columnValid = true;

    const strValue = rowData[columnName] ?? "";

    if (strValue !== "") {
      columnStat.total_records++;
    }

    // Required check

    if (!rule.has_empty && !strValue) {
      columnStat.missing_required_count++;

      if (columnValid) {
        columnStat.invalid_records++;
      }

      columnValid = false;
      rowValid = false;

      if (columnStat.error_msg.length < 50) {
        columnStat.error_msg.push({
          row: rowNumber,
          column: columnName,
          error_type: "Missing Required",
          error_description: `${columnName} is mandatory`,
        });
      }

      continue;
    }

    if (!strValue) continue;

    // Valid record count

    if (columnValid) {
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
