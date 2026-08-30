package com.zone01.myblog.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notification_tickets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "post_id", "type"})
})
public class NotificationTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public NotificationTicket() {}

    public NotificationTicket(Long userId, Long postId, String type) {
        this.userId = userId;
        this.postId = postId;
        this.type = type;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getPostId() { return postId; }
    public String getType() { return type; }
    public Instant getCreatedAt() { return createdAt; }
}
