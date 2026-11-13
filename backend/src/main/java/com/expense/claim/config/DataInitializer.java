package com.expense.claim.config;

import com.expense.claim.entity.*;
import com.expense.claim.repository.ClaimAuditLogRepository;
import com.expense.claim.repository.ClaimRepository;
import com.expense.claim.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final ClaimAuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.manager.email:manager@company.com}")
    private String managerEmail;

    @Value("${app.seed.manager.password:Manager@123}")
    private String managerPassword;

    @Value("${app.seed.manager.name:Corporate Manager}")
    private String managerName;

    public DataInitializer(
            UserRepository userRepository,
            ClaimRepository claimRepository,
            ClaimAuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.claimRepository = claimRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Requirement 4: Seed one Manager account at startup
        User manager;
        if (!userRepository.existsByEmail(managerEmail.trim().toLowerCase())) {
            manager = new User();
            manager.setName(managerName);
            manager.setEmail(managerEmail.trim().toLowerCase());
            manager.setPassword(passwordEncoder.encode(managerPassword));
            manager.setRole(Role.ROLE_MANAGER);
            manager.setActive(true);
            manager = userRepository.save(manager);
            logger.info(">>> Seeded default Manager account: {} (Password: {})", managerEmail, managerPassword);
        } else {
            manager = userRepository.findByEmail(managerEmail.trim().toLowerCase()).get();
        }

        // Seed demo employee accounts and sample claims for out-of-the-box experience
        if (!userRepository.existsByEmail("john.doe@company.com")) {
            User emp1 = new User();
            emp1.setName("John Doe");
            emp1.setEmail("john.doe@company.com");
            emp1.setPassword(passwordEncoder.encode("Employee@123"));
            emp1.setRole(Role.ROLE_EMPLOYEE);
            emp1.setActive(true);
            emp1 = userRepository.save(emp1);

            User emp2 = new User();
            emp2.setName("Jane Smith");
            emp2.setEmail("jane.smith@company.com");
            emp2.setPassword(passwordEncoder.encode("Employee@123"));
            emp2.setRole(Role.ROLE_EMPLOYEE);
            emp2.setActive(true);
            emp2 = userRepository.save(emp2);

            logger.info(">>> Seeded demo Employee accounts: john.doe@company.com, jane.smith@company.com (Password: Employee@123)");

            // Demo Claim 1: Pending
            Claim claim1 = new Claim();
            claim1.setTitle("Flight ticket to Chicago Tech Summit");
            claim1.setAmount(new BigDecimal("450.00"));
            claim1.setCategory(ClaimCategory.TRAVEL);
            claim1.setExpenseDate(LocalDate.now().minusDays(3));
            claim1.setDescription("Round-trip flight booking to attend the annual technical summit.");
            claim1.setStatus(ClaimStatus.PENDING);
            claim1.setEmployee(emp1);
            claim1 = claimRepository.save(claim1);
            auditLogRepository.save(new ClaimAuditLog(
                    claim1.getId(), claim1.getTitle(), AuditAction.CREATED, emp1.getEmail(), emp1.getRole().name(), "Claim created with amount $450.00"
            ));

            // Demo Claim 2: Approved
            Claim claim2 = new Claim();
            claim2.setTitle("Team Lunch with Client Executives");
            claim2.setAmount(new BigDecimal("125.50"));
            claim2.setCategory(ClaimCategory.MEALS);
            claim2.setExpenseDate(LocalDate.now().minusDays(5));
            claim2.setDescription("Dinner & discussion meeting regarding quarterly expansion.");
            claim2.setStatus(ClaimStatus.APPROVED);
            claim2.setEmployee(emp1);
            claim2.setReviewedBy(manager);
            claim2.setReviewedAt(LocalDateTime.now().minusDays(4));
            claim2 = claimRepository.save(claim2);
            auditLogRepository.save(new ClaimAuditLog(
                    claim2.getId(), claim2.getTitle(), AuditAction.CREATED, emp1.getEmail(), emp1.getRole().name(), "Claim created with amount $125.50"
            ));
            auditLogRepository.save(new ClaimAuditLog(
                    claim2.getId(), claim2.getTitle(), AuditAction.APPROVED, manager.getEmail(), manager.getRole().name(), "Approved by Manager"
            ));

            // Demo Claim 3: Rejected
            Claim claim3 = new Claim();
            claim3.setTitle("Wireless Ergonomic Noise-Canceling Headphones");
            claim3.setAmount(new BigDecimal("299.99"));
            claim3.setCategory(ClaimCategory.EQUIPMENT);
            claim3.setExpenseDate(LocalDate.now().minusDays(8));
            claim3.setDescription("Personal audio headset for remote office setup.");
            claim3.setStatus(ClaimStatus.REJECTED);
            claim3.setRejectionComment("Per company policy, personal audio equipment exceeding $100 requires prior department director approval.");
            claim3.setEmployee(emp2);
            claim3.setReviewedBy(manager);
            claim3.setReviewedAt(LocalDateTime.now().minusDays(6));
            claim3 = claimRepository.save(claim3);
            auditLogRepository.save(new ClaimAuditLog(
                    claim3.getId(), claim3.getTitle(), AuditAction.CREATED, emp2.getEmail(), emp2.getRole().name(), "Claim created with amount $299.99"
            ));
            auditLogRepository.save(new ClaimAuditLog(
                    claim3.getId(), claim3.getTitle(), AuditAction.REJECTED, manager.getEmail(), manager.getRole().name(), "Rejected: " + claim3.getRejectionComment()
            ));

            // Demo Claim 4: Pending for emp2
            Claim claim4 = new Claim();
            claim4.setTitle("AWS Certified Solutions Architect Exam Fee");
            claim4.setAmount(new BigDecimal("150.00"));
            claim4.setCategory(ClaimCategory.TRAINING);
            claim4.setExpenseDate(LocalDate.now().minusDays(1));
            claim4.setDescription("Professional certification exam registration fee.");
            claim4.setStatus(ClaimStatus.PENDING);
            claim4.setEmployee(emp2);
            claim4 = claimRepository.save(claim4);
            auditLogRepository.save(new ClaimAuditLog(
                    claim4.getId(), claim4.getTitle(), AuditAction.CREATED, emp2.getEmail(), emp2.getRole().name(), "Claim created with amount $150.00"
            ));

            logger.info(">>> Seeded demo claims and audit trails successfully.");
        }
    }
}
