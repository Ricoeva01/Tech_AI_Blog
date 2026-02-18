export default class AppError extends Error {
  constructor(message = "An unexpected error occurred") {
    super(message);
    this.name = "AppError";
  }
}
