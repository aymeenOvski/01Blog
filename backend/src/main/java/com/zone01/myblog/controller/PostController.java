package com.zone01.myblog.controller;

import com.zone01.myblog.dto.CommentRequest;
import com.zone01.myblog.dto.CommentResponse;
import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.dto.PostUpdateRequest;
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
    public ResponseEntity<List<PostResponse>> getFeed(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            throw BlogApiException.unauthorized("Authentication required to load feed");
        }

        return ResponseEntity.ok(postService.getFeedPosts(userDetails.getUsername()));
    }

    @GetMapping("/user/{targetUsername}")
    public ResponseEntity<List<PostResponse>> getUserPosts(
            @PathVariable String targetUsername,
            @AuthenticationPrincipal UserDetails userDetails) {

        String currentUsername = (userDetails != null) ? userDetails.getUsername() : null;
        return ResponseEntity.ok(postService.getUserPosts(targetUsername, currentUsername));
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

    @PostMapping("/{id}/like")
    public ResponseEntity<Boolean> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.toggleLike(id, userDetails.getUsername()));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.addComment(id, request, userDetails.getUsername()));
    }
}
