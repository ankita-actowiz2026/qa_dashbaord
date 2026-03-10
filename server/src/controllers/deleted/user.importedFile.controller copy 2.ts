import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import ImportedFile from "../models/importedFile.model";
import CleanDataModel from "../models/cleanData.model";
const BATCH_SIZE = 5000;
class ImportedFileController {
 

  /**
   * Add/Upload Imported File
   */
 addImportedFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    const userId = (req as any).user._id;
    const fileName = req.file.originalname;
    const filePath = req.file.path; // ✅ use path instead of buffer
    const columnConfig = req.body.columnConfig
      ? JSON.parse(req.body.columnConfig)
      : [];

    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    const rules = columnConfig.map((col: any) => ({
      field_name: col.name,
      datatype: col.type,
      is_required: col.is_mandatory ?? false,
      allow_duplicate: col.is_allow_duplicate ?? false,
      allow_special_char: col.block_special_chars ? false : true,
      num_alphaNum_alpha: col.allow_alpha_numeric ? "alphanumeric" : "",
    }));
//res.json(rules)
    // 1️⃣ Save ImportedFile first
    const importedFile = await ImportedFile.create({
      user_id: userId,
      file_name: fileName,
      total_records: 0,
      valid_records: 0,
      invalid_records: 0,
      duplicate_count: 0,
      missing_required_count: 0,
      datatype_error_count: 0,
      junk_character_count: 0,
      error_msg: [],
      rules,
    });

    let totalRecords = 0;

    switch (fileExtension) {
      case "xlsx":
      case "xls":
        totalRecords = await this.parseExcelFileStream(
          filePath,
          importedFile._id
        );
        break;

      default:
        res.status(400).json({
          success: false,
          message: "Only streaming Excel shown here",
        });
        return;
    }

    await ImportedFile.findByIdAndUpdate(importedFile._id, {
      total_records: totalRecords,
      valid_records: totalRecords,
    });

    res.status(201).json({
      success: true,
      message: "File uploaded and processed successfully",
      data: {
        id: importedFile._id,
        fileName,
        totalRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};


private async parseExcelFileStream(
  filePath: string,
  importedFileId: string,
  columnConfig: any[] = []
): Promise<number> {
  
  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    sharedStrings: "cache",
    hyperlinks: "ignore",
  });

  const BATCH_SIZE = 5000;

  let headers: string[] = [];
  let cleanBatch: any[] = [];
  let errorBatch: any[] = [];
  let totalRecords = 0;

  // ✅ Convert columnConfig → ruleMap (O(1) lookup)
  const ruleMap: Record<string, any> = {};
  columnConfig.forEach((col) => {
    ruleMap[col.name] = col;
  });
console.log(ruleMap)
  // ✅ Duplicate tracker (per column)
  const duplicateTracker: Record<string, Set<string>> = {};

  for await (const worksheet of workbook) {

    for await (const row of worksheet) {

      // ---------------- HEADER ROW ----------------
      if (row.number === 1) {
        headers = row.values
          .slice(1)
          .map((h: any, i: number) =>
            h ? String(h).trim() : `Column${i + 1}`
          );
        continue;
      }

      const record: Record<string, any> = {};
      let hasError = false;
console.log(headers)
      // ---------------- COLUMN LOOP ----------------
      headers.forEach((header, index) => {

        const value = row.values[index + 1] ?? null;
        const stringValue = value ? String(value).trim() : "";

        record[header] = value;

        const rule = ruleMap[header];
        if (!rule) return;
        console.log("===========>"+rule)
        
        // 🔴 1. Mandatory Check
        if (rule.is_mandatory && !stringValue) {
          hasError = true;
          errorBatch.push({
            importedfile_id: importedFileId,
            rowNumber: row.number,
            columnName: header,
            errorType: "Mandatory Error",
            errorDescription: `${header} is required`,
          });
        }

        // 🔴 2. Length Validation
        if (stringValue) {

          if (rule.length_type === "fixed" && rule.min_length) {
            if (stringValue.length !== rule.min_length) {
              hasError = true;
              errorBatch.push({
                importedfile_id: importedFileId,
                rowNumber: row.number,
                columnName: header,
                errorType: "Fixed Length Error",
                errorDescription: `${header} must be exactly ${rule.min_length} characters`,
              });
            }
          }

          if (rule.length_type === "variable") {

            if (rule.min_length && stringValue.length < rule.min_length) {
              hasError = true;
              errorBatch.push({
                importedfile_id: importedFileId,
                rowNumber: row.number,
                columnName: header,
                errorType: "Min Length Error",
                errorDescription: `${header} must be at least ${rule.min_length} characters`,
              });
            }

            if (rule.max_length && stringValue.length > rule.max_length) {
              hasError = true;
              errorBatch.push({
                importedfile_id: importedFileId,
                rowNumber: row.number,
                columnName: header,
                errorType: "Max Length Error",
                errorDescription: `${header} must not exceed ${rule.max_length} characters`,
              });
            }
          }
        }

        // 🔴 3. Special Character Check
        if (rule.block_special_chars && stringValue) {
          const specialCharRegex = /[^a-zA-Z0-9 ]/;
          if (specialCharRegex.test(stringValue)) {
            hasError = true;
            errorBatch.push({
              importedfile_id: importedFileId,
              rowNumber: row.number,
              columnName: header,
              errorType: "Special Character Error",
              errorDescription: `${header} contains special characters`,
            });
          }
        }

        // 🔴 4. Alphanumeric Check
        if (rule.allow_alpha_numeric && stringValue) {
          const alphaNumRegex = /^[a-zA-Z0-9]+$/;
          if (!alphaNumRegex.test(stringValue)) {
            hasError = true;
            errorBatch.push({
              importedfile_id: importedFileId,
              rowNumber: row.number,
              columnName: header,
              errorType: "Alphanumeric Error",
              errorDescription: `${header} must be alphanumeric`,
            });
          }
        }

        // 🔴 5. Duplicate Check (within file)
        if (!rule.is_allow_duplicate && stringValue) {

          if (!duplicateTracker[header]) {
            duplicateTracker[header] = new Set();
          }

          if (duplicateTracker[header].has(stringValue)) {
            hasError = true;
            errorBatch.push({
              importedfile_id: importedFileId,
              rowNumber: row.number,
              columnName: header,
              errorType: "Duplicate Error",
              errorDescription: `${header} contains duplicate value`,
            });
          } else {
            duplicateTracker[header].add(stringValue);
          }
        }

      });

      totalRecords++;

      // ---------------- STORE CLEAN ROW ----------------
      if (!hasError) {
        cleanBatch.push({
          importedfile_id: importedFileId,
          data: record,
        });
      }

      // ---------------- BATCH INSERT CLEAN ----------------
      if (cleanBatch.length === BATCH_SIZE) {
        await CleanDataModel.insertMany(cleanBatch, { ordered: false });
        cleanBatch = [];
      }

      // ---------------- BATCH INSERT ERRORS ----------------
      if (errorBatch.length === BATCH_SIZE) {
        await ErrorDataModel.insertMany(errorBatch, { ordered: false });
        errorBatch = [];
      }

    }
  }

  // Insert remaining clean data
  if (cleanBatch.length > 0) {
    await CleanDataModel.insertMany(cleanBatch, { ordered: false });
  }

  // Insert remaining errors
  if (errorBatch.length > 0) {
    await ErrorDataModel.insertMany(errorBatch, { ordered: false });
  }

  return totalRecords;
}

}

export const importedFileController = new ImportedFileController();
