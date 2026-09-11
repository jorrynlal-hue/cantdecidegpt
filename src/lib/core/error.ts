export class AppError extends Error {
  status: number;
  code: string;

  constructor(message: string, code = 'BAD_REQUEST', status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }

  static forbidden(msg = 'You do not have permission to do this.'): AppError {
    return new AppError(msg, 'FORBIDDEN', 403);
  }

  static notFound(msg = 'Record not found.'): AppError {
    return new AppError(msg, 'NOT_FOUND', 404);
  }

  static unauthorized(msg = 'Not authenticated.'): AppError {
    return new AppError(msg, 'UNAUTHORIZED', 401);
  }

  static badRequest(msg = 'Invalid input.'): AppError {
    return new AppError(msg, 'BAD_REQUEST', 400);
  }
}