'use strict';
const $ = id => document.getElementById(id);
const screen = $('screen');
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const statuses = {new:'Новая',in_progress:'Идет обучение',completed:'Обучение завершено'};
const payments = {cash:'Наличными',transfer:'Переводом по номеру телефона'};
const slideNames = ['Онлайн-курсы','Алгоритмы и программирование','Веб-дизайн','Базы данных'];
const options = entries => Object.entries(entries).map(([value,label])=>`<option value="${escapeText(value)}">${escapeText(label)}</option>`).join('');
let state = {user:null,rows:[],csrf:'',module:2};
let filter = '';
let slide = 0;
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let cycle;
let pending = false;
let module = 2;
const endpoint = document.body.dataset.api;
const images = ['image01.webp','image02.jpg','image03.png','image04.jpg'];

function moveSlide(offset) {
  slide = (slide + offset + slideNames.length) % slideNames.length;
  $('slide').src = `slides/${images[slide]}`;
  $('slide').alt = slideNames[slide];
  $('slide-number').textContent = `${slide + 1} / 4`;
}
function restartSlider() {
  clearInterval(cycle);
  if (playing) cycle = setInterval(()=>moveSlide(1),3000);
  $('autoplay').textContent = playing ? 'Пауза' : 'Продолжить';
}
$('back').onclick = ()=>{moveSlide(-1);restartSlider();};
$('next').onclick = ()=>{moveSlide(1);restartSlider();};
$('autoplay').onclick = ()=>{playing=!playing;restartSlider();};
$('slider').hidden = true;

async function api(payload) {
  const response = await fetch(endpoint, payload ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,csrf:state.csrf})} : {});
  return response.json();
}
function message(text='',bad=false) {
  $('notice').textContent = text;
  $('notice').classList.toggle('bad',bad);
}
const field = (name,label,control) => `<div class="field"><label for="field-${name}">${label}</label>${control}<p class="error" id="error-${name}"></p></div>`;
const input = (name,label,type='text',extra='') => field(name,label,`<input id="field-${name}" name="${name}" type="${type}" aria-describedby="error-${name}" ${extra}>`);
const select = (name,label,items,placeholder) => field(name,label,`<select id="field-${name}" name="${name}" aria-describedby="error-${name}">${placeholder?'<option value="">Выберите</option>':''}${options(items)}</select>`);
const form = (action,fields,label) => `<form data-action="${action}" novalidate>${fields}<button>${label}</button></form>`;
function render() {
  const admin = state.user?.role === 'admin';
  const route = state.user ? admin ? 'admin' : location.hash === '#new' ? 'new' : 'mine' : location.hash === '#register' ? 'register' : 'login';
  $('nav').innerHTML = admin ? '<a href="#admin">Панель администратора</a><button id="logout">Выйти</button>'
    : state.user ? '<a href="#mine">Мои заявки</a><a href="#new">Новая заявка</a><button id="logout">Выйти</button>'
    : '<a href="#login">Вход</a><a href="#register">Регистрация</a>';
  const title = {login:'Вход',register:'Регистрация',new:'Новая заявка',mine:'Мои заявки',admin:'Панель администратора'}[route];
  let content;
  if (route === 'register') {
    content = form('register',input('login','Логин','text','autocomplete="username"')+input('password','Пароль','password','autocomplete="new-password"')+input('full_name','ФИО')+input('phone','Телефон','tel','placeholder="8(900)123-45-67"')+input('email','Электронная почта','email'),module===1?'Создать пользователя':'Зарегистрироваться')+'<p><a href="#login">Уже зарегистрированы? Войти</a></p>';
  } else if (route === 'login') {
    content = form('login',input('login','Логин','text','autocomplete="username"')+input('password','Пароль','password','autocomplete="current-password"'),'Войти')+'<p><a href="#register">Еще не зарегистрированы? Регистрация</a></p>';
  } else if (route === 'new') {
    content = form('apply',(module===1?input('course','Название курса'):select('course','Курс',Object.fromEntries(state.courses.map(course=>[course,course])),true))
      +input('start_date','Желаемая дата начала','text',module===1?'placeholder="2026-11-15"':'placeholder="15.11.2026"')
      +select('payment','Способ оплаты',payments,true),'Отправить');
  } else {
    const rows = admin && filter ? state.rows.filter(row=>row.status===filter) : state.rows;
    content = (admin && module === 2 ? `<label>Фильтр по статусу <select id="filter"><option value="">Все статусы</option>${options(statuses)}</select></label>` : '')
      + (rows.length ? rows.map(row=>record(row,admin)).join('') : '<p>Заявок пока нет.</p>');
  }
  screen.innerHTML = `<h1 id="title">${title}</h1>${content}`;
  if ($('filter')) {
    $('filter').value = filter;
    $('filter').onchange = event=>{filter=event.target.value;render();$('filter').focus();};
  }
  if ($('logout')) $('logout').onclick = ()=>submit('logout',{});
}
function record(row,admin) {
  const id = Number(row.id);
  const hiddenId = `<input type="hidden" name="id" value="${id}">`;
  const update = admin
    ? form('status',hiddenId+select(`status-${id}`,'Новый статус',{in_progress:statuses.in_progress,completed:statuses.completed}),'Сохранить статус')
    : (module===1 || row.status==='completed' ? form('review',hiddenId+field(`body-${id}`,'Отзыв',`<textarea id="field-body-${id}" name="body-${id}" aria-describedby="error-body-${id}" maxlength="1000"></textarea>`),'Отправить отзыв') : '');
  const reviews = !admin ? (row.reviews || []).map(body=>`<p>Отзыв: ${escapeText(body)}</p>`).join('') : '';
  return `<article class="record"><h2>${escapeText(row.course)}</h2>
    ${admin?`<p>Заявитель: ${escapeText(row.login)}</p>`:''}
    <p>Начало: ${escapeText(row.start_date)} · ${escapeText(payments[row.payment])}</p>
    <p>Статус: <strong>${escapeText(statuses[row.status])}</strong></p>${reviews}${update}</article>`;
}
async function load() {
  try {
    const data = await api();
    if (data.error) throw Error(data.error);
    state = data;
    module = data.module;
    $('slider').hidden = module === 1;
    if (module === 2 && !cycle) restartSlider();
    render();
  } catch (error) {
    message(error.message || 'Проверьте запуск сервера и соединение с базой.',true);
  }
}
async function submit(action,fields) {
  if (pending) return;
  pending = true;
  message();
  try {
    const result = await api({action,...fields});
    screen.querySelectorAll('.error').forEach(item=>item.textContent='');
    screen.querySelectorAll('[aria-invalid]').forEach(item=>item.removeAttribute('aria-invalid'));
    if (result.errors) {
      for (const [key,value] of Object.entries(result.errors)) {
        if (!$('error-'+key)) continue;
        $('error-'+key).textContent=value;
        $('field-'+key).setAttribute('aria-invalid','true');
      }
      const password = screen.querySelector('input[type=password]');
      if (password) password.value='';
    }
    if (!result.ok) {
      message(result.error || 'Проверьте поля формы.',true);
      return;
    }
    if (action==='register'||action==='logout') location.hash='login';
    if (action==='apply'||action==='login') location.hash='mine';
    await load();
    message(result.message);
  } catch {
    message('Не удалось сохранить. Проверьте, запущен ли сервер.',true);
  } finally {
    pending = false;
  }
}
screen.addEventListener('submit',event=>{
  event.preventDefault();
  submit(event.target.dataset.action,Object.fromEntries(new FormData(event.target)));
});
addEventListener('hashchange',render);
load();
