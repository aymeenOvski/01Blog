ALTER TABLE users
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE users
    ADD CONSTRAINT chk_users_status
        CHECK (status IN ('ACTIVE', 'BANNED'));

CREATE INDEX IF NOT EXISTS idx_users_status
    ON users(status);


ALTER TABLE posts
    ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'VISIBLE';

ALTER TABLE posts
    ADD CONSTRAINT chk_posts_visibility
        CHECK (visibility IN ('VISIBLE', 'HIDDEN'));

CREATE INDEX IF NOT EXISTS idx_posts_visibility
    ON posts(visibility);