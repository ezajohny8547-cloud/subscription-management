package com.subscription.billing.service;

import com.subscription.billing.dto.CreateDiscountRequest;
import com.subscription.billing.dto.DiscountResponse;
import com.subscription.billing.entity.Discount;
import com.subscription.billing.entity.DiscountType;
import com.subscription.billing.entity.DiscountUsage;
import com.subscription.billing.repository.DiscountRepository;
import com.subscription.billing.repository.DiscountUsageRepository;
import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.DuplicateResourceException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.model.Customer;
import com.subscription.model.Product;
import com.subscription.model.Subscription;
import com.subscription.repository.ProductRepository;
import com.subscription.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final DiscountUsageRepository discountUsageRepository;
    private final ProductRepository productRepository;
    private final SubscriptionRepository subscriptionRepository;

    public DiscountService(DiscountRepository discountRepository,
                           DiscountUsageRepository discountUsageRepository,
                           ProductRepository productRepository,
                           SubscriptionRepository subscriptionRepository) {
        this.discountRepository = discountRepository;
        this.discountUsageRepository = discountUsageRepository;
        this.productRepository = productRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    public List<DiscountResponse> getAllDiscounts() {
        return discountRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DiscountResponse getDiscountById(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount not found with ID: " + id));
        return mapToResponse(discount);
    }

    @Transactional
    public DiscountResponse createDiscount(CreateDiscountRequest request) {
        if (discountRepository.findByCodeIgnoreCase(request.getCode().trim()).isPresent()) {
            throw new DuplicateResourceException("Discount with code '" + request.getCode() + "' already exists");
        }

        Discount discount = new Discount();
        discount.setCode(request.getCode().trim().toUpperCase());
        discount.setDescription(request.getDescription());
        discount.setDiscountType(request.getDiscountType());
        discount.setDiscountValue(request.getDiscountValue().setScale(2, RoundingMode.HALF_UP));
        discount.setMinPurchaseAmount(request.getMinPurchaseAmount());
        discount.setMinQuantity(request.getMinQuantity());
        discount.setStartDate(request.getStartDate());
        discount.setEndDate(request.getEndDate());
        discount.setMaxUsageCount(request.getMaxUsageCount());
        discount.setCurrentUsageCount(0);
        discount.setActive(true);

        if (request.getApplicableProductId() != null) {
            Product product = productRepository.findById(request.getApplicableProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Applicable product not found with ID: " + request.getApplicableProductId()));
            discount.setApplicableProduct(product);
        }

        if (request.getApplicableSubscriptionId() != null) {
            Subscription subscription = subscriptionRepository.findById(request.getApplicableSubscriptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Applicable subscription not found with ID: " + request.getApplicableSubscriptionId()));
            discount.setApplicableSubscription(subscription);
        }

        Discount saved = discountRepository.save(discount);
        return mapToResponse(saved);
    }

    @Transactional
    public DiscountResponse toggleDiscountStatus(Long id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount not found with ID: " + id));
        discount.setActive(!discount.isActive());
        Discount updated = discountRepository.save(discount);
        return mapToResponse(updated);
    }

    public BigDecimal evaluateAndCalculateDiscount(String code,
                                                  BigDecimal subtotal,
                                                  int totalQuantity,
                                                  Long productId,
                                                  Long subscriptionId,
                                                  LocalDate referenceDate) {
        if (code == null || code.trim().isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        Discount discount = discountRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BusinessRuleException("Discount code '" + code + "' is not recognized"));

        if (!discount.isActive()) {
            throw new BusinessRuleException("Discount code '" + code + "' is currently inactive");
        }

        if (discount.isExpired(referenceDate)) {
            throw new BusinessRuleException("Discount code '" + code + "' has expired or is not yet active");
        }

        if (discount.isExhausted()) {
            throw new BusinessRuleException("Discount code '" + code + "' has reached its maximum usage limit");
        }

        if (discount.getMinPurchaseAmount() != null && subtotal.compareTo(discount.getMinPurchaseAmount()) < 0) {
            throw new BusinessRuleException("Minimum purchase amount of $" + discount.getMinPurchaseAmount() + " required for discount " + code);
        }

        if (discount.getMinQuantity() != null && totalQuantity < discount.getMinQuantity()) {
            throw new BusinessRuleException("Minimum quantity of " + discount.getMinQuantity() + " items required for discount " + code);
        }

        if (discount.getApplicableProduct() != null && !discount.getApplicableProduct().getId().equals(productId)) {
            throw new BusinessRuleException("Discount code '" + code + "' is only applicable for product: " + discount.getApplicableProduct().getName());
        }

        if (discount.getApplicableSubscription() != null && !discount.getApplicableSubscription().getId().equals(subscriptionId)) {
            throw new BusinessRuleException("Discount code '" + code + "' is only applicable for subscription ID: " + discount.getApplicableSubscription().getId());
        }

        BigDecimal calculatedAmount;
        if (discount.getDiscountType() == DiscountType.PERCENTAGE) {
            calculatedAmount = subtotal.multiply(discount.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            calculatedAmount = discount.getDiscountValue().setScale(2, RoundingMode.HALF_UP);
        }

        // Discount cannot exceed subtotal
        if (calculatedAmount.compareTo(subtotal) > 0) {
            calculatedAmount = subtotal;
        }

        return calculatedAmount;
    }

    @Transactional
    public void recordDiscountUsage(String code, Long invoiceId, Customer customer, BigDecimal amountDeducted) {
        if (code == null || code.trim().isEmpty() || amountDeducted.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Discount discount = discountRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new BusinessRuleException("Discount code '" + code + "' not found"));

        if (discount.isExhausted()) {
            throw new BusinessRuleException("Discount code '" + code + "' has reached its maximum usage limit");
        }

        discount.setCurrentUsageCount(discount.getCurrentUsageCount() + 1);
        discountRepository.save(discount);

        DiscountUsage usage = new DiscountUsage(discount, invoiceId, customer, amountDeducted);
        discountUsageRepository.save(usage);
    }

    public DiscountResponse mapToResponse(Discount discount) {
        LocalDate today = LocalDate.now();
        DiscountResponse res = new DiscountResponse();
        res.setId(discount.getId());
        res.setCode(discount.getCode());
        res.setDescription(discount.getDescription());
        res.setDiscountType(discount.getDiscountType());
        res.setDiscountValue(discount.getDiscountValue());
        res.setMinPurchaseAmount(discount.getMinPurchaseAmount());
        res.setMinQuantity(discount.getMinQuantity());
        res.setStartDate(discount.getStartDate());
        res.setEndDate(discount.getEndDate());
        res.setMaxUsageCount(discount.getMaxUsageCount());
        res.setCurrentUsageCount(discount.getCurrentUsageCount());
        res.setActive(discount.isActive());
        res.setExpired(discount.isExpired(today));
        res.setExhausted(discount.isExhausted());
        res.setCreatedAt(discount.getCreatedAt());
        res.setUpdatedAt(discount.getUpdatedAt());

        if (discount.getApplicableProduct() != null) {
            res.setApplicableProductId(discount.getApplicableProduct().getId());
            res.setApplicableProductName(discount.getApplicableProduct().getName());
        }
        if (discount.getApplicableSubscription() != null) {
            res.setApplicableSubscriptionId(discount.getApplicableSubscription().getId());
            res.setApplicableSubscriptionNumber(discount.getApplicableSubscription().getSubscriptionNumber());
        }

        return res;
    }
}
