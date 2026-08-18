package com.zone01.myblog.service;

import com.zone01.myblog.dto.AuthResponse;
import com.zone01.myblog.dto.LoginRequest;
import com.zone01.myblog.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}

