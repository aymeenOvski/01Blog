package com.zone01.myblog.service;

import com.zone01.myblog.dto.ReportRequest;
import com.zone01.myblog.dto.ReportResponse;

public interface ReportService {
    ReportResponse createReport(ReportRequest request, String reporterUsername);
}