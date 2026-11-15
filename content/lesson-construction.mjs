// Code in the cards is taken from the same sources used to run the portal.
export function lessonConstruction(stack, sources, descriptions) {
  const php = stack === 'mysql';
  const prefix = 'examples/'+stack+'/';
  const code = name => sources[prefix+name];
  const server = php ? 'public/api.php' : 'portal.py';
  const script = 'public/portal.js';
  const db = 'schema.sql';
  const block = (file, placement, text=code(file), purpose=descriptions[prefix+file]) => ({file,placement,text,purpose});
  const range = (text, start, end) => {
    const from = start == null ? 0 : text.indexOf(start);
    const to = end == null ? text.length : text.indexOf(end,from+1);
    if (from<0 || to<0) throw new Error('Не найден фрагмент урока '+(from<0?start:end));
    return text.slice(from,to);
  };
  const backend=code(server);
  const branch = name => php ? "    if ($action === '"+name+"'" : "    if action == '"+name+"'";
  const fallback = php ? "    reply(['error' => 'Эта операция" : "    return {'error': 'Эта операция";
  const id = php ? '    $id = filter_var(' : "    raw_id = value('id')";
  const insert = 'Вставьте перед последней строкой с сообщением «Эта операция недоступна для вашей роли». Сохраните отступы.';
  const rawJs = code(script);
  const slider = range(rawJs,'const images =','async function api');
  const loadSlider = range(rawJs,"    $('slider').hidden = module","    render();");
  const frontend = rawJs.replace(slider,'').replace(loadSlider,'');
  const config=php?'C:/xampp/rvmp-php-config.json':'config.local.json';
  const apiAddress=php?'public/api.php':'api';
  const dir=php?'C:/xampp/htdocs/rvmp-php':'Проект';
  const start = php ? null : String.raw`py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --no-index --find-links .\wheels -r requirements.txt
.\.venv\Scripts\python.exe app.py`;
  return {
    setup:[
      block('.gitignore','В папке '+dir+' создайте .gitignore и вставьте строки целиком.',
        'config.local.json\n.venv/\n__pycache__/\nwheels/\n.vs/\n',
        'Локальные реквизиты, библиотеки и служебные папки исключаются из истории Git.')
    ],
    users:[block(db,'Сверьте команду с SQL в конструкторе. Если создаёте таблицу запросом, выполните его во вкладке SQL или Query Tool один раз.',range(code(db),null,'CREATE TABLE applications').trim(),'Первичный ключ различает записи, уникальный login запрещает повторную регистрацию.')],
    relations:[block(db,'Для создания через SQL выполните команды в своей базе после создания users. Если таблицы уже созданы в конструкторе, сверяйте команды с их структурой.',range(code(db),'CREATE TABLE applications',null).trim(),'Первая связь назначает владельца заявки, вторая связывает отзыв с заявкой.')],
    connect:[
      block(config,'Создайте файл настроек. Замените реквизиты на выданные, сохраните как JSON.',code('config.example.json').replace('"module": 2','"module": 1'),descriptions[prefix+'config.example.json']),
      block('courses.json','Создайте рядом с серверным файлом в корне проекта и вставьте массив целиком.'),
      block(php?'forms.php':'forms.py','Создайте в корне проекта. Вставьте функции целиком. Следующая карточка свяжет проверку регистрации с запросом к БД.'),
      block('public/index.html','Создайте в созданной папке public. Секция слайдера пока скрыта атрибутом hidden.',code('public/index.html').replace('<section class="slider"','<section hidden class="slider"')),
      ...(php?[]:[
        block('requirements.txt','Создайте в корне проекта и вставьте весь список.'),
        block('app.py','Создайте в корне и вставьте файл целиком. После установки пакетов этот файл запускает сервер.'),
      ]),
      block(server,'Создайте файл. Вставьте основу обработчика. Следующие операции добавляйте перед ответом «Эта операция недоступна для вашей роли».',
        range(backend,null,branch('register'))+range(backend,fallback,null),
        php?'PDO открывает соединение. GET возвращает состояние пользователя. POST заранее проверяет токен сессии.':
          'Flask отдаёт страницу и JSON. При GET соединение читает данные, при POST сессия и транзакция защищают изменения.'),
      ...(start?[block('PowerShell','В PowerShell из папки проекта выполните команды после распаковки библиотеки wheel. Последней командой перезапускайте сервер после правки.',start,'Виртуальное окружение отделяет зависимости проекта от остальных приложений.')]:[]),
      block('Браузер','Откройте адрес из карточки, заменив окончание на '+apiAddress+'. В ответе API ожидаются поля user, rows и csrf.',
        php?'http://localhost:8080/rvmp-php/public/api.php':'http://127.0.0.1:'+(stack==='postgresql'?8212:8213)+'/api',
        'Ответ JSON подтверждает, что сервер работает с заданными реквизитами.')
    ],
    form:[
      block(script,'Создайте файл. Скопируйте общий код до функции render.',range(frontend,null,'function render()'),
        'api отправляет JSON, form создаёт форму с именем операции, а input связывает подпись и поле.'),
      block(script,'В конец добавьте функции render и record.',range(frontend,'function render()','async function load'),
        'render выбирает экран по роли и адресу. Имена input совпадают с ключами обработчика. record выводит только строки, полученные от сервера.'),
      block(script,'Добавьте в конец обработчики отправки и загрузки страницы.',range(frontend,'async function load',null),
        'load читает состояние. submit отправляет поля, показывает ошибки с тем же именем и обновляет страницу.'),
      block('public/style.css','Создайте в public и вставьте базовые правила.',code('public/style.css').replace('input,select,textarea{width:100%;','input,select,textarea{'))
    ],
    register:[block(server,insert,range(backend,branch('register'),branch('login')),'Проверки запускаются до INSERT. Значения передаются параметрами, пароль сохраняется как хеш.')],
    login:[block(server,insert,range(backend,branch('login'),branch('apply')),'Хеш сравнивается с введённым паролем. Сессия хранит роль и id, которые нужны для следующих действий.')],
    apply:[block(server,insert,range(backend,branch('apply'),id),'INSERT использует id из сессии и сохраняет заявку после проверки курса, даты и способа оплаты.')],
    review:[block(server,insert,range(backend,id,branch('status'))+range(backend,branch('review'),fallback),
      'Сначала преобразуем идентификатор заявки в число. Отзыв записывается только при совпадении владельца, а в модуле 2 проверяется и статус.')],
    admin:[block(server,insert,range(backend,branch('status'),branch('review')),
      'Только администратор назначает статус. Список берётся из базы, чтобы обе роли видели одно изменение.')],
    mobile:[block('public/style.css','Найдите правило input,select,textarea и замените его целиком этой версией.',
      'input,select,textarea{width:100%;background:white;color:var(--ink)}',
      'Поля занимают ширину формы, а box-sizing учитывает отступы и рамку.')],
    slider:[
      block(script,'После объявления const endpoint вставьте этот блок перед async function api.',slider,
        'Индекс с остатком от деления удерживает слайдер внутри списка. Таймер переключает изображение каждые 3000 мс.'),
      block(script,'В функции load вставьте перед вызовом render().',loadSlider,
        'Слайдер скрывается в модуле 1 и начинает перелистывание в модуле 2.')
    ],
    date:[block(php?'forms.php':'forms.py','Найдите функцию в созданном файле. Сверьте её с вызовом из обработчика apply.',
      range(code(php?'forms.php':'forms.py'),php?'function parseCourseDate':'def parse_course_date',php?'function addCourseReview':null),
      'Дата проверяется по календарю. Ввод 31.02 не должен превращаться в дату марта.')],
    reviewRule:[block(server,'Найдите ветку review, которую добавили в М1. Проследите, где учитывается режим М2.',
      range(backend,branch('review'),fallback),
      'Модуль 2 разрешает запись только к завершённой заявке владельца, даже при прямой отправке запроса.')],
    filter:[block(script,'Найдите блок фильтра в render и сверьте с проверкой в браузере.',
      range(rawJs,'    const rows = admin','  if ($(\x27logout\x27))').trimEnd(),
      'Режим администратора включает выбор статуса. После смены значения список перерисовывается.')]
  };
}
