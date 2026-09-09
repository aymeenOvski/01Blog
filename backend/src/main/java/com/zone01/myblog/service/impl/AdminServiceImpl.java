package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.AdminStatsResponse;
import com.zone01.myblog.dto.ReportResponse;
import com.zone01.myblog.model.Report;
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

    public AdminServiceImpl(UserRepository userRepository, PostRepository postRepository, ReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.reportRepository = reportRepository;
    }

    @Override
    public AdminStatsResponse getStats() {
        long users = userRepository.count();
        long posts = postRepository.count();
        long reports = reportRepository.countByStatus("PENDING");
        return new AdminStatsResponse(users, posts, reports);
    }

    @Override
    public List<ReportResponse> getPendingReports() {
        return reportRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
            .map(r -> new ReportResponse(
                r.getId(),
                r.getReporter().getUsername(),
                r.getTargetUser().getUsername(),
                r.getReason(),
                r.getStatus(),
                r.getCreatedAt()
            )).toList();
    }

    @Override
    @Transactional
    public void resolveReport(Long reportId, String action) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        if ("DISMISS".equalsIgnoreCase(action)) {
            report.setStatus("DISMISSED");
        } else if ("RESOLVE".equalsIgnoreCase(action)) {
            report.setStatus("RESOLVED");
        } else {
            throw new IllegalArgumentException("Invalid action: " + action);
        }

        reportRepository.save(report);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    @Override
    @Transactional
    public void deletePost(Long postId) {
        postRepository.deleteById(postId);
    }
}