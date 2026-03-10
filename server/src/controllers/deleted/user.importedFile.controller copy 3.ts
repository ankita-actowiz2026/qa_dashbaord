import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import ImportedFile from "../models/importedFile.model";
import CleanDataModel from "../models/cleanData.model";
const BATCH_SIZE = 5000;
import path from "path";
import { parseExcelFileStream } from "../services/excelParser_optimized";



  /**
   * Add/Upload Imported File
   */
 export const addImportedFile = async (
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

    const filePath = path.resolve(req.file.path);

    const columnConfig = JSON.parse(req.body.columnConfig);

    const result = await parseExcelFileStream(filePath, columnConfig);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


