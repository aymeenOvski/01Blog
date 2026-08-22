package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.UserSummaryResponse;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.model.Follow;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.FollowRepository;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.FollowService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class FollowServiceImpl implements FollowService {

    private static final int SUGGESTED_USERS_LIMIT = 5;

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowServiceImpl(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
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
                    followRepository.save(new Follow(currentUser, targetUser));
                    return true;
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFollowing(String username) {
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        return followRepository.findFollowedUsers(user.getId()).stream()
                .map(u -> new UserSummaryResponse(u.getUsername(), u.getAvatarUrl()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFollowers(String username) {
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        return followRepository.findFollowerUsers(user.getId()).stream()
                .map(u -> new UserSummaryResponse(u.getUsername(), u.getAvatarUrl()))
                .toList();
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
