package com.expense.claim.util;

import com.expense.claim.dto.ClaimResponseDTO;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

public class CsvExportUtil {

    private static final String[] HEADERS = {
            "Claim ID",
            "Title",
            "Amount",
            "Category",
            "Expense Date",
            "Status",
            "Employee Name",
            "Employee Email",
            "Reviewed By",
            "Reviewed At",
            "Created At",
            "Description",
            "Rejection Comment"
    };

    public static ByteArrayInputStream claimsToCsv(List<ClaimResponseDTO> claims) {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader(HEADERS)
                .build();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             CSVPrinter csvPrinter = new CSVPrinter(new PrintWriter(out, true, StandardCharsets.UTF_8), format)) {

            for (ClaimResponseDTO claim : claims) {
                List<String> data = Arrays.asList(
                        String.valueOf(claim.getId()),
                        claim.getTitle(),
                        claim.getAmount() != null ? claim.getAmount().toString() : "0.00",
                        claim.getCategory() != null ? claim.getCategory().name() : "",
                        claim.getExpenseDate() != null ? claim.getExpenseDate().toString() : "",
                        claim.getStatus() != null ? claim.getStatus().name() : "",
                        claim.getEmployee() != null ? claim.getEmployee().getName() : "",
                        claim.getEmployee() != null ? claim.getEmployee().getEmail() : "",
                        claim.getReviewedBy() != null ? claim.getReviewedBy().getName() : "",
                        claim.getReviewedAt() != null ? claim.getReviewedAt().toString() : "",
                        claim.getCreatedAt() != null ? claim.getCreatedAt().toString() : "",
                        claim.getDescription() != null ? claim.getDescription() : "",
                        claim.getRejectionComment() != null ? claim.getRejectionComment() : ""
                );
                csvPrinter.printRecord(data);
            }

            csvPrinter.flush();
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export claims data to CSV: " + e.getMessage(), e);
        }
    }
}
