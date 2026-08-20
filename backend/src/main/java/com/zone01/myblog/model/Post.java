package com.zone01.myblog.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList; // ADDED: Required for initializing empty collection
import java.util.List;      // ADDED: List support for multiple media URLs

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

    @ElementCollection
    @CollectionTable(name = "post_media_urls", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "media_url", length = 500)
    private List<String> mediaUrls = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Post() {}

    public Post(Users author, String content, List<String> mediaUrls) {
        this.author = author;
        this.content = content;
        this.mediaUrls = mediaUrls != null ? mediaUrls : new ArrayList<>();
    }

    public Long getId() { return id; }
    public Users getAuthor() { return author; }
    public void setAuthor(Users author) { this.author = author; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public List<String> getMediaUrls() { return mediaUrls; }
    public void setMediaUrls(List<String> mediaUrls) { this.mediaUrls = mediaUrls; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
