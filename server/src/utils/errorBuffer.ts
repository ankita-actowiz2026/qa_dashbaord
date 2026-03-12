import ExcelJS from "exceljs";

export class ErrorBuffer {
  private buffer: any[] = [];
  private bufferSize: number;
  private sheet: ExcelJS.Worksheet;

  constructor(sheet: ExcelJS.Worksheet, bufferSize = 500) {
    this.sheet = sheet;
    this.bufferSize = bufferSize;
  }

  add(row: any[]) {
    this.buffer.push(row);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  flush() {
    for (const row of this.buffer) {
      this.sheet.addRow(row).commit();
    }

    this.buffer.length = 0;
  }
}
