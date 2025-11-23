-- Assumptions MVP Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  host_player_id UUID,
  state TEXT NOT NULL DEFAULT 'LOBBY',
  round_number INT NOT NULL DEFAULT 1,
  hotseat_player_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  session_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for host_player_id after players table exists
ALTER TABLE rooms ADD CONSTRAINT fk_host_player
  FOREIGN KEY (host_player_id) REFERENCES players(id) ON DELETE SET NULL;

ALTER TABLE rooms ADD CONSTRAINT fk_hotseat_player
  FOREIGN KEY (hotseat_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- Assignments table
CREATE TABLE assignments (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  giver_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  target_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  PRIMARY KEY (room_id, giver_player_id, round_number)
);

-- Indexes for performance
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_assignments_room_id ON assignments(room_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to rooms table
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;

-- Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (we use service role key on server)
-- These policies allow read access from the client
CREATE POLICY "Allow read access to rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow read access to assignments" ON assignments FOR SELECT USING (true);

-- Only service role can insert/update/delete (enforced by using service role key on server)
CREATE POLICY "Allow service role full access to rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow service role full access to players" ON players FOR ALL USING (true);
CREATE POLICY "Allow service role full access to assignments" ON assignments FOR ALL USING (true);
