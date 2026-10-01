package com.zone01.myblog.service;

import com.zone01.myblog.dto.AdminStatsResponse;
import com.zone01.myblog.dto.ReportResponse;

import com.zone01.myblog.dto.AdminPostResponse;
import com.zone01.myblog.dto.AdminUserResponse;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    AdminStatsResponse getStats();

    Page<AdminUserResponse> getBannedUsers(Pageable pageable);

    Page<AdminPostResponse> getHiddenPosts(Pageable pageable);

    List<ReportResponse> getPendingReports();

    Page<AdminUserResponse> getAllUsers(Pageable pageable);

    Page<AdminPostResponse> getAllPosts(Pageable pageable);

    void resolveReport(Long reportId, String action);

    void dismissUserReports(Long userId);

    void dismissBannedUserReports();

    void dismissHiddenPostReports();

    void banUser(Long userId);

    void unbanUser(Long userId);

    void hidePost(Long postId);

    void unhidePost(Long postId);

    void deleteUser(Long userId);

    void deletePost(Long postId);
}