package com.zone01.myblog.repository;

import com.zone01.myblog.dto.PostResponse;
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

    // @Query("""
    // SELECT new com.zone01.myblog.dto.PostResponse(
    // p.id,
    // p.author.username,
    // p.author.avatarUrl,
    // p.content,
    // p.mediaUrl,
    // p.mediaType,
    // p.createdAt,
    // COUNT(DISTINCT l.id),
    // CASE WHEN SUM(CASE WHEN l.user.username = :currentUsername THEN 1 ELSE 0 END)
    // > 0 THEN true ELSE false END,
    // COUNT(DISTINCT c.id)
    // )
    // FROM Post p
    // LEFT JOIN PostLike l ON l.post = p.id
    // LEFT JOIN Comment c ON c.post = p.id
    // GROUP BY p.id, p.author.username, p.author.avatarUrl, p.content, p.mediaUrl,
    // p.mediaType, p.createdAt
    // ORDER BY p.createdAt DESC
    // """)
    // List<PostResponse> findAllPostsWithCounts(@Param("currentUsername") String
    // currentUsername);

    @Query("""
                SELECT new com.zone01.myblog.dto.PostResponse(
                    p.id,
                    p.author.username,
                    p.author.avatarUrl,
                    p.content,
                    p.mediaUrl,
                    p.mediaType,
                    p.createdAt,
                    COUNT(DISTINCT l.id),
                    CASE WHEN COUNT(DISTINCT CASE WHEN lu.username = :currentUsername THEN l.id END) > 0 THEN true ELSE false END,
                    COUNT(DISTINCT c.id)
                )
                FROM Post p
                LEFT JOIN PostLike l ON l.post = p
                LEFT JOIN l.user lu
                LEFT JOIN Comment c ON c.post = p
                WHERE p.author.username = :targetUsername
                GROUP BY p.id, p.author.username, p.author.avatarUrl, p.content, p.mediaUrl, p.mediaType, p.createdAt
                ORDER BY p.createdAt DESC
            """)
    List<PostResponse> findUserPostsWithCounts(
            @Param("targetUsername") String targetUsername,
            @Param("currentUsername") String currentUsername);

    @Query("""
                SELECT new com.zone01.myblog.dto.PostResponse(
                    p.id,
                    p.author.username,
                    p.author.avatarUrl,
                    p.content,
                    p.mediaUrl,
                    p.mediaType,
                    p.createdAt,
                    COUNT(DISTINCT l.id),
                    CASE WHEN COUNT(DISTINCT CASE WHEN lu.username = :currentUsername THEN l.id END) > 0 THEN true ELSE false END,
                    COUNT(DISTINCT c.id)
                )
                FROM Post p
                LEFT JOIN PostLike l ON l.post = p
                LEFT JOIN l.user lu
                LEFT JOIN Comment c ON c.post = p
                WHERE p.id = :postId
                GROUP BY p.id, p.author.username, p.author.avatarUrl, p.content, p.mediaUrl, p.mediaType, p.createdAt
            """)
    Optional<PostResponse> findPostByIdWithCounts(
            @Param("postId") Long postId,
            @Param("currentUsername") String currentUsername);

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByAuthorOrderByCreatedAtDesc(Users author);
}
