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
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;

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
        return mapToResponse(saved, username);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> mapToResponse(post, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(String username) {
        Users author = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        return postRepository.findByAuthorOrderByCreatedAtDesc(author)
                .stream()
                .map(post -> mapToResponse(post, username))
                .collect(Collectors.toList());
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
        Post updated = postRepository.save(post);
        return mapToResponse(updated, currentUsername);
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
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        var existingLike = postLikeRepository.findByPostIdAndUserId(postId, user.getId());

        if (existingLike.isPresent()) {
            postLikeRepository.delete(existingLike.get());
            return false;
        } else {
            PostLike like = new PostLike(post, user);
            postLikeRepository.save(like);
            return true;
        }
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long postId, CommentRequest request, String currentUsername) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

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

    private PostResponse mapToResponse(Post post, String currentUsername) {
        long likesCount = postLikeRepository.countByPostId(post.getId());

        boolean isLiked = currentUsername != null &&
                postLikeRepository.findByPostIdAndUserId(
                        post.getId(),
                        userRepository.findByUsername(currentUsername).map(Users::getId).orElse(-1L)
                ).isPresent();

        long commentsCount = commentRepository.countByPostId(post.getId());

        return new PostResponse(
                post.getId(),
                post.getAuthor().getUsername(),
                post.getAuthor().getAvatarUrl(),
                post.getContent(),
                post.getMediaUrl(),
                post.getMediaType(),
                post.getCreatedAt(),
                likesCount,
                isLiked,
                commentsCount
        );
    }
}
