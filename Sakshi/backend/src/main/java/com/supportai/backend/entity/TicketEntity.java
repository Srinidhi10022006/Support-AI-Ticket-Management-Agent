package com.supportai.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tickets")
public class TicketEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Integer ticketId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "issue_type", nullable = false, length = 100)
    private String issueType;

    @Column(name = "description", nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "priority", length = 10)
    private String priority;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "ai_suggestion", columnDefinition = "text")
    private String aiSuggestion;

    @Column(name = "employee_name", length = 100)
    private String employeeName;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "jira_issue_key", length = 100)
    private String jiraIssueKey;

    @Column(name = "jira_issue_url", columnDefinition = "text")
    private String jiraIssueUrl;

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @Column(name = "admin_response", columnDefinition = "text")
    private String adminResponse;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<TicketResponseEntity> responses = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ActivityLogEntity> activityLogs = new ArrayList<>();
}

