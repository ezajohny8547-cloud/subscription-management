package com.subscription.subscription.service;

import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.product.entity.Product;
import com.subscription.product.repository.ProductRepository;
import com.subscription.product.service.ProductService;
import com.subscription.subscription.dto.PlanDTO;
import com.subscription.subscription.entity.BillingInterval;
import com.subscription.subscription.entity.Plan;
import com.subscription.subscription.entity.PlanStatus;
import com.subscription.subscription.repository.PlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlanService {

    private final PlanRepository planRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public PlanService(PlanRepository planRepository,
                       ProductRepository productRepository,
                       ProductService productService) {
        this.planRepository = planRepository;
        this.productRepository = productRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public List<PlanDTO> searchPlans(String query, BillingInterval interval, PlanStatus status) {
        List<Plan> plans = planRepository.searchPlans(
                (query != null && !query.trim().isEmpty()) ? query.trim() : null,
                interval,
                status
        );
        return plans.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlanDTO> getActiveAvailablePlans() {
        return planRepository.findActiveAndAvailablePlans(LocalDate.now())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlanDTO getPlanById(Long id) {
        Plan plan = findEntityById(id);
        return toDTO(plan);
    }

    @Transactional(readOnly = true)
    public Plan findEntityById(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", id));
    }

    public PlanDTO createPlan(PlanDTO dto) {
        validatePlan(dto, null);

        Plan plan = new Plan();
        mapDtoToEntity(dto, plan);

        Plan saved = planRepository.save(plan);
        return toDTO(saved);
    }

    public PlanDTO updatePlan(Long id, PlanDTO dto) {
        validatePlan(dto, id);
        Plan plan = findEntityById(id);
        mapDtoToEntity(dto, plan);

        Plan updated = planRepository.save(plan);
        return toDTO(updated);
    }

    public PlanDTO updateStatus(Long id, PlanStatus status) {
        Plan plan = findEntityById(id);
        plan.setStatus(status);
        Plan updated = planRepository.save(plan);
        return toDTO(updated);
    }

    public void deletePlan(Long id) {
        Plan plan = findEntityById(id);
        planRepository.delete(plan);
    }

    /**
     * Validates that the plan is active and valid for the given date.
     * Throws BusinessRuleException if plan is unavailable.
     */
    public void validatePlanAvailability(Plan plan, LocalDate targetDate) {
        if (plan == null) {
            throw new BusinessRuleException("Plan reference cannot be null.");
        }
        if (plan.getStatus() != PlanStatus.ACTIVE) {
            throw new BusinessRuleException(String.format("Plan '%s' is not active (current status: %s). Customers cannot select inactive plans.",
                    plan.getPlanName(), plan.getStatus()));
        }
        LocalDate date = (targetDate != null) ? targetDate : LocalDate.now();
        if (date.isBefore(plan.getAvailabilityStartDate())) {
            throw new BusinessRuleException(String.format("Plan '%s' is not yet available. Availability starts on %s.",
                    plan.getPlanName(), plan.getAvailabilityStartDate()));
        }
        if (date.isAfter(plan.getAvailabilityEndDate())) {
            throw new BusinessRuleException(String.format("Plan '%s' has expired. Availability ended on %s.",
                    plan.getPlanName(), plan.getAvailabilityEndDate()));
        }
    }

    private void validatePlan(PlanDTO dto, Long currentPlanId) {
        if (dto.getPlanName() == null || dto.getPlanName().trim().isEmpty()) {
            throw new BusinessRuleException("Plan name is required.");
        }
        if (dto.getPlanCode() == null || dto.getPlanCode().trim().isEmpty()) {
            throw new BusinessRuleException("Plan code is required.");
        }
        if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Plan recurring price must be strictly greater than zero.");
        }
        if (dto.getBillingInterval() == null) {
            throw new BusinessRuleException("Billing interval is required (DAILY, WEEKLY, MONTHLY, YEARLY).");
        }
        if (dto.getMinimumQuantity() == null || dto.getMinimumQuantity() < 1) {
            throw new BusinessRuleException("Minimum quantity must be at least 1.");
        }
        if (dto.getAvailabilityStartDate() == null || dto.getAvailabilityEndDate() == null) {
            throw new BusinessRuleException("Both availability start date and end date are required.");
        }
        if (dto.getAvailabilityEndDate().isBefore(dto.getAvailabilityStartDate())) {
            throw new BusinessRuleException("Availability end date cannot precede availability start date.");
        }

        // Validate unique planCode
        boolean exists = (currentPlanId == null)
                ? planRepository.existsByPlanCode(dto.getPlanCode().trim())
                : planRepository.existsByPlanCodeAndPlanIdNot(dto.getPlanCode().trim(), currentPlanId);
        if (exists) {
            throw new BusinessRuleException("Plan code '" + dto.getPlanCode() + "' is already in use.");
        }
    }

    private void mapDtoToEntity(PlanDTO dto, Plan plan) {
        plan.setPlanName(dto.getPlanName().trim());
        plan.setPlanCode(dto.getPlanCode().trim().toUpperCase());
        plan.setDescription(dto.getDescription());
        plan.setPrice(dto.getPrice());
        plan.setBillingInterval(dto.getBillingInterval());
        plan.setMinimumQuantity(dto.getMinimumQuantity() != null ? dto.getMinimumQuantity() : 1);
        plan.setAvailabilityStartDate(dto.getAvailabilityStartDate());
        plan.setAvailabilityEndDate(dto.getAvailabilityEndDate());
        plan.setAutoClose(dto.getAutoClose() != null ? dto.getAutoClose() : false);
        plan.setAutoCloseAfterCycles(dto.getAutoCloseAfterCycles());
        if (dto.getStatus() != null) {
            plan.setStatus(dto.getStatus());
        }

        if (dto.getProductIds() != null) {
            Set<Product> products = new HashSet<>(productRepository.findAllById(dto.getProductIds()));
            plan.setAssociatedProducts(products);
        }
    }

    public PlanDTO toDTO(Plan entity) {
        if (entity == null) return null;
        PlanDTO dto = new PlanDTO();
        dto.setPlanId(entity.getPlanId());
        dto.setPlanName(entity.getPlanName());
        dto.setPlanCode(entity.getPlanCode());
        dto.setDescription(entity.getDescription());
        dto.setPrice(entity.getPrice());
        dto.setBillingInterval(entity.getBillingInterval());
        dto.setMinimumQuantity(entity.getMinimumQuantity());
        dto.setAvailabilityStartDate(entity.getAvailabilityStartDate());
        dto.setAvailabilityEndDate(entity.getAvailabilityEndDate());
        dto.setAutoClose(entity.getAutoClose());
        dto.setAutoCloseAfterCycles(entity.getAutoCloseAfterCycles());
        dto.setStatus(entity.getStatus());
        dto.setIsCurrentlyAvailable(entity.isAvailableOn(LocalDate.now()));
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getAssociatedProducts() != null) {
            Set<Long> ids = entity.getAssociatedProducts().stream()
                    .map(Product::getProductId)
                    .collect(Collectors.toSet());
            dto.setProductIds(ids);
            dto.setAssociatedProducts(entity.getAssociatedProducts().stream()
                    .map(productService::toDTO)
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
