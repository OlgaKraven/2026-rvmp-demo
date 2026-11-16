import {lessonConstruction} from "../content/lesson-construction.mjs";
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {stagesFor, official, stacks, tasks, criteria, stageNames, resultFiles} from '../content/course.mjs';
import {variants} from '../content/variants.mjs';
import {buildPresentation} from '../content/presentation.mjs';
import {model} from '../content/model.mjs';
import {buildErLayouts} from './er-layout.mjs';
import {windowsWheels} from './offline-wheels.mjs';
import '../src/core.js';

const out = 'site';
const read = file => fs.readFileSync(file,'utf8');
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
fs.mkdirSync(out,{recursive:true});
for (const dir of ['src','materials']) {
  fs.cpSync(dir,dir==='src'?out:`${out}/${dir}`,{recursive:true});
}
fs.mkdirSync(`${out}/downloads`,{recursive:true});

const kimAssignments = JSON.parse(read('content/assignments.json'));
const previews = [
  {name:'КИМ · стр. 32–36',path:'materials/kim-2026.pdf#page=32',pdf:true},
  ...['Условия.md','Начните здесь.md'].map(name=>({name,path:'materials/'+name,text:read('materials/'+name)})),
  ...tasks.flatMap(({id})=>fs.readdirSync('materials/assets/'+id).sort().map(name=>({name,path:`materials/assets/${id}/${name}`,task:id})))
];
const kimPreviewPages = fs.readdirSync('materials/kim-preview')
  .filter(name=>/^page-\d+\.jpg$/.test(name))
  .sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]))
  .map(name=>'materials/kim-preview/'+name);
if(kimPreviewPages.length!==47)throw new Error('Ожидаются все 47 страниц КИМ РВМП 2026');

const code = {};
const codeDescriptions = {};
const shared = 'examples/shared/';
const seedTemplate = read(shared+'demo-data.sql');
const sampleHashes = {
  php: ['$2y$10$9x2z85HLThEB0AMpIejlMO90axnRDmrwlZhK1kIRDdyaly6kV37kW',
    '$2y$10$jQb.6ioAKbl3d.Vf7c3.nOmwK4YZoweFJqHnmjYpUclF6K4r3SyPG'],
  python: ['pbkdf2:sha256:600000$nqhMcq6EOlyUZrrQ$ec0fc79e72dac676eba9071cfab6073d021421348c2d67f4ce484ee3902c9056',
    'pbkdf2:sha256:600000$w4T6HCP7elryoK7U$e745a4f10144d1decb68e4a13a3f24a3ad5d0ea266d689a43b3a439e00c2a72e'],
};
const preparation = read('src/preparation.html');
const launchGuide = Object.fromEntries(['database','php','python'].map(id=>[
  id, preparation.match(new RegExp(`  <section id="${id}">([\\s\\S]*?)\\n  </section>`))[1],
]));
const slideFiles = fs.readdirSync('materials/assets/M2').sort().filter(name=>/^image0[1-4]\./.test(name));
const descriptions = {
  'courses.json':'Три курса из условия модуля 2 для формы и серверной проверки.',
  'schema.sql':'Таблицы пользователей, заявок и отзывов, ограничения и связи.',
  'app.py':'Подключение к СУБД и запуск Flask на локальном адресе.',
  'portal.py':'Серверные действия: вход, заявки, отзывы и смена статуса.',
  'public/api.php':'Обработчики форм PHP и запросы к базе через PDO.',
  'public/index.html':'Каркас страниц и блок из четырёх изображений.',
  'public/portal.js':'Формы, список заявок, фильтр и управление слайдером.',
  'public/style.css':'Общие стили и адаптация интерфейса под телефон.',
  'forms.py':'Проверки регистрации и даты.',
  'forms.php':'Проверки регистрации и даты, условие записи отзыва.',
  'requirements.txt':'Библиотеки для запуска Flask в учебном окружении.',
  'config.example.json':'Образец локальной настройки базы и модуля.',
  'README.md':'Импорт заполненной базы, запуск без интернета и вход под двумя ролями.'
};
for (const stack of Object.keys(stacks)) {
  const dir = 'examples/'+stack+'/';
  const php = stack==='mysql';
  const files = {
    'schema.sql':read((stack==='python-mysql'?'examples/mysql/':dir)+'schema.sql'),
    'config.example.json':read(dir+'config.example.json'),
    'courses.json':read(shared+'courses.json'),
    'README.md':read(dir+'Порядок работы.md'),
    'public/index.html':read(shared+'public/index.html').replace('__API__',php?'api.php':'api'),
    'public/style.css':read(shared+'public/style.css'),
    'public/portal.js':read(shared+'public/portal.js'),
    ...(php ? {'public/api.php':read(dir+'api.php'),'forms.php':read(dir+'forms.php')} : {
      'app.py':read(dir+'app.py'),'portal.py':read(shared+'portal.py'),'forms.py':read(shared+'forms.py'),
      'requirements.txt':read(dir+'requirements.txt')
    })
  };
  for (const [name, contents] of Object.entries(files)) {
    const path = dir+name;
    code[path] = contents;
    codeDescriptions[path] = descriptions[name];
  }
  const slides = Object.fromEntries(slideFiles.map(name=>['public/slides/'+name,fs.readFileSync('materials/assets/M2/'+name)]));
  const packages = php ? {} : windowsWheels(dir+'requirements.txt', stack==='postgresql'?['tzdata']:[]);
  if (!php) fs.writeFileSync(out+'/downloads/wheels-'+stack+'.zip',ExamCore.zip(packages));
  const [admin, student] = sampleHashes[php ? 'php' : 'python'];
  const seed = seedTemplate.replace('__ADMIN_HASH__', () => admin).replace('__STUDENT_HASH__', () => student);
  const populated = ['-- Импортируйте в новую пустую учебную базу UTF-8.', files['schema.sql'].trim(), seed].join('\n\n');
  fs.writeFileSync(`${out}/downloads/example-${stack}.zip`,ExamCore.zip({
    '.gitignore':'config.local.json\n__pycache__/\n.venv/\n.vs/\n',...files,...slides,...packages,
    'preparation.html':preparation, 'database-filled.sql':populated,
  }));
}

const practiceVariants = {};
for (const [id, variant] of Object.entries(variants)) {
  const dir = 'downloads/variants/'+id;
  const archive = {};
  const save = (name, contents) => {
    const path = dir+'/'+name;
    fs.mkdirSync(`${out}/${path.slice(0,path.lastIndexOf('/'))}`,{recursive:true});
    fs.writeFileSync(`${out}/${path}`,contents);
    archive[name] = contents;
    return path;
  };
  const assignments = {};
  const files = {M1:[],M2:[]};
  for (const task of tasks) {
    const paragraphs = variant.assignments[task.id];
    const name = `${task.id}/Условие.md`;
    const heading = `# ${id} · ${variant.name} · ${task.id}\n\nУчебный вариант · ${task.minutes} минут\n\n`;
    assignments[task.id] = {paragraphs,path:save(name,heading+paragraphs.join('\n\n')+'\n')};
    files[task.id].push({name:'Условие · Markdown',path:assignments[task.id].path});
  }
  const accounts = [
    {login:'student01',password:'Training2026',name:'Иванов Иван Иванович',phone:'8(900)123-45-67',email:'student01@example.test'},
    {login:'student02',password:'Training2026',name:'Петрова Анна Игоревна',phone:'8(900)123-45-68',email:'student02@example.test'}
  ];
  const input = accounts.map((account,i)=>({...account,course:variant.courses[i],
    date:i===0?'15.04.2027':'20.04.2027',payment:i===0?'Наличными':'Переводом'}));
  const scenario = [
    `# Входные данные для проверки · ${id}`,
    'Зарегистрируйте двух пользователей и подайте по одной заявке от каждого. '
      + 'Убедитесь, что каждый пользователь видит только свою заявку. '
      + 'Войдите администратором, указанным в условии. Переведите первую заявку в статус «Обучение завершено». '
      + 'Проверьте доступность отзыва после доработки в модуле 2.',
    ...input.map((row,i)=>`Пользователь ${i+1}: ${row.login} / ${row.password}, ${row.name}, ${row.phone}, ${row.email}. Курс «${row.course}», дата ${row.date}, оплата: ${row.payment}.`)
  ].join('\n\n')+'\n';
  files.M1.push({name:'Входные данные · Markdown',path:save('M1/Входные данные.md',scenario)});
  for (const [i, title] of [variant.name,...variant.courses].entries()) {
    const hue = (Number(id.slice(1))*31+i*26)%360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <rect width="800" height="400" fill="hsl(${hue}, 45%, 18%)"/>
  <circle cx="${650-i*20}" cy="90" r="160" fill="hsl(${hue}, 40%, 30%)"/>
  <path d="M440 400 730 95 800 195V400Z" fill="hsl(${hue}, 45%, 24%)"/>
  <text x="45" y="190" fill="#fff" font-family="sans-serif" font-size="32">${ExamCore.escape(title)}</text>
  <text x="45" y="240" fill="#fff" font-family="sans-serif" font-size="18">${id} · Курсы дополнительного образования</text>
</svg>`;
    const name = `Слайд ${i+1} · ${title}`;
    files.M2.push({name,image:true,path:save(`M2/slide-${i+1}.svg`,svg)});
  }
  const path = dir+'/exam.zip';
  fs.writeFileSync(`${out}/${path}`,ExamCore.zip(archive));
  practiceVariants[id] = {name:variant.name,courses:variant.courses,input,assignments,checks:variant.checks,files,path};
}

model.layouts = await buildErLayouts(model);
fs.writeFileSync(`${out}/er-data.js`,'globalThis.ER_GUIDE='+JSON.stringify(model)+';');
const stages = Object.fromEntries(Object.keys(stacks).map(id=>[id,stagesFor(id)]));
const shotCaptions = {
  installation:'Windows. Открыт клиент базы или панель управления службами выбранного стека.',
  'ready-login':'Готовый пример после распаковки и импорта заполненной базы. Пользователь видит две заявки.',
  workspace:'Проводник Windows. Исходные материалы (Input) и проект (Project) лежат в разных папках.',
  roles:'Блокнот Windows. Действия пользователя и администратора записаны отдельно.',
  slides:'Проводник Windows. Четыре файла в папке слайдера.',
  'db-list':'Windows. Открыта отдельная учебная база или схема. Таблиц в ней пока нет.',
  'db-export':'Windows · phpMyAdmin. В экспорте SQL отмечена Structure у всех трёх таблиц, флажки Data сняты.',
  repo:'Windows · Visual Studio. Выбран режим создания локального Git-репозитория в папке проекта.',
  'before-submission':'Windows · Edge. Перед сдачей проверен мобильный экран и сохранённый отзыв.',
  submission:'Windows · Visual Studio. История учебного репозитория после итогового коммита.',
  'db-designer':'Windows. В конструкторе СУБД показаны связи между таблицами.',
  kim:'Windows · Edge. Страница 32 КИМ: заголовок образца базового уровня.',
  files:'Windows · Edge. Архив и список файлов выбранного стека.',
  er:'Windows · Edge. Схема для сверки: users → applications → reviews.',
  users:'Windows. В структуре users видны семь полей, их типы и ключи.',
  relations:'Windows. Внешний ключ applications.user_id указывает на users.id.',
  login:'Windows · Edge. Открылась форма входа запущенного портала.',
  'login-error':'Windows · браузер. Ошибка входа показана рядом с полем.',
  'registration-error':'Windows · Edge. Ошибка телефона показана прямо под полем.',
  'registration-ok':'Windows · Edge. Портал подтвердил создание пользователя.',
  'date-error':'Windows · Edge. 31 февраля отклонено в форме новой заявки.',
  application:'Windows · Edge. Заявка появилась в списке со статусом «Новая».',
  admin:'Windows · Edge. Администратор сохранил статус и отфильтровал заявки.',
  slider:'Windows · Edge. Слайдер переключился на второе из четырёх изображений.',
  'mobile-review':'Windows · браузер, ширина 390 px. В списке появился сохранённый отзыв.',
  'm1-login':'Windows · Edge. Открылась форма входа модуля 1.',
  'm1-form':'Windows · Edge. Форма регистрации модуля 1 с пятью полями.',
  'm1-application':'Windows · Edge. Новая заявка сохранена в модуле 1.',
  'm1-review':'Windows · Edge. Модуль 1 сохранил отзыв владельца заявки.',
  'm1-admin':'Windows · Edge. Администратор модуля 1 поменял статус заявки.',
  'm2-continuity':'Windows · Edge. После перехода к модулю 2 сохранились заявка и отзыв.'
};
const screens = Object.fromEntries(Object.keys(stacks).map(stack=>[stack,Object.fromEntries(
  Object.entries(shotCaptions).flatMap(([id,caption])=>{
    const file=[`materials/windows/${stack}/${id}.png`,`materials/windows/${id}.png`].find(candidate=>fs.existsSync(candidate));
    return file?[[id,{file,caption}]]:[];
  })
)]));
const lessonCode = Object.fromEntries(Object.keys(stacks).map(stack=>[stack,lessonConstruction(stack,code,codeDescriptions)]));
const data = {lessonCode,official,stacks,stages,tasks,criteria,stageNames,resultFiles,kimAssignments,kimPreviewPages,previews,code,codeDescriptions,practiceVariants,launchGuide,
  screens};
const presentations = Object.fromEntries(Object.entries(stacks).map(([stack,{name}])=>[stack,{
  name,
  pdf: 'materials/rvmp-2026-presentation'+(stack==='python-mysql'?'':'-'+stack)+'.pdf',
  slides: buildPresentation(data,stack)
}]));
fs.writeFileSync(`${out}/presentation-data.js`,'globalThis.EXAM_PRESENTATIONS='+JSON.stringify(presentations)+';');
fs.writeFileSync(`${out}/content.js`,'globalThis.COURSE='+JSON.stringify(data)+';');

const index = read('src/index.html').replace(/\b(src|href)="([^"?]+\.(?:js|css))"/g,
  (_,attribute,file)=>`${attribute}="${file}?v=${digest(out+'/'+file)}"`);
fs.writeFileSync(`${out}/index.html`,index);
fs.writeFileSync(`${out}/.nojekyll`,'');
console.log(`Собран РВМП 2026: ${Object.keys(stacks).length} стека, ${Object.keys(practiceVariants).length} учебных вариантов.`);
