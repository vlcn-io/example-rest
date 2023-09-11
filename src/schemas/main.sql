CREATE TABLE IF NOT EXISTS test (id PRIMARY KEY, content TEXT, position);

CREATE INDEX IF NOT EXISTS test_position ON test (position);
SELECT crsql_as_crr('test');
SELECT crsql_fract_as_ordered('test', 'position');

CREATE TABLE IF NOT EXISTS local_notes (id PRIMARY KEY, content TEXT);