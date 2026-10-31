package com.subscription.dashboard.controller;

import com.subscription.common.ApiResponse;
import com.subscription.dashboard.dto.ReportFilterDTO;
import com.subscription.dashboard.dto.ReportResponseDTO;
import com.subscription.dashboard.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/dashboard/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ReportResponseDTO>> getReport(
            @ModelAttribute ReportFilterDTO filter) {
        ReportResponseDTO report = reportService.generateReport(filter);
        return ResponseEntity.ok(ApiResponse.success("Report data retrieved successfully", report));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReportCsv(
            @ModelAttribute ReportFilterDTO filter) {
        byte[] csvData = reportService.exportCsv(filter);
        String filename = "subscription-report-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
