// utils/DBBuffer.ts
import { IErrorBuffer } from "../interface/IErrorBuffer";
import { ErrorLog } from "../models/ErrorLog";

export class DBBuffer implements IErrorBuffer {
  private buffer: any[] = [];
  private bufferSize: number;
  private fileName: string;
  private isFlushing = false; // ✅ prevent parallel flush

  constructor(fileName: string, bufferSize = 1000) {
    this.fileName = fileName;
    this.bufferSize = bufferSize;
  }

  add(error: {
    rowNumber: number;
    columnName: string;
    errorType: string;
    errorMsg: string;
  }) {
    this.buffer.push({
      rowNumber: error.rowNumber,
      columnName: error.columnName,
      errorType: error.errorType,
      errorMsg: error.errorMsg,
    });

    if (this.buffer.length >= this.bufferSize) {
      this.flush(); // async fire 🚀
    }
  }

  async flush() {
    if (this.buffer.length === 0 || this.isFlushing) return;

    this.isFlushing = true;

    const data = this.buffer;
    this.buffer = []; // ✅ clear first

    try {
      await ErrorLog.findOneAndUpdate(
        { fileName: this.fileName },
        {
          $push: {
            errors: {
              $each: data, // ✅ push batch
            },
          },
        },
        {
          upsert: true, // ✅ create if not exists
        },
      );
    } catch (err) {
      console.error("DB update error:", err);
    } finally {
      this.isFlushing = false;
    }
  }
}
