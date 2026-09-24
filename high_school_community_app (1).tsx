import React, { useState, useEffect } from 'react';
import AuthScreen from './src/AuthScreen.jsx';
import { 
  Home, 
  BookOpen, 
  BarChart2, 
  Users, 
  User, 
  Search, 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Sparkles, 
  CheckCircle, 
  ShieldCheck, 
  GraduationCap, 
  Lock, 
  Image, 
  TrendingUp, 
  Hash, 
  Moon, 
  Sun,
  X,
  Filter,
  MoreHorizontal
} from 'lucide-react';

const MOCK_POSTS = [
  {
    id: '1',
    authorName: '2年B組のりか',
    authorGrade: '2年',
    authorClass: 'B組',
    isAnonymous: false,
    content: '来週の数学IIの範囲、p.45〜p.78で合ってますか…？難しすぎて絶望してるんだけど助けて😭誰か一緒に図書室で勉強しませんか！',
    timestamp: '10分前',
    category: '#テスト対策',
    likes: 12,
    comments: [
      { id: 'c1', author: '2年A組たくみ', text: '合ってるよ！三角関数が中心だから公式暗記必須だね', timestamp: '5分前' },
      { id: 'c2', author: '匿名高校生', text: '図書室放課後行く予定！一緒にやろ〜', timestamp: '2分前' }
    ],
    targetGrade: '2年生限定',
    isLiked: false
  },
  {
    id: '2',
    authorName: '匿名高校生',
    authorGrade: '3年',
    authorClass: 'A組',
    isAnonymous: true,
    content: '今年の文化祭の有志バンド、まだドラム探してるグループあったりしますか？軽音部じゃないけど一応経験者です！ドラム叩きたい🥁',
    timestamp: '35分前',
    category: '#部活',
    likes: 24,
    comments: [
      { id: 'c3', author: '3年C組けんと', text: 'うちのバンドキーボードとドラム探してる！DM（クラスラウンジ）で話さない？', timestamp: '20分前' }
    ],
    targetGrade: '全学年',
    isLiked: false
  },
  {
    id: '3',
    authorName: '1年D組サッカー部員',
    authorGrade: '1年',
    authorClass: 'D組',
    isAnonymous: false,
    content: '今日の購買の焼きそばパン秒で売り切れて泣いた。明日は1時間目の休み時間からダッシュする決意。🍞🔥',
    timestamp: '2時間前',
    category: '#雑談',
    likes: 45,
    comments: [],
    targetGrade: '全学年',
    isLiked: true
  },
  {
    id: '4',
    authorName: '匿名高校生',
    authorGrade: '3年',
    authorClass: 'E組',
    isAnonymous: true,
    content: '共通テスト模試の英語、長文の解答スピードを上げるコツ教えてほしいです…推薦目指しててマジで背水の陣。',
    timestamp: '4時間前',
    category: '#進路',
    likes: 18,
    comments: [
      { id: 'c4', author: '3年B組みゆう', text: '段落ごとに一言要約をメモしながら読むと、見直しも早くなるよ！ファイティン！', timestamp: '3時間前' }
    ],
    targetGrade: '3年生向け',
    isLiked: false
  }
];

const INITIAL_POLLS = [
  {
    id: 'p1',
    question: '今年の文化祭クラス出し物、何がいいと思う？',
    options: [
      { id: 'o1', text: 'お化け屋敷 👻', votes: 142 },
      { id: 'o2', text: 'コンセプトカフェ ☕️', votes: 198 },
      { id: 'o3', text: '縁日・ゲームコーナー 🎯', votes: 85 },
      { id: 'o4', text: '演劇・ダンスパフォーマンス 💃', votes: 52 }
    ],
    totalVotes: 477,
    hasVoted: false,
    userVotedOption: null
  }
];

const STUDY_NOTES = [
  { id: 's1', title: '【数II】三角関数の公式まとめシート', author: '3年数学マスター', subject: '数学', likes: 58, downloads: 34 },
  { id: 's2', title: '【世界史】古代メソポタミア〜ギリシャ文明暗記ノート', author: '歴史オタク2年', subject: '社会', likes: 89, downloads: 62 },
  { id: 's3', title: '【英語】文法比較ライティング頻出表現20選', author: '帰国子女A', subject: '英語', likes: 112, downloads: 95 }
];

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: '水海道第一高等学校',
    grade: '2年',
    classNum: '1組',
    studentId: '20240182',
    handleName: '青葉たろう'
  });

  // App UI state
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'study', 'polls', 'lounge', 'profile'
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [polls, setPolls] = useState(INITIAL_POLLS);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('すべて');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('すべて');

  // Post modal / creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTag, setNewPostTag] = useState('#雑談');
  const [newPostTarget, setNewPostTarget] = useState('全学年');
  const [isAnonymousPost, setIsAnonymousPost] = useState(false);

  // Comment modal state
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  // Class lounge chat state
  const [loungeMessages, setLoungeMessages] = useState([
    { id: 'm1', sender: '2年B組委員長', text: 'みんなー！来週の席替えの希望アンケート提出忘れずにね！', time: '12:30' },
    { id: 'm2', sender: 'けんじ', text: 'はーい！後ろの窓際席になりますように🙏', time: '12:32' },
    { id: 'm3', sender: 'あおい', text: '体育祭のTシャツサイズ入力も今日までだよね？', time: '12:45' }
  ]);
  const [newLoungeMsg, setNewLoungeMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (schoolInfo.schoolName && schoolInfo.studentId) {
      setIsAuthenticated(true);
    }
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      authorName: isAnonymousPost ? '匿名高校生' : `${schoolInfo.grade}${schoolInfo.classNum}_${schoolInfo.handleName}`,
      authorGrade: schoolInfo.grade,
      authorClass: schoolInfo.classNum,
      isAnonymous: isAnonymousPost,
      content: newPostContent,
      timestamp: 'たった今',
      category: newPostTag,
      likes: 0,
      comments: [],
      targetGrade: newPostTarget,
      isLiked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setIsCreateModalOpen(false);
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentPost) return;

    const newComment = {
      id: Date.now().toString(),
      author: `${schoolInfo.grade}${schoolInfo.classNum}_${schoolInfo.handleName}`,
      text: commentInput,
      timestamp: 'たった今'
    };

    setPosts(posts.map(p => {
      if (p.id === activeCommentPost.id) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));

    setActiveCommentPost(prev => ({
      ...prev,
      comments: [...prev.comments, newComment]
    }));

    setCommentInput('');
  };

  const handleVote = (pollId, optionId) => {
    setPolls(polls.map(p => {
      if (p.id === pollId && !p.hasVoted) {
        return {
          ...p,
          hasVoted: true,
          userVotedOption: optionId,
          totalVotes: p.totalVotes + 1,
          options: p.options.map(opt => 
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          )
        };
      }
      return p;
    }));
  };

  const handleSendLoungeMsg = (e) => {
    e.preventDefault();
    if (!newLoungeMsg.trim()) return;

    const msg = {
      id: Date.now().toString(),
      sender: schoolInfo.handleName,
      text: newLoungeMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLoungeMessages([...loungeMessages, msg]);
    setNewLoungeMsg('');
  };

  // Filter logic
  const filteredPosts = posts.filter(post => {
    const matchesTag = selectedTag === 'すべて' || post.category === selectedTag;
    const matchesGrade = selectedGradeFilter === 'すべて' || post.targetGrade === '全学年' || post.targetGrade === selectedGradeFilter;
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesGrade && matchesSearch;
  });

  const categories = ['すべて', '#授業', '#部活', '#テスト対策', '#雑談', '#進路'];
  const gradeFilters = ['すべて', '全学年', '1年生限定', '2年生限定', '3年生向け'];

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={({ studentId, handleName, classNum }) => {
          setSchoolInfo((current) => ({ ...current, studentId, handleName, classNum }));
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors`}>
      <div className="max-w-6xl mx-auto flex min-h-screen">
        
        {}
        <aside className="w-20 lg:w-64 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between sticky top-0 h-screen bg-white dark:bg-slate-900 z-10">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3 px-3 py-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="hidden lg:block">
                <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Campus
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">{schoolInfo.schoolName}</p>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1">
              {[
                { id: 'home', label: 'タイムライン', icon: Home },
                { id: 'study', label: 'テスト対策・ノート', icon: BookOpen },
                { id: 'polls', label: '校内アンケート', icon: BarChart2 },
                { id: 'lounge', label: `${schoolInfo.grade}${schoolInfo.classNum}ラウンジ`, icon: Users },
                { id: 'profile', label: 'マイページ', icon: User },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-2xl font-medium transition ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    <span className="hidden lg:inline text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Post Creation Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden lg:inline text-sm">投稿する</span>
            </button>
          </div>

          {/* User Profile Summary & Dark mode toggle */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <span className="hidden lg:inline">{isDarkMode ? 'ライトモード' : 'ダークモード'}</span>
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-700">
                {schoolInfo.handleName.slice(0, 1)}
              </div>
              <div className="hidden lg:block text-left overflow-hidden">
                <div className="text-xs font-bold truncate">{schoolInfo.handleName}</div>
                <div className="text-[10px] text-slate-400 truncate">{schoolInfo.grade}{schoolInfo.classNum}・認証済</div>
              </div>
            </div>
          </div>
        </aside>

        {}
        <main className="flex-1 border-r border-slate-200 dark:border-slate-800 min-h-screen bg-white dark:bg-slate-900 max-w-2xl">
          
          {/* TAB 1: Home / Timeline */}
          {activeTab === 'home' && (
            <div>
              {/* Top Bar */}
              <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-4 z-10">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-bold">校内タイムライン</h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {schoolInfo.schoolName} 生徒専用
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="投稿やキーワードを検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent"
                  />
                </div>

                {/* Categories & Grade Filters */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">タグ:</span>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedTag(cat)}
                        className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                          selectedTag === cat 
                            ? 'bg-indigo-600 text-white font-medium' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">対象:</span>
                    {gradeFilters.map(grade => (
                      <button
                        key={grade}
                        onClick={() => setSelectedGradeFilter(grade)}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] transition ${
                          selectedGradeFilter === grade 
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-semibold' 
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feed List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPosts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">条件に一致する投稿が見つかりませんでした。</p>
                  </div>
                ) : (
                  filteredPosts.map(post => (
                    <article key={post.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <div className="flex gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                          post.isAnonymous 
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                            : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
                        }`}>
                          {post.isAnonymous ? '匿' : post.authorName.slice(0, 1)}
                        </div>

                        {/* Post Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm">{post.authorName}</span>
                              <span className="text-xs text-slate-400">・{post.timestamp}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium">
                                {post.category}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500">
                              {post.targetGrade}
                            </span>
                          </div>

                          <p className="text-sm mt-1 text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                            {post.content}
                          </p>

                          {/* Post Footer Actions */}
                          <div className="flex items-center gap-6 mt-3 text-slate-500 dark:text-slate-400 text-xs">
                            <button 
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center gap-1.5 transition ${
                                post.isLiked ? 'text-rose-500 font-medium' : 'hover:text-rose-500'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                              <span>{post.likes}</span>
                            </button>

                            <button 
                              onClick={() => setActiveCommentPost(post)}
                              className="flex items-center gap-1.5 hover:text-indigo-600 transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments.length}</span>
                            </button>

                            <button className="flex items-center gap-1.5 hover:text-slate-700 transition ml-auto">
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Study Notes & Q&A */}
          {activeTab === 'study' && (
            <div className="p-4 space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  テスト対策 & 勉強ノート共有
                </h2>
                <p className="text-xs text-slate-500 mt-1">先輩や同級生がまとめたノートをチェックしよう！</p>
              </div>

              {/* Upload Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">自分のノートを共有する</h3>
                  <p className="text-xs text-indigo-100 mt-0.5">わかりやすいノートで「いいね」を集めよう</p>
                </div>
                <button className="px-3.5 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition shadow">
                  ノート追加
                </button>
              </div>

              {/* Note Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">人気ノート</h3>
                {STUDY_NOTES.map(note => (
                  <div key={note.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 transition flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
                        {note.subject}
                      </span>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{note.title}</h4>
                      <p className="text-xs text-slate-400">作成者: {note.author}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> {note.likes}</span>
                      <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-medium text-xs hover:bg-indigo-700">
                        閲覧
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Polls */}
          {activeTab === 'polls' && (
            <div className="p-4 space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart2 className="w-6 h-6 text-indigo-600" />
                  校内リアルタイムアンケート
                </h2>
                <p className="text-xs text-slate-500 mt-1">みんなの本音を匿名投票で調査！</p>
              </div>

              {polls.map(poll => (
                <div key={poll.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{poll.question}</h3>
                  
                  <div className="space-y-2">
                    {poll.options.map(option => {
                      const percentage = poll.totalVotes > 0 
                        ? Math.round((option.votes / poll.totalVotes) * 100) 
                        : 0;
                      const isSelected = poll.userVotedOption === option.id;

                      return (
                        <button
                          key={option.id}
                          disabled={poll.hasVoted}
                          onClick={() => handleVote(poll.id, option.id)}
                          className={`w-full relative overflow-hidden text-left p-3.5 rounded-xl border transition ${
                            isSelected 
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30' 
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {/* Progress bar fill if voted */}
                          {poll.hasVoted && (
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40 transition-all duration-500 z-0"
                              style={{ width: `${percentage}%` }}
                            />
                          )}
                          <div className="relative z-10 flex justify-between items-center text-xs font-medium">
                            <span className="text-slate-700 dark:text-slate-200">{option.text}</span>
                            {poll.hasVoted && (
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    総投票数: {poll.totalVotes}票
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Class Lounge (Private Chat) */}
          {activeTab === 'lounge' && (
            <div className="flex flex-col h-screen">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">{schoolInfo.grade}{schoolInfo.classNum} 限定ラウンジ</h2>
                    <p className="text-xs text-slate-400">クラスの連絡や雑談用のプライベートメッセージ</p>
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {loungeMessages.map(msg => {
                  const isMe = msg.sender === schoolInfo.handleName;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.sender}</span>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-xs ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5">{msg.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendLoungeMsg} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                <input
                  type="text"
                  value={newLoungeMsg}
                  onChange={(e) => setNewLoungeMsg(e.target.value)}
                  placeholder={`${schoolInfo.classNum}にメッセージを送信...`}
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: Profile */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                  {schoolInfo.handleName.slice(0, 1)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{schoolInfo.handleName}</h2>
                  <p className="text-xs text-slate-400">{schoolInfo.schoolName}・{schoolInfo.grade}{schoolInfo.classNum}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" /> 生徒認証済み
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">登録情報</h3>
                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between"><span>学校名</span><span className="font-semibold text-slate-800 dark:text-slate-100">{schoolInfo.schoolName}</span></div>
                  <div className="flex justify-between"><span>学年・クラス</span><span className="font-semibold text-slate-800 dark:text-slate-100">{schoolInfo.grade} {schoolInfo.classNum}</span></div>
                  <div className="flex justify-between"><span>学籍番号</span><span className="font-semibold text-slate-800 dark:text-slate-100">●●●●{schoolInfo.studentId.slice(-4)}</span></div>
                </div>
              </div>

              <button 
                onClick={() => setIsAuthenticated(false)}
                className="w-full py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition border border-rose-200 dark:border-rose-900"
              >
                ログアウト
              </button>
            </div>
          )}

        </main>

        {}
        <aside className="hidden md:block w-72 p-4 space-y-6 sticky top-0 h-screen bg-slate-50/50 dark:bg-slate-900/50">
          {/* Trend Section */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              校内トレンド
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { tag: '#テスト対策', count: '42 件の投稿' },
                { tag: '#文化祭有志', count: '28 件の投稿' },
                { tag: '#球技大会', count: '19 件の投稿' },
                { tag: '#共通テスト模試', count: '15 件の投稿' },
              ].map(item => (
                <button 
                  key={item.tag} 
                  onClick={() => {
                    setSelectedTag(item.tag);
                    setActiveTab('home');
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="font-semibold text-indigo-600 dark:text-indigo-400">{item.tag}</div>
                  <div className="text-[10px] text-slate-400">{item.count}</div>
                </button>
              ))}
            </div>
          </div>

          {/* School Guidelines */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-4 h-4" />
              コミュニティルール
            </div>
            <p className="text-[11px] leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
              お互いをリスペクトし、誹謗中傷や個人情報の投稿は控えましょう。安全で楽しい学校生活のためのスペースです。
            </p>
          </div>
        </aside>

      </div>

      {}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">新規投稿の作成</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <textarea
              rows={4}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="校内のみんなに共有したいことを書こう..."
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            {/* Post Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-500">カテゴリ:</span>
                <select 
                  value={newPostTag}
                  onChange={(e) => setNewPostTag(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                >
                  {categories.filter(c => c !== 'すべて').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <span className="font-semibold text-slate-500 ml-2">公開範囲:</span>
                <select 
                  value={newPostTarget}
                  onChange={(e) => setNewPostTarget(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
                >
                  {gradeFilters.filter(g => g !== 'すべて').map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Anonymous Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
                <input 
                  type="checkbox"
                  checked={isAnonymousPost}
                  onChange={(e) => setIsAnonymousPost(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>「匿名高校生」として投稿する</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                キャンセル
              </button>
              <button 
                onClick={handleCreatePost}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
              >
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {activeCommentPost && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base">コメント</h3>
              <button onClick={() => setActiveCommentPost(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Original Post Preview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl text-xs space-y-1">
              <div className="font-bold text-indigo-600 dark:text-indigo-400">{activeCommentPost.authorName}</div>
              <div className="text-slate-700 dark:text-slate-300">{activeCommentPost.content}</div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {activeCommentPost.comments.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-6">まだコメントはありません。</p>
              ) : (
                activeCommentPost.comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-slate-100/60 dark:bg-slate-700/20 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{comment.author}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{comment.timestamp}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="返信を入力..."
                className="flex-1 px-4 py-2 text-xs bg-slate-100 dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
                送信
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}