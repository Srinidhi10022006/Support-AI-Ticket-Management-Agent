package com.supportai.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "ticket_responses")
public class TicketResponseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Integer responseId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private TicketEntity ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id")
    private UserEntity responder;

    @Column(name = "generated_response", nullable = false, columnDefinition = "text")
    private String generatedResponse;

    @Column(name = "response_type", length = 10)
    private String responseType;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "created_at")
    private LocalDateTime generatedAt;
}

