package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.CommentRequest;
import com.zone01.myblog.dto.CommentResponse;
import com.zone01.myblog.dto.NotificationResponse;
import com.zone01.myblog.dto.PostResponse;
import com.zone01.myblog.dto.PostUpdateRequest;
import com.zone01.myblog.dto.PagedResponse;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.model.Comment;
import com.zone01.myblog.model.Post;
import com.zone01.myblog.model.PostLike;
import com.zone01.myblog.model.Repost;
import com.zone01.myblog.model.Notification;
import com.zone01.myblog.model.NotificationTicket;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.CommentRepository;
import com.zone01.myblog.repository.PostLikeRepository;
import com.zone01.myblog.repository.PostRepository;
import com.zone01.myblog.repository.RepostRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.repository.NotificationRepository;
import com.zone01.myblog.repository.NotificationTicketRepository;
import com.zone01.myblog.repository.FollowRepository;
import com.zone01.myblog.service.FileStorageService;
import com.zone01.myblog.service.PostService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import org.apache.tika.Tika;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
    private final RepostRepository repostRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final FollowRepository followRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationTicketRepository notificationTicketRepository;

    private final Tika tika = new Tika();
    private static final List<String> ALLOWED_MEDIA_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm", "video/quicktime");

    public PostServiceImpl(PostRepository postRepository, UserRepository userRepository,
            FileStorageService fileStorageService, PostLikeRepository postLikeRepository,
            CommentRepository commentRepository, NotificationRepository notificationRepository,
            NotificationTicketRepository notificationTicketRepository,
            SimpMessagingTemplate messagingTemplate, FollowRepository followRepository,
            RepostRepository repostRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.postLikeRepository = postLikeRepository;
        this.repostRepository = repostRepository;
        this.commentRepository = commentRepository;
        this.notificationRepository = notificationRepository;
        this.notificationTicketRepository = notificationTicketRepository;
        this.followRepository = followRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public PostResponse createPost(String username, String content, List<MultipartFile> mediaFiles) {
        Users author = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        String normalizedContent = content != null
                ? content.replace("\r\n", "\n").replace("\r", "\n")
                : null;

        String trimmedContent = normalizedContent != null
                ? normalizedContent.trim()
                : null;

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

        List<Users> followers = followRepository.findFollowerUsers(author.getId());
        for (Users follower : followers) {
            Notification notif = notificationRepository.save(new Notification(
                    follower,
                    author,
                    "POST",
                    author.getUsername() + " published a new post.",
                    saved.getId()));

            NotificationResponse dto = NotificationResponse.fromEntity(notif);
            messagingTemplate.convertAndSendToUser(
                    follower.getUsername(),
                    "/queue/notifications",
                    dto);
        }

        return new PostResponse(
                saved.getId(),
                author.getUsername(),
                author.getAvatarUrl(),
                saved.getContent(),
                saved.getMediaUrls(),
                saved.getCreatedAt(),
                0L,
                false,
                0L);
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
                throw BlogApiException.badRequest("Invalid file format. Detected: " + detectedType
                        + ". Allowed formats: JPEG, PNG, GIF, WEBP, MP4, WEBM, MOV");
            }
            return detectedType.toLowerCase();
        } catch (IOException e) {
            throw BlogApiException.badRequest("Failed to inspect uploaded file format");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PostResponse> getUserPosts(
            String targetUsername, String currentUsername, int page, int size) {
        List<Object[]> results = postRepository.findUserPostsWithCounts(targetUsername, currentUsername);
        List<PostResponse> authoredPosts = results.stream()
                .map(this::mapToPostResponse)
                .toList();

        List<PostResponse> repostedPosts = repostRepository
                .findVisibleByUserUsername(targetUsername)
                .stream()
                .map(repost -> mapRepostToResponse(repost, currentUsername))
                .toList();

        List<PostResponse> mergedPosts = java.util.stream.Stream.concat(authoredPosts.stream(), repostedPosts.stream())
                .sorted(java.util.Comparator.comparing(PostResponse::createdAt).reversed())
                .toList();

        return paginate(mergedPosts, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PostResponse> getFeedPosts(
            String currentUsername, int page, int size) {
        List<PostResponse> authoredPosts = postRepository.findFeedPostsWithCounts(currentUsername).stream()
                .map(this::mapToPostResponse)
                .toList();

        List<PostResponse> repostedPosts = repostRepository
                .findVisibleFromFollowedUsers(currentUsername)
                .stream()
                .map(repost -> mapRepostToResponse(repost, currentUsername))
                .toList();

        List<PostResponse> mergedPosts = java.util.stream.Stream.concat(authoredPosts.stream(), repostedPosts.stream())
                .sorted(java.util.Comparator.comparing(PostResponse::createdAt).reversed())
                .toList();

        return paginate(mergedPosts, page, size);
    }

    @Override
    @Transactional
    public PostResponse repostPost(Long postId, String currentUsername) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        Post post = postRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));

        if (!"VISIBLE".equalsIgnoreCase(post.getVisibility()) || post.getAuthor().isBanned()) {
            throw BlogApiException.notFound("Post not found");
        }

        if (post.getAuthor().getId().equals(user.getId())) {
            throw BlogApiException.badRequest("You cannot repost your own post");
        }

        if (repostRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            throw BlogApiException.conflict("You already reposted this post");
        }

        Repost repost = repostRepository.save(new Repost(user, post));
        return mapRepostToResponse(repost, currentUsername);
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
                commentRepository.countByPostId(postId));
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
                commentCount);
    }

    private PostResponse mapRepostToResponse(Repost repost, String currentUsername) {
        Post post = repost.getPost();
        Long postId = post.getId();

        return new PostResponse(
                postId,
                post.getAuthor().getUsername(),
                post.getAuthor().getAvatarUrl(),
                post.getContent(),
                post.getMediaUrls(),
                repost.getCreatedAt(),
                postLikeRepository.countByPostId(postId),
                postLikeRepository.existsByPostIdAndUserId(
                        postId,
                        userRepository.findByUsername(currentUsername)
                                .map(Users::getId)
                                .orElse(-1L)),
                commentRepository.countByPostId(postId),
                true,
                repost.getUser().getUsername(),
                post.getAuthor().getUsername());
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

        Post post = postRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));

        var existingLike = postLikeRepository.findByPostIdAndUserId(postId, user.getId());

        if (existingLike.isPresent()) {
            postLikeRepository.delete(existingLike.get());
            return false;
        }

        PostLike like = new PostLike(post, user);

        try {
            postLikeRepository.save(like);

            // Don't notify self & check if the user already used their notification ticket
            if (!post.getAuthor().getId().equals(user.getId())) {
                boolean ticketUsed = notificationTicketRepository.existsByUserIdAndPostIdAndType(
                        user.getId(), post.getId(), "LIKE");

                if (!ticketUsed) {
                    notificationTicketRepository.save(new NotificationTicket(user.getId(), post.getId(), "LIKE"));

                    Notification notif = notificationRepository.save(new Notification(
                            post.getAuthor(),
                            user,
                            "LIKE",
                            user.getUsername() + " liked your post.",
                            post.getId()));

                    messagingTemplate.convertAndSendToUser(
                            post.getAuthor().getUsername(),
                            "/queue/notifications",
                            NotificationResponse.fromEntity(notif));
                }
            }

            return true;
        } catch (DataIntegrityViolationException e) {
            return true;
        }
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long postId, CommentRequest request, String currentUsername) {
        Post post = postRepository.findByIdWithAuthor(postId)
                .orElseThrow(() -> BlogApiException.notFound("Post not found"));

        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        Comment comment = new Comment(request.content(), post, user);
        Comment saved = commentRepository.save(comment);

        if (!post.getAuthor().getId().equals(user.getId())) {
            boolean ticketUsed = notificationTicketRepository.existsByUserIdAndPostIdAndType(
                    user.getId(), post.getId(), "COMMENT");

            if (!ticketUsed) {
                notificationTicketRepository.save(new NotificationTicket(user.getId(), post.getId(), "COMMENT"));

                Notification notif = notificationRepository.save(new Notification(
                        post.getAuthor(),
                        user,
                        "COMMENT",
                        user.getUsername() + " commented on your post.",
                        post.getId()));

                messagingTemplate.convertAndSendToUser(
                        post.getAuthor().getUsername(),
                        "/queue/notifications",
                        NotificationResponse.fromEntity(notif));
            }
        }

        return new CommentResponse(saved.getId(), user.getUsername(), saved.getContent(), saved.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<CommentResponse> getPostComments(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        Page<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);

        return new PagedResponse<>(
                comments.getContent().stream()
                        .map(c -> new CommentResponse(c.getId(), c.getUser().getUsername(), c.getContent(),
                                c.getCreatedAt()))
                        .toList(),
                comments.getNumber(),
                comments.getTotalPages(),
                comments.getTotalElements(),
                comments.isFirst(),
                comments.isLast());
    }

    private <T> PagedResponse<T> paginate(List<T> items, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        int fromIndex = Math.min(safePage * safeSize, items.size());
        int toIndex = Math.min(fromIndex + safeSize, items.size());
        int totalPages = items.isEmpty() ? 0 : (int) Math.ceil((double) items.size() / safeSize);

        return new PagedResponse<>(
                items.subList(fromIndex, toIndex),
                safePage,
                totalPages,
                items.size(),
                safePage == 0,
                toIndex >= items.size());
    }

    @Override
    @Transactional
    public void deleteComment(Long postId, Long commentId, String currentUsername) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> BlogApiException.notFound("Comment not found"));
        
        // Verify the comment belongs to the post
        if (!comment.getPost().getId().equals(postId)) {
            throw BlogApiException.badRequest("Comment does not belong to this post");
        }
        
        // Verify the current user is the author of the comment
        if (!comment.getUser().getUsername().equals(currentUsername)) {
            throw BlogApiException.forbidden("You are not authorized to delete this comment");
        }
        
        commentRepository.delete(comment);
    }
}
