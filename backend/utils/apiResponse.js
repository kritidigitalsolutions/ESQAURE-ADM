/**
 * Uniform API Response Utility conforming to E² Stories Architecture Rules
 */
export class ApiResponse {
  /**
   * Send a successful JSON response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {any} [data]
   * @param {number} [statusCode=200]
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    const payload = {
      success: true,
      statusCode,
      message
    };

    if (data !== null && data !== undefined) {
      payload.data = data;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Send an error JSON response
   * @param {import('express').Response} res
   * @param {string} message
   * @param {string} errorCode
   * @param {number} [statusCode=500]
   * @param {any} [details]
   */
  static error(res, message = 'An error occurred', errorCode = 'INTERNAL_ERROR', statusCode = 500, details = null) {
    const payload = {
      success: false,
      statusCode,
      error: errorCode,
      message
    };

    if (details) {
      payload.details = details;
    }

    return res.status(statusCode).json(payload);
  }
}
