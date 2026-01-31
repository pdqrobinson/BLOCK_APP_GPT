-- Seed data for demo posts
-- Note: This data requires real user_ids from auth.users to work properly
-- For testing purposes, you may need to insert these after creating test users

-- Sample posts around Phoenix, AZ area
-- You can update user_ids to match your actual test users

-- Status posts (24h duration)
insert into public.posts (
  user_id, post_type, geometry, content, expires_at, duration_minutes, idempotency_key
) values
  (
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user_id
    'status',
    st_makepoint(-112.0740, 33.4484)::geography, -- Phoenix downtown
    'Just finished a great morning walk! The weather is perfect today. ☀️',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'status',
    st_makepoint(-112.0640, 33.4584)::geography, -- Nearby
    'Working from a coffee shop today. Anyone want to meet up?',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  );

-- Ask posts (3 days duration)
insert into public.posts (
  user_id, post_type, geometry, content, expires_at, duration_minutes, idempotency_key
) values
  (
    '00000000-0000-0000-0000-000000000002', -- Replace with actual user_id
    'ask',
    st_makepoint(-112.0840, 33.4384)::geography,
    'Does anyone know a good place to get tacos nearby? Looking for recommendations! 🌮',
    now() + interval '3 days',
    4320,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'ask',
    st_makepoint(-112.0940, 33.4484)::geography,
    'Has anyone seen a lost cat? Orange tabby, very friendly. 🐱',
    now() + interval '7 days',
    10080,
    gen_random_uuid()
  );

-- Activity posts (2 days duration)
insert into public.posts (
  user_id, post_type, geometry, content, expires_at, duration_minutes, idempotency_key
) values
  (
    '00000000-0000-0000-0000-000000000003', -- Replace with actual user_id
    'activity',
    st_makepoint(-112.0740, 33.4384)::geography,
    'Pickleball meetup at the park tomorrow at 9am! All skill levels welcome. 🏓',
    now() + interval '2 days',
    2880,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'activity',
    st_makepoint(-112.0640, 33.4684)::geography,
    'Group yoga session this evening at 6pm. Bring your own mat! 🧘',
    now() + interval '1 day',
    1440,
    gen_random_uuid()
  );

-- Food item posts (24h duration)
insert into public.posts (
  user_id, post_type, item_kind, geometry, content, expires_at, duration_minutes, idempotency_key
) values
  (
    '00000000-0000-0000-0000-000000000004', -- Replace with actual user_id
    'item',
    'food',
    st_makepoint(-112.0840, 33.4584)::geography,
    'Free homemade cookies! Made too many for the party. Fresh and delicious. 🍪',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'item',
    'food',
    st_makepoint(-112.0740, 33.4484)::geography,
    'Extra garden vegetables - tomatoes, peppers, and zucchini available for pickup! 🥬',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  );

-- Physical item posts (7 days duration)
insert into public.posts (
  user_id, post_type, item_kind, geometry, content, expires_at, duration_minutes, idempotency_key
) values
  (
    '00000000-0000-0000-0000-000000000005', -- Replace with actual user_id
    'item',
    'physical',
    st_makepoint(-112.0940, 33.4384)::geography,
    'Free patio furniture! 2 chairs and a small table. First come first served. 🪑',
    now() + interval '7 days',
    10080,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'item',
    'physical',
    st_makepoint(-112.0640, 33.4284)::geography,
    'Kids bicycle (ages 5-7). Used but in good condition. Free to a good home. 🚲',
    now() + interval '14 days',
    20160,
    gen_random_uuid()
  );

-- Additional status posts spread around the area
insert into public.posts (
  user_id, post_type, geometry, content, expires_at, duration_minutes, idempotency_key
) values
  (
    '00000000-0000-0000-0000-000000000001',
    'status',
    st_makepoint(-112.0540, 33.4484)::geography,
    'Beautiful sunset today! Anyone else catching it?',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'status',
    st_makepoint(-112.0840, 33.4684)::geography,
    'Local library event tonight - book club meeting at 7pm! 📚',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'status',
    st_makepoint(-112.1040, 33.4284)::geography,
    'Community garden is looking great this season. Come check it out! 🌻',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'status',
    st_makepoint(-112.0740, 33.4784)::geography,
    'Farmers market this Saturday! Fresh produce and local goods. 🥕',
    now() + interval '24 hours',
    1440,
    gen_random_uuid()
  );

-- Note: To make this work with your actual users, you need to:
-- 1. Create test users in auth.users (via Supabase dashboard or signup)
-- 2. Replace the placeholder user_ids above with actual user IDs
-- 3. Run: supabase db push --yes
-- 
-- Alternative: Temporarily disable RLS for seeding, then re-enable:
-- alter table public.posts disable row level security;
-- -- Run the INSERT statements
-- alter table public.posts enable row level security;
