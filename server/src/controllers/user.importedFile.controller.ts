import { Request, Response, NextFunction } from "express";
//import { importedFileService } from "../services/user.importedFile.service";
import  IImportedFile   from "../interface/importedFile.interface";
import { Types } from "mongoose";
import ExcelJS from "exceljs";
import { Readable } from "stream";
class ImportedFileController {
  addImportedFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File required" });
    }

    const stream = Readable.from(req.file.buffer);
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(stream);

    const BATCH_SIZE = 2000;
    let batch: any[] = [];
    let batch_number = 1;

    let total_records = 0;

    for await (const worksheet of workbook) {
      for await (const row of worksheet) {
        if (row.number === 1) continue; // skip header

        total_records++;

        const values = row.values as any[];

        const rowData = {
          name: values[1],
          email: values[2],
          phone: values[3],
        };

        batch.push(rowData);

        if (batch.length === BATCH_SIZE) {
          await importedFileService.createImportedFile({
            user_id: req.body.user_id,
            file_name: req.file.originalname,
            total_records: 0,
            valid_records: 0,
            invalid_records: 0,
            duplicate_count: 0,
            missing_required_count: 0,
            datatype_error_count: 0,
            junk_character_count: 0,
            errors: [],
            rules: [],
            batch_number,
            rows: batch,
          });

          batch = [];
          batch_number++;
        }
      }
    }

    // Save remaining rows
    if (batch.length > 0) {
      await importedFileService.createImportedFile({
        user_id: req.body.user_id,
        file_name: req.file.originalname,
        total_records: 0,
        valid_records: 0,
        invalid_records: 0,
        duplicate_count: 0,
        missing_required_count: 0,
        datatype_error_count: 0,
        junk_character_count: 0,
        junk_character_count: 0,
        errors: [],
        rules: [],
        batch_number,
        rows: batch,
      });
    }

    return res.status(201).json({
      success: true,
      message: "File stored in batches successfully",
      total_records,
    });

  } catch (error) {
    next(error);
  }
};

//   getImportedFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {     
//       const importedFiles = await importedFileService.getImportedFiles();
//       res.status(200).json({success: true,data: importedFiles});
//     } catch (error) {
//       next(error);
//     }
//   };

 
//  getImportedFile = async (req: Request, res: Response) => {
//   const query: GetImportedFilesQuery = {
//     search: req.query.search as string,
//     sortBy: req.query.sortBy as string,
//     sortOrder: req.query.sortOrder as 'asc' | 'desc',
//     page: req.query.page ? Number(req.query.page) : 1,
//     limit: req.query.limit ? Number(req.query.limit) : 10,
//   };

//   const importedFiles = await importedFileService.getImportedFilesWithPagination(query);
//   res.json(importedFiles);
// };
 


  
}
export const importedFileController = new ImportedFileController();
