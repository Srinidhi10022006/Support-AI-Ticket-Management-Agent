package com.supportai.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

@Configuration
@PropertySource(value = "file:../api.env", ignoreResourceNotFound = true, factory = DotenvPropertySourceFactory.class)
public class DotenvConfig {
}
