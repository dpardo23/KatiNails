-- Prueba mínima del entorno de pgTAP: confirma que la base de pruebas arranca con sus esquemas.
-- Las pruebas de RLS y permisos por rol se agregan con la primera migración.
begin;
select plan(3);

select has_schema('public', 'existe el esquema public');
select has_schema('auth', 'existe el esquema auth de Supabase');
select has_schema('storage', 'existe el esquema storage de Supabase');

select * from finish();
rollback;
