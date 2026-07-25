package com.roomreservation.reservation;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {
    List<ReservationEntity> findByEmployeeId(Long employeeId);

    List<ReservationEntity> findByRoomId(Long roomId);

    @Query("select r from ReservationEntity r "
            + "where r.roomId = :roomId "
            + "and r.dateReservation = :date "
            + "and r.statut <> com.roomreservation.reservation.ReservationStatus.ANNULEE "
            + "and :start < r.heureFin "
            + "and :end > r.heureDebut")
    List<ReservationEntity> findOverlappingReservations(@Param("roomId") Long roomId,
                                                        @Param("date") LocalDate date,
                                                        @Param("start") LocalTime start,
                                                        @Param("end") LocalTime end);
}
