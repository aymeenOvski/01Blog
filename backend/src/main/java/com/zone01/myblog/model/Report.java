package com.zone01.myblog.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private Users reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id")
    private Users targetUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_post_id")
    private Post targetPost;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Report() {
    }

    public Report(Users reporter, Users targetUser, String reason) {
        this.reporter = reporter;
        this.targetUser = targetUser;
        this.targetPost = null;
        this.reason = reason;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }

    public Report(Users reporter, Post targetPost, String reason) {
        this.reporter = reporter;
        this.targetUser = null;
        this.targetPost = targetPost;
        this.reason = reason;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Users getReporter() {
        return reporter;
    }

    public void setReporter(Users reporter) {
        this.reporter = reporter;
    }

    public Users getTargetUser() {
        return targetUser;
    }

    public void setTargetUser(Users targetUser) {
        this.targetUser = targetUser;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Post getTargetPost() {
        return targetPost;
    }

    public void setTargetPost(Post targetPost) {
        this.targetPost = targetPost;
    }
}