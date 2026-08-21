package com.supportai.backend.service;

import com.supportai.backend.dto.TicketCreateRequest;
import com.supportai.backend.dto.TicketDto;
import com.supportai.backend.dto.TicketStatusUpdateRequest;
import com.supportai.backend.entity.TicketEntity;
import com.supportai.backend.entity.UserEntity;
import com.supportai.backend.exception.ResourceNotFoundException;
import com.supportai.backend.repository.TicketRepository;
import com.supportai.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public TicketDto createTicket(TicketCreateRequest request) {
        UserEntity user = findUser(request.userId());

        TicketEntity ticket = new TicketEntity();
        ticket.setUser(user);
        ticket.setSubject(request.subject());
        ticket.setIssueType(request.issueType());
        ticket.setDescription(request.description());
        ticket.setPriority(request.priority());
        ticket.setStatus("Open");
        ticket.setEmployeeName(request.employeeName());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setDepartment(normalizeDepartment(request.department()));

        TicketEntity savedTicket = ticketRepository.save(ticket);
        activityLogService.createSystemLog(savedTicket, user, "Ticket Created", "Ticket created from user dashboard", null, "Open");

        return toDto(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getTicketsForUser(Integer userId) {
        findUser(userId);
        return ticketRepository.findByUserUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketDto> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public TicketDto updateTicketStatus(Integer ticketId, TicketStatusUpdateRequest request) {
        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        UserEntity performedBy = findUser(request.performedBy());

        String oldStatus = ticket.getStatus();
        ticket.setStatus(request.status());
        TicketEntity updatedTicket = ticketRepository.save(ticket);
        activityLogService.createSystemLog(
                updatedTicket,
                performedBy,
                "Ticket Status Updated",
                request.remarks() == null || request.remarks().isBlank()
                        ? "Status changed to " + request.status()
                        : request.remarks(),
                oldStatus,
                request.status()
        );

        return toDto(updatedTicket);
    }

    private UserEntity findUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private String normalizeDepartment(String department) {
        if (department == null || department.trim().isEmpty()) {
            return null;
        }
        return department.trim();
    }

    private TicketDto toDto(TicketEntity ticket) {
        UserEntity user = ticket.getUser();
        return TicketDto.builder()
                .ticketId(ticket.getTicketId())
                .userId(user.getUserId())
                .employeeId(user.getEmployeeId())
                .userName(user.getFullName())
                .userEmail(user.getEmail())
                .department(ticket.getDepartment())
                .subject(ticket.getSubject())
                .issueType(ticket.getIssueType())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .employeeName(ticket.getEmployeeName())
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}
