package com.expense.claim.service;

import com.expense.claim.dto.PageResponse;
import com.expense.claim.dto.UserDTO;
import com.expense.claim.entity.User;
import com.expense.claim.exception.BusinessException;
import com.expense.claim.exception.ResourceNotFoundException;
import com.expense.claim.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDTO> getUsers(String search, Pageable pageable) {
        Page<User> page;
        if (search != null && !search.trim().isEmpty()) {
            String query = search.trim();
            page = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable);
        } else {
            page = userRepository.findAll(pageable);
        }
        return PageResponse.from(page.map(UserDTO::fromEntity));
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return UserDTO.fromEntity(user);
    }

    @Transactional
    public UserDTO toggleUserStatus(Long userId, boolean active, User currentManager) {
        if (currentManager.getId().equals(userId) && !active) {
            throw new BusinessException("You cannot deactivate your own manager account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setActive(active);
        User updated = userRepository.save(user);
        return UserDTO.fromEntity(updated);
    }
}
