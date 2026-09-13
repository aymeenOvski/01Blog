package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.ReportRequest;
import com.zone01.myblog.dto.ReportResponse;
import com.zone01.myblog.model.Post;
import com.zone01.myblog.model.Report;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.PostRepository;
import com.zone01.myblog.repository.ReportRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.ReportService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public ReportServiceImpl(
            ReportRepository reportRepository,
            UserRepository userRepository,
            PostRepository postRepository) {

        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    @Override
    @Transactional
    public ReportResponse createReport(
            ReportRequest request,
            String reporterUsername) {

        Users reporter = userRepository.findByUsername(reporterUsername)
                .orElseThrow(() -> new IllegalArgumentException("Reporter not found"));

        boolean hasUserTarget = request.targetUsername() != null
                && !request.targetUsername().isBlank();

        boolean hasPostTarget = request.targetPostId() != null;

        // XOR logic
        if (hasUserTarget == hasPostTarget) {
            throw new IllegalArgumentException(
                    "A report must target exactly one user or one post");
        }

        Report report;

        if (hasUserTarget) {

            Users targetUser = userRepository
                    .findByUsername(request.targetUsername())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Target user not found"));

            if (reporter.getId().equals(targetUser.getId())) {
                throw new IllegalArgumentException(
                        "You cannot report yourself");
            }

            report = new Report(
                    reporter,
                    targetUser,
                    request.reason());

        } else {

            Post targetPost = postRepository
                    .findByIdWithAuthor(request.targetPostId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Target post not found"));

            if (targetPost.getAuthor().getId().equals(reporter.getId())) {
                throw new IllegalArgumentException(
                        "You cannot report your own post");
            }

            report = new Report(
                    reporter,
                    targetPost,
                    request.reason());
        }

        Report saved = reportRepository.save(report);

        return toResponse(saved);
    }

    private ReportResponse toResponse(Report report) {

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
}