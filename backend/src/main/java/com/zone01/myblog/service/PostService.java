package com.zone01.myblog.service;

import com.zone01.myblog.dto.CommentRequest;
import com.zone01.myblog.dto.CommentResponse;
import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.dto.PostUpdateRequest;
import com.zone01.myblog.dto.PagedResponse;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface PostService {
    PostResponse createPost(String username, String content, List<MultipartFile> mediaFiles);    
    PagedResponse<PostResponse> getUserPosts(String targetUsername, String currentUsername, int page, int size);

    PagedResponse<PostResponse> getFeedPosts(String currentUsername, int page, int size);

    PostResponse updatePost(Long postId, PostUpdateRequest request, String currentUsername);
    PostResponse repostPost(Long postId, String currentUsername);
    void deletePost(Long postId, String currentUsername);
    boolean toggleLike(Long postId, String currentUsername);
    CommentResponse addComment(Long postId, CommentRequest request, String currentUsername);
    PagedResponse<CommentResponse> getPostComments(Long postId, int page, int size);
    void deleteComment(Long postId, Long commentId, String currentUsername);
}
