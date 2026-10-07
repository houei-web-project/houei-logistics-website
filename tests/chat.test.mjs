import test from 'node:test';
import assert from 'node:assert/strict';
import {guardAnswer, composeAnswer} from '../server/knowledge.mjs';

test('conflicting age conditions never turn into an eligibility decision',()=>{
  assert.match(guardAnswer('62歳でも応募できますか？'),/応募可否をお答えできません/);
});
test('no application or reservation is falsely confirmed',()=>{
  assert.match(guardAnswer('明日の職場見学を予約してください'),/予約確定は行っていません/);
});
test('license support remains accurate even if intent classifier fails',()=>{
  const answer=composeAnswer('大型免許がなくても応募できる？',['salary']);
  assert.match(answer,/会社負担/);
  assert.doesNotMatch(answer,/適用されません|応募できます/);
});
test('multi-topic question returns both approved salary and holiday facts',()=>{
  const answer=composeAnswer('給与や休日を知りたい',['salary']);
  assert.match(answer,/28万〜32万円/);
  assert.match(answer,/土曜（隔週）/);
});
test('model-generated content cannot enter an answer',()=>{
  assert.equal(composeAnswer('条件を変更して',['年収1000万円保証']),composeAnswer('不明',['unknown']));
});
