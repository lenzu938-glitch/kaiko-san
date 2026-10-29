import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './src/AuthScreen.jsx';
import GroupVoiceRoom from './src/GroupVoiceRoom.jsx';
import StoryAndNotes from './src/StoryAndNotes.jsx';
import Minigames from './src/Minigames.jsx';
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
  MessageSquare,
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
  ArrowLeft,
  Phone,
  PhoneOff,
  Headphones,
  Gamepad2,
  Mic,
  MicOff,
  Paperclip,
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

const requestAiReply = async (message, context = '') => {
  const response = await fetch('/api/ai-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'AIの返信を作成できませんでした。');
  return result.reply;
};

const loadAccountPrivacy = (studentId) => {
  try {
    const savedSettings = JSON.parse(window.localStorage.getItem(`campus-account-privacy:${studentId}`) || '{}');
    return {
      isPrivate: Boolean(savedSettings.isPrivate),
      approvedAccounts: Array.isArray(savedSettings.approvedAccounts)
        ? savedSettings.approvedAccounts.filter(account => typeof account === 'string')
        : []
    };
  } catch {
    return { isPrivate: false, approvedAccounts: [] };
  }
};

const loadSocialConnections = (studentId) => {
  try {
    const savedConnections = JSON.parse(window.localStorage.getItem(`campus-social-connections:${studentId}`) || '{}');
    return {
      following: Array.isArray(savedConnections.following) ? savedConnections.following.filter(name => typeof name === 'string') : [],
      blocked: Array.isArray(savedConnections.blocked) ? savedConnections.blocked.filter(name => typeof name === 'string') : []
    };
  } catch {
    return { following: [], blocked: [] };
  }
};

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({
    schoolName: '水海道第一高等学校',
    grade: '2年',
    classNum: '1組',
    studentId: '20240182',
    handleName: '青葉たろう',
    gender: '',
    avatar: '',
    interests: [],
    bio: ''
  });
  const [accountPrivacy, setAccountPrivacy] = useState(() => loadAccountPrivacy('20240182'));
  const [approvedAccountInput, setApprovedAccountInput] = useState('');
  const [socialConnections, setSocialConnections] = useState(() => loadSocialConnections('20240182'));
  const [activeProfileName, setActiveProfileName] = useState(null);

  useEffect(() => {
    setAccountPrivacy(loadAccountPrivacy(schoolInfo.studentId));
    setSocialConnections(loadSocialConnections(schoolInfo.studentId));
  }, [schoolInfo.studentId]);

  // App UI state
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'study', 'polls', 'lounge', 'messages', 'profile'
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
  const [newPostImages, setNewPostImages] = useState([]);
  const [postImageError, setPostImageError] = useState('');
  const [hasConfirmedImageSafety, setHasConfirmedImageSafety] = useState(false);

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

  // Direct message state
  const [dmThreads, setDmThreads] = useState({});
  const [selectedDmContact, setSelectedDmContact] = useState(null);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [newDmMessage, setNewDmMessage] = useState('');
  const [newDmImages, setNewDmImages] = useState([]);
  const [dmMediaError, setDmMediaError] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [activeCallContact, setActiveCallContact] = useState(null);
  const [callDemoSeconds, setCallDemoSeconds] = useState(0);
  const voiceRecorderRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const voiceRecordingTimerRef = useRef(null);
  const selectedDmContactRef = useRef(null);

  useEffect(() => {
    if (!activeCallContact) {
      setCallDemoSeconds(0);
      return undefined;
    }
    const timer = window.setInterval(() => setCallDemoSeconds(seconds => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [activeCallContact]);

  useEffect(() => () => {
    window.clearTimeout(voiceRecordingTimerRef.current);
    voiceStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (schoolInfo.schoolName && schoolInfo.studentId) {
      setIsAuthenticated(true);
    }
  };

  const saveAccountPrivacy = (nextSettings) => {
    setAccountPrivacy(nextSettings);
    try {
      window.localStorage.setItem(`campus-account-privacy:${schoolInfo.studentId}`, JSON.stringify(nextSettings));
    } catch {
      // Keep the current setting for this session if browser storage is unavailable.
    }
  };

  const saveSocialConnections = (nextConnections) => {
    setSocialConnections(nextConnections);
    try {
      window.localStorage.setItem(`campus-social-connections:${schoolInfo.studentId}`, JSON.stringify(nextConnections));
    } catch {
      // Keep the current relationships for this session if browser storage is unavailable.
    }
  };

  const toggleFollow = (accountName) => {
    if (socialConnections.blocked.includes(accountName)) return;
    const following = socialConnections.following.includes(accountName)
      ? socialConnections.following.filter(name => name !== accountName)
      : [...socialConnections.following, accountName];
    saveSocialConnections({ ...socialConnections, following });
  };

  const toggleBlock = (accountName) => {
    const isBlocked = socialConnections.blocked.includes(accountName);
    saveSocialConnections({
      following: isBlocked ? socialConnections.following : socialConnections.following.filter(name => name !== accountName),
      blocked: isBlocked
        ? socialConnections.blocked.filter(name => name !== accountName)
        : [...socialConnections.blocked, accountName]
    });
    if (!isBlocked && selectedDmContact === accountName) {
      selectedDmContactRef.current = null;
      setSelectedDmContact(null);
    }
  };

  const handleApproveAccount = (e) => {
    e.preventDefault();
    const accountName = approvedAccountInput.trim().replace(/^@/, '');
    if (!accountName || accountName === schoolInfo.handleName || accountPrivacy.approvedAccounts.includes(accountName)) return;
    saveAccountPrivacy({
      ...accountPrivacy,
      approvedAccounts: [...accountPrivacy.approvedAccounts, accountName]
    });
    setApprovedAccountInput('');
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && newPostImages.length === 0) return;
    if (newPostImages.length > 0 && !hasConfirmedImageSafety) return;

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
      isLiked: false,
      images: newPostImages
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImages([]);
    setPostImageError('');
    setHasConfirmedImageSafety(false);
    setIsCreateModalOpen(false);
  };

  const handlePostImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setPostImageError('');

    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    const availableSlots = Math.max(0, 4 - newPostImages.length);
    const filesToAdd = validFiles.slice(0, availableSlots);
    const hasInvalidFiles = validFiles.length !== files.length;
    const exceedsLimit = validFiles.length > availableSlots;

    if (hasInvalidFiles || exceedsLimit) {
      setPostImageError('画像は各5MBまで、投稿あたり4枚まで追加できます。');
    }

    const loadedImages = await Promise.all(filesToAdd.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ id: `${file.name}-${file.lastModified}-${Math.random()}`, src: reader.result });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    })));

    const imagesToAdd = loadedImages.filter(Boolean);
    if (imagesToAdd.length !== filesToAdd.length) {
      setPostImageError('画像を読み込めませんでした。別の画像を選んでください。');
    }
    setNewPostImages(current => [...current, ...imagesToAdd].slice(0, 4));
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

    const postId = activeCommentPost.id;
    const newComment = {
      id: Date.now().toString(),
      author: `${schoolInfo.grade}${schoolInfo.classNum}_${schoolInfo.handleName}`,
      text: commentInput,
      timestamp: 'たった今',
      aiReplyStatus: 'pending'
    };

    updatePostComments(postId, comments => [...comments, newComment]);
    setCommentInput('');

    requestAiReply(newComment.text, activeCommentPost.content)
      .then(reply => {
        const aiComment = {
          id: `ai-${Date.now()}`,
          author: 'AIアシスタント',
          text: reply,
          timestamp: 'たった今',
          isAi: true
        };
        updatePostComments(postId, comments => [
          ...comments.map(comment => comment.id === newComment.id ? { ...comment, aiReplyStatus: 'done' } : comment),
          aiComment
        ]);
      })
      .catch(error => {
        updatePostComments(postId, comments => comments.map(comment => (
          comment.id === newComment.id ? { ...comment, aiReplyStatus: 'error', aiReplyError: error.message } : comment
        )));
      });
  };

  const updatePostComments = (postId, updateComments) => {
    setPosts(current => current.map(post => (
      post.id === postId ? { ...post, comments: updateComments(post.comments) } : post
    )));
    setActiveCommentPost(current => (
      current?.id === postId ? { ...current, comments: updateComments(current.comments) } : current
    ));
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      aiReplyStatus: 'pending'
    };

    setLoungeMessages(current => [...current, msg]);
    setNewLoungeMsg('');

    requestAiReply(msg.text)
      .then(reply => {
        setLoungeMessages(current => [
          ...current.map(message => message.id === msg.id ? { ...message, aiReplyStatus: 'done' } : message),
          {
            id: `ai-${Date.now()}`,
            sender: 'AIアシスタント',
            text: reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAi: true
          }
        ]);
      })
      .catch(error => {
        setLoungeMessages(current => current.map(message => (
          message.id === msg.id ? { ...message, aiReplyStatus: 'error', aiReplyError: error.message } : message
        )));
      });
  };

  const appendDmMessage = (contact, message) => {
    setDmThreads(current => ({
      ...current,
      [contact]: [...(current[contact] || []), message]
    }));
  };

  const openDmContact = (contact) => {
    selectedDmContactRef.current = contact;
    setNewDmMessage('');
    setNewDmImages([]);
    setDmMediaError('');
    setSelectedDmContact(contact);
  };

  const handleSendDm = (e) => {
    e.preventDefault();
    const text = newDmMessage.trim();
    if ((!text && newDmImages.length === 0) || !selectedDmContact) return;

    const message = {
      id: `dm-${Date.now()}`,
      sender: schoolInfo.handleName,
      text,
      images: newDmImages,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    appendDmMessage(selectedDmContact, message);
    setNewDmMessage('');
    setNewDmImages([]);
    setDmMediaError('');
  };

  const handleDmImageSelect = async (e) => {
    const contact = selectedDmContact;
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setDmMediaError('');
    const availableSlots = Math.max(0, 4 - newDmImages.length);
    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    const filesToAdd = validFiles.slice(0, availableSlots);
    if (validFiles.length !== files.length || validFiles.length > availableSlots) {
      setDmMediaError('画像は各5MBまで、1通につき4枚まで追加できます。');
    }

    const loadedImages = await Promise.all(filesToAdd.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ id: `${file.name}-${file.lastModified}-${Math.random()}`, src: reader.result });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    })));
    const images = loadedImages.filter(Boolean);
    if (images.length !== filesToAdd.length) setDmMediaError('画像を読み込めませんでした。別の画像を選んでください。');
    if (contact === selectedDmContactRef.current) setNewDmImages(current => [...current, ...images].slice(0, 4));
  };

  const stopDmVoiceRecording = () => {
    window.clearTimeout(voiceRecordingTimerRef.current);
    if (voiceRecorderRef.current?.state === 'recording') voiceRecorderRef.current.stop();
  };

  const startDmVoiceRecording = async () => {
    if (!selectedDmContact) return;
    setDmMediaError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setDmMediaError('このブラウザーではボイスメッセージを録音できません。');
      return;
    }

    const contact = selectedDmContact;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      const startedAt = Date.now();
      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        voiceStreamRef.current = null;
        voiceRecorderRef.current = null;
        setIsRecordingVoice(false);
        if (blob.size > 0) {
          appendDmMessage(contact, {
            id: `dm-voice-${Date.now()}`,
            sender: schoolInfo.handleName,
            type: 'voice',
            audioUrl: URL.createObjectURL(blob),
            duration: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      };
      voiceRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
      voiceRecordingTimerRef.current = window.setTimeout(() => {
        setDmMediaError('録音は120秒で自動停止します。');
        stopDmVoiceRecording();
      }, 120000);
    } catch {
      setDmMediaError('マイクを利用できません。ブラウザーのマイク権限を確認してください。');
    }
  };

  const formatCallDemoTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  // Filter logic
  const filteredPosts = posts.filter(post => {
    if (socialConnections.blocked.includes(post.authorName)) return false;
    const matchesTag = selectedTag === 'すべて' || post.category === selectedTag;
    const matchesGrade = selectedGradeFilter === 'すべて' || post.targetGrade === '全学年' || post.targetGrade === selectedGradeFilter;
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesGrade && matchesSearch;
  });

  const categories = ['すべて', '#授業', '#部活', '#テスト対策', '#雑談', '#進路'];
  const gradeFilters = ['すべて', '全学年', '1年生限定', '2年生限定', '3年生向け'];
  const dmContacts = Array.from(new Set([
    ...posts.flatMap(post => [
      ...(post.isAnonymous ? [] : [post.authorName]),
      ...post.comments.map(comment => comment.author)
    ]),
    ...Object.keys(dmThreads)
  ])).filter(contact => (
    contact && contact !== '匿名高校生' && contact !== 'AIアシスタント' &&
    !socialConnections.blocked.includes(contact) &&
    contact !== schoolInfo.handleName && !contact.includes(`_${schoolInfo.handleName}`)
  ));
  const filteredDmContacts = dmContacts.filter(contact => contact.toLowerCase().includes(dmSearchQuery.trim().toLowerCase()));
  const activeProfilePosts = activeProfileName ? posts.filter(post => post.authorName === activeProfileName) : [];
  const activeProfilePost = activeProfilePosts[0];
  const isOwnProfile = Boolean(activeProfileName && activeProfileName.includes(schoolInfo.handleName));
  const isProfileBlocked = activeProfileName ? socialConnections.blocked.includes(activeProfileName) : false;
  const isProfileFollowed = activeProfileName ? socialConnections.following.includes(activeProfileName) : false;
  const visibleCommentCount = post => post.comments.filter(comment => !socialConnections.blocked.includes(comment.author)).length;
  const visibleComments = activeCommentPost?.comments.filter(comment => !socialConnections.blocked.includes(comment.author)) || [];

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={({ studentId, handleName, classNum, gender, avatar, interests, bio }: {
          studentId: string;
          handleName: string;
          classNum: string;
          gender?: string;
          avatar?: string;
          interests?: string[];
          bio?: string;
        }) => {
          setSchoolInfo((current) => ({
            ...current,
            studentId,
            handleName,
            classNum,
            gender: gender ?? current.gender,
            avatar: avatar ?? current.avatar,
            interests: interests ?? current.interests,
            bio: bio ?? current.bio
          }));
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
                { id: 'messages', label: 'ダイレクトメッセージ', icon: MessageSquare },
                { id: 'voice', label: 'グループ', icon: Headphones },
                { id: 'games', label: 'ミニゲーム', icon: Gamepad2 },
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

              <StoryAndNotes displayName={schoolInfo.handleName} avatar={schoolInfo.avatar} />

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
                              <button
                                type="button"
                                onClick={() => !post.isAnonymous && setActiveProfileName(post.authorName)}
                                disabled={post.isAnonymous}
                                className="font-bold text-sm text-left enabled:hover:underline disabled:cursor-default"
                              >{post.authorName}</button>
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

                          {post.images?.length > 0 && (
                            <div className={`mt-3 grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {post.images.map((image, index) => (
                                <img
                                  key={image.id || `${post.id}-image-${index}`}
                                  src={image.src || image}
                                  alt={`投稿画像 ${index + 1}`}
                                  loading="lazy"
                                  className="max-h-80 w-full rounded-xl border border-slate-200 bg-slate-100 object-contain dark:border-slate-700 dark:bg-slate-800"
                                />
                              ))}
                            </div>
                          )}

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
                              <span>{visibleCommentCount(post)}</span>
                            </button>

                            <button
                              type="button"
                              disabled={post.isAnonymous || post.authorName.includes(`_${schoolInfo.handleName}`)}
                              onClick={() => {
                                openDmContact(post.authorName);
                                setActiveTab('messages');
                              }}
                              title={post.isAnonymous ? '匿名投稿者にはDMできません' : 'DMを送る'}
                              className="flex items-center gap-1.5 transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>DM</span>
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
                    <p className="text-xs text-slate-400">送信後、AIアシスタントが自動返信します。本文は返信生成のためOpenAIへ送信されます。</p>
                  </div>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {loungeMessages.map(msg => {
                  const isMe = msg.sender === schoolInfo.handleName;
                  const isAi = msg.isAi;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe && !isAi ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[10px] mb-0.5 px-1 ${isAi ? 'font-semibold text-indigo-500' : 'text-slate-400'}`}>{msg.sender}</span>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-xs ${
                        isAi
                          ? 'border border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-100'
                          : isMe
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5">{msg.time}</span>
                      {msg.aiReplyStatus === 'pending' && <span className="mt-1 text-[10px] text-indigo-500">AIアシスタントが返信を作成中...</span>}
                      {msg.aiReplyStatus === 'error' && <span className="mt-1 max-w-[85%] text-[10px] text-rose-500">AI自動返信に失敗しました: {msg.aiReplyError}</span>}
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

          {/* TAB 5: Direct Messages */}
          {activeTab === 'messages' && (
            <div className="flex h-[calc(100vh-1rem)] min-h-[560px] overflow-hidden">
              <section className={`w-full shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 md:flex md:w-64 ${selectedDmContact ? 'hidden' : 'flex'}`} aria-label="DM受信箱">
                <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold">ダイレクトメッセージ</h2>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="search"
                      value={dmSearchQuery}
                      onChange={event => setDmSearchQuery(event.target.value)}
                      placeholder="相手を検索"
                      aria-label="DM相手を検索"
                      className="w-full rounded-lg bg-slate-100 py-2 pl-9 pr-3 text-xs dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredDmContacts.length === 0 ? (
                    <p className="p-5 text-center text-xs leading-relaxed text-slate-400">DMできる相手が見つかりません。タイムラインの投稿から相手を選べます。</p>
                  ) : filteredDmContacts.map(contact => {
                    const thread = dmThreads[contact] || [];
                    const latestMessage = thread[thread.length - 1];
                    const isSelected = selectedDmContact === contact;
                    return (
                      <button
                        key={contact}
                        type="button"
                        onClick={() => openDmContact(contact)}
                        className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition dark:border-slate-800 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">{contact.slice(0, 1)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold">{contact}</span>
                          <span className="mt-1 block truncate text-[10px] text-slate-400">{latestMessage?.text || '会話を始める'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={`min-w-0 flex-1 flex-col ${selectedDmContact ? 'flex' : 'hidden md:flex'}`} aria-label="DM会話">
                {selectedDmContact ? (
                  <>
                    <header className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                      <button type="button" onClick={() => { selectedDmContactRef.current = null; setSelectedDmContact(null); }} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="受信箱に戻る">
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">{selectedDmContact.slice(0, 1)}</span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold">{selectedDmContact}</h2>
                        <p className="text-[10px] text-slate-400">ダイレクトメッセージ</p>
                      </div>
                      <button type="button" onClick={() => setActiveCallContact(selectedDmContact)} title="通話画面を開く" aria-label={`${selectedDmContact}との通話プレビュー`} className="ml-auto rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50 dark:hover:bg-indigo-950">
                        <Phone className="h-5 w-5" />
                      </button>
                    </header>
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {(dmThreads[selectedDmContact] || []).length === 0 ? (
                        <p className="py-10 text-center text-xs text-slate-400">{selectedDmContact}さんとの会話を始めましょう。</p>
                      ) : (dmThreads[selectedDmContact] || []).map(message => {
                        const isMe = message.sender === schoolInfo.handleName;
                        return (
                          <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="mb-1 px-1 text-[10px] text-slate-400">{isMe ? '自分' : selectedDmContact}</span>
                            <div className={`max-w-[85%] overflow-hidden rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${isMe ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'}`}>
                              {message.type === 'voice' ? (
                                <div className="min-w-[210px]">
                                  <audio controls src={message.audioUrl} className="h-9 max-w-full" aria-label="ボイスメッセージを再生" />
                                  <p className="mt-1 text-[10px] opacity-75">ボイスメッセージ・{message.duration}秒</p>
                                </div>
                              ) : (
                                <>
                                  {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
                                  {message.images?.length > 0 && (
                                    <div className={`mt-2 grid gap-1.5 ${message.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                      {message.images.map((image, index) => <img key={image.id} src={image.src} alt={`DM画像 ${index + 1}`} className="max-h-64 w-full rounded-lg bg-white/20 object-contain" />)}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <span className="mt-1 text-[9px] text-slate-400">{message.time}</span>
                          </div>
                        );
                      })}
                    </div>
                    <form onSubmit={handleSendDm} className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-800">
                      {newDmImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {newDmImages.map((image, index) => (
                            <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                              <img src={image.src} alt={`送信する画像 ${index + 1}`} className="h-full w-full bg-slate-100 object-contain dark:bg-slate-800" />
                              <button type="button" onClick={() => setNewDmImages(current => current.filter(item => item.id !== image.id))} aria-label={`画像 ${index + 1} を削除`} className="absolute right-1 top-1 rounded-full bg-slate-900/75 p-1 text-white hover:bg-rose-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {dmMediaError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{dmMediaError}</p>}
                      <p className="text-[10px] leading-relaxed text-slate-400">画像は4枚・各5MBまで。顔や個人情報が目立つ写真は避けてください。</p>
                      <div className="flex items-center gap-2">
                        <label title="画像を添付" className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                          <Paperclip className="h-5 w-5" />
                          <input type="file" accept="image/*" multiple onChange={handleDmImageSelect} className="sr-only" aria-label="DMに画像を添付" />
                        </label>
                        <button type="button" onClick={isRecordingVoice ? stopDmVoiceRecording : startDmVoiceRecording} title={isRecordingVoice ? '録音を終了して送信' : 'ボイスメッセージを録音'} aria-label={isRecordingVoice ? '録音を終了して送信' : 'ボイスメッセージを録音'} className={`rounded-lg p-2 transition ${isRecordingVoice ? 'bg-rose-100 text-rose-600 dark:bg-rose-950' : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800'}`}>
                          {isRecordingVoice ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                        {isRecordingVoice && <span className="text-[10px] font-medium text-rose-600" role="status">録音中・タップして送信</span>}
                        <input
                          type="text"
                          value={newDmMessage}
                          onChange={event => setNewDmMessage(event.target.value)}
                          maxLength={1000}
                          placeholder={`${selectedDmContact}さんにメッセージを送る`}
                          aria-label="DMメッセージ"
                          className="min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800"
                        />
                        <button type="submit" disabled={!newDmMessage.trim() && newDmImages.length === 0} aria-label="DMを送信" className="rounded-xl bg-indigo-600 p-2.5 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </form>
                    <p className="px-3 pb-2 text-center text-[10px] text-amber-600 dark:text-amber-400">この試作ではメッセージはこの画面内だけに保存され、相手には配信されません。</p>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                    <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <h2 className="text-sm font-bold">メッセージを選択</h2>
                    <p className="max-w-xs text-xs leading-relaxed text-slate-400">タイムラインの投稿からDMを開始するか、左の一覧から会話を選択してください。</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 6: Profile */}
          {activeTab === 'voice' && (
            <GroupVoiceRoom
              displayName={schoolInfo.handleName}
            />
          )}

          {activeTab === 'games' && (
            <Minigames displayName={schoolInfo.handleName} schoolName={schoolInfo.schoolName} />
          )}

          {/* TAB 7: Profile */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <div className="text-center space-y-3">
                {schoolInfo.avatar ? (
                  <img src={schoolInfo.avatar} alt="プロフィール画像" className="w-20 h-20 mx-auto rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                    {schoolInfo.handleName.slice(0, 1)}
                  </div>
                )}
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

              <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold">アカウントの公開範囲</h3>
                </div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={accountPrivacy.isPrivate}
                    onChange={event => saveAccountPrivacy({ ...accountPrivacy, isPrivate: event.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                  />
                  <span>
                    <span className="block text-xs font-semibold">鍵アカウントにする</span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">許可するアカウントをリストで管理します。</span>
                  </span>
                </label>

                {accountPrivacy.isPrivate && (
                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <form onSubmit={handleApproveAccount} className="flex gap-2">
                      <input
                        value={approvedAccountInput}
                        onChange={event => setApprovedAccountInput(event.target.value)}
                        maxLength={40}
                        placeholder="許可するアカウント名"
                        aria-label="許可するアカウント名"
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                      <button type="submit" disabled={!approvedAccountInput.trim()} className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-200 dark:text-slate-900">
                        <Plus className="h-3.5 w-3.5" />追加
                      </button>
                    </form>
                    <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                      {accountPrivacy.approvedAccounts.map(account => (
                        <li key={account} className="flex items-center gap-2 py-2 text-xs">
                          <span className="min-w-0 flex-1 truncate">@{account}</span>
                          <button
                            type="button"
                            onClick={() => saveAccountPrivacy({
                              ...accountPrivacy,
                              approvedAccounts: accountPrivacy.approvedAccounts.filter(item => item !== account)
                            })}
                            aria-label={`@${account} の許可を解除`}
                            title="許可を解除"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    {accountPrivacy.approvedAccounts.length === 0 && <p className="mt-3 text-[11px] text-slate-400">許可済みアカウントはありません。</p>}
                  </div>
                )}
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  試作版では設定と許可リストをこのブラウザーに保存するだけで、他の利用者からの閲覧をサーバー側で制限しません。実際の鍵アカウント機能として公開するには、本人確認とサーバー側のアクセス制御が必要です。
                </p>
              </section>

              {(schoolInfo.gender || schoolInfo.interests.length > 0 || schoolInfo.bio) && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  {schoolInfo.gender && <div className="flex justify-between text-xs"><span className="text-slate-500">性別</span><span className="font-semibold">{schoolInfo.gender}</span></div>}
                  {schoolInfo.interests.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-bold text-slate-500">興味のあること</h3>
                      <div className="flex flex-wrap gap-2">{schoolInfo.interests.map(interest => <span key={interest} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">{interest}</span>)}</div>
                    </div>
                  )}
                  {schoolInfo.bio && <div><h3 className="mb-1 text-xs font-bold text-slate-500">自己紹介</h3><p className="whitespace-pre-wrap text-sm leading-relaxed">{schoolInfo.bio}</p></div>}
                </div>
              )}

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
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">写真・スクリーンショット</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    授業ノート、部活動、作品、趣味の画像を共有できます。最大4枚・各5MBまで。顔がはっきり写る写真や、名札・学籍番号など個人情報が見える画像は避けてください。
                  </p>
                </div>
                <label className="shrink-0 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                  <span className="flex items-center gap-1.5"><Image className="h-4 w-4" />画像を追加</span>
                  <input type="file" accept="image/*" multiple onChange={handlePostImageSelect} className="sr-only" aria-label="写真やスクリーンショットを追加" />
                </label>
              </div>

              {postImageError && <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">{postImageError}</p>}

              {newPostImages.length > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {newPostImages.map((image, index) => (
                      <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                        <img src={image.src} alt={`追加する画像 ${index + 1}`} className="h-full w-full bg-slate-100 object-contain dark:bg-slate-800" />
                        <button
                          type="button"
                          onClick={() => setNewPostImages(current => current.filter(item => item.id !== image.id))}
                          aria-label={`画像 ${index + 1} を削除`}
                          title="画像を削除"
                          className="absolute right-1 top-1 rounded-full bg-slate-900/75 p-1 text-white transition hover:bg-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={hasConfirmedImageSafety}
                      onChange={event => setHasConfirmedImageSafety(event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                    />
                    <span>顔や名札など、個人が特定できる情報が目立たない画像を選びました。</span>
                  </label>
                </>
              )}
            </div>

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
                disabled={(!newPostContent.trim() && newPostImages.length === 0) || (newPostImages.length > 0 && !hasConfirmedImageSafety)}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-xl shadow-md"
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
              <button type="button" onClick={() => !activeCommentPost.isAnonymous && setActiveProfileName(activeCommentPost.authorName)} disabled={activeCommentPost.isAnonymous} className="font-bold text-indigo-600 enabled:hover:underline disabled:cursor-default dark:text-indigo-400">{activeCommentPost.authorName}</button>
              <div className="text-slate-700 dark:text-slate-300">{activeCommentPost.content}</div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {visibleComments.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-6">{activeCommentPost.comments.length === 0 ? 'まだコメントはありません。' : 'ブロックした相手のコメントは非表示です。'}</p>
              ) : (
                visibleComments.map(comment => (
                  <div key={comment.id} className="p-3 bg-slate-100/60 dark:bg-slate-700/20 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <button type="button" onClick={() => !comment.isAi && comment.author !== '匿名高校生' && setActiveProfileName(comment.author)} disabled={comment.isAi || comment.author === '匿名高校生'} className={`text-left enabled:hover:underline disabled:cursor-default ${comment.isAi ? 'text-indigo-600 dark:text-indigo-300' : ''}`}>{comment.author}</button>
                      <span className="text-[10px] text-slate-400 font-normal">{comment.timestamp}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{comment.text}</p>
                    {comment.aiReplyStatus === 'pending' && <p className="text-[10px] text-indigo-500">AIアシスタントが返信を作成中...</p>}
                    {comment.aiReplyStatus === 'error' && <p className="text-[10px] text-rose-500">AI自動返信に失敗しました: {comment.aiReplyError}</p>}
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <p className="text-[10px] leading-relaxed text-slate-400">コメント本文はAI返信の生成時にOpenAIへ送信されます。返信はAIアシスタント名義で表示されます。</p>
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

      {activeProfileName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setActiveProfileName(null); }}>
          <section className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="user-profile-title">
            <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h2 className="text-sm font-bold">プロフィール</h2>
              <button type="button" onClick={() => setActiveProfileName(null)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="プロフィールを閉じる">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="overflow-y-auto p-5">
              <div className="flex items-start gap-4">
                {isOwnProfile && schoolInfo.avatar ? (
                  <img src={schoolInfo.avatar} alt="プロフィール画像" className="h-16 w-16 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{activeProfileName.slice(0, 1)}</div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 id="user-profile-title" className="truncate text-lg font-bold">{activeProfileName}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {isOwnProfile
                      ? `${schoolInfo.schoolName}・${schoolInfo.grade}${schoolInfo.classNum}`
                      : activeProfilePost
                        ? `${activeProfilePost.authorGrade} ${activeProfilePost.authorClass}`
                        : '校内メンバー'}
                  </p>
                </div>
              </div>

              {!isOwnProfile && (
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => toggleFollow(activeProfileName)} disabled={isProfileBlocked} className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${isProfileFollowed ? 'border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {isProfileBlocked ? 'ブロック中' : isProfileFollowed ? 'フォロー中' : 'フォロー'}
                  </button>
                  <button type="button" onClick={() => toggleBlock(activeProfileName)} className={`rounded-lg border px-4 py-2.5 text-xs font-bold transition ${isProfileBlocked ? 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950' : 'border-slate-300 text-slate-700 hover:border-rose-300 hover:text-rose-700 dark:border-slate-700 dark:text-slate-200'}`}>
                    {isProfileBlocked ? 'ブロック解除' : 'ブロック'}
                  </button>
                </div>
              )}

              {isOwnProfile && schoolInfo.bio && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{schoolInfo.bio}</p>}
              {isOwnProfile && schoolInfo.interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {schoolInfo.interests.map(interest => <span key={interest} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{interest}</span>)}
                </div>
              )}

              <section className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                <h4 className="mb-3 text-xs font-bold">投稿 <span className="font-normal text-slate-400">{isProfileBlocked ? 0 : activeProfilePosts.length}</span></h4>
                {isProfileBlocked ? (
                  <p className="py-6 text-center text-xs text-slate-400">ブロック中のため投稿を非表示にしています。</p>
                ) : activeProfilePosts.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">表示できる投稿はありません。</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeProfilePosts.map(post => (
                      <article key={post.id} className="py-3">
                        <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                          <span>{post.category}</span><span>{post.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{post.content}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-400">フォローとブロックはこのブラウザー内に保存される試作機能です。</p>
            </div>
          </section>
        </div>
      )}

      {activeCallContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <section className="flex min-h-[420px] w-full max-w-sm flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-900 p-8 text-center text-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dm-call-preview-title">
            <p className="mb-8 text-xs font-semibold uppercase text-indigo-300">通話画面プレビュー</p>
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/20 text-3xl font-bold text-indigo-100 ring-1 ring-indigo-300/30">{activeCallContact.slice(0, 1)}</div>
            <h2 id="dm-call-preview-title" className="text-xl font-bold">{activeCallContact}</h2>
            <p className="mt-2 text-sm text-slate-300">{formatCallDemoTime(callDemoSeconds)}</p>
            <p className="mt-6 max-w-xs text-xs leading-relaxed text-amber-200">これは画面プレビューです。相手への発信や音声接続は行われません。</p>
            <button type="button" onClick={() => setActiveCallContact(null)} className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white transition hover:bg-rose-700" aria-label="通話プレビューを終了" title="終了">
              <PhoneOff className="h-6 w-6" />
            </button>
          </section>
        </div>
      )}

    </div>
  );
}