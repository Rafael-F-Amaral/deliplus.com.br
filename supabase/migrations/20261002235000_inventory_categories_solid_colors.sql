-- Atualização dos padrões e categorias existentes para cores sólidas com texto branco
ALTER TABLE public.inventory_categories 
  ALTER COLUMN color_bg SET DEFAULT '#475569',
  ALTER COLUMN color_text SET DEFAULT '#FFFFFF';

UPDATE public.inventory_categories
SET 
  color_bg = CASE 
    WHEN name ILIKE '%mercearia%' THEN '#2E4233'
    WHEN name ILIKE '%frios%' THEN '#2563EB'
    WHEN name ILIKE '%embalagens%' THEN '#9333EA'
    WHEN name ILIKE '%hortifruti%' THEN '#16A34A'
    WHEN name ILIKE '%padaria%' THEN '#D97706'
    WHEN color_bg = '#F4F5EE' THEN '#2E4233'
    WHEN color_bg = '#E0F2FE' THEN '#2563EB'
    WHEN color_bg = '#F3E8FF' THEN '#9333EA'
    WHEN color_bg = '#ECFCCB' THEN '#16A34A'
    WHEN color_bg = '#FEF3C7' THEN '#D97706'
    WHEN color_bg = '#D1FAE5' THEN '#16A34A'
    WHEN color_bg = '#E2E8F0' THEN '#475569'
    WHEN color_bg = '#CB5A3C' THEN '#CB5A3C'
    WHEN color_bg = '#2563EB' THEN '#2563EB'
    ELSE '#475569'
  END,
  color_text = '#FFFFFF';
