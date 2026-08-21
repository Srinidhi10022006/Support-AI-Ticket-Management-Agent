package com.supportai.backend.repository;

import com.supportai.backend.entity.UserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {

    Optional<UserEntity> findByEmailIgnoreCase(String email);
}

