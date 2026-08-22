package com.zone01.myblog.repository;

import com.zone01.myblog.model.Follow;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByFollowerIdAndFollowedId(Long followerId, Long followedId);

    boolean existsByFollowerIdAndFollowedId(Long followerId, Long followedId);

    long countByFollowedId(Long followedId);

    long countByFollowerId(Long followerId);

    @Query("SELECT f.followed FROM Follow f WHERE f.follower.id = :followerId ORDER BY f.createdAt DESC")
    List<com.zone01.myblog.model.Users> findFollowedUsers(@Param("followerId") Long followerId);

    @Query("SELECT f.follower FROM Follow f WHERE f.followed.id = :followedId ORDER BY f.createdAt DESC")
    List<com.zone01.myblog.model.Users> findFollowerUsers(@Param("followedId") Long followedId);

    @Query("""
            SELECT u FROM com.zone01.myblog.model.Users u
            WHERE u.id <> :currentUserId
              AND NOT EXISTS (
                  SELECT f FROM Follow f
                  WHERE f.follower.id = :currentUserId AND f.followed.id = u.id
              )
            """)
    List<com.zone01.myblog.model.Users> findUnfollowedUsers(@Param("currentUserId") Long currentUserId);
}
