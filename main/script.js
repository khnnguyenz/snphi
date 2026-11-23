(() => {
  const $ = s => document.querySelector(s);
  const body = document.body;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Canvas: sao, tim bay, hạt trái tim ---------- */
  const cv = $('#fx'), ctx = cv.getContext('2d');
  const mouse = { x: -999, y: -999 };
  let W, H, dpr, cx, cy, scale, parts = [], stars = [], floaters = [], bursts = [], formed = false;
  const COLORS = ['rgba(255,77,126,', 'rgba(255,140,170,', 'rgba(255,214,228,'];
  const heart = t => [16 * Math.sin(t) ** 3,
    -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];

  function newFloater(init) {
    return { x: Math.random() * W, y: init ? Math.random() * H : H + 20, s: Math.random() * 14 + 8,
      v: Math.random() * .5 + .25, sw: Math.random() * 6.28, a: Math.random() * .35 + .1 };
  }
  function build() {
    const n = W < 600 ? 950 : 1700;
    parts = [];
    for (let i = 0; i < n; i++) {
      const [u0, v0] = heart(Math.random() * Math.PI * 2);
      const k = Math.random() < .5 ? 1 + (Math.random() - .5) * .06 : Math.sqrt(Math.random());
      const a = Math.random() * 6.283, R = Math.max(W, H) * .6;
      parts.push({ u: u0 * k, v: v0 * k, hx: Math.random() * W, hy: Math.random() * H,
        x: W / 2 + Math.cos(a) * R, y: H / 2 + Math.sin(a) * R, vx: 0, vy: 0,
        r: Math.random() * 1.4 + .5, c: i % 3, ph: Math.random() * 6.28 });
    }
    stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + .3, ph: Math.random() * 6.28 }));
    floaters = Array.from({ length: W < 600 ? 12 : 22 }, () => newFloater(true));
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H * .32; scale = Math.min(W * .8 / 34, H * .36 / 29);
    build();
  }

  function frame(ms) {
    const t = ms / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,235,240,${.25 + .35 * Math.sin(t * 1.5 + s.ph)})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.textAlign = 'center';
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i]; f.y -= f.v; f.x += Math.sin(t + f.sw) * .3;
      if (f.y < -20) floaters[i] = newFloater(false);
      ctx.font = f.s + 'px serif'; ctx.fillStyle = `rgba(255,110,150,${f.a})`; ctx.fillText('♥', f.x, f.y);
    }
    const beat = 1 + .055 * Math.pow(Math.max(0, Math.sin(t * 3.4)), 8) + .02 * Math.sin(t * 1.1);
    ctx.globalCompositeOperation = 'lighter';
    const groups = [[], [], []];
    for (const p of parts) {
      let gx, gy;
      if (formed) {
        gx = cx + p.u * scale * beat + Math.sin(t * 1.3 + p.ph) * 2;
        gy = cy + (p.v - 2.5) * scale * beat + Math.cos(t * 1.1 + p.ph) * 2;
      } else {
        gx = p.hx + Math.sin(t * .4 + p.ph) * 28; gy = p.hy + Math.cos(t * .35 + p.ph) * 28;
      }
      p.vx = (p.vx + (gx - p.x) * .02) * .9; p.vy = (p.vy + (gy - p.y) * .02) * .9;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 90) { const f = (1 - d / 90) * 5; p.vx += dx / (d + .1) * f; p.vy += dy / (d + .1) * f; }
      p.x += p.vx; p.y += p.vy; groups[p.c].push(p);
    }
    groups.forEach((g, c) => {
      ctx.fillStyle = COLORS[c] + (formed ? (c === 2 ? '.85)' : '.7)') : '.28)');
      ctx.beginPath();
      for (const p of g) { ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, 6.283); }
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]; b.x += b.vx; b.y += b.vy; b.vy -= .02; b.l -= .014;
      if (b.l <= 0) { bursts.splice(i, 1); continue; }
      ctx.font = b.s + 'px serif'; ctx.fillStyle = `${b.col}${b.l})`; ctx.fillText(b.ch, b.x, b.y);
    }
    if (!still) requestAnimationFrame(frame);
  }
  const CH = ['♥', '✦', '♥', '✧'];
  function burst(x, y, n = 10, power = 3) {
    for (let i = 0; i < n; i++) {
      const ch = CH[i % 4];
      bursts.push({ x, y, vx: (Math.random() - .5) * power, vy: -Math.random() * power * .7 - .5, ch,
        s: Math.random() * 14 + 10, l: 1, col: ch === '♥' ? 'rgba(255,120,160,' : 'rgba(255,225,160,' });
    }
  }
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener('pointerdown', e => { mouse.x = e.clientX; mouse.y = e.clientY; burst(e.clientX, e.clientY); });
  addEventListener('pointerup', () => { mouse.x = mouse.y = -999; });
  addEventListener('resize', resize);
  resize(); requestAnimationFrame(frame);
  if (still) frame(0);

  /* ---------- Nhạc (tạo bằng Web Audio, không cần file) ---------- */
  const Music = (() => {
    let ac, master, nextT = 0, step = 0, on = false;
    const chords = [[261.63, 329.63, 392, 523.25], [246.94, 293.66, 392, 493.88],
                    [220, 261.63, 329.63, 440], [174.61, 220, 261.63, 349.23]];
    const mel = [[659.25, 783.99], [587.33, 783.99], [659.25, 523.25], [698.46, 523.25]];
    const pat = [0, 1, 2, 3, 2, 1, 2, 3], EIGHTH = .44;
    function tone(f, t, dur, type, vol) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
    }
    function schedule() {
      while (nextT < ac.currentTime + .4) {
        const bar = Math.floor(step / 8) % 4, i = step % 8, ch = chords[bar];
        tone(ch[pat[i]], nextT, 1.4, 'triangle', .11);
        if (i === 0) tone(ch[0] / 2, nextT, 3, 'sine', .18);
        if (i === 0 || i === 4) tone(mel[bar][i / 4], nextT, 1.8, 'sine', .09);
        nextT += EIGHTH; step++;
      }
    }
    return {
      start() {
        if (!ac) {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          master = ac.createGain(); master.gain.value = .8;
          const d = ac.createDelay(); d.delayTime.value = .38;
          const fb = ac.createGain(); fb.gain.value = .35;
          master.connect(ac.destination); master.connect(d); d.connect(fb); fb.connect(d); d.connect(ac.destination);
          nextT = ac.currentTime + .1; setInterval(schedule, 100);
        }
        ac.resume(); on = true;
      },
      toggle() { if (!ac) { this.start(); return true; } if (on) { ac.suspend(); on = false; } else { ac.resume(); on = true; } return on; }
    };
  })();
  $('#musicBtn').addEventListener('click', e => { try { e.currentTarget.classList.toggle('off', !Music.toggle()); } catch (err) {} });

  /* ---------- Hộp quà ---------- */
  const spin = $('#spin'), gift = $('#gift'), letter = $('#letter'), paper = $('#paper');
  let ready = false, opened = false;
  function setReady() {
    if (ready) return; ready = true;
    spin.style.animation = 'none'; spin.style.transform = 'rotateX(-22deg) rotateY(-28deg)';
    body.classList.add('ready');
  }
  spin.addEventListener('animationend', setReady);
  setTimeout(setReady, still ? 100 : 7600);

  gift.addEventListener('click', async () => {
    if (!ready || opened) return; opened = true;
    try { Music.start(); } catch (e) {}
    body.classList.add('open');
    spin.style.transform = 'rotateX(-34deg) rotateY(0deg)';
    const r = gift.getBoundingClientRect(), bx = r.left + r.width / 2, by = r.top + r.height / 2 - 30;
    await sleep(900); burst(bx, by, 26, 6);
    await sleep(500); burst(bx, by - 30, 18, 7);
    formed = true;
    letter.classList.add('show'); letter.setAttribute('aria-hidden', 'false');
    await sleep(still ? 100 : 1100); body.classList.add('gone');
    await sleep(still ? 100 : 1500); revealText();
  });

  /* ---------- Chữ hiện dần ---------- */
  let skipped = false, userScroll = false, done = false;
  const groups = [...paper.querySelectorAll('.txt')].map(p => {
    const words = p.textContent.trim().split(/\s+/); p.textContent = '';
    return words.map((w, i) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w; p.append(s);
      if (i < words.length - 1) p.append(' '); return s;
    });
  });
  ['wheel', 'touchstart'].forEach(ev => letter.addEventListener(ev, () => { userScroll = true; }, { passive: true }));
  $('#skip').addEventListener('click', () => { skipped = true; });

  let lastTop = -1;
  function follow(el) {
    if (userScroll || el.offsetTop === lastTop) return; lastTop = el.offsetTop;
    const lim = innerHeight * .74, b = el.getBoundingClientRect().bottom;
    if (b > lim) letter.scrollBy({ top: b - lim + 50, behavior: 'smooth' });
  }
  async function revealText() {
    for (const g of groups) {
      for (const w of g) {
        if (skipped) break;
        w.classList.add('on'); follow(w);
        const t = w.textContent;
        await sleep(still ? 0 : 10 + (/[,.!?]$/.test(t) ? 260 : 0));
      }
      if (skipped) break;
      await sleep(still ? 0 : 520);
    }
    groups.flat().forEach(w => w.classList.add('on'));
    done = true; $('#skip').classList.add('hide'); letter.classList.add('seen');
    const r = paper.getBoundingClientRect();
    burst(innerWidth / 2, Math.min(r.bottom - 20, innerHeight * .7), 20, 5);
  }

  /* ---------- Đóng / mở lại thư ---------- */
  $('#close').addEventListener('click', () => {
    if (!done) { skipped = true; }
    letter.classList.remove('show'); letter.setAttribute('aria-hidden', 'true'); body.classList.add('hero');
  });
  $('#again').addEventListener('click', () => {
    letter.classList.add('show', 'seen'); letter.scrollTop = 0; letter.setAttribute('aria-hidden', 'false');
    body.classList.remove('hero');
    groups.flat().forEach(w => w.classList.add('on'));
  });
})();
