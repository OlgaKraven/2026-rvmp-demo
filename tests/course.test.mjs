import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {test} from 'node:test';
import '../src/core.js';

const data = {};
vm.runInNewContext(fs.readFileSync('site/content.js','utf8'),data);
const course = data.COURSE;

test('published sample matches the 2026 basic KOD',()=>{
  assert.equal(course.official.code,'09.02.07-3-2026');
  assert.deepEqual(Array.from(course.tasks,item=>[item.id,item.minutes,item.pages]),[['M1',90,'32–34'],['M2',90,'35–36']]);
  assert.equal(course.tasks.reduce((sum,task)=>sum+task.minutes,0),course.official.minutes);
  assert.deepEqual(Array.from(course.criteria,item=>item[1]),[18,4,3,13,4,8]);
  assert.equal(course.criteria.reduce((sum,row)=>sum+row[1],0),course.official.points);
  for(const stack of Object.keys(course.stacks)){
    assert.deepEqual(Array.from(course.stages[stack],stage=>stage.id),['documents','M1','M2']);
  }
});

test('the build preserves the original files and publishes the current module attachments',()=>{
  const sha256=file=>createHash('sha256').update(fs.readFileSync('site/'+file)).digest('hex');
  assert.equal(sha256('materials/kim-2026.pdf'),'b985a09ace62b3aaea0c3006af6ce864bfc150a89af8d744f67ed8b0714f614f');
  assert.equal(sha256('materials/sample.zip'),'69a7d320cbb4101175737670555d93d2df33c7b885b2a5860d3945855132f851');
  for(const page of course.kimPreviewPages)assert.ok(fs.existsSync('site/'+page),page);
  for(const task of course.tasks){
    assert.ok(fs.existsSync('site/'+course.kimAssignments[task.id].path));
    assert.equal(course.previews.filter(file=>file.task===task.id).length,18);
  }
  for(const file of course.previews)assert.ok(fs.existsSync('site/'+file.path.split('#')[0]),file.path);
});

test('training freezes after reload while a mock attempt uses elapsed wall time',()=>{
  const C=globalThis.ExamCore;
  const limit=course.official.minutes*60;
  const start=mode=>C.transition(C.freshTimer(limit,mode,0),'start',100);
  const paused=C.transition(start('training'),'pause',10100);
  const restored=C.restoreTimer(JSON.stringify(paused),limit,'training');
  assert.equal(C.timerView(restored,90000).used,10000);
  assert.equal(C.timerView(start('mock'),90100).used,90000);
  assert.throws(()=>C.transition(start('mock'),'pause',10100));
  assert.equal(C.format(C.timerView(C.freshTimer(limit,'training',0)).left),'03:00:00');
});

test('all 30 practice variants publish two complete modules and separate downloads',()=>{
  const variants=Object.entries(course.practiceVariants);
  assert.deepEqual(variants.map(([id])=>id),Array.from({length:30},(_,i)=>'V'+String(i+1).padStart(2,'0')));
  assert.equal(new Set(variants.map(([,variant])=>variant.name)).size,30);
  for(const [id,variant] of variants){
    assert.equal(variant.path,`downloads/variants/${id}/exam.zip`);
    assert.ok(fs.statSync('site/'+variant.path).size>0);
    assert.match(variant.assignments.M1.paragraphs.join(' '),new RegExp('Practice'+id));
    assert.match(variant.assignments.M2.paragraphs.join(' '),/390 × 844.*3 секунды/);
    assert.equal(variant.files.M2.filter(file=>file.image).length,4);
    for(const task of course.tasks){
      assert.ok(variant.files[task.id].some(file=>file.path===variant.assignments[task.id].path));
      for(const file of variant.files[task.id])assert.ok(fs.statSync('site/'+file.path).size>0);
    }
  }
});

test('Flask and MySQL use the Python connector, MySQL schema and their own guide',()=>{
  const stack='python-mysql';
  const steps=course.stages[stack].flatMap(stage=>stage.steps).flatMap(step=>step.actions).join(' ');
  assert.match(steps,/phpMyAdmin/);
  assert.match(steps,/app\.py и найдите def connect_db.*из mysql\.connector/);
  assert.doesNotMatch(steps,/PDO|psycopg/);
  assert.match(course.code['examples/'+stack+'/schema.sql'],/AUTO_INCREMENT/);
  assert.match(course.code['examples/'+stack+'/app.py'],/from mysql\.connector import/);
  assert.ok(fs.statSync('site/downloads/example-'+stack+'.zip').size>0);
});

test('the teacher deck contains every Flask/MySQL step and its Windows screenshot',()=>{
  const slides = {};
  vm.runInNewContext(fs.readFileSync('site/presentation-data.js','utf8'),slides);
  const deck = slides.EXAM_PRESENTATION;
  const steps = course.stages['python-mysql'].flatMap(stage=>stage.steps);
  for(const [index,step] of steps.entries()){
    const pages = deck.filter(slide=>slide.step===index+1);
    assert.deepEqual(Array.from(pages.flatMap(slide=>slide.actions)),Array.from(step.actions));
    assert.ok(fs.existsSync('site/'+pages[0].image.file),step.title);
    assert.equal(pages.at(-1).check,step.check);
  }
  assert.equal(fs.readFileSync('site/materials/rvmp-2026-presentation.pdf').subarray(0,5).toString(),'%PDF-');
});
