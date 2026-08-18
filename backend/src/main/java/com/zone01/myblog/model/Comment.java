package com.zone01.myblog.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public Comment() {}

    public Comment(String content, Post post, Users user) {
        this.content = content;
        this.post = post;
        this.user = user;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
    public Instant getCreatedAt() { return createdAt; }
}
