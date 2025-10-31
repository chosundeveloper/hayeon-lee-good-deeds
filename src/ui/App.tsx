import React, { useEffect, useMemo, useState } from 'react';
import { supabase, hasSupabaseEnv } from '../lib/supabaseClient';

export type GoodDeed = {
	id: string;
	author: string;
	content: string;
	createdAt: string; // ISO
};

const STORAGE_KEY = 'hayeon-good-deeds:v1';

async function fetchDeedsFromSupabase(): Promise<GoodDeed[]> {
	const { data, error } = await supabase
		.from('good_deeds')
		.select('*')
		.order('created_at', { ascending: false });
	if (error) {
		console.error('Supabase fetch error:', error);
		throw error;
	}
	// Supabase는 스네이크 케이스로 반환, 카멜케이스로 변환
	return (data ?? []).map((row: any) => ({
		id: row.id,
		author: row.author,
		content: row.content,
		createdAt: row.created_at || row.createdAt || new Date().toISOString()
	})) as GoodDeed[];
}

async function insertDeedToSupabase(deed: GoodDeed): Promise<void> {
	// 카멜케이스를 스네이크 케이스로 변환
	const row = {
		id: deed.id,
		author: deed.author,
		content: deed.content,
		created_at: deed.createdAt
	};
	const { error } = await supabase.from('good_deeds').insert(row);
	if (error) {
		console.error('Supabase insert error:', error);
		throw error;
	}
}

async function deleteDeedFromSupabase(id: string): Promise<void> {
	const { error } = await supabase.from('good_deeds').delete().eq('id', id);
	if (error) {
		console.error('Supabase delete error:', error);
		throw error;
	}
}

function loadDeeds(): GoodDeed[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as GoodDeed[]) : [];
	} catch {
		return [];
	}
}

function saveDeeds(deeds: GoodDeed[]): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(deeds));
}

export const App: React.FC = () => {
	const [author, setAuthor] = useState('');
	const [content, setContent] = useState('');
	const [deeds, setDeeds] = useState<GoodDeed[]>([]);
	const [query, setQuery] = useState('');
	const [supabaseError, setSupabaseError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		(async () => {
			setIsLoading(true);
			setSupabaseError(null);
			if (hasSupabaseEnv) {
				try {
					const remote = await fetchDeedsFromSupabase();
					setDeeds(remote);
					setIsLoading(false);
					return;
				} catch (error) {
					console.error('Supabase 로드 실패:', error);
					setSupabaseError(error instanceof Error ? error.message : 'Supabase 연결 실패');
					// 폴백으로 로컬 사용
				}
			}
			setDeeds(loadDeeds());
			setIsLoading(false);
		})();
	}, []);

	useEffect(() => {
		if (!hasSupabaseEnv) {
			saveDeeds(deeds);
		}
	}, [deeds]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return deeds;
		return deeds.filter(d => d.author.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
	}, [deeds, query]);

	async function addDeed(): Promise<void> {
		if (!content.trim()) return;
		const newDeed: GoodDeed = {
			id: crypto.randomUUID(),
			author: author.trim() || '익명',
			content: content.trim(),
			createdAt: new Date().toISOString()
		};
		
		if (hasSupabaseEnv) {
			try {
				await insertDeedToSupabase(newDeed);
				setDeeds(prev => [newDeed, ...prev]);
				setContent('');
				setSupabaseError(null);
			} catch (error) {
				console.error('Supabase 저장 실패:', error);
				setSupabaseError(error instanceof Error ? error.message : 'Supabase 저장 실패');
				// 폴백: 로컬에 저장
				setDeeds(prev => [newDeed, ...prev]);
				setContent('');
			}
		} else {
			setDeeds(prev => [newDeed, ...prev]);
			setContent('');
		}
	}

	async function removeDeed(id: string): Promise<void> {
		if (hasSupabaseEnv) {
			try {
				await deleteDeedFromSupabase(id);
				setDeeds(prev => prev.filter(d => d.id !== id));
				setSupabaseError(null);
			} catch (error) {
				console.error('Supabase 삭제 실패:', error);
				setSupabaseError(error instanceof Error ? error.message : 'Supabase 삭제 실패');
				// 폴백: 로컬에서만 삭제
				setDeeds(prev => prev.filter(d => d.id !== id));
			}
		} else {
			setDeeds(prev => prev.filter(d => d.id !== id));
		}
	}

	function exportJson(): void {
		const blob = new Blob([JSON.stringify(deeds, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'good-deeds.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="container">
			<header>
				<h1>이하연 미담 등록</h1>
				<p>아름다운 미담을 남겨주세요. {hasSupabaseEnv ? 'Supabase 클라우드에 저장됩니다.' : '저장은 브라우저에 보관됩니다.'}</p>
				{supabaseError && (
					<div style={{padding: '0.8rem', background: 'rgba(255, 107, 107, 0.15)', borderRadius: '0.6rem', marginTop: '0.6rem', fontSize: '0.9rem', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)'}}>
						⚠️ Supabase 오류: {supabaseError}
					</div>
				)}
			</header>

			<section className="form">
				<div className="row">
					<input
						type="text"
						placeholder="작성자 (선택)"
						value={author}
						onChange={e => setAuthor(e.target.value)}
					/>
				</div>
				<div className="row">
					<textarea
						placeholder="미담 내용을 입력하세요"
						value={content}
						onChange={e => setContent(e.target.value)}
						onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addDeed(); }}
					/>
				</div>
				<div className="actions">
					<button onClick={addDeed} disabled={!content.trim()}>등록하기 ⏎</button>
					<button onClick={exportJson} disabled={!deeds.length}>JSON 내보내기</button>
				</div>
			</section>

			<section className="toolbar">
				<input
					type="search"
					placeholder="검색 (작성자/내용)"
					value={query}
					onChange={e => setQuery(e.target.value)}
				/>
				<span className="count">총 {filtered.length}건</span>
			</section>

			<ul className="list">
				{filtered.map(d => (
					<li key={d.id}>
						<div className="meta">
							<span className="author">{d.author}</span>
							<time dateTime={d.createdAt}>{new Date(d.createdAt).toLocaleString()}</time>
						</div>
						<p className="content">{d.content}</p>
						<button className="delete" onClick={() => removeDeed(d.id)}>삭제</button>
					</li>
				))}
			</ul>

			<footer>
				<small>{hasSupabaseEnv ? 'Supabase 클라우드에 저장되어 모든 기기에서 자동 동기화됩니다.' : '브라우저 로컬 저장소에만 저장됩니다. 다른 기기와는 자동 동기화되지 않습니다.'}</small>
			</footer>
		</div>
	);
};
