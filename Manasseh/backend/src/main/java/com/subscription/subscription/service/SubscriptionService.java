package com.subscription.subscription.service;

import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.InvalidStateTransitionException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.product.entity.Product;
import com.subscription.product.entity.ProductVariant;
import com.subscription.product.repository.ProductRepository;
import com.subscription.product.repository.ProductVariantRepository;
import com.subscription.subscription.dto.SubscriptionDTO;
import com.subscription.subscription.dto.SubscriptionHistoryDTO;
import com.subscription.subscription.dto.SubscriptionLineDTO;
import com.subscription.subscription.dto.SubscriptionTransitionRequest;
import com.subscription.subscription.entity.*;
import com.subscription.subscription.repository.SubscriptionHistoryRepository;
import com.subscription.subscription.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRepository historyRepository;
    private final PlanService planService;
    private final QuotationService quotationService;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               SubscriptionHistoryRepository historyRepository,
                               PlanService planService,
                               QuotationService quotationService,
                               ProductRepository productRepository,
                               ProductVariantRepository variantRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.historyRepository = historyRepository;
        this.planService = planService;
        this.quotationService = quotationService;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionDTO> searchSubscriptions(String search, SubscriptionStatus status, Long customerId, Long planId) {
        List<Subscription> list = subscriptionRepository.searchSubscriptions(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                status,
                customerId,
                planId
        );
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubscriptionDTO getSubscriptionById(Long id) {
        Subscription subscription = findEntityById(id);
        SubscriptionDTO dto = toDTO(subscription);
        // Load audit history
        List<SubscriptionHistoryDTO> history = historyRepository.findBySubscriptionIdOrderByCreatedAtAsc(id)
                .stream()
                .map(this::toHistoryDTO)
                .collect(Collectors.toList());
        dto.setHistory(history);
        return dto;
    }

    @Transactional(readOnly = true)
    public Subscription findEntityById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", id));
    }

    /**
     * Creates a subscription directly (e.g. initial DRAFT or CONFIRMED state).
     */
    public SubscriptionDTO createSubscription(SubscriptionDTO dto) {
        validateSubscriptionInput(dto);

        Plan plan = planService.findEntityById(dto.getPlanId());
        LocalDate start = dto.getStartDate() != null ? dto.getStartDate() : LocalDate.now();
        planService.validatePlanAvailability(plan, start);

        Subscription subscription = new Subscription();
        subscription.setSubscriptionNumber(generateSubscriptionNumber());
        subscription.setCustomerId(dto.getCustomerId());
        subscription.setCustomerName(dto.getCustomerName().trim());
        subscription.setCustomerEmail(dto.getCustomerEmail().trim());
        subscription.setPlan(plan);
        subscription.setStartDate(start);

        LocalDate expiry = dto.getExpiryDate() != null ? dto.getExpiryDate() : calculateInitialExpiryDate(start, plan.getBillingInterval());
        subscription.setExpiryDate(expiry);

        // Store accurate billing dates so Module 3 knows when invoices are due
        subscription.setNextBillingDate(start);
        subscription.setPaymentTerms(dto.getPaymentTerms() != null ? dto.getPaymentTerms() : PaymentTerms.NET_30);
        subscription.setStatus(dto.getStatus() != null ? dto.getStatus() : SubscriptionStatus.DRAFT);
        subscription.setBillingCyclesCompleted(0);

        buildSubscriptionLines(subscription, dto.getLines(), plan);

        Subscription saved = subscriptionRepository.save(subscription);
        recordHistory(saved.getSubscriptionId(), null, saved.getStatus(), "STAFF_USER", "Created subscription in " + saved.getStatus() + " state.");

        return toDTO(saved);
    }

    /**
     * Converts an accepted quotation into a confirmed subscription.
     */
    public SubscriptionDTO convertQuotationToSubscription(Long quotationId) {
        Quotation quotation = quotationService.findEntityById(quotationId);

        if (quotation.getStatus() == QuotationStatus.CONVERTED) {
            throw new BusinessRuleException("Quotation has already been converted to a subscription.");
        }
        if (quotation.getStatus() != QuotationStatus.ACCEPTED) {
            throw new BusinessRuleException("Only quotations with status 'ACCEPTED' can be converted into subscriptions. Current status: " + quotation.getStatus());
        }

        Plan plan = quotation.getPlan();
        LocalDate today = LocalDate.now();
        planService.validatePlanAvailability(plan, today);

        Subscription subscription = new Subscription();
        subscription.setSubscriptionNumber(generateSubscriptionNumber());
        subscription.setQuotation(quotation);
        subscription.setCustomerId(quotation.getCustomerId());
        subscription.setCustomerName(quotation.getCustomerName());
        subscription.setCustomerEmail(quotation.getCustomerEmail());
        subscription.setPlan(plan);
        subscription.setStartDate(today);
        subscription.setExpiryDate(calculateInitialExpiryDate(today, plan.getBillingInterval()));
        subscription.setNextBillingDate(today); // First invoice due immediately on start date
        subscription.setPaymentTerms(quotation.getPaymentTerms());
        subscription.setStatus(SubscriptionStatus.CONFIRMED);
        subscription.setBillingCyclesCompleted(0);

        // Copy lines from quotation to subscription
        for (QuotationLine qLine : quotation.getLines()) {
            SubscriptionLine sLine = new SubscriptionLine();
            sLine.setProduct(qLine.getProduct());
            sLine.setVariant(qLine.getVariant());
            sLine.setQuantity(qLine.getQuantity());
            sLine.setUnitPrice(qLine.getUnitPrice());
            sLine.setTaxRate(qLine.getTaxRate());
            sLine.setTaxAmount(qLine.getTaxAmount());
            sLine.setLineTotal(qLine.getLineTotal());
            subscription.addLine(sLine);
        }

        Subscription saved = subscriptionRepository.save(subscription);

        // Mark quotation as converted
        quotation.setStatus(QuotationStatus.CONVERTED);

        recordHistory(saved.getSubscriptionId(), null, SubscriptionStatus.CONFIRMED, "SYSTEM",
                "Converted from Quotation " + quotation.getQuotationNumber());

        return toDTO(saved);
    }

    /**
     * Validates and executes status transitions according to the required lifecycle:
     * DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED (+ PAUSED)
     */
    public SubscriptionDTO transitionStatus(Long subscriptionId, SubscriptionTransitionRequest request) {
        Subscription subscription = findEntityById(subscriptionId);
        SubscriptionStatus current = subscription.getStatus();
        SubscriptionStatus target = request.getTargetStatus();

        if (current == target) {
            return toDTO(subscription);
        }

        // Validate state transition
        if (!current.canTransitionTo(target)) {
            throw new InvalidStateTransitionException(current.name(), target.name(),
                    String.format("Valid next statuses from '%s' are: %s", current, current.allowedNextStatuses()));
        }

        // Additional business validation based on target status
        if (target == SubscriptionStatus.ACTIVE) {
            // Validate plan is still active
            planService.validatePlanAvailability(subscription.getPlan(), LocalDate.now());
            // If nextBillingDate is null, establish it
            if (subscription.getNextBillingDate() == null) {
                subscription.setNextBillingDate(LocalDate.now());
            }
        } else if (target == SubscriptionStatus.CLOSED) {
            subscription.setClosedAt(LocalDateTime.now());
            subscription.setCancellationReason(request.getReason() != null ? request.getReason() : "Closed by authorized user");
        }

        subscription.setStatus(target);
        Subscription updated = subscriptionRepository.save(subscription);

        recordHistory(subscriptionId, current, target,
                request.getChangedBy() != null ? request.getChangedBy() : "STAFF",
                request.getReason() != null ? request.getReason() : "Status updated to " + target);

        return toDTO(updated);
    }

    /**
     * Activation of eligible subscriptions (from CONFIRMED -> ACTIVE).
     */
    public SubscriptionDTO activateSubscription(Long id) {
        return transitionStatus(id, new SubscriptionTransitionRequest(
                SubscriptionStatus.ACTIVE, "Subscription activated and service access provisioned.", "STAFF"));
    }

    /**
     * Pauses an ACTIVE subscription.
     */
    public SubscriptionDTO pauseSubscription(Long id, String reason) {
        return transitionStatus(id, new SubscriptionTransitionRequest(
                SubscriptionStatus.PAUSED, reason != null ? reason : "Customer requested temporary pause.", "STAFF"));
    }

    /**
     * Resumes a PAUSED subscription back to ACTIVE.
     */
    public SubscriptionDTO resumeSubscription(Long id) {
        return transitionStatus(id, new SubscriptionTransitionRequest(
                SubscriptionStatus.ACTIVE, "Subscription resumed by staff.", "STAFF"));
    }

    /**
     * Early closure of an active or paused subscription.
     */
    public SubscriptionDTO closeSubscriptionEarly(Long id, String reason) {
        return transitionStatus(id, new SubscriptionTransitionRequest(
                SubscriptionStatus.CLOSED, reason != null ? reason : "Early cancellation requested.", "STAFF"));
    }

    /**
     * Renewal: Extends expiry date and advances billing cycle.
     */
    public SubscriptionDTO renewSubscription(Long id) {
        Subscription subscription = findEntityById(id);

        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new BusinessRuleException("Only ACTIVE subscriptions can be renewed. Current status: " + subscription.getStatus());
        }

        // Validate plan availability for renewal
        planService.validatePlanAvailability(subscription.getPlan(), LocalDate.now());

        LocalDate currentExpiry = subscription.getExpiryDate();
        LocalDate newExpiry = calculateNextDateByInterval(currentExpiry, subscription.getPlan().getBillingInterval());
        subscription.setExpiryDate(newExpiry);

        // Advance billing cycle count
        subscription.setBillingCyclesCompleted(subscription.getBillingCyclesCompleted() + 1);
        subscription.setLastBillingDate(subscription.getNextBillingDate());
        subscription.setNextBillingDate(calculateNextDateByInterval(subscription.getNextBillingDate(), subscription.getPlan().getBillingInterval()));

        Subscription updated = subscriptionRepository.save(subscription);

        recordHistory(id, SubscriptionStatus.ACTIVE, SubscriptionStatus.ACTIVE, "SYSTEM",
                String.format("Subscription renewed. New expiry date: %s. Billing cycle: %d.", newExpiry, updated.getBillingCyclesCompleted()));

        return toDTO(updated);
    }

    /**
     * Automatic closure according to plan settings:
     * - Auto-close when expiry date passed (plan.autoClose == true)
     * - Auto-close when autoCloseAfterCycles reached
     */
    public int processAutomaticClosures() {
        LocalDate today = LocalDate.now();
        List<Subscription> eligible = subscriptionRepository.findSubscriptionsEligibleForAutoClose(today);
        int closedCount = 0;

        for (Subscription sub : eligible) {
            String reason = Boolean.TRUE.equals(sub.getPlan().getAutoClose()) && !sub.getExpiryDate().isAfter(today)
                    ? "Automatic closure: Expiry date reached under plan policy."
                    : "Automatic closure: Maximum billing cycles (" + sub.getPlan().getAutoCloseAfterCycles() + ") completed.";

            sub.setStatus(SubscriptionStatus.CLOSED);
            sub.setClosedAt(LocalDateTime.now());
            sub.setCancellationReason(reason);
            subscriptionRepository.save(sub);

            recordHistory(sub.getSubscriptionId(), SubscriptionStatus.ACTIVE, SubscriptionStatus.CLOSED, "SYSTEM_SCHEDULER", reason);
            closedCount++;
        }

        return closedCount;
    }

    private void buildSubscriptionLines(Subscription subscription, List<SubscriptionLineDTO> lineDtos, Plan plan) {
        int totalQuantity = 0;
        for (SubscriptionLineDTO lineDto : lineDtos) {
            Product product = productRepository.findById(lineDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", lineDto.getProductId()));

            if (!Boolean.TRUE.equals(product.getIsAvailable())) {
                throw new BusinessRuleException(String.format("Product '%s' is not available for subscription.", product.getName()));
            }

            ProductVariant variant = null;
            BigDecimal effectivePrice = product.getSalesPrice();

            if (lineDto.getVariantId() != null) {
                variant = variantRepository.findById(lineDto.getVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", lineDto.getVariantId()));
                if (!variant.getProduct().getProductId().equals(product.getProductId())) {
                    throw new BusinessRuleException("Variant does not belong to specified product.");
                }
                effectivePrice = variant.calculateEffectivePrice();
            }

            int qty = lineDto.getQuantity() != null ? lineDto.getQuantity() : 1;
            totalQuantity += qty;

            SubscriptionLine line = new SubscriptionLine();
            line.setProduct(product);
            line.setVariant(variant);
            line.setQuantity(qty);
            line.setUnitPrice(lineDto.getUnitPrice() != null ? lineDto.getUnitPrice() : effectivePrice);
            line.setTaxRate(lineDto.getTaxRate() != null ? lineDto.getTaxRate() : BigDecimal.ZERO);
            line.calculateAmounts();

            subscription.addLine(line);
        }

        if (totalQuantity < plan.getMinimumQuantity()) {
            throw new BusinessRuleException(String.format("Total product quantity (%d) does not meet plan minimum requirement (%d).",
                    totalQuantity, plan.getMinimumQuantity()));
        }

        subscription.recalculateTotals();
    }

    private void validateSubscriptionInput(SubscriptionDTO dto) {
        if (dto.getCustomerId() == null) {
            throw new BusinessRuleException("Customer reference is required.");
        }
        if (dto.getCustomerName() == null || dto.getCustomerName().trim().isEmpty()) {
            throw new BusinessRuleException("Customer name is required.");
        }
        if (dto.getCustomerEmail() == null || dto.getCustomerEmail().trim().isEmpty()) {
            throw new BusinessRuleException("Customer email is required.");
        }
        if (dto.getPlanId() == null) {
            throw new BusinessRuleException("Plan reference is required.");
        }
        if (dto.getLines() == null || dto.getLines().isEmpty()) {
            throw new BusinessRuleException("Subscription must contain at least one product line.");
        }
    }

    private LocalDate calculateInitialExpiryDate(LocalDate startDate, BillingInterval interval) {
        return calculateNextDateByInterval(startDate, interval);
    }

    private LocalDate calculateNextDateByInterval(LocalDate fromDate, BillingInterval interval) {
        if (interval == null) return fromDate.plusMonths(1);
        switch (interval) {
            case DAILY:
                return fromDate.plusDays(1);
            case WEEKLY:
                return fromDate.plusWeeks(1);
            case MONTHLY:
                return fromDate.plusMonths(1);
            case YEARLY:
                return fromDate.plusYears(1);
            default:
                return fromDate.plusMonths(1);
        }
    }

    private void recordHistory(Long subscriptionId, SubscriptionStatus prev, SubscriptionStatus next, String by, String reason) {
        SubscriptionHistory history = new SubscriptionHistory(subscriptionId, prev, next, by, reason);
        historyRepository.save(history);
    }

    private synchronized String generateSubscriptionNumber() {
        return "SUB-" + LocalDate.now().getYear() + "-" + String.format("%04d", System.currentTimeMillis() % 10000);
    }

    public SubscriptionDTO toDTO(Subscription entity) {
        if (entity == null) return null;
        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setSubscriptionId(entity.getSubscriptionId());
        dto.setSubscriptionNumber(entity.getSubscriptionNumber());
        if (entity.getQuotation() != null) {
            dto.setQuotationId(entity.getQuotation().getQuotationId());
            dto.setQuotationNumber(entity.getQuotation().getQuotationNumber());
        }
        dto.setCustomerId(entity.getCustomerId());
        dto.setCustomerName(entity.getCustomerName());
        dto.setCustomerEmail(entity.getCustomerEmail());
        if (entity.getPlan() != null) {
            dto.setPlanId(entity.getPlan().getPlanId());
            dto.setPlanName(entity.getPlan().getPlanName());
            dto.setBillingInterval(entity.getPlan().getBillingInterval());
        }
        dto.setStartDate(entity.getStartDate());
        dto.setExpiryDate(entity.getExpiryDate());
        dto.setNextBillingDate(entity.getNextBillingDate());
        dto.setLastBillingDate(entity.getLastBillingDate());
        dto.setPaymentTerms(entity.getPaymentTerms());
        dto.setSubtotal(entity.getSubtotal());
        dto.setTaxTotal(entity.getTaxTotal());
        dto.setTotalAmount(entity.getTotalAmount());
        dto.setStatus(entity.getStatus());
        dto.setBillingCyclesCompleted(entity.getBillingCyclesCompleted());
        dto.setCancellationReason(entity.getCancellationReason());
        dto.setClosedAt(entity.getClosedAt());
        dto.setAllowedNextStatuses(entity.getStatus().allowedNextStatuses());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getLines() != null) {
            dto.setLines(entity.getLines().stream().map(this::toLineDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    public SubscriptionLineDTO toLineDTO(SubscriptionLine line) {
        if (line == null) return null;
        SubscriptionLineDTO dto = new SubscriptionLineDTO();
        dto.setLineId(line.getLineId());
        if (line.getProduct() != null) {
            dto.setProductId(line.getProduct().getProductId());
            dto.setProductName(line.getProduct().getName());
        }
        if (line.getVariant() != null) {
            dto.setVariantId(line.getVariant().getVariantId());
            dto.setVariantName(line.getVariant().getVariantName());
        }
        dto.setQuantity(line.getQuantity());
        dto.setUnitPrice(line.getUnitPrice());
        dto.setTaxRate(line.getTaxRate());
        dto.setTaxAmount(line.getTaxAmount());
        dto.setLineTotal(line.getLineTotal());
        return dto;
    }

    public SubscriptionHistoryDTO toHistoryDTO(SubscriptionHistory history) {
        if (history == null) return null;
        SubscriptionHistoryDTO dto = new SubscriptionHistoryDTO();
        dto.setHistoryId(history.getHistoryId());
        dto.setSubscriptionId(history.getSubscriptionId());
        dto.setPreviousStatus(history.getPreviousStatus());
        dto.setNewStatus(history.getNewStatus());
        dto.setChangedBy(history.getChangedBy());
        dto.setChangeReason(history.getChangeReason());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }
}
