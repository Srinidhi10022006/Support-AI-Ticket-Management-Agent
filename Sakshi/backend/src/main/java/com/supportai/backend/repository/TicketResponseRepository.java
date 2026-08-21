package com.supportai.backend.repository;

import com.supportai.backend.entity.TicketResponseEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketResponseRepository extends JpaRepository<TicketResponseEntity, Integer> {

    List<TicketResponseEntity> findByTicketTicketIdOrderByGeneratedAtAsc(Integer ticketId);
}

