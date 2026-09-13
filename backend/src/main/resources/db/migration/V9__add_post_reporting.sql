ALTER TABLE reports
    ALTER COLUMN target_user_id DROP NOT NULL;

ALTER TABLE reports
    ADD COLUMN target_post_id BIGINT;

ALTER TABLE reports
    ADD CONSTRAINT fk_reports_target_post
        FOREIGN KEY (target_post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE;

ALTER TABLE reports
    ADD CONSTRAINT chk_reports_exactly_one_target
        CHECK (
            (target_user_id IS NOT NULL AND target_post_id IS NULL)
            OR
            (target_user_id IS NULL AND target_post_id IS NOT NULL)
        );

CREATE INDEX IF NOT EXISTS idx_reports_target_post
    ON reports(target_post_id);