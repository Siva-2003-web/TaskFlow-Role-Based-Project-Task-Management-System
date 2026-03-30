const defaultMessageByStatus = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  500: "Internal Server Error",
};

export const createHttpError = (statusCode, message) => {
  const error = new Error(
    message || defaultMessageByStatus[statusCode] || "Error",
  );
  error.statusCode = statusCode;
  return error;
};
