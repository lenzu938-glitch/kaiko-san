import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Gamepad2, MessageCircle, Send, Shield, Skull, Users, X } from 'lucide-react';

const GAMES = {
  wordwolf: { name: 'ワードウルフ', minPlayers: 3, maxPlayers: 8, description: '少数派のお題を見つけよう。話し合いのあとに投票します。' },
  werewolf: { name: '人狼', minPlayers: 5, maxPlayers: 8, description: '村人・占い師・騎士と人狼に分かれて、昼の投票と夜の行動で勝利を目指します。' }
};

const ROLE_LABELS = {
  werewolf: '人狼',
  seer: '占い師',
  doctor: '騎士',
  villager: '村人',
  'ワードウルフ': 'ワードウルフ',
  '多数派': '多数派'
};

export default function Minigames({ displayName, schoolName }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [room, setRoom] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [chatText, setChatText] = useState('');
  const [privateRole, setPrivateRole] = useState(null);
  const [privateWord, setPrivateWord] = useState('');
  const [seerResult, setSeerResult] = useState('');
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);
  const hot = import.meta.hot;

  useEffect(() => {
    if (!hot) return undefined;
    const handleState = nextRoom => {
      setRoom(nextRoom);
      setSelectedTargetId('');
      setIsSearching(nextRoom.mode === 'random' && nextRoom.status === 'lobby');
      setError('');
    };
    const handlePrivate = payload => {
      if (payload.role) setPrivateRole(payload.role);
      if (payload.word) setPrivateWord(payload.word);
      if (payload.lastResult) setSeerResult(payload.lastResult);
    };
    const handleError = payload => setError(payload.message || 'ゲーム通信中に問題が発生しました。');
    const handleLeft = () => {
      setRoom(null);
      setIsSearching(false);
      setPrivateRole(null);
      setPrivateWord('');
      setSeerResult('');
      setSelectedTargetId('');
    };
    hot.on('minigame:state', handleState);
    hot.on('minigame:private', handlePrivate);
    hot.on('minigame:error', handleError);
    hot.on('minigame:left', handleLeft);
    return () => {
      hot.off('minigame:state', handleState);
      hot.off('minigame:private', handlePrivate);
      hot.off('minigame:error', handleError);
      hot.off('minigame:left', handleLeft);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [room?.messages?.length]);

  const sendCommand = command => {
    if (!hot) {
      setError('ゲーム機能は現在の開発サーバーでのみ利用できます。');
      return;
    }
    hot.send('minigame:command', {
      ...command,
      name: displayName,
      school: schoolName
    });
  };

  const leaveRoom = () => {
    sendCommand({ type: 'leave' });
    setRoom(null);
    setIsSearching(false);
    setPrivateRole(null);
    setPrivateWord('');
    setSeerResult('');
    setSelectedTargetId('');
    setError('');
  };

  const startRandomMatch = game => {
    setSelectedGame(game);
    setIsSearching(true);
    setError('');
    setRoom(null);
    sendCommand({ type: 'random', game });
  };

  const createGroup = () => {
    if (!selectedGame) return;
    setError('');
    sendCommand({ type: 'create', game: selectedGame });
  };

  const joinGroup = event => {
    event.preventDefault();
    if (!selectedGame || !inviteCode.trim()) return;
    setError('');
    sendCommand({ type: 'join', game: selectedGame, code: inviteCode.trim().toUpperCase() });
  };

  const submitChat = event => {
    event.preventDefault();
    const text = chatText.trim();
    if (!text) return;
    sendCommand({ type: 'chat', text });
    setChatText('');
  };

  const submitAction = () => {
    if (!selectedTargetId || !room) return;
    if (room.game === 'werewolf' && room.phase === 'night') sendCommand({ type: 'night-action', targetId: selectedTargetId });
    else sendCommand({ type: 'vote', targetId: selectedTargetId });
    setSelectedTargetId('');
  };

  const isHost = room?.hostId === room?.playerId;
  const minPlayers = room ? GAMES[room.game].minPlayers : selectedGame ? GAMES[selectedGame].minPlayers : 0;
  const availableTargets = room?.players.filter(player => player.alive && player.id !== room.playerId) || [];

  if (!selectedGame && !room) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <header className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Gamepad2 className="h-5 w-5" /></div>
          <div><h2 className="text-lg font-bold">ミニゲーム</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">グループで集まるか、同じ学校の人とランダムで遊ぼう</p></div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(GAMES).map(([id, game]) => (
            <button key={id} type="button" onClick={() => { setSelectedGame(id); setError(''); }} className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20">
              <span className="flex items-center justify-between"><span className="font-bold">{game.name}</span>{id === 'werewolf' ? <Skull className="h-5 w-5 text-rose-500" /> : <Users className="h-5 w-5 text-indigo-500" />}</span>
              <span className="mt-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{game.description}</span>
              <span className="mt-4 block text-[10px] font-semibold text-slate-400">{game.minPlayers}〜{game.maxPlayers}人</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!room) {
    const game = GAMES[selectedGame];
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <header className="mb-6 flex items-center gap-3">
          <button type="button" onClick={() => { setSelectedGame(null); setError(''); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="ゲーム選択に戻る"><ArrowLeft className="h-5 w-5" /></button>
          <div><h2 className="text-lg font-bold">{game.name}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{game.minPlayers}〜{game.maxPlayers}人で遊べます</p></div>
        </header>
        <section className="space-y-5 border-y border-slate-200 py-5 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold">グループで遊ぶ</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ルームを作ってコードを共有するか、友だちのコードで参加します。</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={createGroup} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700">グループを作成</button>
              <form onSubmit={joinGroup} className="flex min-w-0 flex-1 gap-2">
                <input value={inviteCode} onChange={event => setInviteCode(event.target.value)} maxLength={8} placeholder="招待コード" aria-label="ゲームグループ招待コード" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs uppercase dark:border-slate-700 dark:bg-slate-900" />
                <button type="submit" disabled={!inviteCode.trim()} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50 dark:border-slate-700">参加</button>
              </form>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
            <h3 className="text-sm font-bold">ランダムマッチ</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">同じ学校を選択している参加者と自動でマッチします。位置情報は取得しません。</p>
            <button type="button" onClick={() => startRandomMatch(selectedGame)} className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"><Users className="h-4 w-4" />同じ学校の人とマッチ</button>
          </div>
        </section>
        {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
        <p className="mt-4 text-[10px] leading-relaxed text-slate-400">この試作のマッチングと部屋情報は開発サーバー上のメモリーに保存されます。サーバーを再起動すると終了します。</p>
      </div>
    );
  }

  const isLobby = room.status === 'lobby';
  const myPlayer = room.players.find(player => player.id === room.playerId);
  const myRole = privateRole || myPlayer?.role;
  const roleInstructions = room.game === 'werewolf'
    ? ({ werewolf: '夜に人狼以外の相手を選び、襲撃します。', seer: '夜に相手を選び、人狼かどうかを占います。', doctor: '夜に相手を選び、襲撃から守ります。', villager: '会話と投票で人狼を見つけます。' }[myRole] || '役職情報を受信中です。')
    : 'みんなで会話して、少数派のお題を持つ人を探します。';

  return (
    <div className="mx-auto flex h-[calc(100vh-1rem)] min-h-[560px] max-w-3xl flex-col p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{room.game === 'werewolf' ? <Skull className="h-5 w-5" /> : <Users className="h-5 w-5" />}</span>
          <div className="min-w-0"><h2 className="truncate text-base font-bold">{GAMES[room.game].name}</h2><p className="mt-1 text-[10px] text-slate-400">ルーム {room.code}・{room.players.length}/{GAMES[room.game].maxPlayers}人</p></div>
        </div>
        <button type="button" onClick={leaveRoom} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">退出</button>
      </header>

      {isLobby ? (
        <div className="grid flex-1 gap-5 overflow-y-auto py-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <section>
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-bold">参加者</h3><p className="mt-1 text-xs text-slate-500">開始まで{Math.max(0, minPlayers - room.players.length)}人必要</p></div>
              {room.mode === 'group' && <button type="button" onClick={() => navigator.clipboard.writeText(room.code).then(() => setError('招待コードをコピーしました。')).catch(() => setError('コピーできませんでした。'))} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700">コード {room.code} をコピー</button>}
            </div>
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {room.players.map(player => <li key={player.id} className="flex items-center gap-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold dark:bg-slate-800">{player.name.slice(0, 1)}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{player.name}</span>{player.id === room.hostId && <span className="text-[10px] text-indigo-600 dark:text-indigo-400">ホスト</span>}</li>)}
            </ul>
            {isSearching && <p className="mt-4 text-xs text-emerald-700 dark:text-emerald-300" role="status">同じ学校の参加者を探しています...</p>}
          </section>
          <aside className="border-t border-slate-200 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0 dark:border-slate-800">
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{GAMES[room.game].description}</p>
            {isHost && <button type="button" onClick={() => sendCommand({ type: 'start' })} disabled={room.players.length < minPlayers} className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">ゲーム開始</button>}
            {!isHost && <p className="mt-4 text-[10px] leading-relaxed text-slate-400">ホストが参加人数を確認して開始します。</p>}
          </aside>
        </div>
      ) : room.status === 'finished' ? (
        <section className="flex-1 overflow-y-auto py-6">
          <div className="mb-5 text-center"><p className="text-xs text-slate-500">ゲーム終了</p><h3 className="mt-2 text-2xl font-bold">{room.result?.winner}の勝利</h3><p className="mt-2 text-sm text-slate-500">{room.result?.detail}</p></div>
          <ul className="divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-800 dark:border-slate-800">
            {room.result?.players.map(player => <li key={player.id} className="flex items-center gap-3 py-3 text-sm"><span className="min-w-0 flex-1 truncate">{player.name}{player.alive === false ? '（脱落）' : ''}</span><span className="text-xs font-semibold text-slate-500">{ROLE_LABELS[player.role] || player.role}{player.word ? `・${player.word}` : ''}</span></li>)}
          </ul>
          <p className="mt-4 text-center text-xs text-slate-400">退出後、同じゲームをもう一度選べます。</p>
        </section>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 py-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <section className="flex min-h-0 flex-col">
            <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/40">
              <div className="flex items-center gap-2 text-xs font-bold"><Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />{room.game === 'werewolf' ? `あなたの役職: ${ROLE_LABELS[myRole] || '確認中'}` : `あなたのお題: ${privateWord || '配布中...'}`}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">{roleInstructions}</p>
              {seerResult && myRole === 'seer' && <p className="mt-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">{seerResult}</p>}
            </div>

            {room.game === 'wordwolf' && room.phase === 'discussion' && isHost && <button type="button" onClick={() => sendCommand({ type: 'advance' })} className="mb-3 self-start rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700">投票へ進む</button>}
            {room.game === 'werewolf' && room.phase === 'day' && isHost && <button type="button" onClick={() => sendCommand({ type: 'advance' })} className="mb-3 self-start rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700">夜に進む</button>}

            <div className="mb-2 flex items-center justify-between text-xs">
              <h3 className="font-bold">{room.phase === 'night' ? '夜の行動' : room.phase.includes('vote') ? '投票' : 'みんなの会話'}</h3>
              {room.phase.includes('vote') && <span className="text-slate-400">投票 {room.submittedCount}/{room.players.filter(player => player.alive).length}</span>}
              {room.phase === 'night' && <span className="text-slate-400">行動 {room.submittedCount}人</span>}
            </div>

            {room.phase.includes('vote') || (room.phase === 'night' && ['werewolf', 'seer', 'doctor'].includes(myRole)) ? (
              <div className="mb-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  {availableTargets.map(target => <button key={target.id} type="button" disabled={room.hasSubmitted} onClick={() => setSelectedTargetId(target.id)} className={`truncate rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${selectedTargetId === target.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}>{target.name}</button>)}
                </div>
                <button type="button" disabled={!selectedTargetId || room.hasSubmitted || !myPlayer?.alive} onClick={submitAction} className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{room.hasSubmitted ? '送信済み・他の人を待っています' : room.phase === 'night' ? '夜の行動を確定' : '投票する'}</button>
              </div>
            ) : null}
            {room.phase === 'night' && !['werewolf', 'seer', 'doctor'].includes(myRole) && <p className="mb-3 rounded-lg bg-slate-100 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">今夜の行動を待っています。</p>}

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              {room.messages.map(message => <div key={message.id} className="text-xs"><div className="flex items-baseline justify-between gap-2"><span className={`font-bold ${message.sender === 'システム' ? 'text-indigo-600 dark:text-indigo-300' : ''}`}>{message.sender}</span><time className="shrink-0 text-[9px] text-slate-400">{new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p className="mt-1 whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-200">{message.text}</p></div>)}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={submitChat} className="mt-2 flex gap-2">
              <input value={chatText} onChange={event => setChatText(event.target.value)} maxLength={200} disabled={!myPlayer?.alive} placeholder={myPlayer?.alive ? 'メッセージを入力...' : '脱落中は発言できません'} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900" />
              <button type="submit" disabled={!chatText.trim() || !myPlayer?.alive} aria-label="メッセージを送信" className="rounded-lg bg-indigo-600 p-2 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </form>
          </section>

          <aside className="hidden min-h-0 flex-col border-l border-slate-200 pl-4 md:flex dark:border-slate-800">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold"><Users className="h-4 w-4" />参加者</h3>
            <ul className="flex-1 space-y-1 overflow-y-auto">
              {room.players.map(player => <li key={player.id} className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs ${player.alive ? '' : 'text-slate-400 line-through'}`}><span className="min-w-0 flex-1 truncate">{player.name}{player.id === room.playerId ? '（自分）' : ''}</span>{player.id === room.hostId && <span className="text-[9px] text-indigo-600">ホスト</span>}</li>)}
            </ul>
            {room.phase === 'werewolf-vote' && room.game === 'werewolf' && <p className="mt-2 text-[10px] text-slate-400">昼の投票で最多票の人を追放します。</p>}
          </aside>
        </div>
      )}
      {error && <div className="mt-2 flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="エラーを閉じる"><X className="h-4 w-4" /></button></div>}
      {room.status === 'playing' && <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><MessageCircle className="h-3 w-3" />会話と役職はこのルーム参加者に共有されます。</div>}
    </div>
  );
}