package com.supportai.backend.repository;

import com.supportai.backend.entity.TicketEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<TicketEntity, Integer> {

    List<TicketEntity> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    List<TicketEntity> findAllByOrderByCreatedAtDesc();
}

