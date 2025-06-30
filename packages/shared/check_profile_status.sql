SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'ProfileStatus'
) ORDER BY enumlabel; 