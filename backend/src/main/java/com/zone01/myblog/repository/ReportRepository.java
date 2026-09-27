package com.zone01.myblog.repository;

import com.zone01.myblog.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatusOrderByCreatedAtDesc(String status);
    List<Report> findByTargetUserIdAndStatus(Long targetUserId, String status);
    List<Report> findByTargetUserIdInAndStatus(List<Long> targetUserIds, String status);
    List<Report> findByTargetPostIdInAndStatus(List<Long> targetPostIds, String status);
    long countByStatus(String status);
}