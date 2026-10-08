import { useRef, useState } from 'react';
import { Camera, Check, ChevronLeft, UserRound } from 'lucide-react';

const interestOptions = ['スポーツ', '料理', 'お菓子作り', 'ファッション', 'ゲーム', '写真', 'アニメ', '読書', '旅行', '音楽'];

export default function ProfileSetupScreen({ onComplete }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState('');
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState('');
  const [nameError, setNameError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [interestLimitReached, setInterestLimitReached] = useState(false);

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const goToStep2 = () => {
    if (!name.trim()) {
      setNameError('名前を入力してください。');
      return;
    }
    setNameError('');
    setStep(2);
  };

  const toggleInterest = (interest) => {
    setInterestLimitReached(false);
    if (interests.includes(interest)) {
      setInterests(interests.filter((item) => item !== interest));
    } else if (interests.length >= 3) {
      setInterestLimitReached(true);
    } else {
      setInterests([...interests, interest]);
    }
  };

  const completeRegistration = () => {
    onComplete({
      handleName: name.trim(),
      gender,
      avatar,
      interests,
      bio: bio.trim(),
    });
  };

  return (
    <main className="profile-setup-page min-h-screen flex items-center justify-center p-4 md:p-8">
      <section className="profile-setup-panel w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 shadow-xl md:p-12">
        <div className="mb-8 flex items-center justify-center gap-3 sm:gap-4" aria-label={`ステップ${step}、全2ステップ`}>
          <div className={`flex items-center gap-2 text-sm md:text-base ${step === 1 ? 'text-custom-blue font-bold' : 'text-slate-400'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step === 1 ? 'bg-custom-blue text-white' : 'bg-emerald-100 text-emerald-700'}`}>
              {step === 1 ? '1' : <Check className="h-4 w-4" />}
            </span>
            <span>基本情報</span>
          </div>
          <div className="h-0.5 w-8 bg-slate-200 sm:w-12" />
          <div className={`flex items-center gap-2 text-sm md:text-base ${step === 2 ? 'text-custom-blue font-bold' : 'text-slate-400'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step === 2 ? 'bg-custom-blue text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <span>興味・自己紹介</span>
          </div>
        </div>

        {step === 1 ? (
          <div className="profile-step">
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">WELCOME TO CAMPUS</p>
            <h1 className="mb-8 text-2xl font-bold text-custom-blue md:text-3xl">プロフィールを作成</h1>
            <div className="mb-10 flex flex-col items-center gap-8 md:flex-row md:items-start">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="profile-avatar-button group relative h-28 w-28 overflow-hidden rounded-full bg-pill-gray ring-4 ring-transparent transition hover:ring-blue-200 md:h-32 md:w-32"
                  aria-label="プロフィール画像を選択"
                >
                  {avatar ? (
                    <img src={avatar} alt="プロフィール画像のプレビュー" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="mx-auto h-16 w-16 text-white" strokeWidth={1.5} />
                  )}
                  <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Camera className="mb-1 h-6 w-6" />画像を変更
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="sr-only" aria-label="画像ファイル" />
                <span className="text-xs font-medium text-slate-400">画像を選択（任意）</span>
              </div>

              <div className="w-full flex-1 space-y-6 md:pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <label htmlFor="profile-name" className="min-w-[60px] text-lg font-bold text-slate-600">名前</label>
                  <div className="w-full sm:max-w-xs">
                    <input
                      id="profile-name"
                      type="text"
                      autoComplete="nickname"
                      value={name}
                      onChange={(event) => { setName(event.target.value); setNameError(''); }}
                      maxLength={24}
                      className="profile-input w-full rounded-2xl bg-pill-gray px-5 py-3 font-medium text-slate-800 transition"
                      aria-describedby={nameError ? 'profile-name-error' : undefined}
                    />
                    {nameError && <p id="profile-name-error" className="mt-2 text-sm text-rose-600" role="alert">{nameError}</p>}
                  </div>
                </div>

                <fieldset className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <legend className="min-w-[60px] text-lg font-bold text-slate-600">性別</legend>
                  <div className="flex flex-wrap gap-3" role="group" aria-label="性別（任意）">
                    {['男', '女', '選択しない'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={gender === option}
                        onClick={() => setGender(gender === option ? '' : option)}
                        className={`rounded-full px-5 py-2.5 text-base font-bold transition ${gender === option ? 'bg-custom-blue text-white' : 'bg-pill-gray text-slate-700 hover:bg-slate-300'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button type="button" onClick={goToStep2} className="profile-primary-button rounded-2xl px-10 py-3.5 text-lg font-bold text-white shadow-lg transition active:scale-95">
                次へ
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-step">
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">A LITTLE ABOUT YOU</p>
            <h1 className="mb-2 text-2xl font-bold text-slate-700 md:text-3xl">興味のあること</h1>
            <p className="mb-5 text-sm text-slate-500">気になるタグを3つまで選べます。</p>
            {interestLimitReached && (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800" role="status">
                興味のあることは最大3つまで選択できます。
              </p>
            )}
            <div className="mb-8 flex flex-wrap gap-3">
              {interestOptions.map((interest) => {
                const selected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full px-5 py-2.5 text-base font-bold transition ${selected ? 'bg-custom-blue text-white' : 'bg-pill-gray text-slate-700 hover:bg-slate-300'}`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            <label htmlFor="profile-bio" className="mb-3 block text-xl font-bold text-slate-700 md:text-2xl">自己紹介 <span className="text-base font-normal text-slate-500">（任意）</span></label>
            <textarea
              id="profile-bio"
              rows={4}
              maxLength={240}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="profile-input mb-8 w-full resize-y rounded-3xl bg-pill-gray p-5 font-medium text-slate-800"
              aria-describedby="profile-bio-count"
            />
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 px-2 py-2 font-bold text-slate-500 transition hover:text-slate-800">
                <ChevronLeft className="h-5 w-5" />戻る
              </button>
              <div className="flex items-center gap-3">
                <span id="profile-bio-count" className="hidden text-xs text-slate-400 sm:inline">{bio.length}/240</span>
                <button type="button" onClick={() => setShowSummary(true)} className="profile-primary-button rounded-2xl px-7 py-3.5 text-base font-bold text-white shadow-lg transition active:scale-95 sm:px-10 sm:text-lg">
                  登録完了
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl md:p-8" role="dialog" aria-modal="true" aria-labelledby="profile-summary-title">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-7 w-7" /></div>
              <h2 id="profile-summary-title" className="text-2xl font-bold text-slate-800">プロフィールを確認</h2>
              <p className="mt-1 text-sm text-slate-500">この内容で登録してコミュニティへ進みます。</p>
            </div>
            <div className="space-y-4 rounded-2xl bg-slate-50 p-5 text-slate-700">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                {avatar ? <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pill-gray text-white"><UserRound className="h-9 w-9" /></div>}
                <div>
                  <p className="text-xs font-bold text-slate-400">名前</p>
                  <p className="text-lg font-bold text-slate-800">{name.trim()}</p>
                  <p className="mt-1 text-xs text-slate-500">性別: {gender || '未選択'}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-slate-400">興味のあること</p>
                {interests.length ? <div className="flex flex-wrap gap-2">{interests.map((interest) => <span key={interest} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-custom-blue">{interest}</span>)}</div> : <p className="text-sm text-slate-500">未選択</p>}
              </div>
              <div>
                <p className="mb-1 text-xs font-bold text-slate-400">自己紹介</p>
                <p className="min-h-12 whitespace-pre-wrap rounded-xl border border-slate-100 bg-white p-3 text-sm leading-relaxed">{bio.trim() || 'なし'}</p>
              </div>
            </div>
            <button type="button" onClick={completeRegistration} className="profile-primary-button w-full rounded-2xl py-3.5 font-bold text-white transition">
              この内容で登録して始める
            </button>
            <button type="button" onClick={() => setShowSummary(false)} className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-800">内容を編集する</button>
          </section>
        </div>
      )}
    </main>
  );
}