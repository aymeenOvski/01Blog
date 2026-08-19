package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.CommentRequest;
import com.zone01.myblog.dto.CommentResponse;
import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.dto.PostUpdateRequest;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.model.Comment;
import com.zone01.myblog.model.Post;
import com.zone01.myblog.model.PostLike;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.CommentRepository;
import com.zone01.myblog.repository.PostLikeRepository;
import com.zone01.myblog.repository.PostRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.FileStorageService;
import com.zone01.myblog.service.PostService;

import org.apache.tika.Tika;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;

    private final Tika tika = new Tika();
    private static final List<String> ALLOWED_MEDIA_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/webm", "video/quicktime"
    );

    public PostServiceImpl(PostRepository postRepository, UserRepository userRepository,
            FileStorageService fileStorageService, PostLikeRepository postLikeRepository,
            CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
    }

    @Override
    @Transactional
    public PostResponse createPost(String username, String content, MultipartFile mediaFile) {
        Users author = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        String trimmedContent = (content != null) ? content.trim() : null;
        
        validatePostPayload(trimmedContent, mediaFile);

        String mediaUrl = null;
        String mediaType = null;

        // Validate file bytes and store media
        if (mediaFile != null && !mediaFile.isEmpty()) {
            String detectedContentType = detectMimeType(mediaFile);
            
            if (detectedContentType.startsWith("image/")) {
                mediaType = "image";
            } else if (detectedContentType.startsWith("video/")) {
                mediaType = "video";
            } else {
                throw BlogApiException.badRequest("Unsupported media format");
            }

            mediaUrl = fileStorageService.storePostMedia(mediaFile);
        }

        Post post = new Post(author, trimmedContent, mediaUrl, mediaType);
        Post saved = postRepository.save(post);

        return new PostResponse(
                saved.getId(),
                author.getUsername(),
                author.getAvatarUrl(),
                saved.getContent(),
                saved.getMediaUrl(),
                saved.getMediaType(),
                saved.getCreatedAt(),
                0L,
                false,
                0L
        );
    }

    private void validatePostPayload(String content, MultipartFile file) {
        boolean hasContent = content != null && !content.isEmpty();
        boolean hasFile = file != null && !file.isEmpty();

        if (!hasContent && !hasFile) {
            throw BlogApiException.badRequest("Post must contain text content or a file attachment");
        }

        if (hasContent && content.length() > 2000) {
            throw BlogApiException.badRequest("Post content exceeds maximum length of 2000 characters");
        }
    }

    private String detectMimeType(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            String detectedType = tika.detect(inputStream);
            if (detectedType == null || !ALLOWED_MEDIA_TYPES.contains(detectedType.toLowerCase())) {
                throw BlogApiException.badRequest("Invalid file format. Detected: " + detectedType + ". Allowed formats: JPEG, PNG, GIF, WEBP, MP4, WEBM, MOV");
            }
            return detectedType.toLowerCase();
        } catch (IOException e) {
            throw BlogApiException.badRequest("Failed to inspect uploaded file format");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(String targetUsername, String currentUsername) {
        return postRepository.findUserPostsWithCounts(targetUsername, currentUsername);
    }

    @Override
    @Transactional
    public PostResponse updatePost(Long postId, PostUpdateRequest request, String currentUsername) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));

        if (!post.getAuthor().getUsername().equals(currentUsername)) {
            throw BlogApiException.forbidden("You are not authorized to edit this post");
        }

        post.setContent(request.content());
        postRepository.save(post);
        
        return postRepository.findPostByIdWithCounts(postId, currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));
    }

    @Override
    @Transactional
    public void deletePost(Long postId, String currentUsername) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));

        if (!post.getAuthor().getUsername().equals(currentUsername)) {
            throw BlogApiException.forbidden("You are not authorized to delete this post");
        }

        postRepository.delete(post);
    }

    @Override
    @Transactional
    public boolean toggleLike(Long postId, String currentUsername) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        var existingLike = postLikeRepository.findByPostIdAndUserId(postId, user.getId());

        if (existingLike.isPresent()) {
            postLikeRepository.delete(existingLike.get());
            return false;
        }

        if (!postRepository.existsById(postId)) {
            throw BlogApiException.notFound("Post not found");
        }

        Post postRef = postRepository.getReferenceById(postId);
        PostLike like = new PostLike(postRef, user);

        try {
            postLikeRepository.save(like);
            return true;
        } catch (DataIntegrityViolationException e) {
            return true;
        }
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long postId, CommentRequest request, String currentUsername) {
        if (!postRepository.existsById(postId)) {
            throw BlogApiException.notFound("Post not found");
        }

        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        Post post = postRepository.getReferenceById(postId);
        Comment comment = new Comment(request.content(), post, user);

        Comment saved = commentRepository.save(comment);
        return new CommentResponse(saved.getId(), user.getUsername(), saved.getContent(), saved.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getPostComments(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> new CommentResponse(c.getId(), c.getUser().getUsername(), c.getContent(), c.getCreatedAt()))
                .toList();
    }
}
