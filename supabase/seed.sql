-- Sample data for Charleston Bonsai
-- Run this after the schema in Supabase SQL Editor

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Japanese Maple Deshojo',
  'japanese-maple-deshojo',
  'Acer palmatum Deshojo',
  'maple',
  850.00,
  'A stunning Japanese Maple cultivar prized for its brilliant spring foliage that emerges bright red before maturing to green. This specimen has been carefully trained for 12 years, developing excellent branch structure and a beautiful silhouette.',
  'Exceptional 12-year-old Japanese Maple with brilliant red spring foliage and excellent branch structure.',
  'intermediate',
  'medium',
  12,
  '14-16 inches',
  'Tokoname ceramic pot',
  ARRAY['/images/trees/maple-deshojo-1.jpg', '/images/trees/maple-deshojo-2.jpg', '/images/trees/maple-deshojo-3.jpg'],
  '/images/trees/maple-deshojo-thumb.jpg',
  ARRAY['Deciduous', 'Fall Color', 'Outdoor'],
  true,
  true
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Ficus Ginseng',
  'ficus-ginseng',
  'Ficus microcarpa Ginseng',
  'ficus',
  125.00,
  'Perfect for beginners, this Ficus Ginseng features an impressive bulbous root system that resembles ancient ginger roots. The thick, exposed roots support a lush canopy of small, glossy leaves.',
  'Beginner-friendly indoor bonsai with distinctive bulbous roots and glossy foliage. Great for indoor spaces.',
  'beginner',
  'small',
  5,
  '8-10 inches',
  'Glazed ceramic pot',
  ARRAY['/images/trees/ficus-ginseng-1.jpg', '/images/trees/ficus-ginseng-2.jpg'],
  '/images/trees/ficus-ginseng-thumb.jpg',
  ARRAY['Indoor', 'Evergreen', 'Low Maintenance'],
  true,
  true
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Chinese Elm',
  'chinese-elm-classic',
  'Ulmus parvifolia',
  'elm',
  275.00,
  'A classic Chinese Elm with beautifully proportioned trunk and well-developed surface roots (nebari). This specimen showcases the species characteristic small, serrated leaves and mottled bark.',
  'Classic Chinese Elm with excellent nebari and natural-looking trunk movement. Versatile for indoor/outdoor.',
  'beginner',
  'medium',
  8,
  '12-14 inches',
  'Unglazed oval pot',
  ARRAY['/images/trees/chinese-elm-1.jpg', '/images/trees/chinese-elm-2.jpg'],
  '/images/trees/chinese-elm-thumb.jpg',
  ARRAY['Semi-Deciduous', 'Indoor/Outdoor', 'Exfoliating Bark'],
  true,
  true
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Juniper Shimpaku',
  'juniper-shimpaku',
  'Juniperus chinensis Shimpaku',
  'juniper',
  450.00,
  'The Shimpaku Juniper is considered the quintessential bonsai species in Japan, prized for its naturally compact growth, fine foliage, and ability to develop deadwood features.',
  'Premium Shimpaku Juniper with flowing trunk movement and established foliage pads. Classic Japanese style.',
  'intermediate',
  'medium',
  10,
  '13-15 inches',
  'Antique Chinese pot',
  ARRAY['/images/trees/juniper-shimpaku-1.jpg', '/images/trees/juniper-shimpaku-2.jpg'],
  '/images/trees/juniper-shimpaku-thumb.jpg',
  ARRAY['Evergreen', 'Outdoor', 'Deadwood Features'],
  true,
  false
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Procumbens Juniper',
  'procumbens-juniper',
  'Juniperus procumbens',
  'juniper',
  95.00,
  'An excellent starter bonsai, this Procumbens Juniper has been trained in the cascade style, emulating a tree growing on a cliff edge. Blue-green foliage provides year-round interest.',
  'Affordable cascade-style juniper perfect for beginners. Cold hardy outdoor tree with blue-green foliage.',
  'beginner',
  'small',
  4,
  '6-8 inches cascade',
  'Cascade pot',
  ARRAY['/images/trees/procumbens-1.jpg', '/images/trees/procumbens-2.jpg'],
  '/images/trees/procumbens-thumb.jpg',
  ARRAY['Evergreen', 'Outdoor', 'Cascade Style'],
  true,
  false
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Japanese Black Pine',
  'japanese-black-pine',
  'Pinus thunbergii',
  'pine',
  1200.00,
  'A magnificent Japanese Black Pine trained in the formal upright style. This advanced specimen represents 15 years of careful training, featuring powerful surface roots and excellent taper.',
  'Museum-quality 15-year-old Black Pine with perfect taper and branch structure. A statement piece.',
  'expert',
  'large',
  15,
  '18-20 inches',
  'Antique Tokoname pot',
  ARRAY['/images/trees/black-pine-1.jpg', '/images/trees/black-pine-2.jpg'],
  '/images/trees/black-pine-thumb.jpg',
  ARRAY['Evergreen', 'Outdoor', 'Needle Reduction'],
  true,
  true
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Satsuki Azalea',
  'satsuki-azalea',
  'Rhododendron indicum',
  'azalea',
  325.00,
  'This Satsuki Azalea is a flowering masterpiece, producing masses of pink and white bicolor blooms in late spring. The trunk has excellent movement and age.',
  'Stunning flowering azalea with bicolor pink/white blooms. Beautiful trunk movement and established roots.',
  'intermediate',
  'medium',
  9,
  '11-13 inches',
  'Glazed azalea pot',
  ARRAY['/images/trees/azalea-1.jpg', '/images/trees/azalea-2.jpg'],
  '/images/trees/azalea-thumb.jpg',
  ARRAY['Flowering', 'Deciduous', 'Spring Interest'],
  true,
  false
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Ficus Retusa',
  'ficus-retusa',
  'Ficus microcarpa Retusa',
  'ficus',
  185.00,
  'A well-developed Ficus Retusa featuring the classic banyan-style aerial roots that make this species so distinctive. Thrives indoors in bright light.',
  'Tropical banyan-style Ficus with aerial roots and dense canopy. Excellent indoor bonsai.',
  'beginner',
  'medium',
  7,
  '12-14 inches',
  'Ceramic pot',
  ARRAY['/images/trees/ficus-retusa-1.jpg', '/images/trees/ficus-retusa-2.jpg'],
  '/images/trees/ficus-retusa-thumb.jpg',
  ARRAY['Indoor', 'Evergreen', 'Aerial Roots'],
  true,
  false
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Dwarf Jade',
  'dwarf-jade',
  'Portulacaria afra',
  'other',
  75.00,
  'The Dwarf Jade is a succulent bonsai that is incredibly easy to care for, making it perfect for complete beginners. Drought tolerant and forgiving of occasional neglect.',
  'Easy-care succulent bonsai perfect for beginners. Drought tolerant with quick-trunking stems.',
  'beginner',
  'mini',
  3,
  '5-6 inches',
  'Small ceramic pot',
  ARRAY['/images/trees/dwarf-jade-1.jpg', '/images/trees/dwarf-jade-2.jpg'],
  '/images/trees/dwarf-jade-thumb.jpg',
  ARRAY['Indoor', 'Succulent', 'Drought Tolerant'],
  true,
  false
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Cedar of Lebanon',
  'cedar-of-lebanon',
  'Cedrus libani',
  'cedar',
  650.00,
  'A rare and majestic Cedar of Lebanon trained as bonsai. Features characteristic flat-topped crown with tiered branches and silvery-green foliage.',
  'Rare 12-year-old Cedar of Lebanon with tiered branching and silvery foliage. Historic species.',
  'advanced',
  'large',
  12,
  '16-18 inches',
  'Handmade ceramic pot',
  ARRAY['/images/trees/cedar-1.jpg', '/images/trees/cedar-2.jpg'],
  '/images/trees/cedar-thumb.jpg',
  ARRAY['Evergreen', 'Outdoor', 'Rare Species'],
  false,
  true
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Trident Maple Forest',
  'trident-maple-forest',
  'Acer buergerianum',
  'maple',
  575.00,
  'A beautiful forest planting featuring seven Trident Maples of varying sizes, creating a natural woodland scene. The trees have been trained together for 8 years.',
  'Seven-tree Trident Maple forest planting. Natural woodland composition with fall color.',
  'intermediate',
  'large',
  8,
  '14-16 inches overall',
  'Large oval training pot',
  ARRAY['/images/trees/maple-forest-1.jpg', '/images/trees/maple-forest-2.jpg'],
  '/images/trees/maple-forest-thumb.jpg',
  ARRAY['Deciduous', 'Forest Style', 'Fall Color'],
  true,
  false
);

INSERT INTO trees (name, slug, species, tree_type, price, description, short_description, care_level, size, age, height, pot_type, images, thumbnail, features, in_stock, featured) VALUES
(
  'Bamboo Leaf Ficus',
  'bamboo-leaf-ficus',
  'Ficus nerifolia',
  'bamboo',
  145.00,
  'The Willow Leaf Ficus features narrow, graceful leaves that resemble bamboo, giving it an elegant, refined appearance. Thrives indoors with bright, indirect light.',
  'Elegant narrow-leaf Ficus with bamboo-like foliage. Refined appearance with good trunk movement.',
  'beginner',
  'small',
  6,
  '9-11 inches',
  'Rectangle ceramic pot',
  ARRAY['/images/trees/bamboo-ficus-1.jpg', '/images/trees/bamboo-ficus-2.jpg'],
  '/images/trees/bamboo-ficus-thumb.jpg',
  ARRAY['Indoor', 'Evergreen', 'Small Leaves'],
  true,
  false
);

-- Verify data was inserted
SELECT 
  name, 
  tree_type, 
  price, 
  care_level, 
  size, 
  featured,
  in_stock
FROM trees 
ORDER BY featured DESC, created_at DESC;
