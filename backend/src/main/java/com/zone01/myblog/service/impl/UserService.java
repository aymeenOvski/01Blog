package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.UpdateProfileInfoRequest;
import com.zone01.myblog.dto.UpdateProfileSecurityRequest;
import com.zone01.myblog.dto.UserProfileResponse;
import com.zone01.myblog.dto.UserSecurityResponse;

public interface UserService {
    UserProfileResponse getUserProfile(String username);
    UserProfileResponse updateProfileInfo(String currentUsername, UpdateProfileInfoRequest request);
    UserSecurityResponse updateProfileSecurity(String currentUsername, UpdateProfileSecurityRequest request);
}
