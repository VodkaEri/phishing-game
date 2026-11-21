// ===== フィッシングメール鑑定所：ゲームの動き =====
// スワイプ・タイム計測・上司の表情・効果音・ランキングをここで扱う。
// 問題のデータは mails.js にある MAILS を使う。
{
  // ===== 設定 =====
  const ROUND = 10;       // 1回に出すメールの数
  const LIMIT = 5;        // 1通の制限時間（秒）
  const MISS_PEN = 3;     // ミスのペナルティ（秒）
  const TIMEOUT_PEN = 5;  // 時間切れのペナルティ（秒）
  const KEY = 'phish-rush-rank-v1', NKEY = 'phish-rush-name';

  // ===== みんなのランキング（Supabase）の設定 =====
  // 2つとも空のままだと「この端末だけのランキング」で動きます。
  // Supabaseの準備ができたら、ここに Project URL と anon public key を貼るだけで
  // みんなのランキングに切り替わります。
  const SUPABASE_URL = 'https://yncvsifethlkbuhjrxti.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_hRm3T8_sqHTvU-7mpV1aBg_GNDM32SZ';
  const ONLINE = Boolean(SUPABASE_URL && SUPABASE_KEY);

  const AV_COLORS = ['#ff7a45', '#7b61ff', '#00a3c4', '#e0459b', '#3b9b3b', '#d48a00'];

  // ===== 上司の顔（0:ニコニコ 1:真顔 2:ムッ 3:激おこ） =====
  function face(m) {
    const skin = m === 3 ? '#f2a08a' : '#f6cfa8';
    const brow = [['30,41 45,38', '55,38 70,41'], ['30,41 45,41', '55,41 70,41'], ['30,37 45,43', '55,43 70,37'], ['28,33 46,45', '54,45 72,33']][m];
    const mouth = ['<path d="M39 71 Q50 82 61 71" fill="none" stroke="#3a1f14" stroke-width="3.5" stroke-linecap="round"/>',
      '<path d="M41 74 L59 74" stroke="#3a1f14" stroke-width="3.5" stroke-linecap="round"/>',
      '<path d="M41 77 Q50 70 59 77" fill="none" stroke="#3a1f14" stroke-width="3.5" stroke-linecap="round"/>',
      '<path d="M39 79 Q50 63 61 79 Z" fill="#3a1f14"/>'][m];
    const extra = m === 0 ? '<circle cx="30" cy="66" r="5" fill="#ff9aa2" opacity=".7"/><circle cx="70" cy="66" r="5" fill="#ff9aa2" opacity=".7"/>'
      : m === 3 ? '<g stroke="#e0182f" stroke-width="4" stroke-linecap="round" fill="none"><path d="M70 18 q4 4 0 8"/><path d="M80 18 q-4 4 0 8"/><path d="M71 30 q4-4 8 0"/><path d="M71 16 q4 4 8 0"/></g>' : '';
    return `<svg viewBox="0 0 100 100" aria-label="上司">
      <path d="M22 100 Q22 84 50 84 Q78 84 78 100Z" fill="#2b3445"/>
      <path d="M44 84 L50 96 L56 84Z" fill="#fff"/><path d="M48.5 86 L51.5 86 L52 98 L48 98Z" fill="#d93a3a"/>
      <circle cx="50" cy="52" r="32" fill="${skin}"/>
      <path d="M19 48 Q20 18 50 17 Q80 18 81 48 Q76 30 50 29 Q24 30 19 48Z" fill="#3b3b44"/>
      <g fill="none" stroke="#222" stroke-width="2.5"><circle cx="38" cy="54" r="8.5"/><circle cx="62" cy="54" r="8.5"/><path d="M46.5 54 L53.5 54"/></g>
      <circle cx="38" cy="55" r="2.6" fill="#222"/><circle cx="62" cy="55" r="2.6" fill="#222"/>
      <polyline points="${brow[0]}" fill="none" stroke="#2a2a30" stroke-width="3.5" stroke-linecap="round"/>
      <polyline points="${brow[1]}" fill="none" stroke="#2a2a30" stroke-width="3.5" stroke-linecap="round"/>
      ${mouth}${extra}</svg>`;
  }

  // ===== 効果音（ファイルなし、ブラウザで音を作る） =====
  // ゲーセン風のピコピコ音。f→f2 は音程のスライド（ピロッ、ヒュ〜ン など）
  let ac = null, muted = false, noiseBuf = null;
  function tone(f, dur, type = 'square', vol = .1, delay = 0, f2 = 0) {
    if (muted || !ac) return;
    const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + dur + .02);
  }
  // ザッ（シュレッダー）やシュッ（紙飛行機）用のノイズ音
  function noise(dur, from, to, vol = .2, delay = 0) {
    if (muted || !ac) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ac.currentTime + delay, s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(from, t0); bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    s.connect(bp).connect(g).connect(ac.destination); s.start(t0); s.stop(t0 + dur + .02);
  }
  const sOk = (c, fast) => {             // コインっぽい「ピロリン」。コンボで音程アップ
    const k = Math.pow(2, Math.min(c - 1, 12) / 12);
    tone(988 * k, .07, 'square', .08); tone(1319 * k, .16, 'square', .08, .06);
    if (fast) tone(2637 * k, .08, 'triangle', .05, .14);
  };
  const sNg = () => { tone(98, .16, 'sawtooth', .13); tone(92, .22, 'square', .1, .18); };   // ブブー
  const sTo = () => tone(880, .45, 'square', .08, 0, 160);                                      // ヒュ〜ン
  const sZone = () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .09, 'square', .07, i * .045));
  const sPlane = () => noise(.28, 900, 4000, .12);                                              // シュッ
  const sShred = () => { noise(.25, 3000, 600, .2); noise(.15, 2000, 500, .15, .1); };          // ザザッ
  const sCount = last => last ? tone(1760, .3, 'square', .09) : tone(880, .09, 'square', .08);
  const sFanfare = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? .4 : .12, 'square', .08, i * .11));
  const sSad = () => [392, 370, 349, 262].forEach((f, i) => tone(f, i === 3 ? .6 : .28, 'sawtooth', .07, i * .3));

  // ===== 状態 =====
  const $ = id => document.getElementById(id);
  let deck = [], idx = 0, log = [], combo = 0, mood = 0, phase = 'start', t0 = 0, raf = 0, mem = [], lastTotal = 0;

  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sum = () => log.reduce((a, r) => a + r.dt + r.pen, 0);

  function show(id) { ['start', 'play', 'result'].forEach(s => { $(s).hidden = s !== id; }); window.scrollTo({ top: 0 }); }

  // ===== スタート〜カウントダウン =====
  function start() {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) { ac = null; }
    const ok = shuffle(MAILS.filter(m => m.ans === 'ok')).slice(0, 5);
    const ng = shuffle(MAILS.filter(m => m.ans === 'ng')).slice(0, 5);
    deck = shuffle([...ok, ...ng]); idx = 0; log = []; combo = 0; mood = 0; myRow = null;
    document.body.classList.remove('zone');
    $('combo').textContent = ''; $('combo').className = 'combo';
    $('bossMini').innerHTML = face(0); $('clock').textContent = '0.0';
    show('play'); phase = 'cd';
    const cd = $('cd'); cd.hidden = false;
    const steps = ['3', '2', '1', 'GO!'];
    steps.forEach((s, i) => setTimeout(() => {
      cd.innerHTML = `<span>${s}</span>`; sCount(i === 3);
      if (i === 3) setTimeout(() => { cd.hidden = true; nextMail(); }, 380);
    }, i * 450));
  }

  function nextMail() {
    const m = deck[idx], col = AV_COLORS[(m.from.charCodeAt(0) + idx) % AV_COLORS.length];
    $('pg').textContent = (idx + 1) + ' / ' + ROUND;
    $('stage').innerHTML = `
      <div class="mail" id="card">
        <div class="stamp l" id="stL">危険</div><div class="stamp r" id="stR">返信OK</div>
        <div class="mh"><div class="av" style="background:${col}">${esc(m.from.charAt(0))}</div>
          <div><div class="nm">${esc(m.from)}</div><span class="ad">${esc(m.addr)}</span></div></div>
        <div class="sj">${esc(m.subj)}</div>
      </div>`;
    bindSwipe($('card'));
    phase = 'q'; t0 = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (phase !== 'q') return;
    const el = (now - t0) / 1000, rest = Math.max(0, LIMIT - el);
    $('clock').textContent = (sum() + el).toFixed(1);
    const lim = $('lim'); lim.style.transform = `scaleX(${rest / LIMIT})`; lim.classList.toggle('low', rest < 1.5);
    if (rest <= 0) { judge('timeout'); return; }
    raf = requestAnimationFrame(tick);
  }

  // ===== 判定 =====
  function judge(choice) {
    if (phase !== 'q') return;
    phase = 'anim'; cancelAnimationFrame(raf);
    const m = deck[idx], dt = Math.min(LIMIT, (performance.now() - t0) / 1000);
    const timeout = choice === 'timeout', ok = !timeout && choice === m.ans;
    const pen = timeout ? TIMEOUT_PEN : ok ? 0 : MISS_PEN;
    log.push({ m, choice, ok, dt, pen });
    $('clock').textContent = sum().toFixed(1);
    const card = $('card');

    if (ok) {
      combo++;
      sOk(combo, dt < 1);
      popText(dt < 1 ? '神速！' : dt < 2 ? 'NICE!' : 'OK', dt < 1 ? '#ffe03d' : dt < 2 ? '#7dffcf' : '#fff');
      if (combo >= 2 && combo % 2 === 0 && mood > 0) mood--;
      if (combo === 5) { sZone(); popText('ゾーン突入！', '#ff9a1f', 260); }
    } else {
      combo = 0; mood = Math.min(3, mood + 1);
      timeout ? sTo() : sNg();
      $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on');
      $('app').classList.remove('shake'); void $('app').offsetWidth; $('app').classList.add('shake');
      bossShout(timeout ? 'おーい、聞いてる？' : m.ans === 'ng' ? 'それ詐欺だよ！？' : m.boss ? '俺のメール、詐欺扱い…？' : 'それ普通のメールだよ！');
    }
    document.body.classList.toggle('zone', combo >= 5);
    const cb = $('combo');
    cb.textContent = combo >= 2 ? combo + ' COMBO' : '';
    cb.className = 'combo' + (combo >= 5 ? ' zone' : '');
    const mini = $('bossMini'); mini.innerHTML = face(mood);
    mini.classList.remove('hit'); void mini.offsetWidth; if (!ok) mini.classList.add('hit');

    // 返信OK側に仕分けたら紙飛行機、危険側ならシュレッダー
    if (card) {
      const toOk = choice === 'ok';
      card.style.transform = '';
      card.classList.add(timeout ? 'go-ng' : toOk ? 'go-ok' : 'go-ng');
      if (toOk) sPlane(); else { strips(); if (!timeout) sShred(); }
    }
    setTimeout(() => {
      idx++;
      if (idx < ROUND) nextMail(); else finish();
    }, ok ? 380 : 620);
  }

  function popText(txt, color, top) {
    const d = document.createElement('div');
    d.className = 'pop'; d.textContent = txt; d.style.color = color; if (top) d.style.top = top + 'px';
    $('fx').append(d); setTimeout(() => d.remove(), 850);
  }
  function strips() {
    const st = $('stage');
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div');
      s.className = 'strip'; s.style.left = (8 + i * 7.6) + '%';
      s.style.setProperty('--r', (Math.random() * 60 - 30) + 'deg');
      s.style.animationDelay = (Math.random() * .12) + 's';
      st.append(s); setTimeout(() => s.remove(), 900);
    }
  }
  function bossShout(text) {
    const b = $('bossBig');
    b.innerHTML = `<div class="in"><div class="bub">${esc(text)}</div>${face(Math.max(2, mood))}</div>`;
    b.hidden = false; clearTimeout(b._t); b._t = setTimeout(() => { b.hidden = true; }, 900);
  }

  // ===== スワイプ =====
  function bindSwipe(card) {
    let sx = null, dx = 0;
    card.addEventListener('pointerdown', e => { if (phase !== 'q') return; sx = e.clientX; dx = 0; card.style.transition = 'none'; try { card.setPointerCapture(e.pointerId); } catch (_) {} });
    card.addEventListener('pointermove', e => {
      if (sx === null) return;
      dx = e.clientX - sx;
      card.style.transform = `translateX(${dx}px) rotate(${dx * .06}deg)`;
      $('stL').style.opacity = Math.min(1, Math.max(0, -dx / 90));
      $('stR').style.opacity = Math.min(1, Math.max(0, dx / 90));
    });
    const end = () => {
      if (sx === null) return;
      sx = null; card.style.transition = '';
      if (dx > 80) judge('ok'); else if (dx < -80) judge('ng');
      else { card.style.transform = ''; $('stL').style.opacity = 0; $('stR').style.opacity = 0; }
    };
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  }

  // ===== 結果 =====
  function grade(total, miss) {
    if (miss === 0 && total < 15) return 'S';
    if (miss <= 1 && total < 25) return 'A';
    if (total < 40) return 'B';
    return 'C';
  }
  function comment(total, miss) {
    const repliedScam = log.some(r => r.m.ans === 'ng' && r.choice === 'ok');
    if (miss >= 3 && repliedScam) return [3, 'ちょっといいかな。さっきのギフトカードの件で。'];
    if (miss >= 3) return [3, '…一回、研修受け直そうか。'];
    if (total >= 40) return [2, '…その判断スピードで大丈夫？'];
    if (miss === 0 && total < 15) return [0, '君、仕事早いね。来期、期待してるよ。'];
    if (miss === 0) return [0, 'ミスなし、いいね。あとはスピードかな。'];
    return [1, '速いけど、ちょっと雑かな。気をつけてね。'];
  }

  function finish() {
    phase = 'end';
    document.body.classList.remove('zone');
    const total = Math.round(sum() * 10) / 10, miss = log.filter(r => !r.ok).length;
    const real = log.reduce((a, r) => a + r.dt, 0), pen = log.reduce((a, r) => a + r.pen, 0);
    lastTotal = total;
    const [m, c] = comment(total, miss);
    $('bossEnd').innerHTML = face(m); $('say').textContent = c;
    const g = grade(total, miss);
    $('grade').textContent = g;
    if (g === 'S' || g === 'A') sFanfare(); else if (g === 'C') sSad();
    $('total').textContent = total.toFixed(1);
    $('detail').textContent = `実タイム ${real.toFixed(1)}秒 ＋ ペナルティ ${pen}秒（ミス${miss}回）`;
    const rv = [...log].sort((a, b) => a.ok - b.ok);
    $('review').innerHTML = rv.map(r => `
      <div class="ex"><div class="mk" style="background:${r.ok ? 'var(--ok)' : 'var(--ng)'}">${r.ok ? '○' : '×'}</div>
        <div><b>${esc(r.m.subj)}</b><span>${esc(r.m.from)}｜${esc(r.m.addr)}</span>
        <em>正解：${r.m.ans === 'ok' ? '返信OK' : '危険'}${r.choice === 'timeout' ? '（時間切れ）' : ''}　${esc(r.m.pt)}</em></div></div>`).join('');
    $('nameForm').hidden = false;
    $('rankNote').textContent = ONLINE ? 'みんなのランキング（上位20人）。名前はニックネームでOK。' : 'いまはこの端末の記録だけが表示されます。';
    renderRank();
    show('result');
  }

  // ===== ランキング =====
  // ONLINE のときは Supabase、そうでなければこの端末の中（localStorage）に保存する
  let myRow = null; // 自分が登録した記録（ランキングで色を付けるため）

  function loadLocal() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(x => x && typeof x.time === 'number' && typeof x.name === 'string') : []; }
    catch (e) { return mem; }
  }
  function saveLocal(a) { mem = a; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

  // 新しい publishable key（sb_publishable_〜）は apikey ヘッダーだけで送る。
  // 古い anon key（eyJ〜 で始まる）のときだけ Authorization ヘッダーも付ける。
  const sbHeaders = () => {
    const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
    if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = 'Bearer ' + SUPABASE_KEY;
    return h;
  };

  // 上位20件を取ってくる
  async function fetchTop() {
    if (!ONLINE) return loadLocal();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/scores?select=name,time,miss,created_at&order=time.asc,created_at.asc&limit=20`, { headers: sbHeaders() });
    if (!r.ok) throw new Error('fetch failed ' + r.status);
    return r.json();
  }
  // 記録を1件登録する
  async function postScore(name, time, miss) {
    if (!ONLINE) {
      const a = loadLocal(), row = { name, time, miss, created_at: new Date().toISOString() };
      a.push(row); a.sort((x, y) => x.time - y.time || (x.created_at < y.created_at ? -1 : 1));
      saveLocal(a.slice(0, 20)); return row;
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
      method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({ name, time, miss }),
    });
    if (!r.ok) throw new Error('post failed ' + r.status);
    return (await r.json())[0];
  }

  // listId：表示する場所（'list' は結果画面、'listTop' はトップページ）
  async function renderRank(listId = 'list') {
    const ol = $(listId);
    ol.innerHTML = '<li class="empty">読み込み中…</li>';
    let a;
    try { a = await fetchTop(); }
    catch (e) { ol.innerHTML = '<li class="empty">ランキングを読み込めませんでした。時間をおいてもう一度試してください。</li>'; return; }
    ol.innerHTML = '';
    if (!a.length) { ol.innerHTML = '<li class="empty">まだ記録がありません。1位になれるチャンス！</li>'; return; }
    a.forEach((x, i) => {
      const li = document.createElement('li');
      if (myRow && x.name === myRow.name && x.time === myRow.time && x.created_at === myRow.created_at) li.className = 'me';
      const r = document.createElement('span'); r.className = 'r'; r.textContent = i + 1;
      const n = document.createElement('span'); n.className = 'n'; n.textContent = x.name;
      const s = document.createElement('span'); s.className = 's'; s.textContent = Number(x.time).toFixed(1) + '秒';
      li.append(r, n, s); ol.append(li);
    });
  }

  $('nameForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('name').value.trim().slice(0, 12); if (!name) return;
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = '送信中…';
    try {
      myRow = await postScore(name, lastTotal, log.filter(r => !r.ok).length);
      try { localStorage.setItem(NKEY, name); } catch (_) {}
      $('nameForm').hidden = true;
      renderRank();
    } catch (err) {
      btn.textContent = '失敗。もう一度';
    } finally {
      btn.disabled = false;
      if (btn.textContent === '送信中…') btn.textContent = '登録';
    }
  });

  // ===== 操作 =====
  $('go').addEventListener('click', start);
  $('again').addEventListener('click', start);
  $('bOk').addEventListener('click', () => judge('ok'));
  $('bNg').addEventListener('click', () => judge('ng'));
  $('mute').addEventListener('click', () => { muted = !muted; $('mute').textContent = muted ? '音 OFF' : '音 ON'; });
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); judge('ok'); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); judge('ng'); }
  });
  $('copy').addEventListener('click', async () => {
    const miss = log.filter(r => !r.ok).length;
    const text = `フィッシングメール鑑定所：${lastTotal.toFixed(1)}秒（ミス${miss}回・ランク${grade(lastTotal, miss)}）\n上司「${$('say').textContent}」`;
    const b = $('copy');
    try { await navigator.clipboard.writeText(text); b.textContent = 'コピーしました'; } catch (e) { b.textContent = 'コピーできませんでした'; }
    setTimeout(() => { b.textContent = '結果をコピー'; }, 2000);
  });

  try { $('name').value = localStorage.getItem(NKEY) || ''; } catch (_) {}

  // トップページを開いたときに、ランキングを読み込んで表示する
  $('rankNoteTop').textContent = ONLINE ? 'みんなのランキング（上位20人）' : 'この端末の記録';
  renderRank('listTop');
}
