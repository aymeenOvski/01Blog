package com.zone01.myblog.repository;

import com.zone01.myblog.model.NotificationTicket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTicketRepository extends JpaRepository<NotificationTicket, Long> {
    // likes and comments
    boolean existsByUserIdAndPostIdAndType(Long userId, Long postId, String type);
    // follows
    boolean existsByUserIdAndTargetUserIdAndType(Long userId, Long targetUserId, String type);
}
