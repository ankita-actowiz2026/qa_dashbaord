class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode?: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    details?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;