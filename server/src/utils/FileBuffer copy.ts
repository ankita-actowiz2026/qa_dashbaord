// utils/FileBuffer.ts
import fs from "fs";
import path from "path";

export class FileBuffer {
  private buffer: any[] = [];
  private bufferSize: number;
  private filePath: string;
  private isFlushing = false;

  constructor(fileName: string, bufferSize = 1000) {
    this.bufferSize = bufferSize;

    const dir = path.resolve("error_logs");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const nameWithoutExt = path.parse(fileName).name;
    this.filePath = path.join(dir, `${nameWithoutExt}.jsonl`); // ✅ JSON Lines
  }

  add(error: {
    rowNumber: number;
    columnName: string;
    errorType: string;
    errorMsg: string;
  }) {
    this.buffer.push(error);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }
  addBulk(errors: any[]) {
    this.buffer.push(...errors);

    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }
  async flush() {
    if (this.buffer.length === 0 || this.isFlushing) return;

    this.isFlushing = true;

    const data = this.buffer;
    this.buffer = [];

    try {
      const lines = data.map((d) => JSON.stringify(d)).join("\n") + "\n";

      await fs.promises.appendFile(this.filePath, lines);
    } catch (err) {
      console.error("File write error:", err);
    } finally {
      this.isFlushing = false;
    }
  }
}
