-- Supabase 테이블 생성 및 RLS 정책 설정
create table if not exists public.good_deeds (
  id uuid primary key,
  author text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS 활성화 및 정책 (익명 읽기/쓰기/삭제 허용)
alter table public.good_deeds enable row level security;

-- 기존 정책이 있으면 삭제
drop policy if exists "Allow anonymous read" on public.good_deeds;
drop policy if exists "Allow anonymous insert" on public.good_deeds;
drop policy if exists "Allow anonymous delete" on public.good_deeds;

-- 새 정책 생성
create policy "Allow anonymous read"
  on public.good_deeds for select
  to anon using (true);

create policy "Allow anonymous insert"
  on public.good_deeds for insert
  to anon with check (true);

create policy "Allow anonymous delete"
  on public.good_deeds for delete
  to anon using (true);
