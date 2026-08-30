package com.zone01.myblog.repository;

import com.zone01.myblog.model.NotificationTicket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTicketRepository extends JpaRepository<NotificationTicket, Long> {
    boolean existsByUserIdAndPostIdAndType(Long userId, Long postId, String type);
}
