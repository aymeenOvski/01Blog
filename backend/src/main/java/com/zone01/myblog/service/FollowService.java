package com.zone01.myblog.service;

import com.zone01.myblog.dto.UserSummaryResponse;
import com.zone01.myblog.dto.PagedResponse;

import java.util.List;

public interface FollowService {
    boolean toggleFollow(String targetUsername, String currentUsername);
    PagedResponse<UserSummaryResponse> getFollowing(String username, int page, int size);
    PagedResponse<UserSummaryResponse> getFollowers(String username, int page, int size);
    List<UserSummaryResponse> getSuggestedUsers(String currentUsername);
}
