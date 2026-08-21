package com.supportai.backend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JiraEscalationResponse {

    private String message;
    private String jiraIssueKey;
    private String jiraUrl;
}
