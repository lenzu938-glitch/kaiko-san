import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, AudioLines, Copy, Headphones, Mic, MicOff, PhoneOff, Plus, Radio, Users } from 'lucide-react';

const VOICE_EFFECTS = {
  standard: { label: '標準', type: 'allpass', frequency: 1000, q: 1, gain: 0, distortion: 0 },
  low: { label: '低音', type: 'lowshelf', frequency: 280, q: 1, gain: 12, distortion: 0.08 },
  radio: { label: 'ラジオ', type: 'bandpass', frequency: 1600, q: 0.9, gain: 0, distortion: 0.16 },
  robot: { label: 'ロボット', type: 'bandpass', frequency: 1000, q: 0.75, gain: 0, distortion: 0.65 }
};

const createDistortionCurve = amount => {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const strength = amount * 100;
  for (let index = 0; index < samples; index += 1) {
    const value = (index * 2) / samples - 1;
    curve[index] = ((3 + strength) * value * 20 * (Math.PI / 180)) / (Math.PI + strength * Math.abs(value));
  }
  return curve;
};

const createInviteCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
};

const loadGroups = () => {
  try {
    const savedGroups = JSON.parse(window.localStorage.getItem('campus-voice-groups') || '[]');
    return Array.isArray(savedGroups) ? savedGroups.filter(group => (
      typeof group.name === 'string' && typeof group.inviteCode === 'string'
    )) : [];
  } catch {
    return [];
  }
};

export default function GroupVoiceRoom({ displayName }) {
  const [groups, setGroups] = useState(loadGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [voiceEffect, setVoiceEffect] = useState('standard');
  const [participants, setParticipants] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('通話ルームに参加していません');
  const peersRef = useRef(new Map());
  const remoteAudioRef = useRef(new Map());
  const rawStreamRef = useRef(null);
  const processedStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef(null);
  const participantIdRef = useRef('');
  const roomRef = useRef('');
  const signalQueueRef = useRef(Promise.resolve());
  const onSignalRef = useRef(null);
  const leaveCallRef = useRef(null);
  const hot = import.meta.hot;
  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  useEffect(() => {
    window.localStorage.setItem('campus-voice-groups', JSON.stringify(groups));
  }, [groups]);

  const sendSignal = (signal) => {
    if (!hot || !participantIdRef.current) return;
    hot.send('voice:signal', {
      ...signal,
      room: roomRef.current,
      from: participantIdRef.current,
      name: displayName
    });
  };

  const applyVoiceEffect = (effectId) => {
    const nodes = audioNodesRef.current;
    const settings = VOICE_EFFECTS[effectId];
    if (!nodes || !settings) return;
    nodes.filter.type = settings.type;
    nodes.filter.frequency.setTargetAtTime(settings.frequency, nodes.context.currentTime, 0.04);
    nodes.filter.Q.setTargetAtTime(settings.q, nodes.context.currentTime, 0.04);
    nodes.filter.gain.setTargetAtTime(settings.gain, nodes.context.currentTime, 0.04);
    nodes.distortion.curve = settings.distortion ? createDistortionCurve(settings.distortion) : null;
  };

  const closePeer = (peerId) => {
    peersRef.current.get(peerId)?.close();
    peersRef.current.delete(peerId);
    const audio = remoteAudioRef.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
    }
    remoteAudioRef.current.delete(peerId);
    setParticipants(current => current.filter(participant => participant.id !== peerId));
  };

  const createPeer = (peerId, peerName) => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    processedStreamRef.current?.getAudioTracks().forEach(track => peer.addTrack(track, processedStreamRef.current));
    peer.onicecandidate = event => {
      if (event.candidate) sendSignal({ to: peerId, type: 'candidate', candidate: event.candidate.toJSON() });
    };
    peer.ontrack = event => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      let audio = remoteAudioRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudioRef.current.set(peerId, audio);
      }
      audio.srcObject = stream;
      audio.play().catch(() => setError('音声を再生できません。ページを操作してから再度お試しください。'));
      setParticipants(current => current.map(participant => (
        participant.id === peerId ? { ...participant, connected: true } : participant
      )));
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed' || peer.connectionState === 'closed') closePeer(peerId);
    };
    peer.isPolite = participantIdRef.current.localeCompare(peerId) > 0;
    peersRef.current.set(peerId, peer);
    setParticipants(current => current.some(participant => participant.id === peerId)
      ? current.map(participant => ({ ...participant, name: peerName || participant.name }))
      : [...current, { id: peerId, name: peerName || '参加者', connected: false, muted: false }]);
    return peer;
  };

  onSignalRef.current = async signal => {
    if (signal.room !== roomRef.current || signal.from === participantIdRef.current) return;
    if (signal.to && signal.to !== participantIdRef.current) return;

    if (signal.type === 'join') {
      setParticipants(current => current.some(participant => participant.id === signal.from)
        ? current
        : [...current, { id: signal.from, name: signal.name || '参加者', connected: false, muted: false }]);
      const peer = createPeer(signal.from, signal.name);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      sendSignal({ to: signal.from, type: 'offer', sdp: peer.localDescription });
      return;
    }

    if (signal.type === 'leave') {
      closePeer(signal.from);
      return;
    }
    if (signal.type === 'mute') {
      setParticipants(current => current.map(participant => (
        participant.id === signal.from ? { ...participant, muted: signal.muted } : participant
      )));
      return;
    }

    const peer = createPeer(signal.from, signal.name);
    if (signal.type === 'offer') {
      const offerCollision = peer.signalingState !== 'stable';
      if (offerCollision && !peer.isPolite) return;
      if (offerCollision) await peer.setLocalDescription({ type: 'rollback' });
      await peer.setRemoteDescription(signal.sdp);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendSignal({ to: signal.from, type: 'answer', sdp: peer.localDescription });
    } else if (signal.type === 'answer' && peer.signalingState === 'have-local-offer') {
      await peer.setRemoteDescription(signal.sdp);
    } else if (signal.type === 'candidate' && signal.candidate) {
      await peer.addIceCandidate(signal.candidate).catch(() => {});
    }
  };

  useEffect(() => {
    if (!hot) return undefined;
    const handleSignal = signal => {
      signalQueueRef.current = signalQueueRef.current
        .then(() => onSignalRef.current?.(signal))
        .catch(() => setError('通話接続の処理に失敗しました。ルームに入り直してください。'));
    };
    hot.on('voice:signal', handleSignal);
    return () => hot.off('voice:signal', handleSignal);
  }, []);

  const leaveCall = (updateState = true) => {
    if (participantIdRef.current) sendSignal({ type: 'leave' });
    peersRef.current.forEach(peer => peer.close());
    peersRef.current.clear();
    remoteAudioRef.current.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    remoteAudioRef.current.clear();
    rawStreamRef.current?.getTracks().forEach(track => track.stop());
    rawStreamRef.current = null;
    processedStreamRef.current?.getTracks().forEach(track => track.stop());
    processedStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    audioNodesRef.current = null;
    participantIdRef.current = '';
    roomRef.current = '';
    if (updateState) {
      setIsInCall(false);
      setIsMuted(false);
      setParticipants([]);
      setStatus('通話ルームに参加していません');
    }
  };
  leaveCallRef.current = leaveCall;

  useEffect(() => () => leaveCallRef.current?.(false), []);

  const joinCall = async (event) => {
    event.preventDefault();
    const normalizedRoom = selectedGroup?.inviteCode;
    if (!normalizedRoom) {
      setError('通話するグループを選択してください。');
      return;
    }
    if (!hot) {
      setError('通話のシグナリングは現在の開発サーバーでのみ利用できます。');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext || !window.RTCPeerConnection) {
      setError('このブラウザーはグループ通話に対応していません。');
      return;
    }

    setError('');
    setStatus('マイクに接続しています...');
    try {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      rawStreamRef.current = rawStream;
      const context = new AudioContext();
      audioContextRef.current = context;
      await context.resume();
      const source = context.createMediaStreamSource(rawStream);
      const filter = context.createBiquadFilter();
      const distortion = context.createWaveShaper();
      const destination = context.createMediaStreamDestination();
      source.connect(filter);
      filter.connect(distortion);
      distortion.connect(destination);

      processedStreamRef.current = destination.stream;
      audioNodesRef.current = { context, filter, distortion };
      roomRef.current = normalizedRoom;
      participantIdRef.current = crypto.randomUUID();
      applyVoiceEffect(voiceEffect);
      setParticipants([{ id: participantIdRef.current, name: displayName, connected: true, muted: false, isLocal: true }]);
      setIsInCall(true);
      setStatus(`「${selectedGroup.name}」に接続中`);
      sendSignal({ type: 'join' });
    } catch (joinError) {
      leaveCall(false);
      setStatus('通話ルームに参加していません');
      setError(joinError.name === 'NotAllowedError'
        ? 'マイクの使用が許可されませんでした。ブラウザーの設定を確認してください。'
        : 'マイクを開始できませんでした。デバイスを確認してください。');
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    processedStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = !nextMuted; });
    setIsMuted(nextMuted);
    setParticipants(current => current.map(participant => (
      participant.isLocal ? { ...participant, muted: nextMuted } : participant
    )));
    sendSignal({ type: 'mute', muted: nextMuted });
  };

  const changeVoiceEffect = event => {
    const nextEffect = event.target.value;
    setVoiceEffect(nextEffect);
    applyVoiceEffect(nextEffect);
  };

  const createGroup = event => {
    event.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    const group = { id: crypto.randomUUID(), name, inviteCode: createInviteCode() };
    setGroups(current => [group, ...current]);
    setSelectedGroupId(group.id);
    setNewGroupName('');
    setError('');
  };

  const joinGroup = event => {
    event.preventDefault();
    const inviteCode = inviteCodeInput.replace(/\s/g, '').toUpperCase();
    if (!inviteCode) return;
    const existingGroup = groups.find(group => group.inviteCode === inviteCode);
    if (existingGroup) {
      setSelectedGroupId(existingGroup.id);
    } else {
      const group = { id: crypto.randomUUID(), name: '参加したグループ', inviteCode };
      setGroups(current => [group, ...current]);
      setSelectedGroupId(group.id);
    }
    setInviteCodeInput('');
    setError('');
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(selectedGroup.inviteCode);
      setCopyFeedback('コピーしました');
      window.setTimeout(() => setCopyFeedback(''), 1800);
    } catch {
      setError('コピーできませんでした。招待コードを選択してコピーしてください。');
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      {!selectedGroup ? (
        <>
          <header className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Users className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold">グループ</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">グループを作成するか、招待コードで参加</p>
            </div>
          </header>

          <form onSubmit={createGroup} className="flex flex-col gap-2 border-y border-slate-200 py-5 sm:flex-row dark:border-slate-800">
            <input
              value={newGroupName}
              onChange={event => setNewGroupName(event.target.value)}
              maxLength={40}
              placeholder="グループ名"
              aria-label="新しいグループ名"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="submit" disabled={!newGroupName.trim()} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-4 w-4" />グループを作成
            </button>
          </form>

          <form onSubmit={joinGroup} className="flex flex-col gap-2 border-b border-slate-200 py-5 sm:flex-row dark:border-slate-800">
            <input
              value={inviteCodeInput}
              onChange={event => setInviteCodeInput(event.target.value)}
              maxLength={40}
              placeholder="招待コードを入力"
              aria-label="グループ招待コード"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase dark:border-slate-700 dark:bg-slate-900"
            />
            <button type="submit" disabled={!inviteCodeInput.trim()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">コードで参加</button>
          </form>

          <section className="py-5" aria-label="参加中のグループ">
            <h3 className="mb-3 text-sm font-bold">参加中のグループ <span className="font-normal text-slate-400">{groups.length}</span></h3>
            {groups.length === 0 ? (
              <p className="py-10 text-center text-xs text-slate-400">まだグループはありません</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {groups.map(group => (
                  <li key={group.id}>
                    <button type="button" onClick={() => { setSelectedGroupId(group.id); setError(''); }} className="flex w-full items-center gap-3 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><Users className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{group.name}</span>
                        <span className="mt-1 block font-mono text-[11px] text-slate-400">招待コード: {group.inviteCode}</span>
                      </span>
                      <Headphones className="h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{error}</p>}
          <p className="border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800">グループ情報はこのブラウザーに保存されます。別の端末で参加するには招待コードを共有してください。</p>
        </>
      ) : (
        <>
          <header className="mb-5 flex items-start gap-3">
            <button type="button" onClick={() => { if (!isInCall) setSelectedGroupId(null); }} disabled={isInCall} aria-label="グループ一覧へ戻る" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"><ArrowLeft className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold">{selectedGroup.name}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">グループボイス</p>
            </div>
          </header>

          <section className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-4 dark:border-slate-800">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">招待コード</p>
              <code className="mt-1 block font-mono text-sm font-bold tracking-wider">{selectedGroup.inviteCode}</code>
            </div>
            <button type="button" onClick={copyInviteCode} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              <Copy className="h-4 w-4" />{copyFeedback || 'コードをコピー'}
            </button>
          </section>

          <form onSubmit={joinCall} className="grid gap-4 border-b border-slate-200 pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><AudioLines className="h-4 w-4" />ボイスエフェクト</span>
              <select value={voiceEffect} onChange={changeVoiceEffect} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" aria-label="ボイスエフェクト">
                {Object.entries(VOICE_EFFECTS).map(([id, effect]) => <option key={id} value={id}>{effect.label}</option>)}
              </select>
            </label>
            {isInCall ? (
              <button type="button" onClick={() => leaveCall()} className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"><PhoneOff className="h-4 w-4" />通話を終了</button>
            ) : (
              <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"><Headphones className="h-4 w-4" />このグループで通話</button>
            )}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" role="status">
              <span className={`h-2 w-2 rounded-full ${isInCall ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />{status}
            </div>
            {isInCall && (
              <button type="button" onClick={toggleMute} aria-pressed={isMuted} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${isMuted ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}>
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{isMuted ? 'ミュート解除' : 'ミュート'}
              </button>
            )}
          </div>

          <section className="py-5" aria-label="通話参加者">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-slate-500" />通話中の参加者 <span className="font-normal text-slate-400">{participants.length}</span></h3>
            {participants.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">通話に参加すると、ここに参加者が表示されます</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {participants.map(participant => (
                  <li key={participant.id} className="flex items-center gap-3 py-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${participant.isLocal ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{participant.name.slice(0, 1)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{participant.name}{participant.isLocal ? ' (自分)' : ''}</span>
                    <span className="text-xs text-slate-400">{participant.muted ? <MicOff className="h-4 w-4" aria-label="ミュート中" /> : participant.connected ? <AudioLines className="h-4 w-4 text-emerald-600" aria-label="接続中" /> : <Radio className="h-4 w-4" aria-label="接続準備中" />}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" role="alert">{error}</p>}
          <p className="border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800">音声の送受信にはマイク許可とWebRTC接続が必要です。学校のネットワーク設定によっては接続できない場合があります。この試作ではグループ情報は端末内に保存され、シグナリングは開発サーバー経由です。</p>
        </>
      )}
    </div>
  );
}