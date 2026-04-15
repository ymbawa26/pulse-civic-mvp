insert into public.profiles (id, email, display_name, pseudonym, role, region, home_label, email_alerts, privacy_default)
values
  ('11111111-1111-1111-1111-111111111111', 'moderator@pulse.local', 'Ari Moderator', 'Ari', 'moderator', 'Rivergate', 'Rivergate', true, 'pseudonymous'),
  ('22222222-2222-2222-2222-222222222222', 'sam@pulse.local', 'Sam Rivera', 'North Oak Tenant', 'resident', 'Rivergate', 'North Oak', true, 'anonymous'),
  ('33333333-3333-3333-3333-333333333333', 'jade@pulse.local', 'Jade Porter', 'Campus Neighbor', 'resident', 'Rivergate', 'Hillview', false, 'pseudonymous')
on conflict (id) do nothing;

insert into public.issue_reports (
  id,
  reporter_user_id,
  category,
  title,
  description,
  location_text,
  latitude,
  longitude,
  approximate_location_label,
  occurrence_date,
  created_at,
  privacy_mode,
  allow_matching,
  allow_joining_action_room,
  status,
  moderation_flags,
  institution_tag,
  severity_level,
  normalized_keywords
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '22222222-2222-2222-2222-222222222222',
    'Housing',
    'Repeated mold and ceiling leaks in Eastline Terrace',
    'Water has been leaking through the hallway ceiling for weeks and mold is spreading near vents.',
    'Eastline Terrace apartments',
    40.759,
    -74.004,
    'Eastline Terrace apartments',
    '2026-04-01',
    '2026-04-02T10:00:00Z',
    'pseudonymous',
    true,
    true,
    'matched',
    '[]'::jsonb,
    'Eastline Terrace',
    'high',
    array['mold','leaks','eastline','terrace']
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '33333333-3333-3333-3333-333333333333',
    'Housing',
    'No heat and mold complaints going unanswered',
    'Tenants in the Eastline area keep reporting heat outages and mold with little response.',
    'Near Eastline Terrace',
    40.761,
    -74.002,
    'Near Eastline Terrace',
    '2026-04-05',
    '2026-04-07T09:30:00Z',
    'anonymous',
    true,
    true,
    'matched',
    '[]'::jsonb,
    'Eastline Terrace',
    'high',
    array['heat','mold','eastline','terrace']
  )
on conflict (id) do nothing;

insert into public.action_rooms (
  id,
  cluster_key,
  title,
  category,
  approximate_location_label,
  summary,
  guidelines,
  suggested_actions,
  checklist
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'housing-eastline-40.76--74.00',
    'Eastline housing repairs room',
    'Housing',
    'Eastline Terrace area',
    'Residents coordinating around repeated mold, leak, and repair delays in the Eastline area.',
    '["Focus on patterns, not private people.","No threats or doxxing."]'::jsonb,
    '[{"id":"coordinate-complaint-filing","label":"Coordinate complaint filing","description":"File aligned complaints through lawful channels."}]'::jsonb,
    '[{"id":"dated-notes","label":"Dated notes","description":"Short timeline of what happened and when."}]'::jsonb
  )
on conflict (id) do nothing;

insert into public.action_room_reports (room_id, report_id)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2')
on conflict do nothing;

