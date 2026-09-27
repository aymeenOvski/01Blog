-- Add the optional details field first
ALTER TABLE reports
    ADD COLUMN description VARCHAR(1000);

-- Preserve old free-text reasons in the new description field
UPDATE reports
SET description = reason
WHERE reason NOT IN (
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'HATE_SPEECH',
    'FAKE_ACCOUNT',
    'OTHER'
);

-- Convert old arbitrary reasons to the new controlled value
UPDATE reports
SET reason = 'OTHER'
WHERE reason NOT IN (
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'HATE_SPEECH',
    'FAKE_ACCOUNT',
    'OTHER'
);

-- Now existing rows are compatible with the constraint
ALTER TABLE reports
    ADD CONSTRAINT chk_reports_reason
    CHECK (
        reason IN (
            'SPAM',
            'HARASSMENT',
            'INAPPROPRIATE_CONTENT',
            'HATE_SPEECH',
            'FAKE_ACCOUNT',
            'OTHER'
        )
    );