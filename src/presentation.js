(() => {
  'use strict';
  const slides = globalThis.EXAM_PRESENTATION;
  const escape = globalThis.ExamCore.escape;
  const query = new URLSearchParams(location.search);
  const mode = query.has('print') ? 'print' : query.has('audience') ? 'audience' : 'teacher';
  const id = name => document.getElementById(name);
  const frame = id('frame');
  const number = id('page-number');
  const profile = id('profile');
  const prefix = 'rvmp2026-basic-v1:';
  const profileFields = [
    ['teacher-name','ФИО преподавателя'],
    ['teacher-position','Должность'],
    ['teacher-department','Кафедра или лаборатория']
  ];

  function saved(key, fallback = '') {
    try { return JSON.parse(localStorage.getItem(prefix + key)) ?? fallback; }
    catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(prefix + key, JSON.stringify(value)); }
    catch { /* The presentation works without persistence. */ }
  }

  let index = Math.max(0, Math.min(slides.length - 1, saved('presentation-page',0)));
  let dark = mode !== 'print' && saved('presentation-dark',false);
  let identity = Object.fromEntries(profileFields.map(([key]) => [key, mode === 'print' ? '' : saved(key)]));
  let channel;
  let audience;
  let pointerOn = false;
  document.body.dataset.mode = mode;

  function markup(slide, position) {
    const page = String(position + 1).padStart(2,'0');
    const section = escape(slide.section);
    if (slide.type === 'title') {
      return `<article class="slide title-slide">
        <header class="slide-head">
          <div><img class="wordmark" src="presentation-assets/synergy-wordmark.jpg" alt="Университет Синергия"><span>09.02.07 · КОД 09.02.07-3-2026</span></div>
          <span>ГИА базового уровня</span>
        </header>
        <div class="title-layout">
          <div>
            <h1>${escape(slide.title)}</h1>
            <p class="subtitle">Портал «Корочки.есть»</p>
            <p class="subtitle">Python Flask + MySQL / MariaDB</p>
            <div class="identity" aria-label="Преподаватель">
              ${profileFields.map(([key,label])=>`<div class="identity-field"><span>${label}</span><span data-pdf-field="${key}">${escape(identity[key])}</span></div>`).join('')}
            </div>
          </div>
          <img class="title-mascot" src="mascot-exam.png" alt="Носорог готовится к демонстрационному экзамену">
        </div>
        <footer class="slide-foot"><span>${page}</span></footer>
      </article>`;
    }

    const actions = slide.actions
      ? `<ol start="${slide.actionStart}">${slide.actions.map(action=>`<li>${escape(action)}</li>`).join('')}</ol>`
      : (slide.paragraphs || []).map(paragraph=>`<p>${escape(paragraph)}</p>`).join('');
    const image = slide.image
      ? `<figure class="evidence">
          <button type="button" data-evidence aria-label="Увеличить снимок" ${mode !== 'teacher' ? 'tabindex="-1"' : ''}><img src="${escape(slide.image.file)}" alt="${escape(slide.image.caption)}"></button>
          <figcaption>${escape(slide.image.caption)}</figcaption>
        </figure>` : '';
    const table = slide.rows ? `<table class="criteria"><thead><tr><th scope="col">Критерий</th><th scope="col">Баллы</th></tr></thead>
      <tbody>${slide.rows.map(([label,points])=>`<tr><td>${escape(label)}</td><td>${points}</td></tr>`).join('')}</tbody></table>` : '';
    const result = slide.check ? `<div class="outcome"><strong>Что должно получиться</strong>${escape(slide.check)}</div>` : '';
    const label = slide.step ? `Шаг ${slide.step}${slide.part ? ' · часть '+slide.part : ''}` : section;
    return `<article class="slide${slide.type === 'question' ? ' question-slide' : ''}">
      <header class="slide-head"><span>${section}</span><span>ДЭ 2026 <img class="mark" src="presentation-assets/synergy-mark.png" alt="Университет Синергия"></span></header>
      <div class="slide-main">
        <h2>${escape(slide.title)}</h2>
        ${table || `<div class="slide-content${image ? ' with-image' : ''}"><div class="slide-copy">${actions}${result}</div>${image}</div>`}
      </div>
      <footer class="slide-foot"><span>${escape(slide.source || label)}</span><span>${page}</span></footer>
    </article>`;
  }

  if (mode === 'print') {
    frame.innerHTML = slides.map(markup).join('');
    return;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    id('theme').textContent = dark ? 'Светлая тема' : 'Тёмная тема';
  }
  function draw() {
    applyTheme();
    const slide = slides[index];
    frame.innerHTML = markup(slide,index);
    if (mode === 'audience') return;
    number.value = index + 1;
    id('progress').value = index + 1;
    id('previous').disabled = index === 0;
    id('next').disabled = index === slides.length - 1;
    id('teacher-script').innerHTML = `<h2>Сценарий преподавателя</h2>
      <p>${escape(slide.note)}</p>
      ${slide.why ? `<p>${escape(slide.why)}</p>` : ''}
      ${slide.check ? `<p><strong>Проверьте.</strong> ${escape(slide.check)}</p>` : ''}
      ${index + 1 < slides.length ? `<p><strong>Дальше.</strong> ${escape(slides[index + 1].title)}</p>` : ''}`;
    const evidence = frame.querySelector('[data-evidence]');
    if (evidence) evidence.onclick = () => {
      const image = id('image-preview');
      image.src = slide.image.file;
      image.alt = slide.image.caption;
      id('image-viewer').showModal();
    };
  }
  function sendState() {
    channel?.postMessage({type:'slide',index,dark,identity});
  }
  function move(position) {
    index = Math.max(0, Math.min(slides.length - 1, position));
    save('presentation-page',index);
    draw();
    sendState();
  }
  function pointer(point) {
    const slide = frame.querySelector('.slide');
    if (!slide) return;
    let dot = slide.querySelector('.laser-dot');
    if (!point) { dot?.remove(); return; }
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'laser-dot';
      slide.append(dot);
    }
    dot.style.left = `${point.x * 100}%`;
    dot.style.top = `${point.y * 100}%`;
  }

  if (mode === 'audience') {
    channel = new BroadcastChannel('rvmp-presentation:' + query.get('audience'));
    channel.onmessage = ({data}) => {
      if (data.type === 'slide') {
        ({index,dark,identity} = data);
        draw();
      } else if (data.type === 'pointer') {
        pointer(data.point);
      } else if (data.type === 'close') {
        frame.replaceChildren();
        window.close();
      }
    };
    channel.postMessage({type:'ready'});
    frame.ondblclick = () => document.documentElement.requestFullscreen().catch(()=>{});
    return;
  }

  function endPresentation() {
    channel?.postMessage({type:'close'});
    channel?.close();
    channel = null;
    audience = null;
    id('presentation').classList.remove('in-session');
    id('teacher-script').hidden = true;
    id('present').textContent = 'Режим показа';
  }
  id('present').onclick = () => {
    if (audience && !audience.closed) { endPresentation(); return; }
    channel?.close();
    const token = crypto.randomUUID();
    channel = new BroadcastChannel('rvmp-presentation:' + token);
    channel.onmessage = ({data}) => { if (data.type === 'ready') sendState(); };
    audience = window.open('presentation.html?audience=' + token, 'rvmp-audience', 'popup,width=1080,height=670');
    if (!audience) { endPresentation(); return; }
    id('presentation').classList.add('in-session');
    id('teacher-script').hidden = false;
    id('present').textContent = 'Завершить показ';
  };
  addEventListener('pagehide',endPresentation);

  number.max = slides.length;
  id('page-total').textContent = 'из ' + slides.length;
  id('progress').max = slides.length;
  id('previous').onclick = () => move(index - 1);
  id('next').onclick = () => move(index + 1);
  id('jump').onsubmit = event => { event.preventDefault(); move(number.valueAsNumber - 1); };
  const firstBySection = new Map();
  slides.forEach((slide,position)=>{ if (!firstBySection.has(slide.section)) firstBySection.set(slide.section,position); });
  id('chapters').innerHTML = Array.from(firstBySection,([section,position])=>
    `<button class="control" type="button" data-position="${position}">${escape(section)}</button>`).join('');
  id('chapters').onclick = event => {
    const button = event.target.closest('[data-position]');
    if (!button) return;
    move(Number(button.dataset.position));
    id('contents').close();
  };
  id('contents-open').onclick = () => id('contents').showModal();
  id('settings-open').onclick = () => {
    for (const [key] of profileFields) profile.elements.namedItem(key).value = identity[key];
    id('settings').showModal();
  };
  profile.onsubmit = event => {
    event.preventDefault();
    for (const [key] of profileFields) {
      identity[key] = profile.elements.namedItem(key).value.trim();
      save(key,identity[key]);
    }
    draw();
    sendState();
    id('settings').close();
  };
  id('theme').onclick = () => {
    dark = !dark;
    save('presentation-dark',dark);
    applyTheme();
    sendState();
  };
  id('laser').onclick = () => {
    pointerOn = !pointerOn;
    id('laser').setAttribute('aria-pressed',String(pointerOn));
    pointer(null);
    channel?.postMessage({type:'pointer',point:null});
  };
  frame.onpointermove = event => {
    if (!pointerOn) return;
    const box = frame.querySelector('.slide').getBoundingClientRect();
    const point = {x:(event.clientX-box.left)/box.width,y:(event.clientY-box.top)/box.height};
    pointer(point);
    channel?.postMessage({type:'pointer',point});
  };
  frame.onpointerleave = () => {
    pointer(null);
    channel?.postMessage({type:'pointer',point:null});
  };
  id('full').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    else document.documentElement.requestFullscreen().catch(()=>{});
  };
  document.addEventListener('keydown',event=>{
    if (document.querySelector('dialog[open]') || event.target.closest('input')) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(index - 1); }
    if (event.key === 'ArrowRight' || (event.key === ' ' && !event.target.closest('button,a'))) {
      event.preventDefault();
      move(index + 1);
    }
  });
  draw();
})();
