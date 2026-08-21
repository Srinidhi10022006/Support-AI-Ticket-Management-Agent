package com.supportai.backend.controller;

import com.supportai.backend.dto.TicketResponseCreateRequest;
import com.supportai.backend.dto.TicketResponseDto;
import com.supportai.backend.service.TicketResponseService;
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
@RequestMapping("/api/ticket-responses")
@RequiredArgsConstructor
public class TicketResponseController {

    private final TicketResponseService ticketResponseService;

    @PostMapping
    public ResponseEntity<TicketResponseDto> createResponse(@Valid @RequestBody TicketResponseCreateRequest request) {
        return ResponseEntity.ok(ticketResponseService.createTicketResponse(request));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<List<TicketResponseDto>> getResponses(@PathVariable Integer ticketId) {
        return ResponseEntity.ok(ticketResponseService.getResponsesByTicketId(ticketId));
    }
}

