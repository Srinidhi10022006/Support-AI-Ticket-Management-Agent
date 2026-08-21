package com.supportai.backend.service;

import com.supportai.backend.dto.ActivityLogCreateRequest;
import com.supportai.backend.dto.ActivityLogDto;
import com.supportai.backend.entity.ActivityLogEntity;
import com.supportai.backend.entity.TicketEntity;
import com.supportai.backend.entity.UserEntity;
import com.supportai.backend.exception.ResourceNotFoundException;
import com.supportai.backend.repository.ActivityLogRepository;
import com.supportai.backend.repository.TicketRepository;
import com.supportai.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public ActivityLogDto createActivityLog(ActivityLogCreateRequest request) {
        TicketEntity ticket = findTicket(request.ticketId());
        UserEntity performedBy = findUser(request.performedBy());

        ActivityLogEntity log = new ActivityLogEntity();
        log.setTicket(ticket);
        log.setAction(request.action());
        log.setPerformedBy(performedBy);
        log.setRemarks(request.remarks());
        log.setActionTime(LocalDateTime.now());

        return toDto(activityLogRepository.save(log));
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDto> getActivityLogsByTicketId(Integer ticketId) {
        findTicket(ticketId);
        return activityLogRepository.findByTicketTicketIdOrderByActionTimeDesc(ticketId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityLogDto> getAllActivityLogs() {
        return activityLogRepository.findAllByOrderByActionTimeDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public ActivityLogEntity createSystemLog(TicketEntity ticket, UserEntity performedBy, String action, String remarks, String oldStatus, String newStatus) {
        ActivityLogEntity log = new ActivityLogEntity();
        log.setTicket(ticket);
        log.setPerformedBy(performedBy);
        log.setAction(action);
        log.setRemarks(remarks);
        log.setOldStatus(oldStatus);
        log.setNewStatus(newStatus);
        log.setActionTime(LocalDateTime.now());
        return activityLogRepository.save(log);
    }

    private TicketEntity findTicket(Integer ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
    }

    private UserEntity findUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private ActivityLogDto toDto(ActivityLogEntity activityLog) {
        return ActivityLogDto.builder()
                .logId(activityLog.getLogId())
                .ticketId(activityLog.getTicket().getTicketId())
                .action(activityLog.getAction())
                .performedBy(activityLog.getPerformedBy().getUserId())
                .performedByName(activityLog.getPerformedBy().getFullName())
                .remarks(activityLog.getRemarks())
                .actionTime(activityLog.getActionTime())
                .build();
    }
}
