package com.zone01.myblog.exception;

import org.springframework.http.HttpStatus;

public class BlogApiException extends RuntimeException {

    private final HttpStatus httpStatus;

    public BlogApiException(HttpStatus httpStatus, String detail) {
        super(detail);
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    // Direct helper methods for quick throwing in services
    public static BlogApiException badRequest(String detail) {
        return new BlogApiException(HttpStatus.BAD_REQUEST, detail);
    }

    public static BlogApiException unauthorized(String detail) {
        return new BlogApiException(HttpStatus.UNAUTHORIZED, detail);
    }

    public static BlogApiException forbidden(String detail) {
        return new BlogApiException(HttpStatus.FORBIDDEN, detail);
    }

    public static BlogApiException notFound(String detail) {
        return new BlogApiException(HttpStatus.NOT_FOUND, detail);
    }

    public static BlogApiException conflict(String detail) {
        return new BlogApiException(HttpStatus.CONFLICT, detail);
    }

    public static BlogApiException accountLocked(String detail) {
        return new BlogApiException(HttpStatus.LOCKED, detail);
    }
}
