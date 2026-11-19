import fs from 'node:fs';
import path from 'node:path';

const DATA_FILE = path.join(process.cwd(), '.community-data.json');
const MAX_REQUEST_BYTES = 32 * 1024 * 1024;

function readState() {
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (Array.isArray(saved)) return { posts: saved, dmThreads: {} };
    return {
      posts: Array.isArray(saved.posts) ? saved.posts : [],
      dmThreads: saved.dmThreads && typeof saved.dmThreads === 'object' ? saved.dmThreads : {}
    };
  } catch {
    return { posts: [], dmThreads: {} };
  }
}

function writeState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state), 'utf8');
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    request.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_REQUEST_BYTES) {
        reject(new Error('payload_too_large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
  });
}

export function createCommunityRelay() {
  return {
    name: 'community-relay',
    configureServer(server) {
      const state = readState();
      let posts = state.posts;
      const dmThreads = state.dmThreads;

      const persist = () => writeState({ posts, dmThreads });

      server.middlewares.use('/api/community/dm/threads', (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        if (request.method !== 'GET') {
          response.writeHead(405).end(JSON.stringify({ error: 'GETリクエストのみ利用できます。' }));
          return;
        }
        const handle = new URL(request.url, 'http://localhost').searchParams.get('handle');
        if (!handle || handle.length > 100) {
          response.writeHead(400).end(JSON.stringify({ error: 'ユーザー名が必要です。' }));
          return;
        }
        const threads = {};
        for (const [pair, messages] of Object.entries(dmThreads)) {
          const participants = pair.split('|');
          if (participants.includes(handle)) {
            const contact = participants.find(participant => participant !== handle);
            if (contact) threads[contact] = messages;
          }
        }
        response.end(JSON.stringify({ threads }));
      });

      server.middlewares.use('/api/community/dm', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');

        const url = new URL(request.url, 'http://localhost');
        const pair = url.searchParams.get('pair');
        if (!pair || pair.length > 200) {
          response.writeHead(400).end(JSON.stringify({ error: '会話の相手情報が必要です。' }));
          return;
        }

        if (request.method === 'GET') {
          response.end(JSON.stringify({ messages: dmThreads[pair] || [] }));
          return;
        }

        if (request.method === 'POST') {
          try {
            const body = await readJson(request);
            const message = body.message;
            if (!message || typeof message.sender !== 'string') {
              response.writeHead(400).end(JSON.stringify({ error: 'メッセージが不正です。' }));
              return;
            }
            const normalized = {
              ...message,
              id: typeof message.id === 'string' ? message.id : crypto.randomUUID(),
              text: typeof message.text === 'string' ? message.text.slice(0, 1200) : '',
              images: Array.isArray(message.images) ? message.images.slice(0, 4) : [],
              time: typeof message.time === 'string' ? message.time : 'たった今'
            };
            dmThreads[pair] = [...(dmThreads[pair] || []), normalized].slice(-500);
            persist();
            response.writeHead(201).end(JSON.stringify({ message: normalized }));
          } catch (error) {
            response.writeHead(error.message === 'payload_too_large' ? 413 : 400)
              .end(JSON.stringify({ error: 'DMを保存できませんでした。' }));
          }
          return;
        }

        response.writeHead(405).end(JSON.stringify({ error: 'このメソッドは利用できません。' }));
      });

      server.middlewares.use('/api/community/posts', async (request, response, next) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');

        if (request.method === 'GET') {
          response.end(JSON.stringify({ posts }));
          return;
        }

        if (request.method === 'POST') {
          try {
            const post = await readJson(request);
            if (!post || typeof post.content !== 'string' && !Array.isArray(post.images)) {
              response.writeHead(400).end(JSON.stringify({ error: '投稿内容が不正です。' }));
              return;
            }
            const normalized = {
              ...post,
              id: typeof post.id === 'string' ? post.id : crypto.randomUUID(),
              content: typeof post.content === 'string' ? post.content.slice(0, 1200) : '',
              comments: Array.isArray(post.comments) ? post.comments : [],
              likes: Number.isFinite(post.likes) ? post.likes : 0,
              timestamp: 'たった今'
            };
            posts = [normalized, ...posts];
            persist();
            response.writeHead(201).end(JSON.stringify({ post: normalized }));
          } catch (error) {
            response.writeHead(error.message === 'payload_too_large' ? 413 : 400)
              .end(JSON.stringify({ error: error.message === 'payload_too_large' ? 'データが大きすぎます。' : '投稿を保存できませんでした。' }));
          }
          return;
        }

        next();
      });

      server.middlewares.use('/api/community/posts/', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');

        const segments = new URL(request.url, 'http://localhost').pathname.split('/').filter(Boolean);
        const postId = segments.at(-2);
        const action = segments.at(-1);
        if (request.method !== 'POST' || (action !== 'comments' && action !== 'like')) {
          response.writeHead(404).end(JSON.stringify({ error: '見つかりません。' }));
          return;
        }

        try {
          const body = await readJson(request);
          const postIndex = posts.findIndex(post => post.id === postId);
          if (postIndex < 0) {
            response.writeHead(404).end(JSON.stringify({ error: '投稿が見つかりません。' }));
            return;
          }

          if (action === 'like') {
            const isLiked = Boolean(body.isLiked);
            posts[postIndex] = {
              ...posts[postIndex],
              isLiked,
              likes: Math.max(0, Number(posts[postIndex].likes || 0) + (isLiked ? 1 : -1))
            };
          } else {
            const comment = body.comment;
            if (!comment || typeof comment.text !== 'string') {
              response.writeHead(400).end(JSON.stringify({ error: 'コメントが不正です。' }));
              return;
            }
            posts[postIndex].comments = [
              ...posts[postIndex].comments,
              { ...comment, text: comment.text.slice(0, 1200), timestamp: 'たった今' }
            ];
          }

          persist();
          response.end(JSON.stringify({ post: posts[postIndex] }));
        } catch {
          response.writeHead(400).end(JSON.stringify({ error: '変更を保存できませんでした。' }));
        }
      });
    },
    configurePreviewServer(server) {
      this.configureServer(server);
    }
  };
}
