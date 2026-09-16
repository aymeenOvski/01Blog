package com.zone01.myblog.repository;

import com.zone01.myblog.model.Post;
import com.zone01.myblog.model.Users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("""
            SELECT p,
                   COUNT(DISTINCT l.id),
                   CASE
                       WHEN COUNT(
                           DISTINCT CASE
                               WHEN lu.username = :currentUsername
                               THEN l.id
                           END
                       ) > 0
                       THEN true
                       ELSE false
                   END,
                   COUNT(DISTINCT c.id)
            FROM Post p
            LEFT JOIN PostLike l ON l.post = p
            LEFT JOIN l.user lu
            LEFT JOIN Comment c ON c.post = p
            WHERE p.author.username = :targetUsername
              AND p.visibility = 'VISIBLE'
            GROUP BY p
            ORDER BY p.createdAt DESC
            """)
    List<Object[]> findUserPostsWithCounts(
            @Param("targetUsername") String targetUsername,
            @Param("currentUsername") String currentUsername);

    @Query("""
            SELECT p,
                   COUNT(DISTINCT l.id),
                   CASE
                       WHEN COUNT(
                           DISTINCT CASE
                               WHEN lu.username = :currentUsername
                               THEN l.id
                           END
                       ) > 0
                       THEN true
                       ELSE false
                   END,
                   COUNT(DISTINCT c.id)
            FROM Post p
            LEFT JOIN PostLike l ON l.post = p
            LEFT JOIN l.user lu
            LEFT JOIN Comment c ON c.post = p
            WHERE p.author.id IN (
                SELECT f.followed.id
                FROM Follow f
                WHERE f.follower.username = :currentUsername
            )
              AND p.visibility = 'VISIBLE'
            GROUP BY p
            ORDER BY p.createdAt DESC
            """)
    List<Object[]> findFeedPostsWithCounts(
            @Param("currentUsername") String currentUsername);

    @Query("""
            SELECT p,
                   COUNT(DISTINCT l.id),
                   CASE
                       WHEN COUNT(
                           DISTINCT CASE
                               WHEN lu.username = :currentUsername
                               THEN l.id
                           END
                       ) > 0
                       THEN true
                       ELSE false
                   END,
                   COUNT(DISTINCT c.id)
            FROM Post p
            LEFT JOIN PostLike l ON l.post = p
            LEFT JOIN l.user lu
            LEFT JOIN Comment c ON c.post = p
            WHERE p.id = :postId
              AND p.visibility = 'VISIBLE'
            GROUP BY p
            """)
    Optional<Object[]> findPostByIdWithCounts(
            @Param("postId") Long postId,
            @Param("currentUsername") String currentUsername);

    @Query("""
            SELECT p
            FROM Post p
            WHERE p.visibility = 'VISIBLE'
            ORDER BY p.createdAt DESC
            """)
    List<Post> findVisiblePostsOrderByCreatedAtDesc();

    @Query("""
            SELECT p
            FROM Post p
            WHERE p.author = :author
              AND p.visibility = 'VISIBLE'
            ORDER BY p.createdAt DESC
            """)
    List<Post> findVisiblePostsByAuthorOrderByCreatedAtDesc(
            @Param("author") Users author);

    @Query("""
            SELECT p
            FROM Post p
            JOIN FETCH p.author
            WHERE p.id = :id
            """)
    Optional<Post> findByIdWithAuthor(
            @Param("id") Long id);

    /*
     * ------------------------------------------------------------
     * ADMIN POST INVENTORY
     * ------------------------------------------------------------
     */
    List<Post> findAllByVisibilityOrderByCreatedAtDesc(
            String visibility);

    /*
     * ------------------------------------------------------------
     * ADMIN STATISTICS
     * ------------------------------------------------------------
     */
    long countByVisibility(String visibility);
}