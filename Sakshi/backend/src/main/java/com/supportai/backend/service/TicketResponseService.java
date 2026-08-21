package com.supportai.backend.service;

import com.supportai.backend.dto.TicketResponseCreateRequest;
import com.supportai.backend.dto.TicketResponseDto;
import com.supportai.backend.entity.TicketEntity;
import com.supportai.backend.entity.TicketResponseEntity;
import com.supportai.backend.exception.ResourceNotFoundException;
import com.supportai.backend.repository.TicketRepository;
import com.supportai.backend.repository.TicketResponseRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketResponseService {

    private final TicketResponseRepository ticketResponseRepository;
    private final TicketRepository ticketRepository;

    public TicketResponseDto createTicketResponse(TicketResponseCreateRequest request) {
        TicketEntity ticket = findTicket(request.ticketId());

        TicketResponseEntity response = new TicketResponseEntity();
        response.setTicket(ticket);
        response.setGeneratedResponse(request.generatedResponse());
        response.setConfidenceScore(request.confidenceScore());
        response.setResponseType("AI");
        response.setGeneratedAt(LocalDateTime.now());

        return toDto(ticketResponseRepository.save(response));
    }

    public List<TicketResponseDto> getResponsesByTicketId(Integer ticketId) {
        findTicket(ticketId);
        return ticketResponseRepository.findByTicketTicketIdOrderByGeneratedAtAsc(ticketId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private TicketEntity findTicket(Integer ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
    }

    private TicketResponseDto toDto(TicketResponseEntity response) {
        return TicketResponseDto.builder()
                .responseId(response.getResponseId())
                .ticketId(response.getTicket().getTicketId())
                .generatedResponse(response.getGeneratedResponse())
                .confidenceScore(response.getConfidenceScore())
                .generatedAt(response.getGeneratedAt())
                .build();
    }
}

