/**
 * Configuração pública do Supabase (frontend).
 *
 * Preencha com os dados do seu projeto:
 *   Supabase → Project Settings → API
 *
 * - url:     Project URL (ex.: https://abcdefgh.supabase.co)
 * - anonKey: chave pública "anon public"
 *
 * A chave anon é pública por design; quem protege os dados é o RLS
 * configurado em supabase/01-schema.sql. NUNCA coloque a service_role aqui.
 */
window.DF_SUPABASE = {
  url: 'https://qoehugybllbovekvrilh.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZWh1Z3libGxib3Zla3ZyaWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTI0ODcsImV4cCI6MjEwOTIyODQ4N30.JKy9XMfGBCd84qIUizDM1g8G-kcvAVAP1rF2LwVJc1k',
};
