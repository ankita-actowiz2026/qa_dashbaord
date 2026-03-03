import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import ImportedFile from "../models/importedFile.model";
import CleanDataModel from "../models/cleanData.model";
const BATCH_SIZE = 5000;
class ImportedFileController {
  /**
   * Parse Excel File (XLSX/XLS)
   */
  private async parseExcelFile(fileBuffer: Buffer): Promise<{ headers: string[], errorFreeData: Record<string, any>[], totalRecords: number }> {
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
  addImportedFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate file exists
      if (!req.file) {
        res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
        return;
      }

      const userId = (req as any).user._id; // From auth middleware
      const fileName = req.file.originalname;
      const fileBuffer = req.file.buffer;
      const columnConfig = req.body.columnConfig ? JSON.parse(req.body.columnConfig) : [];

      console.log(`Processing file: ${fileName}, Size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

      // Get file extension
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      let headers: string[] = [];
      let errorFreeData: Record<string, any>[] = [];
      let totalRecords = 0;

      // Parse file based on extension using switch case
      try {
        switch(fileExtension) {
          case 'xlsx':
          case 'xls':
            console.log('Parsing Excel file...');
            ({ headers, errorFreeData, totalRecords } = await this.parseExcelFile(fileBuffer));
            break;

          case 'csv':
            console.log('Parsing CSV file...');
            ({ headers, errorFreeData, totalRecords } = await this.parseCsvFile(fileBuffer));
            break;

          case 'json':
            console.log('Parsing JSON file...');
            ({ headers, errorFreeData, totalRecords } = await this.parseJsonFile(fileBuffer));
            break;

          default:
            res.status(400).json({ 
              success: false, 
              message: `Unsupported file format: ${fileExtension}. Supported formats: csv, xlsx, xls, json` 
            });
            return;
        }
      } catch (parseError) {
        console.error('File parsing error:', parseError);
        res.status(400).json({ 
          success: false, 
          message: `Error parsing file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
        });
        return;
      }

      console.log(`File parsed successfully. Total records: ${totalRecords}`);

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
      const importedFile = new ImportedFile({
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
      });

      console.log('Saving to database...'+importedFile);
      const savedFile = await importedFile.save();
      console.log('File saved successfully to database');
      
     let totalInserted = 0;

for (let i = 0; i < errorFreeData.length; i += BATCH_SIZE) {
  const batch = errorFreeData.slice(i, i + BATCH_SIZE);

  const cleanDataDocs = batch.map(row => ({
    importedfile_id: savedFile._id,
    data: row
  }));

  await CleanDataModel.insertMany(cleanDataDocs, { ordered: false });

  totalInserted += cleanDataDocs.length;

  console.log(`Inserted ${totalInserted} / ${errorFreeData.length}`);
}
      res.status(201).json({
        success: true,
        message: "File uploaded and processed successfully",
        data: {
          id: savedFile._id,
          fileName: savedFile.file_name,
          totalRecords: savedFile.total_records,
          validRecords: savedFile.valid_records,
          invalidRecords: savedFile.invalid_records,
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      next(error);
    }
  };
}

export const importedFileController = new ImportedFileController();
