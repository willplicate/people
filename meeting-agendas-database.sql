-- Meeting Agendas and Notes Tables
-- Run this in your Supabase SQL editor

-- Create meeting agendas table
CREATE TABLE meeting_agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    attendees TEXT[], -- Array of attendee names for easy searching
    meeting_date TIMESTAMP WITH TIME ZONE,
    agenda TEXT, -- Pre-meeting agenda/bullet points
    notes TEXT, -- Meeting notes
    fireflies_link TEXT, -- Optional link to Fireflies recording
    tags TEXT[], -- Optional tags for categorization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_meeting_agendas_meeting_date ON meeting_agendas(meeting_date);
CREATE INDEX idx_meeting_agendas_attendees ON meeting_agendas USING gin(attendees);
CREATE INDEX idx_meeting_agendas_tags ON meeting_agendas USING gin(tags);
CREATE INDEX idx_meeting_agendas_created_at ON meeting_agendas(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_meeting_agendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meeting_agendas_updated_at
    BEFORE UPDATE ON meeting_agendas
    FOR EACH ROW EXECUTE FUNCTION update_meeting_agendas_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE meeting_agendas ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all operations for now)
CREATE POLICY "Allow all operations on meeting_agendas" ON meeting_agendas FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO meeting_agendas (title, attendees, meeting_date, agenda, notes) VALUES
('Weekly Team Standup', ARRAY['John', 'Sarah', 'Mike'], '2025-09-22 10:00:00+00',
 '• Review last week progress
• Discuss blockers
• Plan this week priorities',
 'Great progress on project X. Mike needs help with API integration.'),

('Project Kickoff with Client', ARRAY['KATHY', 'David', 'Lisa'], '2025-09-20 14:00:00+00',
 '• Project overview
• Timeline discussion
• Resource allocation
• Next steps',
 'Client approved timeline. Starting development next week. Kathy will handle design review.'),

('Monthly Review', ARRAY['Manager', 'HR'], '2025-09-15 15:30:00+00',
 '• Performance review
• Goals for next month
• Training needs',
 'Positive feedback overall. Need to focus on communication skills.');