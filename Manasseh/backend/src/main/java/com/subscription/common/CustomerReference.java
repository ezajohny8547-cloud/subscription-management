package com.subscription.common;

/**
 * Shared Customer reference model agreed with Module 1 (Auth & Customer Management).
 * Enables Module 2 to reference customers without duplicating customer account or auth logic.
 */
public class CustomerReference {

    private Long customerId;
    private String customerCode;
    private String companyName;
    private String contactName;
    private String email;
    private String phone;
    private String billingAddress;

    public CustomerReference() {
    }

    public CustomerReference(Long customerId, String customerCode, String companyName, String contactName, String email, String phone, String billingAddress) {
        this.customerId = customerId;
        this.customerCode = customerCode;
        this.companyName = companyName;
        this.contactName = contactName;
        this.email = email;
        this.phone = phone;
        this.billingAddress = billingAddress;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerCode() {
        return customerCode;
    }

    public void setCustomerCode(String customerCode) {
        this.customerCode = customerCode;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(String billingAddress) {
        this.billingAddress = billingAddress;
    }
}
