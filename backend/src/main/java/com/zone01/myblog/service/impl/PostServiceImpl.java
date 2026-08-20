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
import java.util.ArrayList;
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
    public PostResponse createPost(String username, String content, List<MultipartFile> mediaFiles) {
        Users author = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        String trimmedContent = (content != null) ? content.trim() : null;
        
        validatePostPayload(trimmedContent, mediaFiles);

        List<String> mediaUrls = new ArrayList<>();

        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            for (MultipartFile file : mediaFiles) {
                if (file != null && !file.isEmpty()) {
                    String detectedContentType = detectMimeType(file);
                    
                    if (!detectedContentType.startsWith("image/") && !detectedContentType.startsWith("video/")) {
                        throw BlogApiException.badRequest("Unsupported media format");
                    }

                    String mediaUrl = fileStorageService.storePostMedia(file);
                    mediaUrls.add(mediaUrl);
                }
            }
        }

        Post post = new Post(author, trimmedContent, mediaUrls);
        Post saved = postRepository.save(post);

        return new PostResponse(
                saved.getId(),
                author.getUsername(),
                author.getAvatarUrl(),
                saved.getContent(),
                saved.getMediaUrls(),
                saved.getCreatedAt(),
                0L,
                false,
                0L
        );
    }

    private void validatePostPayload(String content, List<MultipartFile> files) {
        boolean hasContent = content != null && !content.isEmpty();
        boolean hasFiles = files != null && !files.isEmpty() && files.stream().anyMatch(f -> !f.isEmpty());

        if (!hasContent && !hasFiles) {
            throw BlogApiException.badRequest("Post must contain text content or at least one file attachment");
        }

        if (hasContent && content.length() > 2000) {
            throw BlogApiException.badRequest("Post content exceeds maximum length of 2000 characters");
        }

        if (files != null && files.size() > 5) {
            throw BlogApiException.badRequest("Cannot upload more than 5 media files per post");
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
        List<Object[]> results = postRepository.findUserPostsWithCounts(targetUsername, currentUsername);
        return results.stream().map(this::mapToPostResponse).toList();
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

        Users currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        return new PostResponse(
                post.getId(),
                post.getAuthor().getUsername(),
                post.getAuthor().getAvatarUrl(),
                post.getContent(),
                post.getMediaUrls(),
                post.getCreatedAt(),
                postLikeRepository.countByPostId(postId),
                postLikeRepository.existsByPostIdAndUserId(postId, currentUser.getId()),
                commentRepository.countByPostId(postId)
        );
    }

    private PostResponse mapToPostResponse(Object[] row) {
        Post post = (Post) row[0];
        Long likeCount = (Long) row[1];
        Boolean isLiked = (Boolean) row[2];
        Long commentCount = (Long) row[3];

        return new PostResponse(
                post.getId(),
                post.getAuthor().getUsername(),
                post.getAuthor().getAvatarUrl(),
                post.getContent(),
                post.getMediaUrls(),
                post.getCreatedAt(),
                likeCount,
                isLiked,
                commentCount
        );
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
