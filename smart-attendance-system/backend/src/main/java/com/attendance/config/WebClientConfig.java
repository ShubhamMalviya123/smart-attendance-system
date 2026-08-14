package com.attendance.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${ai-service.base-url}")
    private String aiServiceBaseUrl;

    @Bean
    public WebClient aiServiceWebClient() {
        return WebClient.builder()
                .baseUrl(aiServiceBaseUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(300 * 1024 * 1024)) // 300MB - allows multiple video files in one multipart request
                .build();
    }
}
