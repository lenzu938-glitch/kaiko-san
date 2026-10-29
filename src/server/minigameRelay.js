const GAME_RULES = {
  wordwolf: { minPlayers: 3, maxPlayers: 8 },
  werewolf: { minPlayers: 5, maxPlayers: 8 }
};

const WORD_PAIRS = [
  ['犬', '猫'],
  ['夏', '冬'],
  ['ラーメン', 'うどん'],
  ['海', 'プール'],
  ['電車', 'バス'],
  ['映画', 'ドラマ'],
  ['朝ごはん', '昼ごはん'],
  ['サッカー', 'バスケットボール']
];

const randomItem = items => items[Math.floor(Math.random() * items.length)];
const shuffle = items => [...items].sort(() => Math.random() - 0.5);

const createRoomCode = rooms => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while ([...rooms.values()].some(room => room.code === code));
  return code;
};

export function createMinigameRelay() {
  return {
    name: 'minigame-relay',
    configureServer(server) {
      const rooms = new Map();
      const sessions = new Map();

      const sendError = (client, message) => client.send('minigame:error', { message });

      const roomForClient = client => {
        const session = sessions.get(client);
        return session ? rooms.get(session.roomId) : null;
      };

      const getRoomView = (room, player) => ({
        roomId: room.id,
        code: room.code,
        game: room.game,
        mode: room.mode,
        status: room.status,
        phase: room.phase,
        hostId: room.hostId,
        playerId: player.id,
        hasSubmitted: room.votes.has(player.id) || room.nightActions.has(player.id),
        players: [...room.players.values()].map(({ id, name, alive }) => ({ id, name, alive })),
        messages: room.messages.slice(-30),
        submittedCount: room.phase === 'night'
          ? room.nightActions.size
          : room.votes.size,
        result: room.result
      });

      const broadcastRoom = room => {
        for (const player of room.players.values()) {
          player.client.send('minigame:state', getRoomView(room, player));
        }
      };

      const sendPrivate = (player, payload) => player.client.send('minigame:private', payload);

      const createRoom = ({ game, school, mode }) => {
        const id = crypto.randomUUID();
        const room = {
          id,
          code: createRoomCode(rooms),
          game,
          school,
          mode,
          status: 'lobby',
          phase: 'lobby',
          hostId: null,
          players: new Map(),
          votes: new Map(),
          nightActions: new Map(),
          messages: [],
          result: null
        };
        rooms.set(id, room);
        return room;
      };

      const addPlayer = (room, client, name) => {
        if (sessions.has(client)) return null;
        const player = { id: crypto.randomUUID(), name, client, alive: true, role: null, word: null };
        room.players.set(player.id, player);
        sessions.set(client, { roomId: room.id, playerId: player.id });
        if (!room.hostId) room.hostId = player.id;
        return player;
      };

      const getLivingPlayers = room => [...room.players.values()].filter(player => player.alive);

      const checkWerewolfWinner = room => {
        const living = getLivingPlayers(room);
        const wolves = living.filter(player => player.role === 'werewolf').length;
        const villagers = living.length - wolves;
        if (wolves === 0) return '市民陣営';
        if (wolves >= villagers) return '人狼陣営';
        return null;
      };

      const finishGame = (room, winner, detail) => {
        room.status = 'finished';
        room.phase = 'result';
        room.result = {
          winner,
          detail,
          players: [...room.players.values()].map(player => ({
            id: player.id,
            name: player.name,
            role: player.role,
            word: room.game === 'wordwolf' ? player.word : undefined,
            alive: player.alive
          }))
        };
        broadcastRoom(room);
      };

      const startGame = room => {
        if (room.status !== 'lobby') return;
        const rules = GAME_RULES[room.game];
        if (room.players.size < rules.minPlayers) return;
        room.status = 'playing';
        room.votes.clear();
        room.nightActions.clear();
        room.result = null;
        for (const player of room.players.values()) player.alive = true;

        if (room.game === 'wordwolf') {
          const [majorityWord, minorityWord] = randomItem(WORD_PAIRS);
          const minorityId = randomItem([...room.players.keys()]);
          for (const player of room.players.values()) {
            player.word = player.id === minorityId ? minorityWord : majorityWord;
            player.role = player.id === minorityId ? 'ワードウルフ' : '多数派';
            sendPrivate(player, { role: player.role, word: player.word });
          }
          room.phase = 'discussion';
          room.messages.push({ id: crypto.randomUUID(), sender: 'システム', text: '全員にお題が配られました。会話してワードウルフを探そう。', time: Date.now() });
        } else {
          const players = shuffle([...room.players.values()]);
          const wolfCount = players.length >= 7 ? 2 : 1;
          players.forEach((player, index) => {
            player.role = index < wolfCount ? 'werewolf' : index === wolfCount ? 'seer' : index === wolfCount + 1 ? 'doctor' : 'villager';
            sendPrivate(player, { role: player.role });
          });
          room.phase = 'day';
          room.messages.push({ id: crypto.randomUUID(), sender: 'システム', text: 'ゲーム開始。役職は自分だけに表示されています。', time: Date.now() });
        }
        broadcastRoom(room);
      };

      const resolveDayVote = room => {
        const alive = getLivingPlayers(room);
        if (room.votes.size < alive.length) return;
        const counts = new Map();
        for (const target of room.votes.values()) counts.set(target, (counts.get(target) || 0) + 1);
        const highest = Math.max(...counts.values());
        const winners = [...counts].filter(([, count]) => count === highest).map(([id]) => id);
        const eliminated = winners.length === 1 ? room.players.get(winners[0]) : null;
        if (eliminated) eliminated.alive = false;
        room.messages.push({
          id: crypto.randomUUID(),
          sender: 'システム',
          text: eliminated ? `${eliminated.name}が投票で追放されました。` : '投票が同数のため、今回は追放なしです。',
          time: Date.now()
        });
        const winner = checkWerewolfWinner(room);
        if (winner) {
          finishGame(room, winner, eliminated ? `${eliminated.name}が追放されました。` : '追放者はいませんでした。');
          return;
        }
        room.phase = 'night';
        room.votes.clear();
        room.nightActions.clear();
        broadcastRoom(room);
      };

      const resolveNight = room => {
        const living = getLivingPlayers(room);
        const activeRoles = ['werewolf', 'seer', 'doctor'];
        const actors = living.filter(player => activeRoles.includes(player.role));
        if (actors.some(player => !room.nightActions.has(player.id))) return;
        const wolfTargets = [...room.nightActions.values()].filter(action => action.role === 'werewolf').map(action => action.targetId);
        const targetCounts = new Map();
        wolfTargets.forEach(target => targetCounts.set(target, (targetCounts.get(target) || 0) + 1));
        const highest = Math.max(0, ...targetCounts.values());
        const chosen = [...targetCounts].filter(([, count]) => count === highest).map(([id]) => id);
        const doctor = living.find(player => player.role === 'doctor');
        const protectedId = doctor ? room.nightActions.get(doctor.id)?.targetId : null;
        const victimId = chosen.length === 1 && chosen[0] !== protectedId ? chosen[0] : null;
        const victim = victimId ? room.players.get(victimId) : null;
        if (victim) victim.alive = false;
        room.messages.push({
          id: crypto.randomUUID(),
          sender: 'システム',
          text: victim ? `夜が明けました。${victim.name}が襲撃されました。` : '夜が明けました。昨夜の犠牲者はいません。',
          time: Date.now()
        });
        const winner = checkWerewolfWinner(room);
        if (winner) {
          finishGame(room, winner, victim ? `${victim.name}が襲撃されました。` : '昨夜の犠牲者はいません。');
          return;
        }
        room.phase = 'day';
        room.votes.clear();
        room.nightActions.clear();
        broadcastRoom(room);
      };

      const leaveRoom = (client, announce = true) => {
        const session = sessions.get(client);
        if (!session) return;
        const room = rooms.get(session.roomId);
        sessions.delete(client);
        if (!room) return;
        const player = room.players.get(session.playerId);
        if (player) {
          room.players.delete(player.id);
          room.votes.delete(player.id);
          room.nightActions.delete(player.id);
          if (announce && room.players.size > 0) {
            room.messages.push({ id: crypto.randomUUID(), sender: 'システム', text: `${player.name}がルームを退出しました。`, time: Date.now() });
          }
        }
        if (room.players.size === 0) rooms.delete(room.id);
        else {
          if (room.hostId === session.playerId) room.hostId = room.players.keys().next().value;
          broadcastRoom(room);
          if (room.phase === 'vote' || room.phase === 'werewolf-vote') resolveDayVote(room);
          if (room.phase === 'night') resolveNight(room);
        }
      };

      const handleCommand = (data, client) => {
        if (!data || typeof data !== 'object' || JSON.stringify(data).length > 12000) return;
        if (data.type === 'create' || data.type === 'random') {
          leaveRoom(client, false);
          const game = data.game;
          const rules = GAME_RULES[game];
          const school = typeof data.school === 'string' ? data.school.trim().slice(0, 80) : '';
          const name = typeof data.name === 'string' ? data.name.trim().slice(0, 32) : '';
          if (!rules || !school || !name) return sendError(client, 'ゲーム、学校、名前を確認してください。');
          let room;
          if (data.type === 'random') {
            room = [...rooms.values()].find(candidate => candidate.mode === 'random' && candidate.game === game && candidate.school === school && candidate.status === 'lobby' && candidate.players.size < rules.maxPlayers);
            if (!room) room = createRoom({ game, school, mode: 'random' });
          } else {
            room = createRoom({ game, school, mode: 'group' });
          }
          const player = addPlayer(room, client, name);
          if (!player) return sendError(client, 'すでに別のゲームルームに参加しています。');
          if (room.mode === 'random' && room.players.size >= rules.minPlayers) startGame(room);
          else broadcastRoom(room);
          return;
        }

        if (data.type === 'join') {
          leaveRoom(client, false);
          const game = data.game;
          const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : '';
          const school = typeof data.school === 'string' ? data.school.trim().slice(0, 80) : '';
          const name = typeof data.name === 'string' ? data.name.trim().slice(0, 32) : '';
          const room = [...rooms.values()].find(candidate => candidate.code === code && candidate.game === game && candidate.school === school);
          if (!room || room.mode !== 'group' || room.status !== 'lobby') return sendError(client, '参加できるグループが見つかりません。コードとゲームを確認してください。');
          if (room.players.size >= GAME_RULES[game].maxPlayers) return sendError(client, 'このグループは満員です。');
          const player = addPlayer(room, client, name);
          if (!player) return sendError(client, 'すでに別のゲームルームに参加しています。');
          broadcastRoom(room);
          return;
        }

        const room = roomForClient(client);
        const session = sessions.get(client);
        const player = room?.players.get(session?.playerId);
        if (!room || !player) return sendError(client, '先にゲームルームに参加してください。');

        if (data.type === 'leave') {
          leaveRoom(client);
          client.send('minigame:left', {});
          return;
        }
        if (data.type === 'start') {
          if (room.hostId !== player.id || room.mode !== 'group') return sendError(client, 'ゲームの開始はグループ作成者が行います。');
          if (room.players.size < GAME_RULES[room.game].minPlayers) return sendError(client, `開始には${GAME_RULES[room.game].minPlayers}人以上必要です。`);
          startGame(room);
          return;
        }
        if (data.type === 'advance') {
          if (room.hostId !== player.id) return sendError(client, '進行はグループ作成者が行います。');
          if (room.game === 'wordwolf' && room.phase === 'discussion') room.phase = 'vote';
          else if (room.game === 'werewolf' && room.phase === 'day') room.phase = 'werewolf-vote';
          else return sendError(client, '現在は進行を変更できません。');
          room.votes.clear();
          broadcastRoom(room);
          return;
        }
        if (data.type === 'chat') {
          const text = typeof data.text === 'string' ? data.text.trim().slice(0, 200) : '';
          if (!text || room.status !== 'playing' || !player.alive) return;
          room.messages.push({ id: crypto.randomUUID(), sender: player.name, text, time: Date.now() });
          if (room.messages.length > 100) room.messages.splice(0, room.messages.length - 100);
          broadcastRoom(room);
          return;
        }
        if (data.type === 'vote') {
          const target = room.players.get(data.targetId);
          if (!['vote', 'werewolf-vote'].includes(room.phase) || !player.alive || room.votes.has(player.id) || !target?.alive || target.id === player.id) return;
          room.votes.set(player.id, target.id);
          if (room.game === 'wordwolf' && room.votes.size === room.players.size) {
            const votes = [...room.votes.values()];
            const counts = new Map();
            votes.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
            const high = Math.max(...counts.values());
            const topIds = [...counts].filter(([, count]) => count === high).map(([id]) => id);
            const wolfCaught = topIds.length === 1 && room.players.get(topIds[0]).role === 'ワードウルフ';
            finishGame(room, wolfCaught ? '多数派' : 'ワードウルフ', wolfCaught ? 'ワードウルフを見つけました。' : 'ワードウルフを見つけられませんでした。');
          } else if (room.game === 'werewolf') {
            resolveDayVote(room);
          } else {
            broadcastRoom(room);
          }
          return;
        }
        if (data.type === 'night-action') {
          const target = room.players.get(data.targetId);
          if (room.game !== 'werewolf' || room.phase !== 'night' || !player.alive || room.nightActions.has(player.id) || !target?.alive || target.id === player.id || !['werewolf', 'seer', 'doctor'].includes(player.role)) return;
          room.nightActions.set(player.id, { role: player.role, targetId: target.id });
          if (player.role === 'seer') sendPrivate(player, { role: player.role, lastResult: `${target.name}は${target.role === 'werewolf' ? '人狼' : '人狼ではありません'}。` });
          resolveNight(room);
          if (room.phase === 'night') broadcastRoom(room);
        }
      };

      server.ws.on('minigame:command', handleCommand);
    }
  };
}