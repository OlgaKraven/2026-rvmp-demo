(()=>{'use strict';
const D=COURSE,C=ExamCore,E=C.escape,root=document.getElementById('app'),prefix='rvmp2026-basic-v1:';let memory={},storageOK=true;
function get(k,f=null){try{return JSON.parse(localStorage.getItem(prefix+k))??f;}catch{storageOK=false;return memory[k]??f;}}
function set(k,v){memory[k]=v;try{localStorage.setItem(prefix+k,JSON.stringify(v));}catch{storageOK=false;}}
const p=new URLSearchParams(location.search),modes=[['overview','Обзор'],['learn','Обучение'],['training','Тренировка'],['mock','Пробный экзамен'],['examples','Примеры'],['teacher','Преподавателю']];
const modeIcons = {
  overview: 'M12 2.5 2 11h3v9a1 1 0 0 0 1 1h3.5v-6h5v6H18a1 1 0 0 0 1-1v-9h3z',
  learn: 'M6 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm3.5 2h6a4 4 0 0 1 0 8H9a2 2 0 1 0 0 4h7.2l-2-2 1.4-1.4L20 19l-4.4 4.4-1.4-1.4 2-2H9a4 4 0 1 1 0-8h6.5a2 2 0 0 0 0-4h-6z',
  training: 'M9 1h6v3H9zM11 4h2v1h-2zM19 7l1.8-1.8 1.4 1.4-1.8 1.8zM21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-10-5h2v4.5l2.2 2.2-1.4 1.4-2.8-2.8z',
  mock: 'M9 3a3 3 0 0 1 6 0h3a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1 1.2v2h4v-2zm-2 9.1 3.1 3.1 5.5-5.5-1.4-1.4-4.1 4.1-1.7-1.7z',
  examples: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 2h16V7H4zm5.4 2.6L6 14l3.4 3.4 1.2-1.2L8.4 14l2.2-2.2zm5.2 0-1.2 1.2 2.2 2.2-2.2 2.2 1.2 1.2L18 14z',
  teacher: 'M2 3h20v14h-9v2h4v2H7v-2h4v-2H2zm4.2 9 1.3 1.3 3-3 3 1.5 4.3-4.3-1.3-1.3-3.3 3.3-3-1.5z'
};
const toolIcons = {
  moon: 'M20.8 15.2A9 9 0 0 1 8.8 3.2a9.2 9.2 0 1 0 12 12Z',
  sun: 'M17.5 12a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0ZM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM3.5 4.9l1.4-1.4L7 5.6 5.6 7zm13.5 13.5 1.4-1.4 2.1 2.1-1.4 1.4zm0-12.8 2.1-2.1 1.4 1.4L18.4 7zM3.5 19.1 5.6 17 7 18.4l-2.1 2.1z',
  tour: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm4.7 5.3-7 2.4-2.4 7 7-2.4z'
};
let mode=p.get('mode')||get('mode','overview'),stack=p.get('stack')||get('stack','mysql'),stage=p.get('module')||p.get('stage')||get('stage','documents'),task=0,dark=get('dark',false);
if(!D.stages[stack])stack='mysql';if(mode==='criteria')mode='overview';if(!modes.some(m=>m[0]===mode))mode='learn';if(!D.stages[stack].some(s=>s.id===stage))stage='documents';
const exampleStackFrom = query => query.get('exampleStack') || query.get('stack');
let exampleStack = mode==='examples' ? exampleStackFrom(p) || get('example-stack') : get('example-stack');
const selectedExampleStack = () => Object.hasOwn(D.stacks,exampleStack) ? exampleStack : stack;
const lessonViews = [['brief','Условие и файлы'],['steps','Шаги'],['help','Справка']];
const resultStepTitle = 'Что сохранить';
const isLessonView = view => lessonViews.some(([id])=>id===view);
let learningView = isLessonView(p.get('view')) ? p.get('view')
  : !p.has('view') && (p.has('module') || p.has('stage')) ? 'steps' : 'map';
const stageProgressKey = () => 'learning-stage:' + stack;
const lessonViewKey = id => 'lesson-view:' + stack + ':' + id;
function openedStage() {
  const id = get(stageProgressKey(),'documents');
  return D.stages[stack].some(item=>item.id===id) ? id : 'documents';
}
if(mode==='learn'&&learningView==='map'&&!p.has('module')&&!p.has('stage'))stage=openedStage();

function overview() {
  const hours = Math.floor(D.official.minutes / 60);
  const minutes = D.official.minutes % 60;
  return `<section class="hero study-intro">
    <div class="banner-copy">
      <h1>Демонстрационный экзамен</h1>
      <ul class="banner-facts" aria-label="Параметры экзамена">
        <li>Базовый уровень</li>
        <li><span>Время экзамена</span> <time datetime="PT${hours}H${minutes}M">${hours} ч ${minutes} мин</time></li>
      </ul>
      <p class="lead">В двух модулях вы разработаете портал «Корочки.есть» для записи на онлайн-курсы, затем доработаете его дизайн и правила работы.</p>
      <div class="button-row">${btn('Открыть маршрут обучения →','data-mode="learn" data-lesson-view="map"',true)}${btn('Материалы задания','id="materials-open"')}</div>
    </div>
    <div class="banner-mascot"><img src="mascot-exam.png" alt="Носорог-студент увидел в календаре «Демка завтра»"></div>
  </section>${criteria()}`;
}

function resultFiles(id) {
const files = D.resultFiles;

  return `<ul class="result-files" role="list">${files[id].map(([name,type])=>{
    const icon = name.includes('.') ? 'M7 3h7l4 4v14H6V3h1zm7 0v5h4m-8 5h4m-4 4h4' : 'M3 7V5h6l2 2h10v12H3z';
    return `<li>
      <span class="result-file-icon"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${icon}"/></svg></span>
      <span class="result-file-info"><code>${E(name)}</code><span class="result-file-type">${E(type)}</span></span>
    </li>`;
  }).join('')}</ul>`;
}

function learningMap() {
  const stages = S();
  const active = openedStage();
  const done = id => get('done:'+stack+':'+id,false);
  return `<section class="map-panel">
    <div class="map-intro">
      <h1>Маршрут обучения</h1>
      <p>Сначала разберите исходные документы. Дальше каждый этап даёт результат для следующего.</p>
    </div>
    <div class="map-stack">
      <strong id="stack-label">Стек обучения</strong>
      <div class="example-stacks" id="stack" role="group" aria-labelledby="stack-label">
        ${Object.entries(D.stacks).map(([id,route])=>btn(E(route.name),`type="button" data-learning-stack="${E(id)}" aria-pressed="${id===stack}"`)).join('')}
      </div>
      <p class="muted">${E(D.stacks[stack].tools)}</p>
    </div>
    <div class="learning-map">
      <ol class="map-nodes" aria-label="Этапы обучения">${stages.map((item,index)=>{
        const complete = done(item.id);
        const current = !complete && item.id === active;
        const status = complete ? ' · Завершён' : current ? ' · Текущий этап' : '';
        const preparationLabel = index===0 ? `aria-label="${E('Этап 0 · '+item.title+' · '+item.module+status)}"` : '';
        return `<li><button class="map-node" data-map-stage="${item.id}" aria-pressed="${item.id===stage}" ${preparationLabel} ${current?'aria-current="step"':''} ${complete?'data-completed':''}>
          <span class="map-circle" aria-hidden="true">${complete?'✓':index}</span>
          <span><strong>${E(item.title)}</strong><small>${E(item.module+status)}</small></span>
        </button></li>`;
      }).join('')}</ol>
      <article class="map-detail" aria-label="Выбранный этап">
        ${stages.map(item=>{
          const complete = done(item.id);
          const resume = savedStep(item) !== null ? stepIndex(item)+1 : null;
          const action = complete ? 'Открыть этап'
            : resume ? 'Продолжить с шага '+resume
            : item.id === 'documents' ? 'Открыть подготовку' : 'Прочитать условие';
          return `<div class="map-stage-preview" ${item.id===stage?'':'inert'}>
            <div class="map-stage-content">
              <p class="section-code">${E(item.module)}</p>
              <h2>${E(item.title)}</h2><p>${E(item.goal)}</p>
              <strong>${resultStepTitle}</strong>${resultFiles(item.id)}
            </div>
            ${btn(action+' →',`data-stage="${item.id}" data-lesson-view="${resume||complete?'steps':'brief'}"`,true)}
          </div>`;
        }).join('')}
      </article>
    </div>
  </section>`;
}

function showLessonSteps() {
  const lesson=current(), index=stepIndex();
  const titles=[...lesson.steps.map(step=>step.title),resultStepTitle];
  const dialog=modal('Шаги этапа · '+lesson.title);
  const list=(start,end)=>`<ol class="lesson-step-list" start="${start+1}">${titles.slice(start,end).map((title,offset)=>{
    const number=start+offset;
    return `<li>${btn(E(title),`data-jump-step="${number}" ${number===index?'aria-current="step"':''}`)}</li>`;
  }).join('')}</ol>`;
  dialog.querySelector('.modal-body').innerHTML=list(0,titles.length);
  dialog.querySelectorAll('[data-jump-step]').forEach(button=>button.onclick=event=>{
    dialog.close();
    goToStep(Number(button.dataset.jumpStep),event.detail>0);
  });
}

function goToStep(index, pointer=false) {
  set(stepKey(),index);
  render();
  focusLessonHeading(pointer);
}

function focusLessonHeading(pointer=false) {
  const heading = document.querySelector('.lesson-heading');
  heading.toggleAttribute('data-pointer-focus',pointer);
  const workspaceStep=heading.closest('.study-step-er');
  heading.focus({preventScroll:!!workspaceStep});
  workspaceStep?.scrollIntoView({block:'start',behavior:'instant'});
}

const btn=(t,a='',primary=false)=>`<button class="btn${primary?' primary':''}" ${a}>${t}</button>`,link=(t,url)=>`<a href="${E(url)}" target="_blank" rel="noopener">${E(t)}</a>`,label=()=>D.stacks[stack].name;
function iconButton(title,path,attributes) {
  return btn(
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="${path}"/></svg><span class="icon-tooltip" aria-hidden="true">${E(title)}</span>`,
    `type="button" data-icon-button aria-label="${E(title)}" ${attributes}`
  );
}
function siteNavigation() {
  return `<nav class="site-nav" aria-label="Основные разделы">${modes.map(([id,title])=>
    iconButton(title,modeIcons[id],`data-mode="${id}" ${mode===id?'aria-current="page"':''}`)
  ).join('')}</nav>`;
}
function siteTools() {
  return `<div class="top-tools">
    ${iconButton(dark?'Включить светлую тему':'Включить тёмную тему',dark?toolIcons.sun:toolIcons.moon,'id="theme"')}
    ${iconButton('Тур по сайту',toolIcons.tour,'id="site-tour" aria-haspopup="dialog"')}
  </div>`;
}
const validVariant = id => id==='sample'||Object.hasOwn(D.practiceVariants,id) ? id : 'sample';
let variantId = validVariant(p.get('variant')||get('mock-variant','sample'));
const mockVariant = () => D.practiceVariants[variantId];
const S=()=>D.stages[stack],current=()=>S().find(s=>s.id===stage);
const key=()=>`${stack}:${mode}:${mode==='mock'?variantId:'sample'}`;
const stepKey=(id=stage)=>`step:${stack}:${id}`;
function savedStep(lesson) { return get(stepKey(lesson.id)); }

const stepIndex=(lesson=current())=>Math.min(Math.max(0,savedStep(lesson)??0),lesson.steps.length);
function del(k){delete memory[k];try{localStorage.removeItem(prefix+k);}catch{storageOK=false;}}
function header(title,text){return `<div class="route-heading"><h1>${E(title)}</h1>${text?`<p>${E(text)}</p>`:''}</div>`;}
function sources(){return `<div class="button-row"><a class="btn" href="materials/kim-2026.pdf#page=32" target="_blank">КИМ · PDF</a><a class="btn" href="materials/sample.zip" download>Приложения · ZIP</a></div>`;}
function shotFor(s,screenStack=stack){return D.screens[screenStack]?.[s.shot]||D.screens[screenStack]?.[s.fallbackShot];}
function shot(s,full=false,example=false,screenStack=stack){const a=shotFor(s,screenStack);if(!a)return '';return `<figure class="microshot"><button class="image-open" data-image="${E(a.file)}" aria-label="Увеличить скриншот: ${E(a.caption)}"><img src="${E(a.file)}" alt="${E(a.caption)}" ${full?'':'loading="lazy"'}></button><figcaption>${example?'На снимке: ':''}${E(a.caption)}</figcaption></figure>`;}
function lessonActions(actions, withEr) {
  return `<ol${withEr?' class="er-lesson-actions" role="list"':''}>${actions.map((action,index)=>withEr
    ? `<li><span class="er-lesson-action-number" aria-hidden="true">${index+1}</span><span>${E(action)}</span></li>`
    : `<li>${E(action)}</li>`).join('')}</ol>`;
}


function explain(step, withEr) {
  const file=step.file && 'examples/'+stack+'/'+step.file;
  const resources = (step.resources || []).map(resource => {
    if (resource === 'example') return `<li><a href="downloads/example-${E(stack)}.zip" download>Рабочий портал · ZIP</a></li>`;
    if (resource === 'kim') return `<li>${link('КИМ · стр. 32', 'materials/kim-2026.pdf#page=32')}</li>`;
    if (resource === 'archive') return '<li><a href="materials/sample.zip" download>Приложения · ZIP</a></li>';
    if (resource === 'drawio') return `<li>${link('Открыть draw.io','https://app.diagrams.net/')}</li>`;
    const file = D.previews.find(item=>item.name===resource);
    return file ? documentItems([file]) : '';
  }).join('');
  return `<section class="lesson-explanation">
    ${resources?`${withEr?'<h3>Материалы шага</h3>':''}<ul class="lesson-resources" aria-label="Материалы шага">${resources}</ul>`:''}
    ${file && Object.hasOwn(D.code,file)?btn('Открыть '+E(step.file),`type="button" data-code="${E(file)}" aria-haspopup="dialog"`):''}
    <h3>Что сделать</h3>
    ${step.actionGroups
      ? step.actionGroups.map(group=>`<section class="lesson-action-group"><h4>${E(group.title)}</h4>${lessonActions(group.actions,withEr)}${group.shot?shot(group):''}</section>`).join('')
      : lessonActions(step.actions,withEr)}
    ${step.code?`<div class="lesson-code-block">
      <div class="lesson-code-toolbar"><span>${E(step.codeLabel||'Код')}</span>${btn('Копировать код','type="button" data-copy-lesson-code')}</div>
      <pre class="lesson-code" tabindex="0">${E(step.code)}</pre>
    </div>`:''}
    ${shot(step,false,true)}
    <div class="build-check"><strong>Как проверить результат</strong><p>${E(step.check)}</p></div>
    <p class="lesson-reason"><strong>Зачем это нужно.</strong> ${E(step.why)}</p>
  </section>`;
}
function flatTabs(items, active, prefix, sharedPanel) {
  return items.map(([id,label])=>btn(E(label),`type="button" role="tab" id="${prefix}-tab-${id}" data-tab="${id}"
    aria-selected="${id===active}" tabindex="${id===active?0:-1}" aria-controls="${sharedPanel ?? prefix+'-panel-'+id}"`)).join('');
}
function bindFlatTabs(list, activate) {
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  tabs.forEach(tab=>tab.onclick=()=>activate(tab));
  list.onkeydown = event=>{
    if (event.altKey||event.ctrlKey||event.metaKey||event.shiftKey) return;
    const index = tabs.indexOf(event.target);
    if (index<0) return;
    const next = {ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowRight:(index+1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if (next===undefined) return;
    event.preventDefault();
    tabs[next].click();
  };
}
function lessonHelp(foundation) {
  const {title,summary,exampleTitle,example,termsTitle,diagnosticsTitle,csvExport}=foundation.guide;
  const procedure = steps=>`<ol class="lesson-help-procedure">${steps.map(([heading,action,screenshot])=>
    `<li><strong>${E(heading)}</strong><p>${E(action)}</p>${screenshot?shot({shot:screenshot}):''}</li>`).join('')}</ol>`;
  const glossary = entries=>`<dl class="lesson-glossary">${entries.map(([term,definition])=>
    `<div><dt>${E(term)}</dt><dd>${Array.isArray(definition)?definition.map(line=>`<p>${E(line)}</p>`).join(''):E(definition)}</dd></div>`).join('')}</dl>`;
  const topics = [
    ['summary','Объяснение',`<h3 id="lesson-help-title">${E(title)}</h3><p class="lesson-help-intro">${E(summary)}</p><p><strong>Результат этапа.</strong> ${E(current().output)}</p><p><a href="downloads/example-${E(stack)}.zip" download>Скачать рабочий пример выбранного стека</a></p>`],
    ['example',exampleTitle,`<h3>${E(exampleTitle)}</h3>${example.split('\n').map(line=>`<p>${E(line)}</p>`).join('')}`],
    ...(csvExport ? [['csv-export','CSV через Excel',`<h3>${E(csvExport.title)}</h3><p>${E(csvExport.intro)}</p>
      ${procedure(csvExport.steps)}
      <h4 class="lesson-help-procedure-heading">${E(csvExport.importTitle)}</h4>
      ${procedure(csvExport.importSteps)}`]] : []),
    ['terms','Термины',`<h3>${E(termsTitle)}</h3>${glossary(foundation.terms)}`],
    ...(foundation.relationshipHelp ? [['relationships','Как читать связи',`<h3>Как читать связи</h3>${glossary(foundation.relationshipHelp)}`]] : []),
    ['errors','Ошибки',`<h3>${E(diagnosticsTitle)}</h3><ul class="lesson-help-errors">${foundation.errors.map(error=>`<li>${E(error)}</li>`).join('')}
      ${foundation.question?`<li><strong>${E(foundation.question)}</strong><p>${E(foundation.answer)}</p></li>`:''}</ul>`]
  ];
  return `<div class="lesson-help-body">
    <nav class="lesson-tabs lesson-help-menu" role="tablist" aria-label="Темы справки">
      ${flatTabs(topics,'summary','help')}
    </nav>
    ${topics.map(([id,,content])=>`<div class="lesson-help-pane" role="tabpanel" id="help-panel-${id}"
      aria-labelledby="help-tab-${id}" tabindex="0" ${id==='summary'?'':'hidden'}>${content}</div>`).join('')}
  </div>`;
}
function bindHelpTopics() {
  const menu = root.querySelector('.lesson-help-menu');
  if (!menu) return;
  bindFlatTabs(menu, tab=>{
    const previous = menu.querySelector('[aria-selected="true"]');
    previous.setAttribute('aria-selected','false');
    previous.tabIndex = -1;
    document.getElementById(previous.getAttribute('aria-controls')).hidden = true;
    tab.setAttribute('aria-selected','true');
    tab.tabIndex = 0;
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    panel.hidden = false;
    panel.scrollTop = 0;
    tab.focus({preventScroll:true});
  });
}


function conditionText(paragraphs) {
  const html=[];
  let list=[];
  const flush=()=>{
    if(list.length)html.push(`<ol>${list.join('')}</ol>`);
    list=[];
  };
  for(const text of paragraphs){
    if(/^\d+\. /.test(text)){
      list.push(`<li>${E(text.replace(/^\d+\. /,''))}</li>`);
    }else{
      flush();
      html.push(`<p>${E(text)}</p>`);
    }
  }
  flush();
  return `<div class="condition-text">${html.join('')}</div>`;
}
function taskParagraphs(text) {
  return text.split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z])/u);
}
function assignmentAttachment(index, name) {
  return `<a href="${E(D.kimAssignments[D.tasks[index].id].path)}" download>${E(name)}</a>`;
}
function conditionTaskMenu(index) {
  return `<nav class="condition-task-menu" aria-label="Задания КИМ">
    ${D.tasks.map((item,i)=>{
      const label = 'Задание '+(i+1)+'. '+D.kimAssignments[item.id].title;
      return btn((i+1)+' · '+E(stageNames[item.id][1]),`type="button" data-condition-task="${i}" aria-controls="kim-condition" aria-pressed="${i===index}" aria-label="${E(label)}"`);
    }).join('')}
  </nav>`;
}
function sampleConditions(index) {
  const task = D.tasks[index];
  const original = D.kimAssignments[task.id];
  return `<div class="condition-document" id="kim-condition" aria-live="polite">
    <section class="condition-section">
      <h3>Задание ${index+1}. ${E(original.title)}</h3>
      <p class="task-meta">КИМ · стр. ${E(task.pages.split(';')[0])}</p>
      ${conditionText(original.paragraphs)}
      <p class="condition-attachment"><strong>Приложение</strong> ${assignmentAttachment(index,original.attachment)}</p>
      ${original.expertNotes?`<aside class="condition-expert">
        <h4>Инструкции для технического эксперта</h4>
        ${conditionText(original.expertNotes)}
      </aside>`:''}
    </section>
  </div>`;
}
function lessonBrief(lesson) {
  const taskIndex=D.tasks.findIndex(item=>item.id===lesson.id);
  if(taskIndex<0){
    const files=D.previews.filter(file=>!file.task);
    return `${conditionText(taskParagraphs(lesson.goal))}
      <section class="task-files"><h3>Исходные документы</h3><ul>${documentItems(files)}</ul></section>
      ${sources()}`;
  }
  const assignment=D.tasks[taskIndex];
  const page=assignment.pages.match(/^\d+/)[0];
  const original=D.kimAssignments[lesson.id];
return `

    ${conditionText(original.paragraphs)}
    <section class="task-files"><h3>Приложения</h3>
      <ul><li>${assignmentAttachment(taskIndex,original.attachment)}</li>
        </ul>
    </section>
    <p class="task-source">${link('КИМ · стр. '+assignment.pages.split(';')[0],'materials/kim-2026.pdf#page='+page)} · ${E(original.title)}</p>
    <p><strong>Для обучения.</strong> ${E(lesson.output)}</p>`;
}
function bindLessonDocuments(host) {
  host.querySelectorAll('[data-lesson-document]').forEach(control=>control.onclick=event=>{
    if (event.ctrlKey||event.metaKey||event.shiftKey||event.altKey) return;
    const file=D.previews.find(item=>item.path===control.dataset.lessonDocument);
    if(!file)return;
    event.preventDefault();
    const dialog=modal(file.name);
    dialog.querySelector('.modal-body').innerHTML=documentPreview(file);
  });
}

const stageNames = D.stageNames;

function stageNavigation() {
  const practice = mode==='training'||mode==='mock', mock=mode==='mock';
  const items = practice ? D.tasks : S();
  const completed = items.map((item,index)=>!mock&&(practice ? taskDone(index) : get('done:'+stack+':'+item.id,false)));
  return `<nav class="stage-nav" aria-label="${mock?'Задания пробного экзамена':practice?'Этапы тренировки':'Этапы обучения'}">
    <div class="stage-nav-caption">
      <strong>${mock?'Задания':'Этапы'}</strong>
      ${mock?'':`<span aria-live="polite">Выполнено ${completed.filter(Boolean).length} из ${items.length}</span>`}
    </div>
    <ol class="stage-nav-list" role="list">${items.map((item,index)=>{
      const number = index + Number(practice);
      const active = practice ? index===task : item.id===stage;
      const [name,short] = stageNames[item.id];
      const duration = number ? D.tasks[number-1].minutes+' мин' : 'Перед началом';
      const label = `${number?'Задание '+number:'Этап 0'} · ${name} · ${duration}${completed[index]?' · Выполнено':''}`;
      const marker = completed[index]
        ? '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>'
        : number;
      return `<li><button type="button" class="stage-nav-node" ${practice?`data-task="${index}"`:`data-stage="${item.id}"`} aria-label="${E(label)}" ${active?'aria-current="step"':''} ${completed[index]?'data-completed':''}>
        <span class="stage-nav-marker" aria-hidden="true">${marker}</span>
        <span class="stage-nav-label" aria-hidden="true"><span>${E(name)}</span><small>${duration}</small></span>
        <span class="stage-nav-short" aria-hidden="true">${E(short)}</span>
      </button></li>`;
    }).join('')}</ol>
  </nav>`;
}

function stepArrow(index, direction, label) {
  const previous = direction==='previous';
  const path = previous ? 'M20 12H4m7-7-7 7 7 7' : 'M4 12h16m-7-7 7 7-7 7';
  const icon = `<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  return btn(icon,`type="button" data-step="${index}" data-step-direction="${direction}" aria-label="${E(label)}"
    title="${E(label)}" aria-keyshortcuts="${previous?'ArrowLeft':'ArrowRight'}"`,!previous);
}
function learn() {
  const lesson=current(), index=stepIndex(), step=lesson.steps[index];
  const next=S()[S().indexOf(lesson)+1], nextStep=lesson.steps[index+1];
  const done=get('done:'+stack+':'+stage,false);
  const forwardTitle = !nextStep?'Что сохранить':nextStep.erWorkspace?'К сверке ER-диаграммы':'Следующий шаг';
  const forward = step
    ? stepArrow(index+1,'next',forwardTitle)
    : done && (next
      ? btn('Далее · '+E(next.title)+' →',`data-stage="${next.id}"`,true)
      : btn('Перейти к тренировке →','data-mode="training"',true));
  return `<header class="workspace-intro">
      <div><h1>Обучение</h1><p>Портал «Корочки.есть»</p></div>
      <div class="lesson-back">${btn('← К маршруту','data-mode="learn" data-lesson-view="map" aria-label="К маршруту обучения"')}</div>
    </header>
    <div class="route-layout lesson-layout">
      ${stageNavigation()}
      <section class="route-content lesson-card${lesson.id==='M1'?' lesson-card-er':''}${lesson.id==='M2'?' lesson-card-db':''}${learningView==='help'?' lesson-card-with-help':''}" aria-labelledby="lesson-title">
        <header class="lesson-card-heading">
          <h2 id="lesson-title">${E(lesson.title)}</h2>
          <p class="task-meta">${E(lesson.module)} · ${E(label())}</p><p class="lesson-goal">${E(lesson.goal)}</p>
        </header>
        <nav class="lesson-tabs" aria-label="Разделы этапа">
          ${lessonViews.map(([view,title])=>
            btn(title,`type="button" data-lesson-tab="${view}" ${learningView===view?'aria-current="page"':''}`)
          ).join('')}
        </nav>
        ${learningView==='help'?lessonHelp(lesson.foundation):learningView==='brief'?`<div class="lesson-brief">
          ${lessonBrief(lesson)}
          <div class="button-row">${btn(savedStep(lesson)===null?'Перейти к шагам →':'Продолжить с шага '+(index+1)+' →','id="start-lesson"',true)}</div>
        </div>`:`
        <section class="study-step${step?.erWorkspace?' study-step-er':''}" aria-labelledby="lesson-step-title">
          <div class="lesson-step-heading">
            <h3 class="lesson-heading" id="lesson-step-title" tabindex="-1"><span class="lesson-step-number" aria-label="Шаг ${index+1} из ${lesson.steps.length+1}">${index+1}</span><span>${E(step?.title ?? resultStepTitle)}</span></h3>
            ${btn('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>','type="button" id="lesson-steps" aria-label="Все шаги" title="Все шаги" aria-haspopup="dialog"')}
          </div>
          ${step?.erWorkspace ? `
            <section class="lesson-explanation er-review">
              <h4>Что сверить</h4>
              <p>${E(step.why)}</p>
              ${lessonActions(step.actions,true)}
              ${shotFor(step)?btn('Снимок готовой схемы',`type="button" data-image="${E(shotFor(step).file)}" aria-haspopup="dialog"`):''}
            </section>
            <section class="er-workspace" id="er-workspace" aria-labelledby="er-title"></section>
          ` : step ? `
            ${step.source?`<p class="source-note">Источник · ${E(step.source)}</p>`:''}
            ${explain(step,lesson.id==='M1')}
          ` : `<div class="lesson-result">


            ${resultFiles(stage)}
          </div>`}
          <div class="study-controls${step?'':' lesson-result-controls'}">
            ${index>0?stepArrow(index-1,'previous','Предыдущий шаг'):''}
            ${step?'':`<label class="lesson-complete"><input type="checkbox" id="done" ${done?'checked':''}> Этап выполнен</label>`}
            ${forward || ''}
          </div>
        </section>
        `}
      </section>
    </div>`;
}
function timer(){return C.restoreTimer(JSON.stringify(get('timer:'+key())),D.official.minutes*60,mode);}
let audioContext;
function enableTimerSound() {
  if (!get('timer-sound',true) || !window.AudioContext) return;
  audioContext ??= new AudioContext();
  audioContext.resume().catch(()=>{});
}
function signalTimer() {
  if (!get('timer-sound',true) || audioContext?.state !== 'running') return;
  const tone = audioContext.createOscillator(), gain = audioContext.createGain();
  const now = audioContext.currentTime;
  tone.frequency.value = 660;
  gain.gain.setValueAtTime(0.12,now);
  gain.gain.exponentialRampToValueAtTime(0.001,now+0.5);
  tone.connect(gain).connect(audioContext.destination);
  tone.start(now);
  tone.stop(now+0.5);
}
const taskDone = index => get('task-done:'+key()+':'+index,false);
const taskClock = () => get('task-clock:'+key(),{anchor:0,spent:{},alerted:{}});
function taskSpent(clock,used) {
  return (clock.spent[task] || 0) + Math.max(0,used-clock.anchor);
}
function selectPracticeTask(next) {
  if (mode === 'training' && next !== task) {
    const clock = taskClock(), used = Math.min(timer().durationMs,C.timerView(timer()).used);
    clock.spent[task] = taskSpent(clock,used);
    clock.anchor = used;
    set('task-clock:'+key(),clock);
  }
  set('task:'+key(),next);
  render();
  root.querySelector('.stage-nav [data-task="'+next+'"]')?.focus({preventScroll:true});
}
function taskDocuments(index) {
  return D.previews.filter(file=>file.task===D.tasks[index].id);
}

function documentItems(files) {
  return files.map(file=>`<li><a href="${E(file.path)}" data-lesson-document="${E(file.path)}" aria-haspopup="dialog">${E(file.name)}</a></li>`).join('');
}
function trainingFiles() {
  const files=taskDocuments(task);
  if (!files.length) return '';
  return `<section class="task-files" aria-labelledby="training-files-title">
    <h3 id="training-files-title">Файлы задания</h3>
    <ul>${documentItems(files)}</ul>
  </section>`;
}
function mockFiles() {
  const variant=mockVariant();
  if (!variant) return trainingFiles();
  const files=variant.files[D.tasks[task].id];
  return `<section class="task-files" aria-labelledby="training-files-title">
    <h3 id="training-files-title">Файлы задания</h3>
    <ul>${files.map(file=>`<li><a href="${E(file.path)}" download>${E(file.name)}${file.image?' · SVG':''}</a></li>`).join('')}</ul>
  </section>`;
}

function showTrainingSample() {
  materials({initialTask:task,title:'Условие КИМ и приложения'});
}
function timerBox() {
  const t=timer(), finished=t.status==='finished', running=t.status==='running', idle=t.status==='idle';
  const training=mode==='training';
  const clock=`<output class="training-clock" id="clock" aria-live="off">${C.format(C.timerView(t).left)}</output>`;
  const status='<span id="timer-status" role="status"></span>';
  const progress='<progress id="timer-progress" aria-label="Использованное время" max="1" value="0"></progress>';
  const startLabel=training?(idle?'Начать тренировку':'Продолжить тренировку'):'Начать экзамен';
  const mainAction=finished?btn('Начать заново','data-timer="reset"',true)
    : training&&running?btn('Пауза','data-timer="pause"',true)
    : running?'':btn(startLabel,'data-timer="start"',true);
  return `<section class="timer-card" aria-label="${training?'Время тренировки':'Время пробного экзамена'}">
    <div class="training-timer-top">
      <span class="eyebrow">${training?'ТРЕНИРОВКА':'ПРОБНЫЙ ЭКЗАМЕН'}</span>
      ${clock}${status}${progress}
      ${training?`<div class="timer-task">
        <span id="task-clock-label">Время на задание ${task+1}</span>
        <output id="task-clock" aria-labelledby="task-clock-label" aria-live="off"></output>
      </div>`:''}
    </div>
    <div class="training-timer-controls">
      ${mainAction}
      ${!finished&&(!idle||!training)?btn('Завершить',`data-timer="finish" ${idle?'disabled':''}`):''}
    </div>
    ${training?`<div class="attempt-actions">
      <label class="attempt-sound"><input type="checkbox" id="timer-sound" ${get('timer-sound',true)?'checked':''}> Звук таймера</label>
      ${!finished?btn('Сбросить тренировку','data-timer="reset"'):''}
    </div>`:!finished?'<p class="timer-hint">После начала время идёт непрерывно, даже при закрытой странице.</p>':''}
  </section>`;
}
function resetAttempt(){for(const t of D.tasks){for(let i=0;i<t.checks.length+(mockVariant()?.checks[t.id]?.length??0);i++)del('check:'+key()+':'+t.id+':'+i);del('notes:'+key()+':'+t.id);}if(mode==='training'){
 for(let i=0;i<D.tasks.length;i++)del('task-done:'+key()+':'+i);
 del('task-clock:'+key());
}set('timer:'+key(),C.freshTimer(D.official.minutes*60,mode));set('task:'+key(),0);render();}
function attemptNotice(){const t=timer();if(t.status==='paused')return '<section class="pause-screen" aria-labelledby="pause-title" tabindex="-1"><h2 id="pause-title">Тренировка на паузе</h2><p>Отсчёт остановлен. Условия и отметки снова появятся после продолжения.</p></section>';if(t.status==='finished')return `<section class="attempt-result" role="status"><h2>${C.timerView(t).expired?'Время вышло':'Попытка завершена'}</h2><p>Отметки самопроверки сохранены.</p></section>`;return '';}

function practice() {
  const status=timer().status, locked=status==='paused'||status==='finished';
  const mock=mode==='mock', t=D.tasks[task], variant=mock?mockVariant():null;
  const taskChecks=[...t.checks,...(variant?.checks[t.id]||[])];
  const checks=taskChecks.map((item,i)=>`<label><input type="checkbox" ${locked?'disabled':''} data-check="${t.id}:${i}" ${get('check:'+key()+':'+t.id+':'+i,false)?'checked':''}>${E(item)}</label>`).join('');
  const workspace=`<div class="training-workspace" ${status==='paused'?'hidden':''}>
    ${stageNavigation()}
    <article class="training-task">
      <h2>${E(t.title)}</h2>
      <p class="task-meta">Задание ${task+1} · ${t.minutes} мин · ${variant?'Учебный вариант '+variantId:'КИМ, стр. '+E(t.pages)}</p>
      <section class="practice-condition">
        <h3>Условие задания</h3>
        ${conditionText((variant?.assignments??D.kimAssignments)[t.id].paragraphs)}
      </section>
      ${mock?mockFiles():`<div class="task-support">${trainingFiles()}
        ${locked?'':btn('Подсказка к заданию',`data-help="${t.id}"`)}
      </div>`}
      <section class="self-check training-checklist" aria-labelledby="training-check-title">
        <header><h3 id="training-check-title">Самопроверка</h3><span id="training-check-count" aria-live="polite">${taskChecks.filter((_,i)=>get('check:'+key()+':'+t.id+':'+i,false)).length} из ${taskChecks.length}</span></header>
        ${checks}
        ${mock?'<p class="small">Отметки служат для самопроверки.</p>':`<label class="task-complete"><input type="checkbox" id="task-complete" ${locked?'disabled':''} ${taskDone(task)?'checked':''}> Задание выполнено</label>`}
      </section>
    </article>
  </div>`;
  if(!mock)return `<section class="training-page practice-page training-compact">
    <header class="workspace-intro">
      <div><h1>Тренировка</h1><p>Портал «Корочки.есть» · официальный образец КИМ</p></div>
      <div class="training-intro-actions">
        ${btn('Условие КИМ и приложения','id="training-sample" aria-haspopup="dialog"')}
      </div>
    </header>
    <div class="attempt-layout">${timerBox()}<div class="attempt-content">${attemptNotice()}${workspace}</div></div>
  </section>`;
  return `<section class="training-page practice-page training-compact mock-exam">
    <header class="workspace-intro">
      <div><h1>Пробный экзамен</h1><p>Образец КИМ и 30 учебных вариантов · 2 модуля · 50 баллов</p></div>
    </header>
    <div class="attempt-layout">
      ${timerBox()}
      <div class="attempt-content">
        <section class="mock-variant-bar" aria-labelledby="mock-variant-title">
          <div>
            <h2 id="mock-variant-title">Вариант экзамена</h2>
            <p>${variant?E(variantId+' · '+variant.name):'Образец КИМ · Корочки.есть'}</p>
            ${status==='running'?'<p class="small" id="variant-lock">Завершите попытку, чтобы сменить вариант.</p>':''}
          </div>
          <div class="mock-variant-actions">
            ${btn('Выбрать вариант',`type="button" id="mock-variant" aria-haspopup="dialog" ${status==='running'?'disabled aria-describedby="variant-lock"':''}`)}
            ${variant?btn('Входные данные','type="button" id="mock-data" aria-haspopup="dialog"'):''}
            <a class="btn" id="mock-download" href="${E(variant?.path||'materials/sample.zip')}" download>Скачать комплект · ZIP</a>
          </div>
        </section>
        ${attemptNotice()}${workspace}
      </div>
    </div>
  </section>`;
}
function files(fileStack) {
  return Object.keys(D.code).filter(path=>path.startsWith('examples/'+fileStack+'/'));
}
const fileLabel = path => path.split('/').slice(2).join('/');
function examples() {
  const activeStack = selectedExampleStack();
  return `<section class="training-page example-page">
    ${header('Примеры','Скачайте рабочий портал и откройте инструкцию для выбранного стека.')}
    <div class="example-stacks" role="group" aria-label="Стек примера">
      ${Object.entries(D.stacks).map(([id,route])=>btn(E(route.name),`type="button" data-example-stack="${id}" aria-pressed="${id===activeStack}"`)).join('')}
    </div>
    <div class="example-grid">
      <article class="route-panel">
        <h2>Рабочий портал</h2>
        <p>В архиве исходники портала, схема базы, изображения и порядок запуска в Windows.</p>
        <div class="example-actions">
          <a class="btn primary" href="downloads/example-${E(activeStack)}.zip" download>Скачать ZIP</a>
          ${btn('Как использовать','type="button" id="example-launch" aria-haspopup="dialog"')}
        </div>
      </article>
      <article class="route-panel">
        <h2>Внутри проекта</h2>
        <ul class="example-files" id="example-file">
          ${files(activeStack).map(file=>`<li>
            <button type="button" class="file-open" data-example-file="${E(file)}" aria-haspopup="dialog">${E(fileLabel(file))}</button>
            <p>${E(D.codeDescriptions[file])}</p>
          </li>`).join('')}
        </ul>
      </article>
    </div>
  </section>`;
}

function criteria() {
  return `<section id="criteria" class="route-panel overview-criteria" aria-labelledby="criteria-title">
    <header class="criteria-heading"><h2 id="criteria-title">Критерии оценки</h2><span>${D.official.points} баллов</span></header>
    <p class="criteria-source">КИМ ${E(D.official.code)} · таблица 7</p>
    <div class="criteria-table-wrap">
      <table class="criteria-table" aria-labelledby="criteria-title">
        <thead><tr><th scope="col">Критерий</th><th scope="col">Баллы</th></tr></thead>
        <tbody>${D.criteria.map(([title,points])=>`<tr><th scope="row">${E(title)}</th><td>${points}</td></tr>`).join('')}</tbody>
        <tfoot><tr><th scope="row">Итого</th><td>${D.official.points}</td></tr></tfoot>
      </table>
    </div>
    <p>${link('Полные формулировки в КИМ · стр. 13','materials/kim-2026.pdf#page=13')}</p>
  </section>`;
}
function teacher(){
  return `<section class="training-page">
    ${header('Преподавателю','Разбор задания «Корочки.есть» на Python Flask + MySQL / MariaDB.')}
    <article class="route-panel">
      <h2>Демонстрационный экзамен 2026</h2>
      <p>Базовый уровень, два модуля по 90 минут. В презентации собраны условия, действия в Windows и проверка результата.</p>
      <p>В презентации откройте «Ещё», чтобы заполнить данные преподавателя. «Режим показа» открывает отдельное окно для аудитории. Двойной щелчок по слайду в этом окне включает полный экран.</p>
      <div class="button-row">
        <a class="btn primary" id="deck-open" href="presentation.html">Открыть презентацию</a>
        <a class="btn" href="materials/rvmp-2026-presentation.pdf" download>Скачать PDF</a>
      </div>
    </article>
  </section>`;
}
function modal(title){const d=document.createElement('dialog');d.className='course-dialog';d.setAttribute('aria-label',title);d.innerHTML=`<header class="modal-head"><h2>${E(title)}</h2>${btn('Закрыть','data-close')}</header><div class="modal-body"></div>`;document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.showModal();return d;}
function chooseMockVariant() {
  const dialog=modal('Выберите вариант экзамена');
  const options=[['sample','Образец КИМ · Корочки.есть'],...Object.entries(D.practiceVariants).map(([id,item])=>[id,id+' · '+item.name])];
  dialog.querySelector('.modal-body').innerHTML=`<div class="mock-variant-list">${options.map(([id,name])=>
    btn(E(name),`type="button" data-variant="${E(id)}" aria-pressed="${id===variantId}"`)).join('')}</div>`;
  dialog.querySelector('[aria-pressed="true"]')?.focus();
  dialog.querySelectorAll('[data-variant]').forEach(button=>button.onclick=()=>{
    if(timer().status==='running')return;
    variantId=validVariant(button.dataset.variant);
    set('mock-variant',variantId);
    dialog.close();
    render();
    document.getElementById('mock-variant')?.focus({preventScroll:true});
  });
}

function showMockData() {
  const variant=mockVariant();
  if(!variant)return;
  const dialog=modal('Входные данные · '+variantId+' · '+variant.name);
  dialog.querySelector('.modal-body').innerHTML=`<h3>Курсы</h3><ul>${variant.courses.map(course=>`<li>${E(course)}</li>`).join('')}</ul>
    <h3>Данные для проверки</h3>${variant.input.map(row=>`<p><strong>${E(row.login)}</strong> · ${E(row.name)}<br>
      Пароль: ${E(row.password)} · ${E(row.phone)} · ${E(row.email)}<br>
      ${E(row.course)} · ${E(row.date)} · ${E(row.payment)}</p>`).join('')}
    <a href="${E(variant.files.M1[1].path)}" download>Скачать входные данные</a>`;
}

function openExampleInstructions() {
  const dialog=modal('Порядок работы · '+D.stacks[selectedExampleStack()].name);
  const path='examples/'+selectedExampleStack()+'/Порядок работы.md';
  const steps=D.code[path].split('\n').filter(line=>/^\d+\. /.test(line));
  dialog.querySelector('.modal-body').innerHTML=conditionText(steps);

}

function fileModal(file, fileStack=stack) {
  const dialog = modal('Исходники примера');
  const body = dialog.querySelector('.modal-body');
  body.innerHTML = `<div class="document-picks" role="group" aria-label="Файлы примера">${files(fileStack).map(path=>
      btn(E(fileLabel(path)),`type="button" data-code-file="${E(path)}" aria-pressed="${path===file}"`)).join('')}</div>
    <p class="file-description" aria-live="polite"></p>
    <div class="button-row">${btn('Копировать код','id="copy-code"')}</div>
    <pre class="code-preview" tabindex="0"></pre>`;
  const choices = body.querySelectorAll('[data-code-file]');
  const description = body.querySelector('.file-description');
  const code = body.querySelector('pre');
  const copy = body.querySelector('#copy-code');
  const show = path => {
    for(const button of choices) button.setAttribute('aria-pressed',String(button.dataset.codeFile===path));
    description.textContent = D.codeDescriptions[path];
    code.textContent = D.code[path];
    copy.textContent = 'Копировать код';
  };
  show(file);
  for(const button of choices) button.onclick=()=>show(button.dataset.codeFile);
  bindCodeCopy(copy, code);
}
function bindCodeCopy(button, code) {
  button.onclick = async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Скопировано';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Код выделен. Нажмите Ctrl+C или ⌘C';
    }
  };
}
function sheetPreview(sheet) {
  if (!sheet.rows.length) return `<p>${E(sheet.name)} · Лист пуст</p>`;
  const width = sheet.columns.reduce((sum,column)=>sum+column,0);
  const rows = sheet.rows.map(row=>{
    const values = row.filter(Boolean);
    const isHeader = values.length>1 && values.every(cell=>cell.bold && cell.align!=='right');
    const cells = row.map(cell=>{
      if (!cell) return '<td class="sheet-empty"></td>';
      const attributes = [
        cell.colspan>1 ? `colspan="${cell.colspan}"` : '',
        cell.rowspan>1 ? `rowspan="${cell.rowspan}"` : '',
        cell.align ? `data-align="${E(cell.align)}"` : '',
        cell.title ? 'data-sheet-title' : '',
        `title="${E(cell.formula ? cell.cell+' · '+cell.formula : cell.cell)}"`
      ].filter(Boolean).join(' ');
      const tag = isHeader ? 'th' : 'td';
      return `<${tag} ${attributes}>${cell.bold?`<strong>${E(cell.value)}</strong>`:E(cell.value)}</${tag}>`;
    });
    return `<tr${values.length?'':' class="sheet-spacer"'}>${cells.join('')}</tr>`;
  });
  return `<div class="scroll-table sheet-scroll" role="region" aria-label="Лист ${E(sheet.name)}" tabindex="0">
    <table class="sheet-table" style="--sheet-width:${Math.ceil(width)}px">
      <caption>${E(sheet.name)}</caption>
      <colgroup>${sheet.columns.map(column=>`<col style="width:${column/width*100}%">`).join('')}</colgroup>
      <tbody>${rows.join('')}</tbody>
    </table>
  </div>`;
}
function documentPreview(file) {
  if (file.sheets) {
    return `<p class="sheet-original"><a href="${E(file.path)}" download>Скачать оригинал · XLSX</a></p>${file.sheets.map(sheetPreview).join('')}`;
  }
  const original = `<p>${link('Оригинал · '+file.name,file.path)}</p>`;
  if (isImage(file)) return original+`<img src="${E(file.path)}" alt="${E(file.name)}" loading="lazy" style="max-width:100%">`;
  if (file.text) return original+`<pre class="material-text">${E(file.text)}</pre>`;
  if (file.pdf || file.name.endsWith('.pdf')) return original+`<iframe title="${E(file.name)}" src="${E(file.path)}"></iframe>`;
  return original;
}
function kimPreview(page,enlarged) {
  const pages = D.kimPreviewPages;
  return `<div class="kim-viewer">
    <div class="kim-toolbar">
      ${btn('←',`type="button" data-kim-direction="-1" aria-label="Предыдущая страница" ${page===1?'disabled':''}`)}
      <form id="kim-page-form" class="number-jump">
        <label for="kim-page">Страница</label>
        <input id="kim-page" type="number" min="1" max="${pages.length}" value="${page}" required>
        <span>из ${pages.length}</span>
        ${btn('Перейти','type="submit"')}
      </form>
      ${btn('→',`type="button" data-kim-direction="1" aria-label="Следующая страница" ${page===pages.length?'disabled':''}`)}
      ${btn(enlarged?'По ширине':'Увеличить',`type="button" id="kim-zoom" aria-pressed="${enlarged}"`)}
      <a class="btn kim-download" href="materials/kim-2026.pdf" download aria-label="Скачать КИМ · PDF" title="Скачать КИМ · PDF">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M10 2h4v8h4l-6 6-6-6h4zm-7 14h3v3h12v-3h3v6H3z"/></svg>
      </a>
    </div>
    <div class="kim-page-frame" tabindex="0" role="region" aria-label="Просмотр страницы ${page}" ${enlarged?'data-enlarged':''}>
      <img src="${E(pages[page-1])}" alt="КИМ · страница ${page}">
    </div>
  </div>`;
}
const isImage = file => /\.(png|jpe?g|webp)$/i.test(file.name);
function materials({initialTask=0,title='Материалы задания'}={}) {
  const dialog = modal(title);
  dialog.classList.add('materials-dialog');
  const body = dialog.querySelector('.modal-body');
  const tabs = [['condition','Условие'],['kim','КИМ · PDF'],['documents','Документы'],['images','Изображения'],['downloads','Скачать']];
  const documents = D.previews.filter(file=>!isImage(file));
  const images = D.previews.filter(isImage);
  let tab = 'condition', selectedTask = initialTask, selectedDocument = 0;
  let pdfPage = D.official.conditionPage, pdfEnlarged = false;

  function content() {
    switch(tab) {
      case 'condition':
        return sampleConditions(selectedTask);
      case 'kim':
        return kimPreview(pdfPage,pdfEnlarged);
      case 'documents':
        return `<div class="document-picks" role="group" aria-label="Документы">${documents.map((file,index)=>
          btn(E(file.name),`type="button" data-material-file="${index}" aria-pressed="${index===selectedDocument}"`)).join('')}</div>
          <div id="document-preview">${documentPreview(documents[selectedDocument])}</div>`;
      case 'images':
        return images.map(file=>`<figure class="microshot"><img src="${E(file.path)}" alt="${E(file.name)} · ${E(file.task)}"><figcaption>${E(file.name)} · ${E(file.task)}</figcaption></figure>`).join('');
      case 'downloads':
        return `<h3>Сохранить для работы без интернета</h3>
          <p><a class="btn" href="materials/sample.zip" download>Приложения · ZIP</a></p>
${D.tasks.map(item=>`<p>${assignmentAttachment(D.tasks.indexOf(item),D.kimAssignments[item.id].attachment)}</p>`).join('')}`;

    }
  }

  function draw() {
    body.innerHTML = `<nav class="lesson-tabs materials-tabs" role="tablist" aria-label="Разделы материалов">
      ${flatTabs(tabs,tab,'materials','materials-panel')}
    </nav>
    <div class="materials-panel" id="materials-panel" role="tabpanel" aria-labelledby="materials-tab-${tab}">
      ${tab==='condition'?conditionTaskMenu(selectedTask):''}
      <div class="materials-preview" role="region" aria-label="Содержимое материалов" tabindex="0">${content()}</div>
    </div>`;
    bindFlatTabs(body.querySelector('.materials-tabs'), button=>{
      if(tab===button.dataset.tab)return;
      tab = button.dataset.tab;
      draw();
      body.querySelector('[data-tab="'+tab+'"]').focus({preventScroll:true});
    });
    body.querySelectorAll('[data-condition-task]').forEach(button=>button.onclick=()=>{
      const index = Number(button.dataset.conditionTask);
      if(selectedTask===index)return;
      selectedTask = index;
      draw();
      body.querySelector('[data-condition-task="'+index+'"]').focus({preventScroll:true});
    });
    body.querySelectorAll('[data-material-file]').forEach(button=>button.onclick=()=>{
      selectedDocument = Number(button.dataset.materialFile);
      draw();
      body.querySelector(`[data-material-file="${selectedDocument}"]`).focus({preventScroll:true});
    });
    const pageForm = body.querySelector('#kim-page-form');
    if(pageForm) {
      pageForm.onsubmit=event=>{
        event.preventDefault();
        changePage(body.querySelector('#kim-page').valueAsNumber,'#kim-page');
      };
      body.querySelectorAll('[data-kim-direction]').forEach(button=>button.onclick=()=>{
        const direction = button.dataset.kimDirection;
        changePage(pdfPage+Number(direction),'[data-kim-direction="'+direction+'"]:not(:disabled)');
      });
      body.querySelector('#kim-zoom').onclick=()=>{
        pdfEnlarged = !pdfEnlarged;
        draw();
        body.querySelector('#kim-zoom').focus({preventScroll:true});
      };
    }
  }
  function changePage(page,focus) {
    pdfPage = page;
    draw();
    (body.querySelector(focus)||body.querySelector('#kim-page')).focus({preventScroll:true});
  }
  draw();
}
function tour(){
 const original={mode,stage,learningView,scroll:window.scrollY};
 const step=(mode,title,text,target,view='map')=>({mode,title,text,target,view});
 const items=[
  step('overview','Обзор · материалы задания','Откройте официальный КИМ и приложения к двум модулям. Критерии и баллы приведены ниже на странице.','#materials-open'),
  step('learn','Обучение · выберите стек','Выберите PHP с MySQL либо Flask с MySQL или PostgreSQL. Шаги и примеры меняются вместе с маршрутом.','#stack'),
  step('learn','Выберите этап маршрута','Начните с документов. Нажмите на этап, прочитайте его описание и откройте задание. Цветная отметка показывает завершённые этапы.','.map-node[aria-pressed="true"]'),
  step('learn','Прочитайте условие и откройте файлы','В этой вкладке находится полный текст задания из КИМ. Приложения можно просмотреть и скачать перед переходом к шагам.','.lesson-tabs [aria-current="page"]','brief'),
  step('learn','Выполните шаги и сохраните файлы','Здесь можно выбрать любой шаг этапа. В модуле 1 шаг «Сверьте свою ER-диаграмму» открывает интерактивную схему. Последний шаг каждого этапа перечисляет файлы для сохранения.','#lesson-steps','steps'),
  step('learn','Откройте справку','На каждом этапе есть своё объяснение, пример и подсказки на случай ошибки. При возврате к шагам откроется тот же шаг.','#lesson-help-title','help'),
  step('training','Тренировка · откройте образец КИМ','Прочитайте условие портала «Корочки.есть» и скачайте приложения.','#training-sample'),
  step('training','Управляйте временем тренировки','Верхний таймер показывает время на всю тренировку, нижний — на выбранное задание. «Пауза» останавливает оба отсчёта.','.training-timer-top'),
  step('training','Выполните и отметьте задание','Выберите один из двух модулей, прочитайте условие и при необходимости откройте подсказку. Отметьте пункты самопроверки и поставьте «Задание выполнено».','.stage-nav [aria-current="step"]'),
  step('mock','Пробный экзамен · выберите вариант','Доступны опубликованный образец и 30 авторских вариантов с двумя модулями каждый.','.mock-variant-bar'),
  step('mock','Откройте условия и материалы','Выберите модуль, чтобы прочитать условие и открыть его файлы. Комплект варианта можно скачать над заданиями.','.practice-condition'),
  step('mock','Запустите таймер экзамена','Нажмите «Начать», когда готовы. Отсчёт идёт непрерывно, даже если закрыть страницу.','.training-timer-top'),
  step('mock','Выполните задания и проверьте себя','Выберите задание в списке. Откройте его файлы под условием и отметьте выполненные пункты самопроверки.','.stage-nav [data-task]'),
  step('examples','Примеры · выберите стек и скачайте материалы','Выберите PHP или Flask. Архив, схема базы и фрагменты кода откроются для выбранного стека.','.example-stacks'),
  step('examples','Посмотрите исходный код','Нажмите название нужного файла. В окне можно прочитать и скопировать весь код. Сохраняйте исходные имена и пути файлов.','#example-file'),
  step('teacher','Преподавателю · подготовьте занятие','Заполните данные преподавателя и откройте презентацию. Разбор показан на Flask с MySQL или MariaDB.','#deck-open')
 ];
 let i=0;
 const d=modal('Тур по сайту');
 d.classList.add('tour-dialog');const card=document.createElement('section');card.className='tour-card';while(d.firstChild)card.append(d.firstChild);d.append(card);
 const spot=document.createElement('div');spot.className='tour-spotlight';spot.setAttribute('aria-hidden','true');d.prepend(spot);const body=d.querySelector('.modal-body');
 function position(){
  const target=spot.dataset.target&&root.querySelector(spot.dataset.target);
  if(!target)return;
  const r=target.getBoundingClientRect(),pad=8,gap=14,w=innerWidth,h=innerHeight;
  const top=Math.max(pad,r.top-5),left=Math.max(pad,r.left-5);
  const right=Math.min(w-pad,r.right+5),bottom=Math.min(h-pad,r.bottom+5);
  Object.assign(spot.style,{top:top+'px',left:left+'px',width:Math.max(0,right-left)+'px',height:Math.max(0,bottom-top)+'px'});

  const width=card.offsetWidth,height=Math.min(card.scrollHeight+2,h-2*pad);
  const below=h-pad-bottom-gap,above=top-gap-pad;
  let x=Math.min(left,w-pad-width),y,maxHeight=h-2*pad;
  if(below>=height)y=bottom+gap;
  else if(above>=height)y=top-gap-height;
  else if(w-pad-right-gap>=width||left-gap-pad>=width){
   x=w-pad-right-gap>=width?right+gap:left-gap-width;
   y=Math.min(top,h-pad-height);
  }else if(below>=above){
   y=bottom+gap;
   maxHeight=below;
  }else{
   y=pad;
   maxHeight=above;
  }
  Object.assign(card.style,{top:Math.max(pad,y)+'px',left:Math.max(pad,x)+'px',maxHeight:Math.max(0,maxHeight)+'px'});
 }
 function draw(){
  const x=items[i];
  mode=x.mode;
  stage=x.mode==='learn'&&x.view!=='map'?'M1':original.stage;
  learningView=x.view;
  render();

  const pausedTarget=x.mode==='training'&&x.target.startsWith('.stage-nav')&&root.querySelector('#pause-title');
  const target=pausedTarget||root.querySelector(x.target);
  spot.dataset.target=pausedTarget?'#pause-title':x.target;
  const description=pausedTarget
    ? 'После продолжения откроются список заданий, условия и подсказки. Отмечайте пункты самопроверки и завершённые задания по мере работы.'
    : x.text;
  body.innerHTML=`<p class="section-code">${i+1} / ${items.length}</p><h3>${E(x.title)}</h3><p>${E(description)}</p><div class="button-row">${btn('← Назад',`id="tour-prev" ${i===0?'disabled':''}`)}${btn(i===items.length-1?'Готово':'Далее →','id="tour-next"',true)}</div>`;
  target?.scrollIntoView({block:'center',behavior:'instant'});
  position();
  body.querySelector('#tour-prev').onclick=()=>{i--;draw();};
  const next=body.querySelector('#tour-next');
  next.onclick=()=>{if(i===items.length-1)d.close();else{i++;draw();}};
  next.focus({preventScroll:true});
 }
 window.addEventListener('resize',position);
 document.addEventListener('scroll',position,true);
 d.addEventListener('close',()=>{
  window.removeEventListener('resize',position);
  document.removeEventListener('scroll',position,true);
  mode=original.mode;
  stage=original.stage;
  learningView=original.learningView;
  render();
  window.scrollTo(0,original.scroll);
  document.getElementById('site-tour')?.focus({preventScroll:true});
 });
 draw();
}

function bindImages(host){host.querySelectorAll('[data-image]').forEach(e=>e.onclick=()=>{const d=modal('Скриншот шага');d.querySelector('.modal-body').innerHTML=`<img src="${E(e.dataset.image)}" alt="Увеличенный скриншот" style="max-width:100%">`;});}
function tick(){
 const el=document.getElementById('clock');
 if(!el)return;
 const t=timer(),v=C.timerView(t);
 if(v.expired&&t.status==='running'){
   if(mode==='training')signalTimer();
   set('timer:'+key(),C.transition(t,'finish'));render();return;
 }
 el.textContent=C.format(v.left);
 document.getElementById('timer-progress').value=v.progress;
 const status=t.status==='finished'?(v.expired?'Время истекло':'Завершено'):({idle:'Готов к началу',running:'Идёт отсчёт',paused:'На паузе'})[t.status];
 const statusNode=document.getElementById('timer-status');
 if(statusNode.textContent!==status)statusNode.textContent=status;
 if(mode==='training'){
   const clock=taskClock(), left=D.tasks[task].minutes*60000-taskSpent(clock,Math.min(v.used,t.durationMs));
   document.getElementById('task-clock').textContent=left<=0?'Время вышло':C.format(left);
   if(left<=0&&t.status==='running'&&!clock.alerted[task]){
     clock.alerted[task]=true;
     set('task-clock:'+key(),clock);
     signalTimer();
   }
 }
}
function bind(){root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
 navigate({mode:button.dataset.mode,view:button.dataset.lessonView});
});root.querySelectorAll('[data-map-stage]').forEach(e=>e.onclick=()=>{
 if(stage===e.dataset.mapStage)return;
 stage=e.dataset.mapStage;
 render();
 root.querySelector('[data-map-stage="'+stage+'"]')?.focus({preventScroll:true});
});root.querySelectorAll('[data-stage]').forEach(button=>button.onclick=()=>{
 const id=button.dataset.stage, inSidebar=button.classList.contains('stage-nav-node');
 if(inSidebar&&id===stage)return;
 const view=inSidebar?get(lessonViewKey(id)):button.dataset.lessonView;
 navigate({stage:id,view:isLessonView(view)?view:'brief'});
 if(inSidebar)root.querySelector('.stage-nav [aria-current="step"]')?.focus({preventScroll:true});
});root.querySelectorAll('[data-step]').forEach(e=>e.onclick=event=>goToStep(Number(e.dataset.step),event.detail>0));root.querySelectorAll('[data-code]').forEach(e=>e.onclick=()=>fileModal(e.dataset.code));root.querySelectorAll('[data-task]').forEach(e=>e.onclick=()=>selectPracticeTask(Number(e.dataset.task)));root.querySelectorAll('[data-help]').forEach(e=>e.onclick=()=>{stage=e.dataset.help;const k='timer:'+key();set(k,C.transition(timer(),'assisted'));navigate({mode:'learn',stage,view:'steps'});});root.querySelectorAll('[data-check]').forEach(e=>e.onchange=()=>{
 set('check:'+key()+':'+e.dataset.check,e.checked);
 const count=document.getElementById('training-check-count');
 if(count){
   const items=[...root.querySelectorAll('.training-checklist [data-check]')];
   count.textContent=items.filter(input=>input.checked).length+' из '+items.length;
 }
});root.querySelectorAll('[data-timer]').forEach(e=>e.onclick=()=>{if(e.dataset.timer==='reset'){
 if(mode!=='training'||timer().status==='finished'||window.confirm('Сбросить таймеры и отметки текущей тренировки?'))resetAttempt();
 return;
}if(e.dataset.timer==='start'&&mode==='training')enableTimerSound();set('timer:'+key(),C.transition(timer(),e.dataset.timer));render();document.querySelector('.pause-screen')?.focus();});const on=(id,fn,event='onclick')=>{const el=document.getElementById(id);if(el)el[event]=fn;};root.querySelectorAll('[data-learning-stack]').forEach(button=>button.onclick=()=>{
 const nextStack = button.dataset.learningStack;
 if(nextStack===stack)return;
 navigate({stack:nextStack});
 root.querySelector(`[data-learning-stack="${nextStack}"]`).focus({preventScroll:true});
});on('timer-sound',e=>{set('timer-sound',e.target.checked);if(e.target.checked){enableTimerSound();audioContext?.resume().then(signalTimer).catch(()=>{});}},'onchange');on('task-complete',e=>{
 set('task-done:'+key()+':'+task,e.target.checked);
 render();
 document.getElementById('task-complete')?.focus({preventScroll:true});
},'onchange');
bindLessonDocuments(root);
bindHelpTopics();
root.querySelectorAll('[data-copy-lesson-code]').forEach(button=>{
 bindCodeCopy(button,button.closest('.lesson-code-block').querySelector('pre'));
});
root.querySelectorAll('[data-example-stack]').forEach(button=>button.onclick=()=>{
 const nextStack = button.dataset.exampleStack;
 if (nextStack===selectedExampleStack()) return;
 navigate({exampleStack:nextStack});
 root.querySelector(`[data-example-stack="${nextStack}"]`).focus({preventScroll:true});
});
on('example-launch',openExampleInstructions);
root.querySelectorAll('[data-example-file]').forEach(button=>button.onclick=()=>{
 const file = button.dataset.exampleFile;
 if(file.endsWith('/Порядок работы.md')) openExampleInstructions();
 else fileModal(file,selectedExampleStack());
});
on('training-sample',showTrainingSample);
on('mock-variant',chooseMockVariant);
on('mock-data',showMockData);
on('site-tour',tour);
on('theme',()=>{dark=!dark;set('dark',dark);render();document.getElementById('theme')?.focus({preventScroll:true});});on('materials-open',()=>materials());on('lesson-steps',showLessonSteps);on('start-lesson',()=>openLessonView('steps'));root.querySelectorAll('[data-lesson-tab]').forEach(button=>button.onclick=()=>openLessonView(button.dataset.lessonTab));on('done',e=>{set('done:'+stack+':'+stage,e.target.checked);render();document.getElementById('done')?.focus({preventScroll:true});},'onchange');bindImages(root);
 const workspace=document.getElementById('er-workspace');
 if(workspace){
   const workspaceStack=stack;
   ExamErGuide.mount(workspace,{stack:workspaceStack,get:k=>get(workspaceStack+':'+k),set:(k,v)=>set(workspaceStack+':'+k,v)});
 }
}
function pageUrl(pageMode) {
 const examples = pageMode==='examples' ? '&exampleStack='+selectedExampleStack() : '';
 return '?section=work&mode='+pageMode+'&module='+stage+'&stack='+stack+'&view='+learningView+examples+(pageMode==='mock'?'&variant='+variantId:'');
}
function render({preserveScroll=true}={}){const previousScroll=window.scrollY;task=Math.min(D.tasks.length-1,Math.max(0,get('task:'+key(),0)));document.body.classList.toggle('dark',dark);if(!document.querySelector('.tour-dialog[open]')){set('mode',mode);set('stage',stage);
  if(mode==='learn'&&isLessonView(learningView)){
   set(stageProgressKey(),stage);
   set(lessonViewKey(stage),learningView);
  }
  history.replaceState(null,'',pageUrl(mode)+(mode==='overview'&&(p.get('mode')==='criteria'||location.hash==='#criteria')?'#criteria':''));}root.innerHTML=`<div class="shell"><header class="top"><a class="brand" href="${pageUrl('overview')}"><span class="brand-emblem">ДЭ</span><span><strong>09.02.07 · Информационные системы и программирование</strong><small>${E(D.official.title)} · ${D.official.year}</small></span></a>${siteTools()}</header>${siteNavigation()}<main id="main">${storageOK?'':'<p class="notice">Браузер не сможет сохранить прогресс после закрытия страницы.</p>'}${mode==='overview'?overview():mode==='learn'?(learningView==='map'?learningMap():learn()):['training','mock'].includes(mode)?practice():mode==='examples'?examples():teacher()}</main></div>`;bind();tick();if(preserveScroll)window.scrollTo(0,previousScroll);}
function openLessonView(view) {
 if(view===learningView)return;
 if(view==='steps')set(stepKey(),stepIndex());
 navigate({view});
 if(view==='steps'&&current().steps[stepIndex()]?.erWorkspace)focusLessonHeading();
 else root.querySelector('[data-lesson-tab="'+view+'"]')?.focus({preventScroll:true});
}
function navigate(next) {
 const previous = location.href;
 if (next.mode) mode = next.mode;
 if (next.stack) {
   stack=next.stack;
   set('stack',stack);
   stage=openedStage();
 }
 if (next.mode==='learn'&&next.view==='map') stage=openedStage();
 if (next.stage) stage=next.stage;
 if (next.view) learningView=next.view;
 if (next.exampleStack) {
   exampleStack=next.exampleStack;
   set('example-stack',exampleStack);
 }
 render({preserveScroll:false});
 window.scrollTo(0,0);
 const target=location.href;
 if (target !== previous) {
   history.replaceState(null,'',previous);
   history.pushState(null,'',target);
 }
}
window.addEventListener('popstate',()=>{
 ExamErGuide.closeExpanded();
 const q=new URLSearchParams(location.search);
 mode=modes.some(([id])=>id===q.get('mode'))?q.get('mode'):'overview';
 stack=D.stages[q.get('stack')]?q.get('stack'):'mysql';
 if (mode==='examples') exampleStack=exampleStackFrom(q);
 if (mode==='mock') {variantId=validVariant(q.get('variant'));}
 stage=S().some(s=>s.id===q.get('module'))?q.get('module'):'documents';
 learningView=isLessonView(q.get('view'))?q.get('view'):'map';
 render();
});
window.addEventListener('keydown',event=>{
 if (mode!=='learn'||learningView!=='steps'||event.defaultPrevented||event.isComposing||event.repeat
     ||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey) return;
 if (event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return;
 if (document.querySelector('dialog[open]')||event.target.closest?.('button:not([data-step-direction]), a, input, textarea, select, [contenteditable], pre, #er-workspace')) return;
 const next = stepIndex()+(event.key==='ArrowLeft'?-1:1);
 if (next<0||next>current().steps.length) return;
 event.preventDefault();
 goToStep(next);
});
render();
if(location.hash==='#criteria')document.getElementById('criteria')?.scrollIntoView();
setInterval(tick,1000);
})();
