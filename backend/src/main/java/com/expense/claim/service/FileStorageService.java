package com.expense.claim.service;

import com.expense.claim.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp",
            "application/pdf"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    public FileStorageService(@Value("${app.upload.dir:./uploads/receipts}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the directory for uploaded files.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Validation: Empty check
        if (file.isEmpty()) {
            throw new BusinessException("Cannot upload an empty file");
        }

        // Validation: File size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("File size exceeds 5MB limit");
        }

        // Validation: Content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("Invalid file type. Only JPEG, PNG, WEBP images and PDF files are allowed");
        }

        String originalFileName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "receipt"
        );

        // Security check against directory traversal
        if (originalFileName.contains("..")) {
            throw new BusinessException("Filename contains invalid path sequence: " + originalFileName);
        }

        String fileExtension = "";
        int extIndex = originalFileName.lastIndexOf(".");
        if (extIndex > 0) {
            fileExtension = originalFileName.substring(extIndex);
        }

        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return uniqueFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + uniqueFileName + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BusinessException("File not found: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new BusinessException("File not found: " + fileName);
        }
    }

    public void deleteFile(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) return;
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
        }
    }
}
