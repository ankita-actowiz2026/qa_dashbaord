import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import ImportedFile from "../models/importedFile.model";
import CleanDataModel from "../models/cleanData.model";
const BATCH_SIZE = 5000;
class ImportedFileController {
  /**
   * Parse Excel File (XLSX/XLS)
   */
  private async parseExcelFile1(fileBuffer: Buffer): Promise<{ headers: string[], errorFreeData: Record<string, any>[], totalRecords: number }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength));
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error("No worksheet found in Excel file");
    }

    const headers: string[] = [];
    worksheet.getRow(1)?.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value ? String(cell.value).trim() : `Column${colNumber}`;
    });

    const errorFreeData: Record<string, any>[] = [];
    const totalRecords = worksheet.rowCount - 1;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const record: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const columnName = headers[colNumber - 1];
        record[columnName] = cell.value;
      });

      errorFreeData.push(record);
    });

    return { headers, errorFreeData, totalRecords };
  }

  /**
   * Parse CSV File (Optimized for large files)
   */
  private async parseCsvFile(fileBuffer: Buffer): Promise<{ headers: string[], errorFreeData: Record<string, any>[], totalRecords: number }> {
    const csvText = fileBuffer.toString('utf-8');
    const lines = csvText.split('\n');
    
    // Filter and trim lines
    const validLines = lines
      .map((line, index) => ({ line: line.trim(), originalIndex: index }))
      .filter(({ line }) => line.length > 0)
      .map(({ line }) => line);

    if (validLines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse headers
    const headers = validLines[0]
      .split(',')
      .map(h => h.trim().replace(/^["']|["']$/g, '')); // Remove quotes if present

    const errorFreeData: Record<string, any>[] = [];
    
    // Parse records efficiently
    for (let i = 1; i < validLines.length; i++) {
      const values = validLines[i]
        .split(',')
        .map(v => {
          v = v.trim();
          // Remove quotes and convert to appropriate type
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          // Try to parse as number
          const num = Number(v);
          if (!isNaN(num) && v !== '') {
            return num;
          }
          // Return as string or null
          return v === '' ? null : v;
        });

      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] !== undefined ? values[index] : null;
      });
      
      errorFreeData.push(record);
    }

    const totalRecords = validLines.length - 1;
    return { headers, errorFreeData, totalRecords };
  }

  /**
   * Parse JSON File
   */
  private async parseJsonFile(fileBuffer: Buffer): Promise<{ headers: string[], errorFreeData: Record<string, any>[], totalRecords: number }> {
    const jsonText = fileBuffer.toString('utf-8');
    const jsonData = JSON.parse(jsonText);

    const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

    if (dataArray.length === 0 || typeof dataArray[0] !== 'object') {
      throw new Error("Invalid JSON format. Expected array of objects or single object");
    }

    const headers = Object.keys(dataArray[0]);
    const totalRecords = dataArray.length;
    const errorFreeData = dataArray;

    return { headers, errorFreeData, totalRecords };
  }

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
private async parseExcelFileStream123(
  filePath: string,
  importedFileId: string
): Promise<number> { 
  const columnCount: Record<string, number> = {};
  let headers: string[] = [];
  let headerInitialized = false;
  let headerLen :number=0
  let NALen :number=0
  let blankLen :number=0

  try{
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        //entries: "emit",        
        sharedStrings: "cache",
        hyperlinks: "ignore" ,
      });   

        for await (const worksheet of workbook) {
      for await (const row of worksheet) {
        const values = row.values as any[];

        // ✅ Initialize header (skip index 0)
        if (!headerInitialized) {
          headers = values
            .slice(1)
            .map((h: any, index: number) =>
              h ? String(h).trim() : `Column_${index + 1}`
            );

          headers.forEach(h => (columnCount[h] = 0));
          headerLen = headers.length;
          headerInitialized = true;
          continue;
        }


        // ✅ Faster loop
        for (let i = 0; i < headers.length; i++) {
          const value = values[i + 1];
            

          if (!value) continue;
          if (value === "N/A") {
                NALen++;
                continue;
          }

          if (value === "null") {
                blankLen++;
                continue;
          }
          columnCount[headers[i]]++;
          
        }
      }

      break; // first sheet only
    }

    return {
      //totalRows,
      columnCount,
      headerLen,
      NALen,
      blankLen
    };
  } catch (error: any) {    
    throw new Error(`Failed to read CSV file: ${filePath}. ${error.message}`);
  }  

}
private async parseExcelFileStream123(
  filePath: string,
  importedFileId: string
): Promise<number> {

  const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    sharedStrings: "cache",
    hyperlinks: "ignore",
  });

  const BATCH_SIZE = 5000;
  let headers: string[] = [];
  let batch: any[] = [];
  let totalRecords = 0;

  for await (const worksheet of workbook) {

    for await (const row of worksheet) {

      // Header row
      if (row.number === 1) {
        headers = row.values
          .slice(1)
          .map((h: any, i: number) =>
            h ? String(h).trim() : `Column${i + 1}`
          );
        continue;
      }

      const record: Record<string, any> = {};

      headers.forEach((header, index) => {
        record[header] = row.values[index + 1] ?? null;
      });

      batch.push({
        importedfile_id: importedFileId,
        data: record,
      });

      totalRecords++;

      // Insert batch
      if (batch.length === BATCH_SIZE) {
        await CleanDataModel.insertMany(batch, { ordered: false });
        batch = [];
        console.log(`Inserted ${totalRecords}`);
      }
    }
  }

  // Insert remaining rows
  if (batch.length > 0) {
    await CleanDataModel.insertMany(batch, { ordered: false });
  }

  return totalRecords;
}
}

export const importedFileController = new ImportedFileController();
