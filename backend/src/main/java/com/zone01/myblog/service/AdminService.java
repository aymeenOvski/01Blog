package com.zone01.myblog.service;

import com.zone01.myblog.dto.AdminStatsResponse;
import com.zone01.myblog.dto.ReportResponse;

import com.zone01.myblog.dto.AdminPostResponse;
import com.zone01.myblog.dto.AdminUserResponse;

import java.util.List;

public interface AdminService {

    AdminStatsResponse getStats();

    List<AdminUserResponse> getBannedUsers();

    List<AdminPostResponse> getHiddenPosts();

    List<ReportResponse> getPendingReports();

    void resolveReport(Long reportId, String action);

    void banUser(Long userId);

    void unbanUser(Long userId);

    void hidePost(Long postId);

    void unhidePost(Long postId);

    void deleteUser(Long userId);

    void deletePost(Long postId);
}