package com.dayforce.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs one-time schema repairs that Hibernate's ddl-auto=update cannot handle
 * (e.g., dropping NOT NULL from an existing column).
 * All statements are safe to run repeatedly — they are idempotent on MySQL.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaInitializer {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void repairSchema() {
        // Allow customer-submitted properties to have no broker yet (broker is assigned on approval).
        try {
            jdbcTemplate.execute(
                "ALTER TABLE properties MODIFY COLUMN broker_id BIGINT NULL"
            );
            log.info("SchemaInitializer: broker_id column set to NULLABLE — customer submissions enabled.");
        } catch (Exception e) {
            log.debug("SchemaInitializer: broker_id alter skipped ({})", e.getMessage());
        }

        // Widen status column
        try {
            jdbcTemplate.execute(
                "ALTER TABLE properties MODIFY COLUMN status VARCHAR(50) NOT NULL"
            );
            log.info("SchemaInitializer: status column widened to VARCHAR(50) — all enum values accepted.");
        } catch (Exception e) {
            log.debug("SchemaInitializer: status alter skipped ({})", e.getMessage());
        }

        // Add geocoding columns for map view (safe to run multiple times — MySQL ignores duplicate ADD)
        try {
            jdbcTemplate.execute(
                "ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude DOUBLE NULL"
            );
            jdbcTemplate.execute(
                "ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude DOUBLE NULL"
            );
            log.info("SchemaInitializer: latitude/longitude columns ensured.");
        } catch (Exception e) {
            log.debug("SchemaInitializer: lat/lon alter skipped ({})", e.getMessage());
        }

        // Add view count column (DEFAULT 0 so existing rows start at 0)
        try {
            jdbcTemplate.execute(
                "ALTER TABLE properties ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0"
            );
            log.info("SchemaInitializer: view_count column ensured.");
        } catch (Exception e) {
            log.debug("SchemaInitializer: view_count alter skipped ({})", e.getMessage());
        }
    }
}
