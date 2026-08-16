package com.zone01.myblog.service;

import com.zone01.myblog.dto.PostResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface PostService {
    PostResponse createPost(String username, String content, MultipartFile mediaFile);
    List<PostResponse> getAllPosts();
    List<PostResponse> getUserPosts(String username);
}
