package com.zone01.myblog.repository;

import com.zone01.myblog.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
    Page<Comment> findByPostIdOrderByCreatedAtDesc(Long postId, Pageable pageable);
    long countByPostId(Long postId);
}
