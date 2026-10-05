package com.zone01.myblog.controller;

import com.zone01.myblog.dto.CommentRequest;
import com.zone01.myblog.dto.CommentResponse;
import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.dto.PostUpdateRequest;
import com.zone01.myblog.dto.PagedResponse;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.service.PostService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {

        if (userDetails == null) {
            throw BlogApiException.unauthorized("Authentication required to create post");
        }

        PostResponse response = postService.createPost(userDetails.getUsername(), content, files);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/feed")
        public ResponseEntity<PagedResponse<PostResponse>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        if (userDetails == null) {
            throw BlogApiException.unauthorized("Authentication required to load feed");
        }

        return ResponseEntity.ok(postService.getFeedPosts(
            userDetails.getUsername(), page, Math.min(size, 50)));
    }

    @GetMapping("/user/{targetUsername}")
        public ResponseEntity<PagedResponse<PostResponse>> getUserPosts(
            @PathVariable String targetUsername,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String currentUsername = (userDetails != null) ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getUserPosts(
            targetUsername, currentUsername, page, Math.min(size, 50)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.updatePost(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        postService.deletePost(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/repost")
    public ResponseEntity<PostResponse> repostPost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.repostPost(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Boolean> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.toggleLike(id, userDetails.getUsername()));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<PagedResponse<CommentResponse>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getPostComments(id, page, Math.min(size, 50)));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.addComment(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        postService.deleteComment(postId, commentId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
