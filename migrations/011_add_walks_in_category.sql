-- Add the "Walks In" person category (and allow 'freelancer', which the
-- register-entry form already offers but the CHECK constraint rejects).
ALTER TABLE public.persons DROP CONSTRAINT IF EXISTS persons_person_category_check;
ALTER TABLE public.persons ADD CONSTRAINT persons_person_category_check
  CHECK (person_category IN (
    'employee',
    'guest',
    'rental_company',
    'delivery',
    'contractor',
    'supplier',
    'freelancer',
    'walks_in',
    'other'
  ));
