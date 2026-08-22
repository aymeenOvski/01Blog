package com.zone01.myblog.model;

import jakarta.persistence.*;
import java.sql.Timestamp;

@Entity
@Table(name = "follows", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"follower_id", "followed_id"})
})
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private Users follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followed_id", nullable = false)
    private Users followed;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Timestamp createdAt;

    public Follow() {}

    public Follow(Users follower, Users followed) {
        this.follower = follower;
        this.followed = followed;
    }

    public Long getId() { return id; }
    public Users getFollower() { return follower; }
    public void setFollower(Users follower) { this.follower = follower; }
    public Users getFollowed() { return followed; }
    public void setFollowed(Users followed) { this.followed = followed; }
    public Timestamp getCreatedAt() { return createdAt; }
}
