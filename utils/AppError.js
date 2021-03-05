class AppError extends Error {
  constructor(error, statusCode = 500) {
    super();

    // this.statusCode = statusCode;
    // this.status = `${statusCode}`.startsWith(4) ? "Fail" : "Error";
    // this.message = error.message;
    // this.isOperational = true;
    // this.error = error;
    return {
      statusCode: statusCode,
      status: `${statusCode}`.startsWith(4) ? "Fail" : "Error",
      message: error.message,
      isOperational: true,
      ...error,
      stack: error.stack,
    };
  }
}

module.exports = AppError;
