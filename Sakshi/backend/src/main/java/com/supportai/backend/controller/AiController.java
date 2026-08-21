package com.supportai.backend.controller;

import com.supportai.backend.dto.AiAnalyzeRequest;
import com.supportai.backend.dto.AiAnalyzeResponse;
import com.supportai.backend.service.GeminiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final GeminiService geminiService;

    @PostMapping("/analyze")
    public ResponseEntity<AiAnalyzeResponse> analyze(@Valid @RequestBody AiAnalyzeRequest request) {
        AiAnalyzeResponse response = geminiService.analyze(request);
        return ResponseEntity.ok(response);
    }
}

