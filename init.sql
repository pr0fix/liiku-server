-- Create stop_times table
CREATE TABLE IF NOT EXISTS stop_times (
    id SERIAL PRIMARY KEY,
    trip_id TEXT NOT NULL,
    arrival_time TEXT,
    departure_time TEXT,
    stop_id TEXT NOT NULL,
    stop_sequence INTEGER,
    pickup_type INTEGER,
    drop_off_type INTEGER
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_stop_times_trip ON stop_times(trip_id);

CREATE INDEX IF NOT EXISTS idx_stop_times_stop ON stop_times(stop_id);

CREATE INDEX IF NOT EXISTS idx_stop_times_trip_sequence ON stop_times(trip_id, stop_sequence);