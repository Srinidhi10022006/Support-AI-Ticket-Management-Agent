package com.supportai.backend.repository;

import com.supportai.backend.entity.ActivityLogEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLogEntity, Integer> {

    List<ActivityLogEntity> findByTicketTicketIdOrderByActionTimeDesc(Integer ticketId);

    List<ActivityLogEntity> findAllByOrderByActionTimeDesc();
}
