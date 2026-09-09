package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.ReportRequest;
import com.zone01.myblog.dto.ReportResponse;
import com.zone01.myblog.model.Report;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.ReportRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.ReportService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportServiceImpl(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ReportResponse createReport(ReportRequest request, String reporterUsername) {
        Users reporter = userRepository.findByUsername(reporterUsername)
            .orElseThrow(() -> new IllegalArgumentException("Reporter not found"));

        Users targetUser = userRepository.findByUsername(request.targetUsername())
            .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        if (reporter.getId().equals(targetUser.getId())) {
            throw new IllegalArgumentException("You cannot report yourself");
        }

        Report report = new Report(reporter, targetUser, request.reason());
        Report saved = reportRepository.save(report);

        return new ReportResponse(
            saved.getId(),
            saved.getReporter().getUsername(),
            saved.getTargetUser().getUsername(),
            saved.getReason(),
            saved.getStatus(),
            saved.getCreatedAt()
        );
    }
}