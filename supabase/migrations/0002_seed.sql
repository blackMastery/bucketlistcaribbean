-- ============================================================================
-- Mista Concierge Travel — seed data (mirrors the design prototypes exactly)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Destinations
-- ----------------------------------------------------------------------------
insert into public.destinations (slug, name, tag, description, long_description, hero_image_url, is_featured, avg_temp, best_season, signature_tours, sort_order) values
('st-lucia', 'St. Lucia', 'Adventure & Luxury', 'Twin Pitons, rainforest and geothermal springs.',
  'The Caribbean at its most dramatic — the twin Pitons rising sheer from a sapphire sea, rainforest spilling to the shoreline, and geothermal springs steaming in the hills. Pair barefoot luxury resorts with volcano hikes, catamaran sails and Creole feasts.',
  'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=2000&q=80', true, '82°F', 'Nov–Apr', 2, 1),
('barbados', 'Barbados', 'Beach & Heritage', 'Platinum-coast resorts, rum and Bajan culture.', null,
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2000&q=80', false, '83°F', 'Dec–Apr', 2, 2),
('bahamas', 'The Bahamas', 'Island Hopping', '700 islands of powder sand and glass-clear water.', null,
  'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=2000&q=80', false, '81°F', 'Dec–May', 2, 3),
('jamaica', 'Jamaica', 'Culture & Reef', 'Reggae, Blue Mountain coffee and hidden coves.', null,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80', false, '82°F', 'Nov–Apr', 2, 4),
('turks-caicos', 'Turks & Caicos', 'Diving & Villas', 'Grace Bay sands and world-class reef diving.', null,
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=80', false, '84°F', 'Nov–May', 2, 5),
('grenada', 'Grenada', 'Spice & Sailing', 'The Spice Isle — nutmeg, waterfalls and the Grenadines.', null,
  'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=2000&q=80', false, '83°F', 'Jan–Apr', 2, 6);

-- ----------------------------------------------------------------------------
-- Activity types (drive the Tours filter)
-- ----------------------------------------------------------------------------
insert into public.activity_types (name, sort_order) values
('Beach & Spa', 1), ('Adventure', 2), ('Luxury', 3), ('Culture', 4);

-- ----------------------------------------------------------------------------
-- Tours
-- ----------------------------------------------------------------------------
insert into public.tours
  (slug, title, destination_id, location, price_cents, rating, reviews_count, duration_days, duration_label, badge, badge_color, card_image_url, overview, is_featured, spots_left, booked_last_24h, sort_order)
values
('st-lucia-piton-luxury-escape', 'St. Lucia Piton Luxury Escape', (select id from public.destinations where slug='st-lucia'), 'Soufrière, St. Lucia', 298000, 5.0, 142, 5, '5 days · 4 nights', 'Bestseller', '#FF6B5B', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=80',
  'Wake to the twin Pitons rising straight from a turquoise sea — St. Lucia at its most cinematic. This escape pairs the wild beauty of a UNESCO World Heritage coastline with effortless luxury: an oceanfront resort tucked between the peaks, a private catamaran day along the west coast, geothermal mud baths, and slow evenings of Creole flavours and aged rum.', true, 4, 5, 12),
('barbados-platinum-coast-retreat', 'Barbados Platinum Coast Retreat', (select id from public.destinations where slug='barbados'), 'West Coast, Barbados', 345000, 4.9, 88, 6, '6 days · 5 nights', 'Recommended', '#1B7A5C', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80',
  'Six unhurried days along the famed Platinum Coast — calm turquoise waters, five-star beachfront resorts, and the warm rhythm of Bajan life. Sunset catamaran cruises, rum-distillery tastings and afternoons that melt into long candlelit dinners.', true, null, null, 11),
('grenadines-catamaran-voyage', 'Grenadines Catamaran Voyage', (select id from public.destinations where slug='grenada'), 'The Grenadines', 420000, 5.0, 54, 7, '7 days · 6 nights', 'Limited spots', '#E3A828', 'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=900&q=80',
  'A week under sail through the Grenadines aboard a private catamaran — deserted cays, glass-clear anchorages and reefs alive with colour. Wake somewhere different each morning, snorkel before breakfast and dine on the deck as the sun goes down.', true, null, null, 10),
('jamaica-reggae-reef', 'Jamaica Reggae & Reef', (select id from public.destinations where slug='jamaica'), 'Montego Bay, Jamaica', 198000, 4.8, 96, 4, '4 days · 3 nights', null, '#1B7A5C', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'The soul of Jamaica in four vibrant days — reggae on the breeze, reefs off Montego Bay, and the warmth of island hospitality. Beach time, jerk-spiced feasts and a hidden cove or two only the locals know.', false, null, null, 9),
('bahamas-out-islands-hideaway', 'Bahamas Out Islands Hideaway', (select id from public.destinations where slug='bahamas'), 'Exuma, Bahamas', 265000, 4.9, 61, 5, '5 days · 4 nights', null, '#1B7A5C', 'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=900&q=80',
  'Slip away to the Exuma out islands — powder-soft sand, impossibly clear water and barely another soul. Private boat days, sandbar picnics and the slow luxury of having a stretch of the Bahamas to yourself.', false, null, null, 8),
('turks-caicos-diving-expedition', 'Turks & Caicos Diving Expedition', (select id from public.destinations where slug='turks-caicos'), 'Providenciales', 238000, 4.8, 47, 4, '4 days · 3 nights', 'Recommended', '#1B7A5C', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80',
  'Drop into one of the world''s great wall dives off Providenciales — vivid coral, turtles and the famous Turks & Caicos reef. Days on the water, nights on Grace Bay, all the gear and guiding handled.', false, null, null, 7),
('st-lucia-rainforest-volcano', 'St. Lucia Rainforest & Volcano', (select id from public.destinations where slug='st-lucia'), 'Soufrière, St. Lucia', 175000, 4.7, 39, 3, '3 days · 2 nights', null, '#1B7A5C', 'https://images.unsplash.com/photo-1502209524164-acea936639a2?auto=format&fit=crop&w=900&q=80',
  'A short, wild escape into St. Lucia''s interior — rainforest trails, the drive-in volcano at Sulphur Springs and a restorative soak in geothermal mud baths. Big adventure, beautifully compact.', false, null, null, 6),
('jamaica-blue-mountains-coffee-trail', 'Jamaica Blue Mountains Coffee Trail', (select id from public.destinations where slug='jamaica'), 'Blue Mountains, Jamaica', 128000, 4.6, 33, 2, '2 days · 1 night', null, '#1B7A5C', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80',
  'Climb into the cool, misty Blue Mountains for the world''s most prized coffee — estate tours, tastings at the source and sweeping views back down to the coast. A two-day immersion in Jamaica''s highlands.', false, null, null, 5),
('barbados-rum-heritage-journey', 'Barbados Rum & Heritage Journey', (select id from public.destinations where slug='barbados'), 'Bridgetown, Barbados', 115000, 4.7, 44, 3, '3 days · 2 nights', null, '#1B7A5C', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80',
  'Trace the story of rum across Barbados — historic distilleries, UNESCO-listed Bridgetown and the Bajan culture that gave the spirit to the world. Tastings, heritage and unmistakable island warmth.', false, null, null, 4),
('grenada-spice-island-discovery', 'Grenada Spice Island Discovery', (select id from public.destinations where slug='grenada'), 'St. George''s, Grenada', 168000, 4.8, 36, 4, '4 days · 3 nights', null, '#1B7A5C', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=80',
  'Discover the Spice Isle — nutmeg estates, rainforest waterfalls and the pastel harbour of St. George''s. Four fragrant days of culture, adventure and the gentlest pace in the Caribbean.', false, null, null, 3),
('bahamas-swimming-pigs-cays', 'Bahamas Swimming Pigs & Cays', (select id from public.destinations where slug='bahamas'), 'Exuma, Bahamas', 192000, 4.8, 52, 3, '3 days · 2 nights', null, '#1B7A5C', 'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=900&q=80',
  'The Exuma cays at their most playful — swim with the famous pigs, snorkel with nurse sharks and island-hop between sandbars. Three sun-drenched days of pure Bahamian fun.', false, null, null, 2),
('turks-caicos-private-villa-week', 'Turks & Caicos Private Villa Week', (select id from public.destinations where slug='turks-caicos'), 'Grace Bay', 540000, 5.0, 28, 7, '7 days · 6 nights', 'Limited spots', '#E3A828', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'A full week in a private villa on Grace Bay — your own pool, chef and concierge, steps from the finest beach in the Caribbean. Effortless, exclusive and entirely yours.', false, null, null, 1);

-- ----------------------------------------------------------------------------
-- Tour ↔ activity links
-- ----------------------------------------------------------------------------
insert into public.tour_activities (tour_id, activity_type_id)
select t.id, a.id
from (values
  ('st-lucia-piton-luxury-escape', 'Luxury'), ('st-lucia-piton-luxury-escape', 'Beach & Spa'),
  ('barbados-platinum-coast-retreat', 'Luxury'), ('barbados-platinum-coast-retreat', 'Beach & Spa'),
  ('grenadines-catamaran-voyage', 'Luxury'), ('grenadines-catamaran-voyage', 'Adventure'),
  ('jamaica-reggae-reef', 'Culture'), ('jamaica-reggae-reef', 'Beach & Spa'),
  ('bahamas-out-islands-hideaway', 'Beach & Spa'), ('bahamas-out-islands-hideaway', 'Luxury'),
  ('turks-caicos-diving-expedition', 'Adventure'), ('turks-caicos-diving-expedition', 'Beach & Spa'),
  ('st-lucia-rainforest-volcano', 'Adventure'),
  ('jamaica-blue-mountains-coffee-trail', 'Culture'), ('jamaica-blue-mountains-coffee-trail', 'Adventure'),
  ('barbados-rum-heritage-journey', 'Culture'),
  ('grenada-spice-island-discovery', 'Culture'), ('grenada-spice-island-discovery', 'Adventure'),
  ('bahamas-swimming-pigs-cays', 'Adventure'), ('bahamas-swimming-pigs-cays', 'Beach & Spa'),
  ('turks-caicos-private-villa-week', 'Luxury'), ('turks-caicos-private-villa-week', 'Beach & Spa')
) as x(slug, act)
join public.tours t on t.slug = x.slug
join public.activity_types a on a.name = x.act;

-- ----------------------------------------------------------------------------
-- Full detail for the flagship tour (St. Lucia Piton Luxury Escape)
-- ----------------------------------------------------------------------------
insert into public.tour_images (tour_id, url, position, in_carousel)
select (select id from public.tours where slug='st-lucia-piton-luxury-escape'), url, position, in_carousel
from (values
  ('https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80', 0, true),
  ('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', 1, true),
  ('https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=80', 2, true),
  ('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80', 3, true),
  ('https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=1600&q=80', 4, true),
  ('https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1600&q=80', 5, true),
  ('https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1000&q=80', 6, false),
  ('https://images.unsplash.com/photo-1502209524164-acea936639a2?auto=format&fit=crop&w=1000&q=80', 7, false)
) as x(url, position, in_carousel);

insert into public.tour_highlights (tour_id, text, position)
select (select id from public.tours where slug='st-lucia-piton-luxury-escape'), text, position
from (values
  ('The majestic Pitons — UNESCO World Heritage peaks', 0),
  ('Oceanfront luxury resort between the mountains', 1),
  ('Private catamaran sail & reef snorkelling', 2),
  ('Geothermal mud baths & Diamond Falls', 3),
  ('Beachside spa treatments included', 4),
  ('Small groups — never more than 8 travelers', 5)
) as x(text, position);

insert into public.tour_itinerary (tour_id, day_number, title, body)
select (select id from public.tours where slug='st-lucia-piton-luxury-escape'), day_number, title, body
from (values
  (1, 'Arrival & Sunset Welcome', 'Met at Hewanorra International and transferred along the coast to your oceanfront resort nestled between the Pitons. A champagne welcome and a candlelit beach dinner ease you into island time.'),
  (2, 'The Pitons & Sulphur Springs', 'A guided ascent toward Gros Piton with sweeping Caribbean views, followed by a restorative soak in the geothermal mud baths and a visit to the Diamond Falls botanical gardens.'),
  (3, 'Private Catamaran Sail & Snorkel', 'Set sail along the lush west coast aboard a private catamaran — snorkel vibrant reefs, swim in secluded coves, and enjoy a fresh seafood lunch served on deck as the Pitons drift past.'),
  (4, 'Spa, Beach & Creole Flavours', 'A slow morning of beachside spa treatments and time at leisure, then an evening tasting your way through Soufrière — street food, local chocolate and a guided rum flight.'),
  (5, 'Sunrise & Departure', 'A final sunrise over the Pitons and a leisurely breakfast before your private transfer back to the airport, island-rested and renewed.')
) as x(day_number, title, body);

insert into public.tour_inclusions (tour_id, kind, text, position)
select (select id from public.tours where slug='st-lucia-piton-luxury-escape'), kind, text, position
from (values
  ('included', 'Airport transfers & ground travel', 0),
  ('included', '4 nights luxury oceanfront resort', 1),
  ('included', 'Daily breakfast & select meals', 2),
  ('included', 'Private catamaran day', 3),
  ('included', 'Local guides & entrance fees', 4),
  ('excluded', 'International airfare', 0),
  ('excluded', 'Travel insurance (optional add-on)', 1),
  ('excluded', 'Some lunches & personal expenses', 2)
) as x(kind, text, position);

insert into public.reviews (tour_id, author_name, initials, rating, body, review_date)
select (select id from public.tours where slug='st-lucia-piton-luxury-escape'), author_name, initials, 5.0, body, review_date
from (values
  ('Claire M.', 'CM', 'Waking up to the Pitons every morning was unreal. The catamaran day and the private guides made it feel like our own slice of St. Lucia. Flawless from start to finish.', 'April 2026'),
  ('Daniel & Joy', 'DJ', 'Honeymoon of our dreams. Mista thought of everything — the candlelit beach dinner, the spa, the rum tasting in the village. Luxury without feeling stuffy.', 'March 2026'),
  ('Sophia K.', 'SK', 'The mud baths and the snorkelling were highlights, but it was the little touches and the warmth of the team that made it special. Already planning our next island with them.', 'February 2026')
) as x(author_name, initials, body, review_date);

-- ----------------------------------------------------------------------------
-- Testimonials (Home)
-- ----------------------------------------------------------------------------
insert into public.testimonials (quote, initials, name, trip, sort_order) values
('The most thoughtfully planned trip of our lives. Mista anticipated everything before we even asked.', 'JR', 'James & Rosa', 'Barbados Platinum Coast', 1),
('Waking up to the Pitons with no crowds, just our guide — pure magic. Worth every penny.', 'AL', 'Amelia L.', 'St. Lucia Piton Escape', 2),
('Luxury without losing the soul of the islands. The local connections made it unforgettable.', 'DK', 'David K.', 'Grenadines Catamaran Voyage', 3);

-- ----------------------------------------------------------------------------
-- Team (About)
-- ----------------------------------------------------------------------------
insert into public.team_members (name, role, bio, photo_url, sort_order) values
('Marcus Alleyne', 'Founder & CEO', 'Born in Barbados, sailing the islands since age six. The original "Mista".', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 1),
('Lena Caldeira', 'Head of Experiences', 'Curates every itinerary. Knows a chef on every island worth the trip.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', 2),
('Andre Thomas', 'Lead Concierge', 'Your 24/7 point of contact, from first call to final farewell.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 3),
('Priya Sharma', 'Sustainability Lead', 'Builds the partnerships that keep our travel giving back.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80', 4);

-- ----------------------------------------------------------------------------
-- Brand micro-content
-- ----------------------------------------------------------------------------
insert into public.site_content (key, value) values
('home_hero', '{"badge_rating":"4.9","badge_text":"Trusted by 2,000+ travelers","headline":"Escape to the heart of the Caribbean","description":"Luxury island journeys crafted just for you — from the soaring Pitons of St. Lucia to the powder-soft cays of the Bahamas. Personally guided, perfectly planned.","primary_cta_label":"Explore Our Tours","primary_cta_href":"/tours","secondary_cta_label":"Plan Your Journey","secondary_cta_href":"/contact"}'),
('promo_banner', '{"strong":"Limited time","text":"— Book your 2026 adventure and save 15% on every itinerary.","cta_label":"Explore tours →","cta_href":"/tours"}'),
('hero_stats', '[{"num":"12+","label":"Years in the Caribbean"},{"num":"2,000+","label":"Travelers hosted"},{"num":"15+","label":"Islands covered"},{"num":"4.9★","label":"Average rating"}]'),
('pillars', '[{"icon":"compass","title":"Local Experts","body":"Islanders with the connections and know-how no guidebook can offer."},{"icon":"sparkles","title":"True Luxury","body":"Five-star resorts, private transfers and chef-prepared meals throughout."},{"icon":"pencil","title":"Personalized","body":"Every itinerary is shaped around your pace, interests and dreams."},{"icon":"shield","title":"Safe & Secure","body":"Vetted partners, 24/7 support and full travel protection options."}]'),
('values', '[{"icon":"sparkles","title":"Excellence","body":"We sweat the smallest details so you never have to think about them."},{"icon":"gem","title":"Authenticity","body":"Real islands, real people — never a manufactured experience."},{"icon":"leaf","title":"Sustainability","body":"We travel lightly and reinvest in the communities that host us."},{"icon":"pencil","title":"Personalization","body":"Every journey is shaped entirely around you."}]'),
('certs', '[{"big":"4.9★","label":"Across 2,000+ reviews"},{"big":"IATA","label":"Accredited travel agency"},{"big":"Top 10","label":"Caribbean Travel Awards 2025"},{"big":"1% ↩","label":"Of revenue to island communities"}]'),
('footer_popular_tours', '["St. Lucia Piton Escape","Barbados Platinum Coast","Grenadines Catamaran Voyage","Bahamas Out Islands Hideaway","Jamaica Reggae & Reef"]');
