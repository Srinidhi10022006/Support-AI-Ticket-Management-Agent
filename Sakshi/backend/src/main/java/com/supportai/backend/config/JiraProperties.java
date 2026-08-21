package com.supportai.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jira")
@Getter
@Setter
public class JiraProperties {

    private String url;
    private String email;
    private String apiToken;
    private String projectKey;
}
