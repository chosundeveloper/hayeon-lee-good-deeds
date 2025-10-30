# Hayeon Lee Good Deeds

이하연셀 미담 저장소

## Deployment
- GitHub Pages: https://chosundeveloper.github.io/hayeon-lee-good-deeds/


## Supabase 설정

1. Supabase 프로젝트 생성 후 다음 테이블을 만듭니다.

```sql
create table if not exists public.good_deeds (
  id uuid primary key,
  author text not null,
  content text not null,
  createdAt timestamptz not null
);

-- RLS 활성화 및 정책 (익명 읽기/쓰기 허용, 필요 시 강화)
alter table public.good_deeds enable row level security;
create policy "Allow anonymous read"
  on public.good_deeds for select
  to anon using (true);
create policy "Allow anonymous insert"
  on public.good_deeds for insert
  to anon with check (true);
create policy "Allow anonymous delete"
  on public.good_deeds for delete
  to anon using (true);
```

2. 프로젝트 설정 → API에서 URL과 anon 키를 확인합니다.
3. GitHub 저장소 Settings → Secrets and variables → Actions에 다음을 추가합니다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. main 브랜치로 푸시하면 CI가 빌드 시 환경변수를 주입하여 배포합니다.

> 주의: anon 키는 클라이언트에 노출됩니다. 보안 요구가 높다면 Edge Functions/서버 경유로 권한을 제한하세요.
