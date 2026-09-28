package com.zone01.myblog.repository;

import com.zone01.myblog.model.Repost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RepostRepository extends JpaRepository<Repost, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    @Query("""
            SELECT r
            FROM Repost r
            JOIN FETCH r.post p
            JOIN FETCH p.author author
            WHERE r.user.username = :username
              AND r.user.status = 'ACTIVE'
              AND p.visibility = 'VISIBLE'
              AND author.status = 'ACTIVE'
            ORDER BY r.createdAt DESC
            """)
    List<Repost> findVisibleByUserUsername(@Param("username") String username);

    @Query("""
            SELECT r
            FROM Repost r
            JOIN FETCH r.post p
            JOIN FETCH p.author author
            WHERE r.user.username IN (
                SELECT f.followed.username
                FROM Follow f
                WHERE f.follower.username = :username
            )
              AND r.user.status = 'ACTIVE'
              AND p.visibility = 'VISIBLE'
              AND author.status = 'ACTIVE'
            ORDER BY r.createdAt DESC
            """)
    List<Repost> findVisibleFromFollowedUsers(@Param("username") String username);
}
