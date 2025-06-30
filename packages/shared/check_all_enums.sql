-- Check what enum types exist
SELECT typname as enum_name FROM pg_type WHERE typtype = 'e' ORDER BY typname; 