package com.zone01.myblog.service;

import com.zone01.myblog.dto.UserSummaryResponse;

import java.util.List;

public interface FollowService {
    boolean toggleFollow(String targetUsername, String currentUsername);
    List<UserSummaryResponse> getFollowing(String username);
    List<UserSummaryResponse> getFollowers(String username);
    List<UserSummaryResponse> getSuggestedUsers(String currentUsername);
}
