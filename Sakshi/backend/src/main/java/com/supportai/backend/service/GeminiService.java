package com.supportai.backend.service;

import com.supportai.backend.dto.AiAnalyzeRequest;
import com.supportai.backend.dto.AiAnalyzeResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String AI_UNAVAILABLE_MESSAGE =
            "Unable to generate an AI suggestion at this time. Please try again later.";

    private final String apiKey;
    private final String apiUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final Duration timeout;

    public GeminiService(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.api.url:}") String apiUrl
    ) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
        this.timeout = Duration.ofSeconds(30);

        log.info("Gemini API URL loaded: {}", this.apiUrl);
        log.info("Gemini API key loaded: {}", this.apiKey != null && !this.apiKey.isBlank());
    }

    public AiAnalyzeResponse analyze(AiAnalyzeRequest request) {
        try {
            String prompt = buildPrompt(request);
            String requestBody = buildGeminiRequestBody(prompt);
            String responseJson = callGeminiApi(requestBody);
            return parseGeminiResponse(responseJson);
        } catch (Exception e) {
            log.warn("Gemini analysis unavailable: {}", e.getMessage());
            return buildFallbackResponse();
        }
    }

    private String buildPrompt(AiAnalyzeRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an IT support AI assistant. Analyze the following support ticket and provide a structured response.\n\n");
        prompt.append("Ticket Details:\n");
        prompt.append("- Employee Name: ").append(request.employeeName() != null && !request.employeeName().isBlank() ? request.employeeName() : "Not specified").append("\n");
        prompt.append("- Subject: ").append(request.subject()).append("\n");
        prompt.append("- Issue Type: ").append(request.issueType()).append("\n");
        prompt.append("- Priority: ").append(request.priority() != null && !request.priority().isBlank() ? request.priority() : "Not specified").append("\n");
        prompt.append("- Description: ").append(request.description()).append("\n\n");

        // Include conversation history if present
        if (request.messages() != null && !request.messages().isEmpty()) {
            prompt.append("Conversation History:\n");
            for (AiAnalyzeRequest.ChatMessage msg : request.messages()) {
                prompt.append(msg.role()).append(": ").append(msg.content()).append("\n");
            }
            prompt.append("\n");
        }

        prompt.append("Based on the above, provide a response in the following JSON format (no markdown, no code blocks, just raw JSON):\n");
        prompt.append("{\n");
        prompt.append("  \"summary\": \"A concise summary of the problem (1-2 sentences)\",\n");
        prompt.append("  \"rootCause\": \"The identified root cause of the issue\",\n");
        prompt.append("  \"solution\": \"Step-by-step suggested solution with troubleshooting steps\",\n");
        prompt.append("  \"preventiveRecommendation\": \"How to prevent this issue in the future\",\n");
        prompt.append("  \"humanSupportRequired\": true or false\n");
        prompt.append("}\n");

        if (request.messages() != null && !request.messages().isEmpty()) {
            prompt.append("\nNote: This is a follow-up to the previous conversation. Consider the conversation history when providing your response.");
        }

        return prompt.toString();
    }

    private String buildGeminiRequestBody(String prompt) {
        try {
            ObjectNode root = objectMapper.createObjectNode();

            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode content = objectMapper.createObjectNode();
            ArrayNode parts = objectMapper.createArrayNode();
            ObjectNode part = objectMapper.createObjectNode();
            part.put("text", prompt);
            parts.add(part);
            content.set("parts", parts);
            contents.add(content);
            root.set("contents", contents);

            ObjectNode generationConfig = objectMapper.createObjectNode();
            generationConfig.put("temperature", 0.4);
            generationConfig.put("maxOutputTokens", 1024);
            generationConfig.put("topP", 0.8);
            root.set("generationConfig", generationConfig);

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build Gemini request body", e);
        }
    }

    private String callGeminiApi(String requestBody) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Gemini API key is missing");
        }

        if (apiUrl == null || apiUrl.isBlank()) {
            throw new RuntimeException("Gemini API URL is missing");
        }

        String url = apiUrl + "?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(timeout)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Gemini API returned status {}", response.statusCode());
            throw new RuntimeException("Gemini API returned status " + response.statusCode());
        }

        if (response.body() == null || response.body().isBlank()) {
            throw new RuntimeException("Gemini API returned an empty response");
        }

        return response.body();
    }

    private AiAnalyzeResponse parseGeminiResponse(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);

            // Navigate to the text content
            String text = Optional.ofNullable(root)
                    .map(r -> r.get("candidates"))
                    .filter(c -> c.isArray() && c.size() > 0)
                    .map(c -> c.get(0))
                    .map(c -> c.get("content"))
                    .map(c -> c.get("parts"))
                    .filter(p -> p.isArray() && p.size() > 0)
                    .map(p -> p.get(0))
                    .map(p -> p.get("text"))
                    .map(JsonNode::asText)
                    .orElseThrow(() -> new RuntimeException("Unexpected Gemini response structure"));

            // Extract JSON from the response text (handle possible markdown wrapping)
            String jsonText = text;
            if (text.contains("```json")) {
                jsonText = text.substring(text.indexOf("```json") + 7, text.lastIndexOf("```"));
            } else if (text.contains("```")) {
                jsonText = text.substring(text.indexOf("```") + 3, text.lastIndexOf("```"));
            }
            jsonText = jsonText.trim();

            JsonNode data = objectMapper.readTree(jsonText);

            return AiAnalyzeResponse.builder()
                    .summary(getJsonField(data, "summary", "No summary available"))
                    .rootCause(getJsonField(data, "rootCause", getJsonField(data, "root_cause", "Unable to determine root cause")))
                    .solution(getJsonField(data, "solution", "No solution available"))
                    .preventiveRecommendation(getJsonField(data, "preventiveRecommendation", getJsonField(data, "preventive_recommendation", "")))
                    .humanSupportRequired(data.has("humanSupportRequired") && data.get("humanSupportRequired").asBoolean())
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            return buildFallbackResponse();
        }
    }

    private String getJsonField(JsonNode node, String fieldName, String defaultValue) {
        JsonNode field = node.get(fieldName);
        return field != null && !field.isNull() ? field.asText() : defaultValue;
    }

    private AiAnalyzeResponse buildFallbackResponse() {
        return AiAnalyzeResponse.builder()
                .summary(AI_UNAVAILABLE_MESSAGE)
                .rootCause("AI assistance is temporarily unavailable.")
                .solution(AI_UNAVAILABLE_MESSAGE)
                .preventiveRecommendation("")
                .humanSupportRequired(true)
                .build();
    }
}

