import { useEffect, useState } from 'react';
import { ImagePlus, Music2, Plus, Send, X } from 'lucide-react';

const STORY_STORAGE_KEY = 'campus-stories';
const NOTE_STORAGE_KEY = 'campus-notes';
const STORY_LIFETIME = 24 * 60 * 60 * 1000;

const readStoredItems = key => {
  try {
    const items = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const getMusicEmbedUrl = value => {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'open.spotify.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const typeIndex = parts.findIndex(part => ['track', 'album', 'playlist', 'episode', 'show'].includes(part));
      const type = parts[typeIndex];
      const id = parts[typeIndex + 1];
      return type && /^[a-zA-Z0-9]+$/.test(id || '')
        ? `https://open.spotify.com/embed/${type}/${id}`
        : null;
    }
    if (['youtube.com', 'music.youtube.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      return /^[a-zA-Z0-9_-]{11}$/.test(id || '')
        ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1`
        : null;
    }
  } catch {
    return null;
  }
  return null;
};

const compressImage = file => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    reject(new Error('画像は5MB以下のファイルを選んでください。'));
    return;
  }
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(imageUrl);
    resolve(canvas.toDataURL('image/jpeg', 0.78));
  };
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    reject(new Error('画像を読み込めませんでした。'));
  };
  image.src = imageUrl;
});

const formatAge = createdAt => {
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  return `${Math.floor(minutes / 60)}時間前`;
};

export default function StoryAndNotes({ displayName, avatar }) {
  const [stories, setStories] = useState(() => readStoredItems(STORY_STORAGE_KEY).filter(story => story.expiresAt > Date.now()));
  const [notes, setNotes] = useState(() => readStoredItems(NOTE_STORAGE_KEY).filter(note => !note.expiresAt || note.expiresAt > Date.now()));
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);
  const [isNoteComposerOpen, setIsNoteComposerOpen] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyImage, setStoryImage] = useState('');
  const [noteText, setNoteText] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [activeStoryOwner, setActiveStoryOwner] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [activeNote, setActiveNote] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(stories));
    } catch {
      setError('保存容量が不足しています。古いストーリーを削除してください。');
    }
  }, [stories]);

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      setError('ノートを保存できませんでした。');
    }
  }, [notes]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStories(current => current.filter(story => story.expiresAt > Date.now()));
      setNotes(current => current.filter(note => !note.expiresAt || note.expiresAt > Date.now()));
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const activeStories = stories.filter(story => story.owner === activeStoryOwner);
  const activeStory = activeStories[activeStoryIndex];
  const storiesByOwner = stories.reduce((groups, story) => {
    groups[story.owner] = [...(groups[story.owner] || []), story];
    return groups;
  }, {});
  const storyOwners = Object.keys(storiesByOwner).sort((first, second) => (
    first === displayName ? -1 : second === displayName ? 1 : storiesByOwner[second][0].createdAt - storiesByOwner[first][0].createdAt
  ));

  useEffect(() => {
    if (!activeStory) return undefined;
    const timer = window.setTimeout(() => {
      if (activeStoryIndex < activeStories.length - 1) setActiveStoryIndex(index => index + 1);
      else setActiveStoryOwner(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [activeStory, activeStoryIndex, activeStories.length]);

  const addStory = event => {
    event.preventDefault();
    if (!storyText.trim() && !storyImage) {
      setError('文章か画像を追加してください。');
      return;
    }
    const createdAt = Date.now();
    setStories(current => [...current, {
      id: crypto.randomUUID(),
      owner: displayName,
      text: storyText.trim(),
      image: storyImage,
      createdAt,
      expiresAt: createdAt + STORY_LIFETIME
    }]);
    setStoryText('');
    setStoryImage('');
    setError('');
    setIsStoryComposerOpen(false);
  };

  const addNote = event => {
    event.preventDefault();
    if (!noteText.trim() && !songUrl.trim()) {
      setError('文章か曲を追加してください。');
      return;
    }
    const cleanSongUrl = songUrl.trim();
    if (cleanSongUrl && !getMusicEmbedUrl(cleanSongUrl)) {
      setError('曲はSpotifyまたはYouTubeの共有URLを入力してください。');
      return;
    }
    const createdAt = Date.now();
    const note = { id: crypto.randomUUID(), owner: displayName, text: noteText.trim(), songUrl: cleanSongUrl, createdAt, expiresAt: createdAt + STORY_LIFETIME };
    setNotes(current => [note, ...current.filter(item => item.owner !== displayName)]);
    setNoteText('');
    setSongUrl('');
    setError('');
    setIsNoteComposerOpen(false);
  };

  const handleStoryImage = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setStoryImage(await compressImage(file));
      setError('');
    } catch (imageError) {
      setError(imageError.message);
    }
  };

  const closeComposers = () => {
    setIsStoryComposerOpen(false);
    setIsNoteComposerOpen(false);
    setError('');
  };

  return (
    <>
      <section className="border-b border-slate-100 px-4 py-4 dark:border-slate-800" aria-label="ストーリー">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">ストーリー</h3>
          <span className="text-[10px] text-slate-400">24時間で消えます</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          <button type="button" onClick={() => { setError(''); setIsStoryComposerOpen(true); }} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center" aria-label="ストーリーを追加">
            <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : displayName.slice(0, 1)}<span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white"><Plus className="h-3 w-3" /></span></span>
            <span className="w-full truncate text-[10px]">ストーリー</span>
          </button>
          {storyOwners.map(owner => {
            const ownStory = owner === displayName;
            return (
              <button key={owner} type="button" onClick={() => { setActiveStoryOwner(owner); setActiveStoryIndex(0); }} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
                <span className={`flex h-14 w-14 items-center justify-center rounded-full p-[2px] ${ownStory ? 'bg-slate-300 dark:bg-slate-600' : 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600'}`}>
                  <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-sm font-bold text-slate-700 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-200">
                    {ownStory && avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : owner.slice(0, 1)}
                  </span>
                </span>
                <span className="w-full truncate text-[10px]">{ownStory ? '自分' : owner}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-b border-slate-100 px-4 py-4 dark:border-slate-800" aria-label="ノート">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">ノート</h3>
          <button type="button" onClick={() => { setError(''); setIsNoteComposerOpen(true); }} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400" aria-label="ノートを作成"><Plus className="h-4 w-4" />作成</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          <button type="button" onClick={() => { setError(''); setIsNoteComposerOpen(true); }} className="w-36 shrink-0 rounded-2xl border border-dashed border-slate-300 p-3 text-left transition hover:border-indigo-400 dark:border-slate-700 dark:hover:border-indigo-500">
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">{displayName.slice(0, 1)}</span>
            <span className="block truncate text-[10px] font-semibold">自分のノート</span>
            <span className="mt-1 block text-[10px] text-slate-400">今の気分をシェア</span>
          </button>
          {notes.filter(note => note.owner !== displayName).map(note => (
            <button key={note.id} type="button" onClick={() => setActiveNote(note)} className="w-36 shrink-0 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-700">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{note.owner.slice(0, 1)}</span>
              <span className="block truncate text-[10px] font-semibold">{note.owner}</span>
              <span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">{note.text || '曲をシェア'}{note.songUrl && <Music2 className="ml-1 inline h-3 w-3" />}</span>
            </button>
          ))}
          {notes.filter(note => note.owner === displayName).map(note => (
            <button key={note.id} type="button" onClick={() => setActiveNote(note)} className="w-36 shrink-0 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-700">
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{displayName.slice(0, 1)}</span>
              <span className="block truncate text-[10px] font-semibold">自分のノート</span>
              <span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">{note.text || '曲をシェア'}{note.songUrl && <Music2 className="ml-1 inline h-3 w-3" />}</span>
            </button>
          ))}
        </div>
      </section>

      {(isStoryComposerOpen || isNoteComposerOpen) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) closeComposers(); }}>
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="story-note-dialog-title">
            <header className="mb-4 flex items-center justify-between">
              <h2 id="story-note-dialog-title" className="text-base font-bold">{isStoryComposerOpen ? 'ストーリーを作成' : 'ノートを作成'}</h2>
              <button type="button" onClick={closeComposers} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="閉じる"><X className="h-5 w-5" /></button>
            </header>
            {isStoryComposerOpen ? (
              <form onSubmit={addStory} className="space-y-4">
                <textarea value={storyText} onChange={event => setStoryText(event.target.value)} maxLength={300} rows={4} placeholder="今の瞬間をシェア..." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
                {storyImage && <div className="relative overflow-hidden rounded-xl"><img src={storyImage} alt="ストーリーのプレビュー" className="max-h-64 w-full object-contain" /><button type="button" onClick={() => setStoryImage('')} className="absolute right-2 top-2 rounded-full bg-slate-950/70 p-1.5 text-white" aria-label="画像を削除"><X className="h-4 w-4" /></button></div>}
                <div className="flex items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><ImagePlus className="h-4 w-4" />画像を追加<input type="file" accept="image/*" onChange={handleStoryImage} className="sr-only" /></label>
                  <span className="text-[10px] text-slate-400">24時間で自動削除</span>
                </div>
                {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
                <button type="submit" disabled={!storyText.trim() && !storyImage} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"><Send className="h-4 w-4" />シェア</button>
              </form>
            ) : (
              <form onSubmit={addNote} className="space-y-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">文章 <span className="font-normal text-slate-400">{noteText.length}/60</span>
                  <textarea value={noteText} onChange={event => setNoteText(event.target.value)} maxLength={60} rows={3} placeholder="今の気分は？" className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-800" />
                </label>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300"><span className="flex items-center gap-1.5"><Music2 className="h-4 w-4" />曲を追加（任意）</span>
                  <input value={songUrl} onChange={event => setSongUrl(event.target.value)} type="url" placeholder="SpotifyまたはYouTubeの共有URL" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-normal dark:border-slate-700 dark:bg-slate-800" />
                </label>
                <p className="text-[10px] leading-relaxed text-slate-400">曲はSpotifyまたはYouTubeの公式プレイヤーで再生します。再生には各サービスの利用条件が適用されます。</p>
                {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
                <button type="submit" disabled={!noteText.trim() && !songUrl.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"><Send className="h-4 w-4" />シェア</button>
              </form>
            )}
          </section>
        </div>
      )}

      {activeStory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-3" onMouseDown={event => { if (event.target === event.currentTarget) setActiveStoryOwner(null); }}>
          <section className="relative flex h-[min(82vh,720px)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-slate-900 text-white" role="dialog" aria-modal="true" aria-label={`${activeStory.owner}のストーリー`}>
            <div className="absolute left-3 right-3 top-3 z-10 h-0.5 overflow-hidden rounded bg-white/40"><div key={`${activeStory.id}-${activeStoryIndex}`} className="story-progress h-full origin-left bg-white" /></div>
            <header className="z-10 flex items-center justify-between px-4 pb-3 pt-6">
              <span className="text-xs font-semibold">{activeStory.owner} <span className="ml-1 font-normal text-white/70">{formatAge(activeStory.createdAt)}</span></span>
              <button type="button" onClick={() => setActiveStoryOwner(null)} aria-label="ストーリーを閉じる" className="rounded-lg p-1 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </header>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-800">
              {activeStory.image && <img src={activeStory.image} alt="ストーリー画像" className="absolute inset-0 h-full w-full object-contain" />}
              {activeStory.text && <p className="relative z-10 max-h-full overflow-y-auto whitespace-pre-wrap break-words px-6 py-5 text-center text-lg font-semibold [text-shadow:0_1px_8px_rgb(0_0_0_/_0.8)]">{activeStory.text}</p>}
              <button type="button" onClick={() => activeStoryIndex > 0 ? setActiveStoryIndex(index => index - 1) : setActiveStoryOwner(null)} className="absolute inset-y-0 left-0 w-1/3" aria-label="前のストーリー" />
              <button type="button" onClick={() => activeStoryIndex < activeStories.length - 1 ? setActiveStoryIndex(index => index + 1) : setActiveStoryOwner(null)} className="absolute inset-y-0 right-0 w-1/3" aria-label="次のストーリー" />
            </div>
          </section>
        </div>
      )}

      {activeNote && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setActiveNote(null); }}>
          <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-label={`${activeNote.owner}のノート`}>
            <header className="mb-4 flex items-center justify-between">
              <span className="text-xs font-bold">{activeNote.owner} <span className="ml-1 font-normal text-slate-400">{formatAge(activeNote.createdAt)}</span></span>
              <button type="button" onClick={() => setActiveNote(null)} aria-label="ノートを閉じる" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </header>
            {activeNote.text && <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed">{activeNote.text}</p>}
            {activeNote.songUrl && <iframe title={`${activeNote.owner}がシェアした曲`} src={getMusicEmbedUrl(activeNote.songUrl)} className={`w-full rounded-xl border-0 ${getMusicEmbedUrl(activeNote.songUrl)?.includes('youtube-nocookie.com') ? 'aspect-video' : 'h-[152px]'}`} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />}
            {activeNote.owner === displayName && <button type="button" onClick={() => { setNotes(current => current.filter(note => note.id !== activeNote.id)); setActiveNote(null); }} className="mt-4 text-xs font-semibold text-rose-600 hover:underline">ノートを削除</button>}
          </section>
        </div>
      )}
    </>
  );
}