CREATE TABLE post_reposts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_post_reposts_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_reposts_post
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT uk_post_repost_user_post UNIQUE (user_id, post_id)
);

CREATE INDEX idx_post_reposts_user_created
    ON post_reposts(user_id, created_at DESC);

CREATE INDEX idx_post_reposts_post
    ON post_reposts(post_id);
