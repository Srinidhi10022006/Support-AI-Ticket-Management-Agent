package com.supportai.backend.controller;

import com.supportai.backend.dto.ActivityLogCreateRequest;
import com.supportai.backend.dto.ActivityLogDto;
import com.supportai.backend.service.ActivityLogService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @PostMapping
    public ResponseEntity<ActivityLogDto> createActivityLog(@Valid @RequestBody ActivityLogCreateRequest request) {
        return ResponseEntity.ok(activityLogService.createActivityLog(request));
    }

    @GetMapping
    public ResponseEntity<List<ActivityLogDto>> getAllActivityLogs() {
        return ResponseEntity.ok(activityLogService.getAllActivityLogs());
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<List<ActivityLogDto>> getActivityLogs(@PathVariable Integer ticketId) {
        return ResponseEntity.ok(activityLogService.getActivityLogsByTicketId(ticketId));
    }
}
