package com.subscription.dashboard;

import com.subscription.common.exception.UnauthorizedAccessException;
import com.subscription.dashboard.service.CustomerPortalService;
import com.subscription.entity.Role;
import com.subscription.entity.User;
import com.subscription.repository.InvoiceRepository;
import com.subscription.repository.PaymentRepository;
import com.subscription.repository.SubscriptionRepository;
import com.subscription.repository.UserRepository;
import com.subscription.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerPortalSecurityTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    private CustomerPortalService customerPortalService;

    @BeforeEach
    void setUp() {
        customerPortalService = new CustomerPortalService(userRepository, subscriptionRepository, invoiceRepository, paymentRepository);
    }

    @Test
    void customerAttemptingToAccessAnotherCustomer_isRejectedWithUnauthorizedAccessException() {
        // Customer 10 logged in
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "John Doe", "john@example.com", "pass", Role.CUSTOMER);

        // Attempting to query customer 99
        assertThrows(UnauthorizedAccessException.class, () -> {
            customerPortalService.resolveAndVerifyCustomerId(customerPrincipal, 99L);
        });
    }

    @Test
    void customerAccessingOwnData_isAllowed() {
        UserPrincipal customerPrincipal = new UserPrincipal(10L, "John Doe", "john@example.com", "pass", Role.CUSTOMER);

        Long resolvedId = customerPortalService.resolveAndVerifyCustomerId(customerPrincipal, 10L);
        assertEquals(10L, resolvedId);

        // If customer passes null ID, backend safely defaults to their own authenticated ID
        Long defaultId = customerPortalService.resolveAndVerifyCustomerId(customerPrincipal, null);
        assertEquals(10L, defaultId);
    }

    @Test
    void adminCanAccessCustomerDataForSupport() {
        UserPrincipal adminPrincipal = new UserPrincipal(1L, "Admin User", "admin@subscription.com", "pass", Role.ADMIN);

        Long resolvedId = customerPortalService.resolveAndVerifyCustomerId(adminPrincipal, 99L);
        assertEquals(99L, resolvedId);
    }
}
