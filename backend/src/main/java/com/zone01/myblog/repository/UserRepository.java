package com.zone01.myblog.repository;

import com.zone01.myblog.model.Users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByUsername(String username);
    Optional<Users> findByEmail(String email);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
