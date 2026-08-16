package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.model.Post;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.PostRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.FileStorageService;
import com.zone01.myblog.service.PostService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public PostServiceImpl(PostRepository postRepository, UserRepository userRepository, FileStorageService fileStorageService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional
    public PostResponse createPost(String username, String content, MultipartFile mediaFile) {
        Users author = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        if ((content == null || content.trim().isEmpty()) && (mediaFile == null || mediaFile.isEmpty())) {
            throw BlogApiException.badRequest("Post content or media file must be provided");
        }

        String mediaUrl = null;
        String mediaType = null;

        if (mediaFile != null && !mediaFile.isEmpty()) {
            String contentType = mediaFile.getContentType();
            if (contentType != null) {
                if (contentType.startsWith("image/")) {
                    mediaType = "image";
                } else if (contentType.startsWith("video/")) {
                    mediaType = "video";
                } else {
                    throw BlogApiException.badRequest("Unsupported media format");
                }
            }
            mediaUrl = fileStorageService.storeAvatar(mediaFile);
        }

        Post post = new Post(author, content, mediaUrl, mediaType);
        Post saved = postRepository.save(post);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(String username) {
        Users author = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        return postRepository.findByAuthorOrderByCreatedAtDesc(author)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PostResponse mapToResponse(Post post) {
        return new PostResponse(
                post.getId(),
                post.getAuthor().getUsername(),
                post.getAuthor().getAvatarUrl(),
                post.getContent(),
                post.getMediaUrl(),
                post.getMediaType(),
                post.getCreatedAt()
        );
    }
}
