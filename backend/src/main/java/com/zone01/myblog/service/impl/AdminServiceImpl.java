package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.AdminPostResponse;
import com.zone01.myblog.dto.AdminStatsResponse;
import com.zone01.myblog.dto.AdminUserResponse;
import com.zone01.myblog.dto.ReportResponse;
import com.zone01.myblog.model.Post;
import com.zone01.myblog.model.Report;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.PostRepository;
import com.zone01.myblog.repository.ReportRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.AdminService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;

    public AdminServiceImpl(
            UserRepository userRepository,
            PostRepository postRepository,
            ReportRepository reportRepository) {

        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.reportRepository = reportRepository;
    }

    // =========================================================
    // DASHBOARD
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {

        long totalUsers = userRepository.count();
        long bannedUsers = userRepository.countByStatus("BANNED");

        long totalPosts = postRepository.count();
        long hiddenPosts = postRepository.countByVisibility("HIDDEN");

        long pendingReports = reportRepository.countByStatus("PENDING");

        return new AdminStatsResponse(
                totalUsers,
                bannedUsers,
                totalPosts,
                hiddenPosts,
                pendingReports);
    }

    // =========================================================
    // BANNED USERS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getBannedUsers() {

        return userRepository
                .findByStatusOrderByCreatedAtDesc("BANNED")
                .stream()
                .map(this::toAdminUserResponse)
                .toList();
    }

    private AdminUserResponse toAdminUserResponse(Users user) {

        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getAvatarUrl(),
                user.getCreatedAt());
    }

    // =========================================================
    // HIDDEN POSTS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<AdminPostResponse> getHiddenPosts() {

        return postRepository
                .findAllByVisibilityOrderByCreatedAtDesc("HIDDEN")
                .stream()
                .map(this::toAdminPostResponse)
                .toList();
    }

    private AdminPostResponse toAdminPostResponse(Post post) {

        return new AdminPostResponse(
                post.getId(),
                post.getAuthor().getUsername(),
                post.getContent(),
                post.getVisibility(),
                post.getCreatedAt());
    }

    // =========================================================
    // REPORTS
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getPendingReports() {

        return reportRepository
                .findByStatusOrderByCreatedAtDesc("PENDING")
                .stream()
                .map(this::toReportResponse)
                .toList();
    }

    private ReportResponse toReportResponse(Report report) {

        if (report.getTargetPost() != null) {

            Post post = report.getTargetPost();

            return new ReportResponse(
                    report.getId(),
                    "POST",
                    null,
                    post.getId(),
                    report.getReporter().getUsername(),
                    post.getAuthor().getUsername(),
                    report.getReason(),
                    report.getStatus(),
                    report.getCreatedAt());
        }

        Users user = report.getTargetUser();

        return new ReportResponse(
                report.getId(),
                "USER",
                user.getId(),
                null,
                report.getReporter().getUsername(),
                user.getUsername(),
                report.getReason(),
                report.getStatus(),
                report.getCreatedAt());
    }

    @Override
    @Transactional
    public void resolveReport(Long reportId, String action) {

        Report report = reportRepository
                .findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        if ("DISMISS".equalsIgnoreCase(action)) {

            report.setStatus("DISMISSED");

        } else if ("RESOLVE".equalsIgnoreCase(action)) {

            report.setStatus("RESOLVED");

        } else {

            throw new IllegalArgumentException(
                    "Invalid action: " + action);
        }

        reportRepository.save(report);
    }

    // =========================================================
    // BAN / UNBAN
    // =========================================================

    @Override
    @Transactional
    public void banUser(Long userId) {

        Users user = userRepository
                .findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole())
                || "ADMIN".equalsIgnoreCase(user.getRole())) {

            throw new IllegalArgumentException(
                    "Admin users cannot be banned");
        }

        if ("BANNED".equalsIgnoreCase(user.getStatus())) {
            return;
        }

        user.setStatus("BANNED");
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unbanUser(Long userId) {

        Users user = userRepository
                .findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setStatus("ACTIVE");
        userRepository.save(user);
    }

    // =========================================================
    // HIDE / UNHIDE
    // =========================================================

    @Override
    @Transactional
    public void hidePost(Long postId) {

        Post post = postRepository
                .findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        post.setVisibility("HIDDEN");
        postRepository.save(post);
    }

    @Override
    @Transactional
    public void unhidePost(Long postId) {

        Post post = postRepository
                .findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        post.setVisibility("VISIBLE");
        postRepository.save(post);
    }

    // =========================================================
    // DELETE
    // =========================================================

    @Override
    @Transactional
    public void deleteUser(Long userId) {

        Users user = userRepository
                .findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole())
                || "ADMIN".equalsIgnoreCase(user.getRole())) {

            throw new IllegalArgumentException(
                    "Admin users cannot be deleted");
        }

        userRepository.delete(user);
    }

    @Override
    @Transactional
    public void deletePost(Long postId) {

        Post post = postRepository
                .findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        postRepository.delete(post);
    }
}