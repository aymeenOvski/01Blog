package com.zone01.myblog.controller;

import com.zone01.myblog.dto.CreatePostRequest;
import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @ModelAttribute CreatePostRequest request) {

        PostResponse response = postService.createPost(
                userDetails.getUsername(), 
                request.content(), 
                request.file()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable String username) {
        return ResponseEntity.ok(postService.getUserPosts(username));
    }
}
