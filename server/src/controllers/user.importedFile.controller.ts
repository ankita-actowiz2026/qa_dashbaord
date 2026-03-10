import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import ImportedFile from "../models/importedFile.model";
import CleanData from "../models/cleanData.model";
const BATCH_SIZE = 5000;
import path from "path";
import { parseExcelFile } from "../services/excelParser";
//import { parseExcelFile } from "../services/parseExcel.service";

import fs from "fs/promises";
import { ColumnRule } from "../interface/importedFile.interface";
import { parseCsvFile } from "../services/csvParser";
import { parseXlsFile } from "../services/XlsParser";
import { parseJsonFile } from "../services/jsonParser";
/**
 * Add/Upload Imported File
 */
export const addImportedFile123 = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let filePath: string | null = null;

  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }
    res.json(req.file.path);
    //const result = await parseExcelFile(req.file.path);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const addImportedFile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let filePath: string | null = null;

  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    filePath = path.resolve(req.file.path);
    const ext = path.extname(filePath).toLowerCase();

    const columnConfig: Record<string, ColumnRule> = JSON.parse(
      req.body.columnConfig,
    );

    let result: any;
    switch (ext) {
      case ".json":
        result = await parseJsonFile(filePath, columnConfig);
        break;
      case ".xls":
        result = await parseXlsFile(filePath, columnConfig);
        break;
      case ".csv":
        result = await parseCsvFile(filePath, columnConfig);
        break;
      case ".xlsx":
        result = await parseExcelFile(filePath, columnConfig);
        break;
      default:
        throw new Error("Unsupported file type");
    }

    // 1️⃣ Save summary
    // const importedFile = await ImportedFile.create({
    //   user_id: req.user._id,
    //   file_name: req.file.originalname,

    //   total_records: result.total_records,
    //   valid_records: result.valid_records,
    //   invalid_records: result.invalid_records,
    //   duplicate_count: result.duplicate_count,
    //   missing_required_count: result.missing_required_count,
    //   datatype_error_count: result.datatype_error_count,
    //   junk_character_count: 0,
    //   error_msg: result.error_msg
    // });

    // // 2️⃣ Insert valid rows
    // const cleanDocs = result.clear_data.map((row: any) => ({
    //   importedfile_id: importedFile._id,
    //   data: row
    // }));

    // if (cleanDocs.length) {
    //   await CleanData.insertMany(cleanDocs);
    // }

    // res.status(200).json({
    //   success: true,
    //   importedFileId: importedFile._id
    // });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  } finally {
    //Delete uploaded file after processing
    if (filePath) {
      try {
        await fs.unlink(filePath);
        console.log("Uploaded file deleted:", filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }
  }
};
