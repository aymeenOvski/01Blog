CREATE TABLE post_media_urls (
    post_id BIGINT NOT NULL,
    media_url VARCHAR(500),
    CONSTRAINT fk_post_media_urls_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE INDEX idx_post_media_urls_post_id ON post_media_urls(post_id);