// utils/IErrorBuffer.ts

export interface IErrorBuffer {
  add(error: {
    rowNumber: number;
    columnName: string;
    errorType: string;
    errorMsg: string;
  }): void;

  flush(): Promise<void> | void;
}
