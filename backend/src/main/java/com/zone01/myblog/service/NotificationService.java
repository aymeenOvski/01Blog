package com.zone01.myblog.service;

import com.zone01.myblog.dto.NotificationResponse;
import com.zone01.myblog.dto.PagedResponse;
import com.zone01.myblog.model.Users;


public interface NotificationService {
    void sendNotification(Users recipient, Users actor, String type, String message, Long targetId);
    PagedResponse<NotificationResponse> getUserNotifications(String username, int page, int size);
    void markAsRead(Long notificationId, String username);
}
