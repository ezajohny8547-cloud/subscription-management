package com.subscription.dashboard.dto;

import java.util.List;

public class DashboardChartsDTO {

    private List<RevenuePointDTO> revenueOverTime;
    private List<DistributionDTO> subscriptionStatusDistribution;
    private List<DistributionDTO> invoiceStatusDistribution;
    private List<DistributionDTO> planDistribution;
    private List<DistributionDTO> paymentMethodDistribution;

    public DashboardChartsDTO() {
    }

    public DashboardChartsDTO(List<RevenuePointDTO> revenueOverTime,
                              List<DistributionDTO> subscriptionStatusDistribution,
                              List<DistributionDTO> invoiceStatusDistribution,
                              List<DistributionDTO> planDistribution,
                              List<DistributionDTO> paymentMethodDistribution) {
        this.revenueOverTime = revenueOverTime;
        this.subscriptionStatusDistribution = subscriptionStatusDistribution;
        this.invoiceStatusDistribution = invoiceStatusDistribution;
        this.planDistribution = planDistribution;
        this.paymentMethodDistribution = paymentMethodDistribution;
    }

    public List<RevenuePointDTO> getRevenueOverTime() {
        return revenueOverTime;
    }

    public void setRevenueOverTime(List<RevenuePointDTO> revenueOverTime) {
        this.revenueOverTime = revenueOverTime;
    }

    public List<DistributionDTO> getSubscriptionStatusDistribution() {
        return subscriptionStatusDistribution;
    }

    public void setSubscriptionStatusDistribution(List<DistributionDTO> subscriptionStatusDistribution) {
        this.subscriptionStatusDistribution = subscriptionStatusDistribution;
    }

    public List<DistributionDTO> getInvoiceStatusDistribution() {
        return invoiceStatusDistribution;
    }

    public void setInvoiceStatusDistribution(List<DistributionDTO> invoiceStatusDistribution) {
        this.invoiceStatusDistribution = invoiceStatusDistribution;
    }

    public List<DistributionDTO> getPlanDistribution() {
        return planDistribution;
    }

    public void setPlanDistribution(List<DistributionDTO> planDistribution) {
        this.planDistribution = planDistribution;
    }

    public List<DistributionDTO> getPaymentMethodDistribution() {
        return paymentMethodDistribution;
    }

    public void setPaymentMethodDistribution(List<DistributionDTO> paymentMethodDistribution) {
        this.paymentMethodDistribution = paymentMethodDistribution;
    }
}
