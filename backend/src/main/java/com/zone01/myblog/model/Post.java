package com.zone01.myblog.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Users author;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "media_url", length = 500)
    private String mediaUrl;

    @Column(name = "media_type", length = 50)
    private String mediaType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Post() {}

    public Post(Users author, String content, String mediaUrl, String mediaType) {
        this.author = author;
        this.content = content;
        this.mediaUrl = mediaUrl;
        this.mediaType = mediaType;
    }

    public Long getId() { return id; }
    public Users getAuthor() { return author; }
    public void setAuthor(Users author) { this.author = author; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
