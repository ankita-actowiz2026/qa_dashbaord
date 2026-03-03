import ImportedFile from "../models/importedFile.model";
import  IImportedFile  from "../interface/importedFile.interface";
import  ApiError  from "../utils/api.error";
import { Types } from "mongoose";

export class ImportedFileService {
  async createImportedFile(data: IImportedFile): Promise<IImportedFile> {
   

    
    return ImportedFile.create({
      user_id: data.user_id,
      file_name:data.file_name,
      total_records: data.total_records,
      valid_records: data.valid_records,
      invalid_records: data.invalid_records,
      duplicate_count: data.duplicate_count,
      missing_required_count:data.missing_required_count,
      datatype_error_count:data.datatype_error_count,
      junk_character_count:data.junk_character_count,
      errors:data.errors,
      rules:data.rules,
    });
  }

//   async getImportedFiles(): Promise<IImportedFile[]> {
//     return ImportedFile.find().sort({_id:-1});
//   }
//  async getImportedFilesWithPagination(query: {
//   search?: string;
//   page?: number;
//   limit?: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// }) {
//   const {
//     search = '',
//     page = 1,
//     limit = 10,
//     sortBy = '_id',
//     sortOrder = 'desc',
//   } = query;

//   const skip = (page - 1) * limit;

//   // 🔍 Search condition
//   const searchQuery = search
//     ? {
//         $or: [
//           { title: { $regex: search, $options: 'i' } },
//           { content: { $regex: search, $options: 'i' } },
//           { email: { $regex: search, $options: 'i' } },
//           { author: { $regex: search, $options: 'i' } },
//         ],
//       }
//     : {};

//   // 🔃 Sorting
//   const sortOptions: any = {
//     [sortBy]: sortOrder === 'asc' ? 1 : -1,
//   };

//   // 📄 Fetch data
//   const [data, total] = await Promise.all([
//     ImportedFile.find(searchQuery)
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(limit),

//     ImportedFile.countDocuments(searchQuery),
//   ]);

//   return {
//     data,
//     total,
//     page,
//     limit,
//   };
// }
//   async getImportedFile(id: string): Promise<IImportedFile | null> {   
//     if (!Types.ObjectId.isValid(id)) { 
//         throw new ApiError("Invalid importedFile id", 400);            
//       }
//     const importedFile = await ImportedFile.findById(id);
//     if (!importedFile) {        
//         throw new ApiError("ImportedFile not found", 404);
//     }
//     return importedFile;
//   }

 
}
export const importedFileService = new ImportedFileService();
