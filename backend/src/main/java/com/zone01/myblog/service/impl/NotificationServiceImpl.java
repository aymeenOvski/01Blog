package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.NotificationResponse;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.model.Notification;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.NotificationRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.NotificationService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository,
                                   SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public void sendNotification(Users recipient, Users actor, String type, String message, Long targetId) {
        if (recipient.getId().equals(actor.getId())) return; // Don't notify self

        Notification notification = new Notification(recipient, actor, type, message, targetId);
        notification = notificationRepository.save(notification);

        NotificationResponse dto = new NotificationResponse(
            notification.getId(),
            actor.getUsername(),
            actor.getAvatarUrl(),
            notification.getType(),
            notification.getMessage(),
            notification.getTargetId(),
            notification.isRead(),
            notification.getCreatedAt()
        );

        messagingTemplate.convertAndSendToUser(recipient.getUsername(), "/queue/notifications", dto);
    }

    @Override
    public List<NotificationResponse> getUserNotifications(String username) {
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(n -> new NotificationResponse(
                        n.getId(),
                        n.getActor().getUsername(),
                        n.getActor().getAvatarUrl(),
                        n.getType(),
                        n.getMessage(),
                        n.getTargetId(),
                        n.isRead(),
                        n.getCreatedAt()
                )).toList();
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, String username) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> BlogApiException.notFound("Notification not found"));

        if (!notification.getRecipient().getUsername().equals(username)) {
            throw BlogApiException.forbidden("Unauthorized access");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}
