import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { createMinigameRelay } from './src/server/minigameRelay.js';
import { createCommunityRelay } from './src/server/communityRelay.js';

function createVoiceSignalRelay() {
  return {
    name: 'voice-signal-relay',
    configureServer(server) {
      server.ws.on('voice:signal', signal => {
        if (!signal || typeof signal !== 'object') return;
        if (typeof signal.room !== 'string' || signal.room.length > 80) return;
        if (typeof signal.from !== 'string' || signal.from.length > 80) return;
        if (typeof signal.type !== 'string' || !['join', 'leave', 'offer', 'answer', 'candidate', 'mute'].includes(signal.type)) return;
        if (JSON.stringify(signal).length > 16000) return;
        server.ws.send('voice:signal', signal);
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), createVoiceSignalRelay(), createMinigameRelay(), createCommunityRelay()]
  };
});