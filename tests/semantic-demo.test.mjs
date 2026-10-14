import test from 'node:test';
import assert from 'node:assert/strict';
import {answer, chooseTopics, needsVerifiedGuidance, source} from '../public/chat/semantic-demo.mjs';

test('verified guidance handles high-risk hiring actions without loading the browser model', async () => {
  const progress = [];
  const age = await answer('65歳でも応募できますか？', [], event => progress.push(event));
  assert.equal(age.mode, 'verified-guidance');
  assert.equal(age.topic, 'age');
  assert.match(age.answer, /採用担当/);
  assert.deepEqual(progress, []);

  const application = needsVerifiedGuidance('職場見学を予約したいです');
  assert.equal(application.topic, 'apply');
  assert.match(application.answer, /予約確定は行っていません/);

  const privacy = needsVerifiedGuidance('ここに電話番号を入力してもいいですか');
  assert.equal(privacy.topic, 'privacy');
  assert.match(privacy.answer, /個人情報/);
});

test('semantic topic selection returns close multi-topic matches and rejects weak matches', () => {
  assert.deepEqual(
    chooseTopics([{id:'salary',score:.67},{id:'holidays',score:.62},{id:'job',score:.43}]).map(item => item.id),
    ['salary','holidays'],
  );
  assert.deepEqual(chooseTopics([{id:'job',score:.41}]), []);
  assert.deepEqual(chooseTopics([{id:'job',score:.59},{id:'license',score:.45}]).map(item => item.id), ['job']);
  assert.equal(source.checked, '2026-10-08');
});
