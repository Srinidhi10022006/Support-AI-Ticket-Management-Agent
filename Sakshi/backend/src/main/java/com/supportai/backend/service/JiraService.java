package com.supportai.backend.service;

import com.supportai.backend.config.JiraProperties;
import com.supportai.backend.dto.JiraEscalationResponse;
import com.supportai.backend.entity.TicketEntity;
import com.supportai.backend.exception.ResourceNotFoundException;
import com.supportai.backend.repository.TicketRepository;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class JiraService {

    private static final Logger log = LoggerFactory.getLogger(JiraService.class);

    private final TicketRepository ticketRepository;
    private final JiraProperties jiraProperties;
    private final RestTemplate restTemplate;

    @Transactional
    public JiraEscalationResponse escalateTicket(Integer ticketId) {
        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        Map<String, Object> payload = buildJiraPayload(ticket);
        Map<String, Object> jiraResponse = createJiraIssue(payload);

        String jiraIssueKey = String.valueOf(jiraResponse.get("key"));
        String jiraUrl = String.valueOf(jiraResponse.getOrDefault("self", ""));

       ticket.setJiraIssueKey(jiraIssueKey);
ticket.setJiraIssueUrl(jiraUrl);
ticket.setEscalatedAt(LocalDateTime.now());
ticket.setStatus("In Progress");   // ✅ Allowed by your database
ticketRepository.save(ticket);

        return JiraEscalationResponse.builder()
                .message("Ticket escalated successfully")
                .jiraIssueKey(jiraIssueKey)
                .jiraUrl(jiraUrl)
                .build();
    }

    private Map<String, Object> buildJiraPayload(TicketEntity ticket) {
        String issueType = ticket.getIssueType() == null || ticket.getIssueType().isBlank()
                ? "Task"
                : ticket.getIssueType();
        String priority = ticket.getPriority() == null || ticket.getPriority().isBlank()
                ? "Medium"
                : ticket.getPriority();

        String summary = ticket.getSubject() == null ? "Support Ticket Escalation" : ticket.getSubject();
        String employeeName = ticket.getEmployeeName() == null || ticket.getEmployeeName().isBlank()
                ? "Unknown"
                : ticket.getEmployeeName();

        String description = "Issue Type: " + issueType + "\n"
                + "Priority: " + priority + "\n"
                + "Employee Name: " + employeeName + "\n"
                + "\nOriginal Description:\n" + ticket.getDescription();

        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("summary", summary);
        Map<String, Object> adfDescription = Map.of(
    "type", "doc",
    "version", 1,
    "content", java.util.List.of(
        Map.of(
            "type", "paragraph",
            "content", java.util.List.of(
                Map.of(
                    "type", "text",
                    "text", description
                )
            )
        )
    )
);

fields.put("description", adfDescription);
        fields.put("project", Map.of("key", jiraProperties.getProjectKey()));
        fields.put("issuetype", Map.of("name", "Task"));
        fields.put("priority", Map.of("name", mapPriority(priority)));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fields", fields);
        return payload;
    }

    private Map<String, Object> createJiraIssue(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + Base64.getEncoder().encodeToString(
                (jiraProperties.getEmail() + ":" + jiraProperties.getApiToken()).getBytes(StandardCharsets.UTF_8)));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
       
        String url = jiraProperties.getUrl().replaceAll("/+$", "") + "/rest/api/3/issue";

        try {
            System.out.println("jiraProperties.getUrl() = " + jiraProperties.getUrl());
            System.out.println("jiraProperties.getEmail() = " + jiraProperties.getEmail());
            System.out.println("jiraProperties.getProjectKey() = " + jiraProperties.getProjectKey());
            System.out.println("Payload = " + payload);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Jira API returned an unexpected response");
            }
            return response.getBody();
        } catch (RestClientException ex) {
            log.error("Jira issue creation failed", ex);
            throw new IllegalStateException("Jira escalation failed: " + ex.getMessage(), ex);
        }
    }

    private String mapPriority(String priority) {
        return switch (priority.toLowerCase()) {
            case "critical" -> "High";
            case "high" -> "High";
            case "medium" -> "Medium";
            case "low" -> "Low";
            default -> "Medium";
        };
    }
}
