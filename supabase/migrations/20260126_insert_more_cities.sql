-- Insert more cities
INSERT INTO cities (name, label, slug, region, description, icon_url, cover_image_url, sort_order) VALUES
('Nanjing', '南京', 'nanjing', 'China', '六朝古都，历史与现代交织的科教名城', 'https://images.unsplash.com/photo-1721021181177-1f8ad8ee81d7?w=200&fit=crop', 'https://images.unsplash.com/photo-1721021181177-1f8ad8ee81d7?w=1200&fit=crop', 10),
('Shenzhen', '深圳', 'shenzhen', 'China', '中国硅谷，创新与活力的代名词', 'https://images.unsplash.com/photo-1634647626782-f5fffa9fd9b1?w=200&fit=crop', 'https://images.unsplash.com/photo-1634647626782-f5fffa9fd9b1?w=1200&fit=crop', 20),
('Guangzhou', '广州', 'guangzhou', 'China', '千年商都，岭南文化中心', 'https://images.unsplash.com/photo-1553826059-7a090c4a3447?w=200&fit=crop', 'https://images.unsplash.com/photo-1553826059-7a090c4a3447?w=1200&fit=crop', 30),
('Suzhou', '苏州', 'suzhou', 'China', '东方威尼斯，园林之城', 'https://images.unsplash.com/photo-1548625361-8889ee393a65?w=200&fit=crop', 'https://images.unsplash.com/photo-1548625361-8889ee393a65?w=1200&fit=crop', 40),
('Hangzhou', '杭州', 'hangzhou', 'China', '人间天堂，数字经济高地', 'https://images.unsplash.com/photo-1640100385267-4b935d8ef86c?w=200&fit=crop', 'https://images.unsplash.com/photo-1640100385267-4b935d8ef86c?w=1200&fit=crop', 50),
('Chengdu', '成都', 'chengdu', 'China', '天府之国，美食与休闲之都', 'https://images.unsplash.com/photo-1693858325816-b7a7c1066838?w=200&fit=crop', 'https://images.unsplash.com/photo-1693858325816-b7a7c1066838?w=1200&fit=crop', 60),
('Tianjin', '天津', 'tianjin', 'China', '渤海明珠，中西合璧的近代名城', 'https://images.unsplash.com/photo-1627918524673-8b776269204e?w=200&fit=crop', 'https://images.unsplash.com/photo-1627918524673-8b776269204e?w=1200&fit=crop', 70)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    label = EXCLUDED.label,
    region = EXCLUDED.region,
    description = EXCLUDED.description,
    icon_url = EXCLUDED.icon_url,
    cover_image_url = EXCLUDED.cover_image_url,
    sort_order = EXCLUDED.sort_order;
