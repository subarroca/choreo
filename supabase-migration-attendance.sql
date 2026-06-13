-- Attendance module: track member presence per show date
CREATE TABLE IF NOT EXISTS attendance (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id     uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  date        date NOT NULL,
  status      text NOT NULL DEFAULT 'present'
                CHECK (status IN ('present', 'absent', 'excused')),
  notes       text,
  UNIQUE (show_id, member_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_show_date ON attendance (show_id, date);

-- RLS: same policy pattern as other tables
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select" ON attendance FOR SELECT USING (true);
CREATE POLICY "attendance_insert" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "attendance_update" ON attendance FOR UPDATE USING (true);
CREATE POLICY "attendance_delete" ON attendance FOR DELETE USING (true);
