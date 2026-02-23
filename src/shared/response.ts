export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export const successResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => ({
  success: true,
  message,
  data
})

export const errorResponse = (
  message: string
): ApiResponse<null> => ({
  success: false,
  message
})