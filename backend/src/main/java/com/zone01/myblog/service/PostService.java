package com.zone01.myblog.service;

import com.zone01.myblog.dto.CommentRequest;
import com.zone01.myblog.dto.CommentResponse;
import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.dto.PostUpdateRequest;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface PostService {
    PostResponse createPost(String username, String content, List<MultipartFile> mediaFiles);
    // List<PostResponse> getAllPosts(String currentUsername);
    
    List<PostResponse> getUserPosts(String targetUsername, String currentUsername);

    PostResponse updatePost(Long postId, PostUpdateRequest request, String currentUsername);
    void deletePost(Long postId, String currentUsername);
    boolean toggleLike(Long postId, String currentUsername);
    CommentResponse addComment(Long postId, CommentRequest request, String currentUsername);
    List<CommentResponse> getPostComments(Long postId);
}
