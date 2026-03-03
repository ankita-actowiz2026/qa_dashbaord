import ImportedFile from "../models/importedFile.model";
import  IImportedFile  from "../interface/importedFile.interface";
import  ApiError  from "../utils/api.error";
import { Types } from "mongoose";
import ExcelJS from "exceljs";

export class ImportedFileService {
  /**
   * Process and create imported file record
   * Handles file parsing, data extraction, and database storage
   */
  async createImportedFile(
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    columnConfig: any[] = []
  ): Promise<IImportedFile> {
    try {
      // Read Excel file using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      const worksheet = workbook.getWorksheet(1); // Get first sheet

      if (!worksheet) {
        throw new ApiError("No worksheet found in Excel file", 400);
      }

      // Extract headers from first row
      const headers: string[] = [];
      worksheet.getRow(1)?.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? String(cell.value).trim() : `Column${colNumber}`;
      });

      // Extract all records starting from row 2
      const errorFreeData: Record<string, any>[] = [];
      const totalRecords = worksheet.rowCount - 1; // Exclude header row

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const record: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const columnName = headers[colNumber - 1];
          record[columnName] = cell.value;
        });

        errorFreeData.push(record);
      });

      // Create rules from columnConfig
      const rules = columnConfig.map((col: any) => ({
        field_name: col.name,
        datatype: col.type,
        is_required: col.is_mandatory ?? false,
        allow_duplicate: col.is_allow_duplicate ?? false,
        allow_special_char: col.block_special_chars ? false : true,
        num_alphaNum_alpha: col.allow_alpha_numeric ? 'alphanumeric' : '',
      }));

      // Create and save ImportedFile document
      const importedFileData = {
        user_id: userId,
        file_name: fileName,
        total_records: totalRecords,
        valid_records: totalRecords,
        invalid_records: 0,
        duplicate_count: 0,
        missing_required_count: 0,
        datatype_error_count: 0,
        junk_character_count: 0,
        error_msg: [],
        rules: rules,
      };

      return await ImportedFile.create(importedFileData);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Error processing file",
        500
      );
    }
  }
}

export const importedFileService = new ImportedFileService();
