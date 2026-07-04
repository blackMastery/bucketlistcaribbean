-- Home page hero copy (editable in Admin → Site content)
insert into public.site_content (key, value) values
('home_hero', '{"badge_rating":"4.9","badge_text":"Trusted by 2,000+ travelers","headline":"Escape to the heart of the Caribbean","description":"Luxury island journeys crafted just for you — from the soaring Pitons of St. Lucia to the powder-soft cays of the Bahamas. Personally guided, perfectly planned.","primary_cta_label":"Explore Our Tours","primary_cta_href":"/tours","secondary_cta_label":"Plan Your Journey","secondary_cta_href":"/contact"}')
on conflict (key) do nothing;
