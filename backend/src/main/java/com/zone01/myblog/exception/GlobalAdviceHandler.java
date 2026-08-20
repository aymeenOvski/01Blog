package com.zone01.myblog.exception;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class GlobalAdviceHandler {

    // --- 1. DTO Validation Failures ---
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationFailure(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid field value",
                        (existing, replacement) -> existing));

        Map<String, Object> payload = createPayload(
                HttpStatus.BAD_REQUEST,
                "Validation Error",
                "Provided payload failed validation criteria.");
        payload.put("fieldErrors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(payload);
    }

    // --- 2. Resource Not Found ---
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(EntityNotFoundException ex) {
        return respond(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // --- 3. Database Constraints / Duplicates ---
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        return respond(HttpStatus.CONFLICT, "Database conflict: duplicate entry or constraint constraint violation.");
    }

    // --- 4. Authentication / Credentials ---
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return respond(HttpStatus.UNAUTHORIZED, "Invalid credentials provided.");
    }

    // --- 5. Authorization / Access Control ---
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return respond(HttpStatus.FORBIDDEN, "Access forbidden. Insufficient permissions.");
    }

    // --- 6. Account Status Restrictions (Banned / Disabled) ---
    @ExceptionHandler({ LockedException.class, DisabledException.class })
    public ResponseEntity<Map<String, Object>> handleAccountRestrictions(Exception ex) {
        return respond(HttpStatus.LOCKED, "Account access suspended or disabled. Contact system admin.");
    }

    // --- 7. Custom App & Runtime Exceptions ---
    @ExceptionHandler(BlogApiException.class)
    public ResponseEntity<Map<String, Object>> handleBlogApiException(BlogApiException ex) {
        return respond(ex.getHttpStatus(), ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return respond(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // --- 8. Unhandled Internal Server Errors ---
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleFallback(Exception ex) {
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred processing your request.");
    }

    // --- 9. File Upload Size Exceeded ---
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        Map<String, String> body = new HashMap<>();
        body.put("message", "File size exceeds the maximum permitted upload limit (5MB).");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    // --- Helper Methods ---
    private ResponseEntity<Map<String, Object>> respond(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(createPayload(status, status.getReasonPhrase(), message));
    }

    private Map<String, Object> createPayload(HttpStatus status, String error, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        return body;
    }
}
