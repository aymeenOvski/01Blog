package com.zone01.myblog.service;

import com.zone01.myblog.dto.NotificationResponse;
import com.zone01.myblog.model.Users;

import java.util.List;

public interface NotificationService {
    void sendNotification(Users recipient, Users actor, String type, String message, Long targetId);
    List<NotificationResponse> getUserNotifications(String username);
    void markAsRead(Long notificationId, String username);
}
