package com.zone01.myblog.controller;

import com.zone01.myblog.dto.AdminPostResponse;
import com.zone01.myblog.dto.AdminStatsResponse;
import com.zone01.myblog.dto.AdminUserResponse;
import com.zone01.myblog.dto.ReportResponse;
import com.zone01.myblog.service.AdminService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ReportResponse>> getPendingReports() {
        return ResponseEntity.ok(adminService.getPendingReports());
    }

    @PatchMapping("/reports/{id}")
    public ResponseEntity<Void> resolveReport(
            @PathVariable Long id,
            @RequestParam String action) {

        adminService.resolveReport(id, action);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        adminService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/banned")
    public ResponseEntity<List<AdminUserResponse>> getBannedUsers() {
        return ResponseEntity.ok(adminService.getBannedUsers());
    }

    @GetMapping("/posts/hidden")
    public ResponseEntity<List<AdminPostResponse>> getHiddenPosts() {
        return ResponseEntity.ok(adminService.getHiddenPosts());
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<Void> banUser(
            @PathVariable Long id) {

        adminService.banUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<Void> unbanUser(
            @PathVariable Long id) {

        adminService.unbanUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/posts/{id}/hide")
    public ResponseEntity<Void> hidePost(
            @PathVariable Long id) {

        adminService.hidePost(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/posts/{id}/unhide")
    public ResponseEntity<Void> unhidePost(
            @PathVariable Long id) {

        adminService.unhidePost(id);
        return ResponseEntity.noContent().build();
    }
}
