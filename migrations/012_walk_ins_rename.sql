-- Rename the "Walks In" person category to WALK-INS (value walk_in).
-- No rows use the value, so the constraint can simply be redefined.
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
    'walk_in',
    'other'
  ));
