package com.subscription.subscription.service;

import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.product.entity.Product;
import com.subscription.product.entity.ProductVariant;
import com.subscription.product.repository.ProductRepository;
import com.subscription.product.repository.ProductVariantRepository;
import com.subscription.subscription.dto.QuotationDTO;
import com.subscription.subscription.dto.QuotationLineDTO;
import com.subscription.subscription.dto.QuotationTemplateDTO;
import com.subscription.subscription.entity.*;
import com.subscription.subscription.repository.QuotationLineRepository;
import com.subscription.subscription.repository.QuotationRepository;
import com.subscription.subscription.repository.QuotationTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final QuotationLineRepository quotationLineRepository;
    private final QuotationTemplateRepository templateRepository;
    private final PlanService planService;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    public QuotationService(QuotationRepository quotationRepository,
                            QuotationLineRepository quotationLineRepository,
                            QuotationTemplateRepository templateRepository,
                            PlanService planService,
                            ProductRepository productRepository,
                            ProductVariantRepository variantRepository) {
        this.quotationRepository = quotationRepository;
        this.quotationLineRepository = quotationLineRepository;
        this.templateRepository = templateRepository;
        this.planService = planService;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }

    @Transactional(readOnly = true)
    public List<QuotationDTO> searchQuotations(String search, QuotationStatus status, Long customerId) {
        List<Quotation> list = quotationRepository.searchQuotations(
                (search != null && !search.trim().isEmpty()) ? search.trim() : null,
                status,
                customerId
        );
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuotationDTO getQuotationById(Long id) {
        Quotation quotation = findEntityById(id);
        return toDTO(quotation);
    }

    @Transactional(readOnly = true)
    public Quotation findEntityById(Long id) {
        return quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation", id));
    }

    public QuotationDTO createQuotation(QuotationDTO dto) {
        validateQuotationInput(dto);

        Plan plan = planService.findEntityById(dto.getPlanId());
        // Validate plan availability: customers cannot select unavailable plans!
        LocalDate quoteDate = dto.getQuotationDate() != null ? dto.getQuotationDate() : LocalDate.now();
        planService.validatePlanAvailability(plan, quoteDate);

        Quotation quotation = new Quotation();
        quotation.setQuotationNumber(generateQuotationNumber());
        quotation.setCustomerId(dto.getCustomerId());
        quotation.setCustomerName(dto.getCustomerName().trim());
        quotation.setCustomerEmail(dto.getCustomerEmail().trim());
        quotation.setPlan(plan);
        quotation.setQuotationDate(quoteDate);
        quotation.setValidUntil(dto.getValidUntil() != null ? dto.getValidUntil() : quoteDate.plusDays(30));
        quotation.setPaymentTerms(dto.getPaymentTerms() != null ? dto.getPaymentTerms() : PaymentTerms.NET_30);
        quotation.setStatus(QuotationStatus.DRAFT);
        quotation.setNotes(dto.getNotes());

        buildLines(quotation, dto.getLines(), plan);

        Quotation saved = quotationRepository.save(quotation);
        return toDTO(saved);
    }

    public QuotationDTO updateQuotation(Long id, QuotationDTO dto) {
        Quotation quotation = findEntityById(id);

        if (quotation.getStatus() == QuotationStatus.ACCEPTED || quotation.getStatus() == QuotationStatus.CONVERTED) {
            throw new BusinessRuleException("Cannot modify quotation once accepted or converted to subscription.");
        }

        validateQuotationInput(dto);

        Plan plan = planService.findEntityById(dto.getPlanId());
        planService.validatePlanAvailability(plan, dto.getQuotationDate());

        quotation.setCustomerId(dto.getCustomerId());
        quotation.setCustomerName(dto.getCustomerName().trim());
        quotation.setCustomerEmail(dto.getCustomerEmail().trim());
        quotation.setPlan(plan);
        if (dto.getQuotationDate() != null) {
            quotation.setQuotationDate(dto.getQuotationDate());
        }
        if (dto.getValidUntil() != null) {
            quotation.setValidUntil(dto.getValidUntil());
        }
        if (dto.getPaymentTerms() != null) {
            quotation.setPaymentTerms(dto.getPaymentTerms());
        }
        if (dto.getStatus() != null) {
            quotation.setStatus(dto.getStatus());
        }
        quotation.setNotes(dto.getNotes());

        // Replace lines
        quotation.getLines().clear();
        buildLines(quotation, dto.getLines(), plan);

        Quotation updated = quotationRepository.save(quotation);
        return toDTO(updated);
    }

    public QuotationDTO updateStatus(Long id, QuotationStatus newStatus) {
        Quotation quotation = findEntityById(id);
        if (quotation.getStatus() == QuotationStatus.CONVERTED) {
            throw new BusinessRuleException("Quotation has already been converted to an active subscription.");
        }
        quotation.setStatus(newStatus);
        Quotation updated = quotationRepository.save(quotation);
        return toDTO(updated);
    }

    public void deleteQuotation(Long id) {
        Quotation quotation = findEntityById(id);
        if (quotation.getStatus() != QuotationStatus.DRAFT) {
            throw new BusinessRuleException("Only quotations in DRAFT status can be deleted.");
        }
        quotationRepository.delete(quotation);
    }

    // =========================================================================
    // Quotation Templates
    // =========================================================================

    @Transactional(readOnly = true)
    public List<QuotationTemplateDTO> getActiveTemplates() {
        return templateRepository.findByIsActiveTrue().stream()
                .map(this::toTemplateDTO)
                .collect(Collectors.toList());
    }

    public QuotationTemplateDTO createTemplate(QuotationTemplateDTO dto) {
        if (dto.getTemplateName() == null || dto.getTemplateName().trim().isEmpty()) {
            throw new BusinessRuleException("Template name is required.");
        }
        QuotationTemplate template = new QuotationTemplate();
        template.setTemplateName(dto.getTemplateName().trim());
        if (dto.getDefaultPlanId() != null) {
            Plan plan = planService.findEntityById(dto.getDefaultPlanId());
            template.setDefaultPlan(plan);
        }
        template.setDefaultPaymentTerms(dto.getDefaultPaymentTerms() != null ? dto.getDefaultPaymentTerms() : PaymentTerms.NET_30);
        template.setDefaultTaxRate(dto.getDefaultTaxRate() != null ? dto.getDefaultTaxRate() : new BigDecimal("10.00"));
        template.setDefaultNotes(dto.getDefaultNotes());
        template.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        QuotationTemplate saved = templateRepository.save(template);
        return toTemplateDTO(saved);
    }

    private void buildLines(Quotation quotation, List<QuotationLineDTO> lineDtos, Plan plan) {
        int totalQuantity = 0;
        for (QuotationLineDTO lineDto : lineDtos) {
            Product product = productRepository.findById(lineDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", lineDto.getProductId()));

            if (!Boolean.TRUE.equals(product.getIsAvailable())) {
                throw new BusinessRuleException(String.format("Product '%s' is not currently available for quoting.", product.getName()));
            }

            ProductVariant variant = null;
            BigDecimal effectiveUnitPrice = product.getSalesPrice();

            if (lineDto.getVariantId() != null) {
                variant = variantRepository.findById(lineDto.getVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", lineDto.getVariantId()));
                if (!variant.getProduct().getProductId().equals(product.getProductId())) {
                    throw new BusinessRuleException("Selected variant does not belong to product: " + product.getName());
                }
                if (!Boolean.TRUE.equals(variant.getIsAvailable())) {
                    throw new BusinessRuleException(String.format("Product variant '%s' is currently unavailable.", variant.getVariantName()));
                }
                // Configurable variant addition, e.g. +560.00 for brand
                effectiveUnitPrice = variant.calculateEffectivePrice();
            }

            int qty = lineDto.getQuantity() != null ? lineDto.getQuantity() : 1;
            if (qty < 1) {
                throw new BusinessRuleException("Quantity must be at least 1 for all items.");
            }
            totalQuantity += qty;

            QuotationLine line = new QuotationLine();
            line.setProduct(product);
            line.setVariant(variant);
            line.setQuantity(qty);
            line.setUnitPrice(lineDto.getUnitPrice() != null ? lineDto.getUnitPrice() : effectiveUnitPrice);
            line.setTaxRate(lineDto.getTaxRate() != null ? lineDto.getTaxRate() : BigDecimal.ZERO);
            line.calculateAmounts();

            quotation.addLine(line);
        }

        // Validate plan minimum quantity
        if (totalQuantity < plan.getMinimumQuantity()) {
            throw new BusinessRuleException(String.format(
                    "Selected plan '%s' requires a minimum quantity of %d (total specified: %d).",
                    plan.getPlanName(), plan.getMinimumQuantity(), totalQuantity));
        }

        quotation.recalculateTotals();
    }

    private void validateQuotationInput(QuotationDTO dto) {
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
            throw new BusinessRuleException("Quotation must contain at least one product line.");
        }
    }

    private synchronized String generateQuotationNumber() {
        return "QT-" + LocalDate.now().getYear() + "-" + String.format("%04d", System.currentTimeMillis() % 10000);
    }

    public QuotationDTO toDTO(Quotation entity) {
        if (entity == null) return null;
        QuotationDTO dto = new QuotationDTO();
        dto.setQuotationId(entity.getQuotationId());
        dto.setQuotationNumber(entity.getQuotationNumber());
        dto.setCustomerId(entity.getCustomerId());
        dto.setCustomerName(entity.getCustomerName());
        dto.setCustomerEmail(entity.getCustomerEmail());
        if (entity.getPlan() != null) {
            dto.setPlanId(entity.getPlan().getPlanId());
            dto.setPlanName(entity.getPlan().getPlanName());
        }
        dto.setQuotationDate(entity.getQuotationDate());
        dto.setValidUntil(entity.getValidUntil());
        dto.setPaymentTerms(entity.getPaymentTerms());
        dto.setSubtotal(entity.getSubtotal());
        dto.setTaxAmount(entity.getTaxAmount());
        dto.setTotalAmount(entity.getTotalAmount());
        dto.setStatus(entity.getStatus());
        dto.setNotes(entity.getNotes());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getLines() != null) {
            dto.setLines(entity.getLines().stream().map(this::toLineDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    public QuotationLineDTO toLineDTO(QuotationLine line) {
        if (line == null) return null;
        QuotationLineDTO dto = new QuotationLineDTO();
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

    public QuotationTemplateDTO toTemplateDTO(QuotationTemplate entity) {
        if (entity == null) return null;
        QuotationTemplateDTO dto = new QuotationTemplateDTO();
        dto.setTemplateId(entity.getTemplateId());
        dto.setTemplateName(entity.getTemplateName());
        if (entity.getDefaultPlan() != null) {
            dto.setDefaultPlanId(entity.getDefaultPlan().getPlanId());
            dto.setDefaultPlanName(entity.getDefaultPlan().getPlanName());
        }
        dto.setDefaultPaymentTerms(entity.getDefaultPaymentTerms());
        dto.setDefaultTaxRate(entity.getDefaultTaxRate());
        dto.setDefaultNotes(entity.getDefaultNotes());
        dto.setIsActive(entity.getIsActive());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
