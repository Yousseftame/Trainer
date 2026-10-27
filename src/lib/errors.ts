export class AppError extends Error {
  readonly code: string
  readonly status?: number

  constructor(message: string, code = "app_error", status?: number) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.status = status
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof AppError) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return fallback
}
