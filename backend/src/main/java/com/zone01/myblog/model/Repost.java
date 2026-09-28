package com.zone01.myblog.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_reposts", uniqueConstraints = {
        @UniqueConstraint(name = "uk_post_repost_user_post", columnNames = {"user_id", "post_id"})
})
public class Repost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected Repost() {
    }

    public Repost(Users user, Post post) {
        this.user = user;
        this.post = post;
    }

    public Long getId() {
        return id;
    }

    public Users getUser() {
        return user;
    }

    public Post getPost() {
        return post;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
