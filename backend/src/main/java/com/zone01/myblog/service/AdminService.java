package com.zone01.myblog.service;

import com.zone01.myblog.dto.AdminStatsResponse;
import com.zone01.myblog.dto.ReportResponse;

import java.util.List;

public interface AdminService {
    AdminStatsResponse getStats();
    List<ReportResponse> getPendingReports();
    void resolveReport(Long reportId, String action);
    void deleteUser(Long userId);
    void deletePost(Long postId);
}