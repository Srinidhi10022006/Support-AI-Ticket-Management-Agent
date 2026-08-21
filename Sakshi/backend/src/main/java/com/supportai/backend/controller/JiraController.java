package com.supportai.backend.controller;

import com.supportai.backend.dto.JiraEscalationResponse;
import com.supportai.backend.service.JiraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jira")
@RequiredArgsConstructor
public class JiraController {

    private final JiraService jiraService;

    @PostMapping("/escalate/{ticketId}")
    public ResponseEntity<JiraEscalationResponse> escalateTicket(@PathVariable Integer ticketId) {
        return ResponseEntity.ok(jiraService.escalateTicket(ticketId));
    }
}
