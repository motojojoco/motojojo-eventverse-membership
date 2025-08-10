-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the membership expiry check to run daily at 9:00 AM
SELECT cron.schedule(
  'check-membership-expiry-daily',
  '0 9 * * *', -- Every day at 9:00 AM
  $$
  SELECT net.http_post(
    url := 'https://vibruvwwwxqtagmlkodq.supabase.co/functions/v1/check-membership-expiry',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnJ1dnd3d3hxdGFnbWxrb2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjEyODIsImV4cCI6MjA2MDIzNzI4Mn0.7s_NqBKDjAvtfr7GKPPMhqizUh9VbAfOY4j2lrE3p7A"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);