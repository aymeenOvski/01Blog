package com.zone01.myblog.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeAvatar(MultipartFile file);
    void deleteAvatar(String fileUrl);
}
