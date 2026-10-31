package com.subscription.dashboard.service;

import com.subscription.common.PageResponse;
import com.subscription.dashboard.dto.ReportFilterDTO;
import com.subscription.dashboard.dto.ReportResponseDTO;
import com.subscription.dashboard.dto.ReportRowDTO;
import com.subscription.dashboard.dto.ReportSummaryDTO;
import com.subscription.entity.Invoice;
import com.subscription.entity.InvoiceStatus;
import com.subscription.entity.Subscription;
import com.subscription.entity.SubscriptionStatus;
import com.subscription.repository.InvoiceRepository;
import com.subscription.repository.SubscriptionRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;

    public ReportService(InvoiceRepository invoiceRepository, SubscriptionRepository subscriptionRepository) {
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    public ReportResponseDTO generateReport(ReportFilterDTO filter) {
        Specification<Invoice> spec = buildSpecification(filter);

        Sort.Direction direction = "asc".equalsIgnoreCase(filter.getSortDirection()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortBy = filter.getSortBy() != null && !filter.getSortBy().isEmpty() ? filter.getSortBy() : "issueDate";
        Pageable pageable = PageRequest.of(Math.max(0, filter.getPage()), Math.max(1, filter.getSize()), Sort.by(direction, sortBy));

        Page<Invoice> invoicePage = invoiceRepository.findAll(spec, pageable);

        List<ReportRowDTO> rows = new ArrayList<>();
        for (Invoice inv : invoicePage.getContent()) {
            Subscription sub = inv.getSubscription();
            rows.add(new ReportRowDTO(
                    sub != null ? sub.getId() : null,
                    inv.getUser().getId(),
                    inv.getUser().getName(),
                    inv.getUser().getEmail(),
                    sub != null && sub.getPlan() != null ? sub.getPlan().getName() : "Direct Invoice",
                    sub != null ? sub.getStatus().name() : "N/A",
                    sub != null ? sub.getStartDate() : inv.getIssueDate(),
                    sub != null ? sub.getEndDate() : inv.getDueDate(),
                    inv.getInvoiceNumber(),
                    inv.getTotalAmount(),
                    inv.getPaidAmount(),
                    inv.getOutstandingAmount(),
                    inv.getStatus().name(),
                    inv.getDueDate()
            ));
        }

        // Calculate summary totals across the whole filtered dataset
        List<Invoice> allFiltered = invoiceRepository.findAll(spec);
        BigDecimal totalInvoiced = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        long totalInvoices = allFiltered.size();
        long overdueInvoices = 0;

        for (Invoice inv : allFiltered) {
            totalInvoiced = totalInvoiced.add(inv.getTotalAmount());
            totalRevenue = totalRevenue.add(inv.getPaidAmount());
            totalOutstanding = totalOutstanding.add(inv.getOutstandingAmount());
            if (inv.getStatus() == InvoiceStatus.OVERDUE || (inv.getStatus() == InvoiceStatus.PENDING && inv.getDueDate().isBefore(LocalDate.now()))) {
                overdueInvoices++;
            }
        }

        long totalSubs = subscriptionRepository.count();
        long activeSubs = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);

        ReportSummaryDTO summary = new ReportSummaryDTO(
                totalInvoiced,
                totalRevenue,
                totalOutstanding,
                totalSubs,
                activeSubs,
                totalInvoices,
                overdueInvoices
        );

        PageResponse<ReportRowDTO> pageResponse = new PageResponse<>(
                rows,
                invoicePage.getNumber(),
                invoicePage.getSize(),
                invoicePage.getTotalElements(),
                invoicePage.getTotalPages(),
                invoicePage.isLast()
        );

        return new ReportResponseDTO(summary, pageResponse);
    }

    public byte[] exportCsv(ReportFilterDTO filter) {
        Specification<Invoice> spec = buildSpecification(filter);
        List<Invoice> invoices = invoiceRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "issueDate"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // Write CSV Header
            writer.println("Invoice Number,Customer Name,Customer Email,Plan Name,Subscription Status,Issue Date,Due Date,Invoiced Amount,Paid Amount,Outstanding Balance,Invoice Status");

            for (Invoice inv : invoices) {
                Subscription sub = inv.getSubscription();
                String planName = sub != null && sub.getPlan() != null ? sub.getPlan().getName() : "Direct";
                String subStatus = sub != null ? sub.getStatus().name() : "N/A";

                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,%.2f,%.2f,\"%s\"%n",
                        escapeCsv(inv.getInvoiceNumber()),
                        escapeCsv(inv.getUser().getName()),
                        escapeCsv(inv.getUser().getEmail()),
                        escapeCsv(planName),
                        escapeCsv(subStatus),
                        inv.getIssueDate(),
                        inv.getDueDate(),
                        inv.getTotalAmount(),
                        inv.getPaidAmount(),
                        inv.getOutstandingAmount(),
                        inv.getStatus().name()
                );
            }
        }
        return out.toByteArray();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }

    private Specification<Invoice> buildSpecification(ReportFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("issueDate"), filter.getStartDate()));
            }

            if (filter.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("issueDate"), filter.getEndDate()));
            }

            if (filter.getInvoiceStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getInvoiceStatus()));
            }

            if (filter.getCustomerId() != null) {
                predicates.add(cb.equal(root.get("user").get("id"), filter.getCustomerId()));
            }

            Join<Invoice, Subscription> subJoin = null;
            if (filter.getSubscriptionStatus() != null || filter.getPlanId() != null) {
                subJoin = root.join("subscription", JoinType.LEFT);
            }

            if (filter.getSubscriptionStatus() != null && subJoin != null) {
                predicates.add(cb.equal(subJoin.get("status"), filter.getSubscriptionStatus()));
            }

            if (filter.getPlanId() != null && subJoin != null) {
                predicates.add(cb.equal(subJoin.get("plan").get("id"), filter.getPlanId()));
            }

            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("invoiceNumber")), searchPattern),
                        cb.like(cb.lower(root.get("user").get("name")), searchPattern),
                        cb.like(cb.lower(root.get("user").get("email")), searchPattern)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
