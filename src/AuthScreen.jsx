import { useState } from 'react';

const initialRegisterForm = {
  email: '',
  password: '',
  studentId: '',
  dateOfBirth: '',
  classNum: '1組',
};

const classOptions = ['1組', '2組', '3組', '4組', '5組', '6組'];

export default function AuthScreen({ onLogin }) {
  const [page, setPage] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginMessage, setLoginMessage] = useState(null);
  const [registerMessage, setRegisterMessage] = useState(null);

  const updateLogin = (event) => {
    setLoginForm({ ...loginForm, [event.target.name]: event.target.value });
  };

  const updateRegister = (event) => {
    setRegisterForm({ ...registerForm, [event.target.name]: event.target.value });
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setLoginMessage(null);

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      setLoginMessage({ type: 'error', text: 'メールアドレスとパスワードを正しく入力してください。' });
      return;
    }

    onLogin({ studentId: loginForm.email, handleName: loginForm.email.split('@')[0] || '海校たろう', classNum: loginForm.classNum });
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setRegisterMessage(null);

    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      setRegisterMessage({ type: 'error', text: '入力内容を確認してください。' });
      return;
    }

    setRegisterMessage({ type: 'success', text: '新規登録が完了しました。ログイン画面へ移動します。' });
    setLoginForm({ email: registerForm.email, password: '' });
    setRegisterForm(initialRegisterForm);
    window.setTimeout(() => {
      setPage('login');
      setRegisterMessage(null);
    }, 700);
  };

  if (page === 'register') {
    return (
      <main className="auth-register-page">
        <section className="auth-register-brand">
          <p className="auth-eyebrow">海校さん</p>
          <h1>新規登録</h1>
          <p>学校の仲間とつながるためのアカウントを作成します。</p>
        </section>
        <section className="auth-register-panel">
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            <h2>アカウントを作成</h2>
            <label>メールアドレス<span>*</span><input name="email" type="email" autoComplete="email" value={registerForm.email} onChange={updateRegister} required /></label>
            <label>パスワード<span>*</span><input name="password" type="password" autoComplete="new-password" minLength="8" pattern="[A-Za-z0-9]{8,}" title="半角英数字8文字以上で入力してください" value={registerForm.password} onChange={updateRegister} required /><small>半角英数字8文字以上</small></label>
            <label>クラス<span>*</span><select name="classNum" value={registerForm.classNum} onChange={updateRegister} required>{classOptions.map((className) => <option key={className}>{className}</option>)}</select></label>
            <label>学籍番号<span>*</span><input name="studentId" type="text" autoComplete="off" value={registerForm.studentId} onChange={updateRegister} required /></label>
            <label>生年月日<span>*</span><input name="dateOfBirth" type="date" autoComplete="bday" value={registerForm.dateOfBirth} onChange={updateRegister} required /></label>
            {registerMessage && <p className={`auth-message ${registerMessage.type}`} role="alert">{registerMessage.text}</p>}
            <button className="auth-primary-button" type="submit">新規登録</button>
            <button className="auth-text-button" type="button" onClick={() => { setRegisterMessage(null); setPage('login'); }}>← ログイン画面に戻る</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-login-page">
      <div className="auth-login-container">
        <section className="auth-login-section">
          <p className="auth-eyebrow">海校さん</p>
          <h1>ログイン</h1>
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <label>メールアドレス<input name="email" type="email" autoComplete="email" value={loginForm.email} onChange={updateLogin} required /></label>
            <label>パスワード<input name="password" type="password" autoComplete="current-password" value={loginForm.password} onChange={updateLogin} required /></label>
            <label>クラス<select name="classNum" value={loginForm.classNum || '1組'} onChange={updateLogin} required>{classOptions.map((className) => <option key={className}>{className}</option>)}</select></label>
            <div className="auth-links">
              <button type="button" onClick={() => setLoginMessage({ type: 'success', text: '登録状況確認画面へ移動します。' })}>→ 登録の有無がわからない場合</button>
              <button type="button" onClick={() => setLoginMessage({ type: 'success', text: 'パスワード再設定画面へ移動します。' })}>→ パスワードを忘れた場合</button>
            </div>
            {loginMessage && <p className={`auth-message ${loginMessage.type}`} role="alert">{loginMessage.text}</p>}
            <button className="auth-primary-button auth-login-button" type="submit">ログイン</button>
          </form>
        </section>
        <section className="auth-login-section auth-register-cta">
          <p className="auth-eyebrow">NEW MEMBER</p>
          <h2>新規登録</h2>
          <p>はじめて利用する方はこちらから。</p>
          <button className="auth-secondary-button" type="button" onClick={() => { setLoginMessage(null); setPage('register'); }}>新規登録</button>
        </section>
      </div>
    </main>
  );
}
