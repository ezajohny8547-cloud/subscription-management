package com.subscription.dashboard.dto;

import com.subscription.common.PageResponse;

public class ReportResponseDTO {

    private ReportSummaryDTO summary;
    private PageResponse<ReportRowDTO> page;

    public ReportResponseDTO() {
    }

    public ReportResponseDTO(ReportSummaryDTO summary, PageResponse<ReportRowDTO> page) {
        this.summary = summary;
        this.page = page;
    }

    public ReportSummaryDTO getSummary() {
        return summary;
    }

    public void setSummary(ReportSummaryDTO summary) {
        this.summary = summary;
    }

    public PageResponse<ReportRowDTO> getPage() {
        return page;
    }

    public void setPage(PageResponse<ReportRowDTO> page) {
        this.page = page;
    }
}
