package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.UserSummaryResponse;
import com.zone01.myblog.dto.PagedResponse;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.model.Follow;
import com.zone01.myblog.model.NotificationTicket;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.FollowRepository;
import com.zone01.myblog.repository.NotificationTicketRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.FollowService;
import com.zone01.myblog.service.NotificationService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.Comparator;
import java.util.List;

@Service
public class FollowServiceImpl implements FollowService {

        private static final int SUGGESTED_USERS_LIMIT = 5;

        private final FollowRepository followRepository;
        private final UserRepository userRepository;
        private final NotificationService notificationService;
        private final NotificationTicketRepository notificationTicketRepository;

        public FollowServiceImpl(FollowRepository followRepository, UserRepository userRepository,
                        NotificationService notificationService,
                        NotificationTicketRepository notificationTicketRepository) {
                this.followRepository = followRepository;
                this.userRepository = userRepository;
                this.notificationService = notificationService;
                this.notificationTicketRepository = notificationTicketRepository;
        }

        @Override
        @Transactional
        public boolean toggleFollow(String targetUsername, String currentUsername) {
                if (targetUsername.equalsIgnoreCase(currentUsername)) {
                        throw BlogApiException.badRequest("You cannot follow yourself");
                }

                Users currentUser = userRepository.findByUsername(currentUsername)
                                .orElseThrow(() -> BlogApiException.notFound("Current user not found"));
                Users targetUser = userRepository.findByUsername(targetUsername)
                                .orElseThrow(() -> BlogApiException.notFound("User not found"));

                return followRepository.findByFollowerIdAndFollowedId(currentUser.getId(), targetUser.getId())
                                .map(existing -> {
                                        followRepository.delete(existing);
                                        return false;
                                })
                                .orElseGet(() -> {
                                        // Check if a follow notification ticket was already consumed
                                        boolean ticketUsed = notificationTicketRepository
                                                        .existsByUserIdAndTargetUserIdAndType(
                                                                        currentUser.getId(), targetUser.getId(),
                                                                        "FOLLOW");

                                        if (!ticketUsed) {
                                                notificationTicketRepository.save(
                                                                NotificationTicket.forFollow(currentUser.getId(),
                                                                                targetUser.getId()));
                                                notificationService.sendNotification(targetUser, currentUser, "FOLLOW",
                                                                currentUser.getUsername() + " started following you.",
                                                                null);
                                        }

                                        followRepository.save(new Follow(currentUser, targetUser));
                                        return true;
                                });
        }

        @Override
        @Transactional(readOnly = true)
        public PagedResponse<UserSummaryResponse> getFollowing(String username, int page, int size) {
                Users user = userRepository.findByUsername(username)
                                .orElseThrow(() -> BlogApiException.notFound("User not found"));

                Page<Users> users = followRepository.findFollowedUsers(
                                user.getId(), PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));

                return new PagedResponse<>(users.getContent().stream()
                                .map(u -> new UserSummaryResponse(u.getUsername(), u.getAvatarUrl()))
                                .toList(), users.getNumber(), users.getTotalPages(), users.getTotalElements(),
                                users.isFirst(), users.isLast());
        }

        @Override
        @Transactional(readOnly = true)
        public PagedResponse<UserSummaryResponse> getFollowers(String username, int page, int size) {
                Users user = userRepository.findByUsername(username)
                                .orElseThrow(() -> BlogApiException.notFound("User not found"));

                Page<Users> users = followRepository.findFollowerUsers(
                                user.getId(), PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));

                return new PagedResponse<>(users.getContent().stream()
                                .map(u -> new UserSummaryResponse(u.getUsername(), u.getAvatarUrl()))
                                .toList(), users.getNumber(), users.getTotalPages(), users.getTotalElements(),
                                users.isFirst(), users.isLast());
        }

        @Override
        @Transactional(readOnly = true)
        public List<UserSummaryResponse> getSuggestedUsers(String currentUsername) {
                Users currentUser = userRepository.findByUsername(currentUsername)
                                .orElseThrow(() -> BlogApiException.notFound("User not found"));

                return followRepository.findUnfollowedUsers(currentUser.getId()).stream()
                                .sorted(Comparator.comparingLong(
                                                (Users u) -> followRepository.countByFollowedId(u.getId())).reversed())
                                .limit(SUGGESTED_USERS_LIMIT)
                                .map(u -> new UserSummaryResponse(u.getUsername(), u.getAvatarUrl()))
                                .toList();
        }
}
