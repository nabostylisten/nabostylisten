-- Seed script for service categories
-- This can be run in Supabase SQL editor or via migrations

-- Main categories
INSERT INTO service_categories (id, name, description) VALUES
  ('hair-main', 'Hår', 'Alle typer hårtjenester inkludert klipp, farging og styling'),
  ('nails-main', 'Negler', 'Neglebehandlinger og negldesign'),
  ('makeup-main', 'Sminke', 'Sminketjenester for alle anledninger'),
  ('lashes-brows-main', 'Vipper og bryn', 'Behandlinger for vipper og øyenbryn'),
  ('wedding-main', 'Bryllup', 'Spesialtjenester for bryllup og store begivenheter')
ON CONFLICT (id) DO NOTHING;

-- Hair subcategories
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('hair-cut', 'Klipp og styling', 'Hårklipp og styling tjenester', 'hair-main'),
  ('hair-color', 'Farging', 'Hårkfarging og fargebehandlinger', 'hair-main'),
  ('hair-treatment', 'Behandlinger', 'Hårbehandlinger og kurer', 'hair-main'),
  ('hair-extensions', 'Extensions', 'Hårforlenging og extensions', 'hair-main')
ON CONFLICT (id) DO NOTHING;

-- Hair sub-subcategories
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('hair-cut-wash-blowdry', 'Vask, klipp og føn', 'Komplett hårklipp med vask og styling', 'hair-cut'),
  ('hair-cut-styling', 'Styling', 'Hårstyling uten klipp', 'hair-cut'),
  ('hair-color-full', 'Helfarging', 'Full farging av hele håret', 'hair-color'),
  ('hair-color-highlights', 'Highlights', 'Striper og highlights', 'hair-color'),
  ('hair-color-balayage', 'Balayage', 'Balayage fargeteknikk', 'hair-color')
ON CONFLICT (id) DO NOTHING;

-- Nails subcategories  
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('nails-manicure', 'Manikyr', 'Behandling av hendene og neglene', 'nails-main'),
  ('nails-pedicure', 'Pedikyr', 'Behandling av føttene og tåneglene', 'nails-main'),
  ('nails-gel', 'Gellakk', 'Gellakk påføring og design', 'nails-main'),
  ('nails-extensions', 'Negleforlengelse', 'Kunstige negler og forlengelse', 'nails-main')
ON CONFLICT (id) DO NOTHING;

-- Nails sub-subcategories
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('nails-gel-basic', 'Gellakk basic', 'Enkelt gellakk i én farge', 'nails-gel'),
  ('nails-gel-french', 'French manikyr', 'Klassisk french manikyr med gellakk', 'nails-gel'),
  ('nails-gel-design', 'Negledesign', 'Kreativt design og nail art', 'nails-gel')
ON CONFLICT (id) DO NOTHING;

-- Makeup subcategories
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('makeup-everyday', 'Daglig sminke', 'Naturlig sminke for hverdagen', 'makeup-main'),
  ('makeup-evening', 'Aftensminke', 'Sminke for spesielle anledninger', 'makeup-main'),
  ('makeup-special', 'Spesialsminke', 'Sminke for foto, scene eller teater', 'makeup-main')
ON CONFLICT (id) DO NOTHING;

-- Lashes and brows subcategories
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('lashes-extensions', 'Vippeforlengelse', 'Påføring av kunstige vipper', 'lashes-brows-main'),
  ('lashes-lift', 'Vippecurl', 'Curling og løft av naturlige vipper', 'lashes-brows-main'),
  ('brows-shaping', 'Brynforming', 'Forming og rydding av øyenbryn', 'lashes-brows-main'),
  ('brows-tinting', 'Brynfarging', 'Farging av øyenbryn', 'lashes-brows-main')
ON CONFLICT (id) DO NOTHING;

-- Wedding subcategories
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('wedding-bridal-makeup', 'Brudesminke', 'Sminke for bruden på bryllupsdagen', 'wedding-main'),
  ('wedding-bridal-hair', 'Brudehår', 'Hårstyling for bruden', 'wedding-main'),
  ('wedding-party', 'Brudefølge', 'Sminke og hår for brudefølget', 'wedding-main'),
  ('wedding-trial', 'Prøvesminke', 'Prøvesminke og hårstyling før bryllupet', 'wedding-main')
ON CONFLICT (id) DO NOTHING;

-- Wedding sub-subcategories
INSERT INTO service_categories (id, name, description, parent_category_id) VALUES
  ('wedding-makeup-natural', 'Naturlig brudesminke', 'Naturlig og tidløs brudesminke', 'wedding-bridal-makeup'),
  ('wedding-makeup-glamour', 'Glamourøs brudesminke', 'Dramatisk og glamourøs brudesminke', 'wedding-bridal-makeup'),
  ('wedding-hair-updo', 'Oppsatt brudehår', 'Elegant oppsatt frisyre for bruden', 'wedding-bridal-hair'),
  ('wedding-hair-loose', 'Løst brudehår', 'Løse bølger og styling for bruden', 'wedding-bridal-hair')
ON CONFLICT (id) DO NOTHING;