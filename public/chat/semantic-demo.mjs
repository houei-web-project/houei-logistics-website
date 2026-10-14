const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const MODEL_REVISION = '2c4055b12046f11709e9df2c122e59ffbdc2f900';
const UNKNOWN_THRESHOLD = 0.42;

export const source = {
  title: '豊栄物流の採用情報',
  url: 'https://houei-butsuryu.co.jp/recruit.html',
  checked: '2026-10-08',
};

export const model = {
  library: 'Transformers.js',
  libraryVersion: '3.8.1',
  id: MODEL_ID,
  revision: MODEL_REVISION,
};

const topics = [
  {
    id: 'experience',
    label: '未経験・研修',
    examples: ['未経験でも大丈夫ですか', 'トラック運転手は初めてです', '先輩の同乗や研修はありますか', '仕事に慣れるまで教えてもらえますか'],
    answer: '未経験の方も歓迎されています。先輩社員が同乗し、運転や搬入の方法を指導する体制が紹介されています。初めての大型車の仕事で気になる点も、採用担当へ相談できます。',
  },
  {
    id: 'license',
    label: '免許取得・資格支援',
    examples: ['大型免許がなくても応募できますか', '免許取得支援はありますか', 'フォークリフトの資格支援を知りたい', '普通免許だけで相談できますか'],
    answer: '大型免許がない方も、会社負担で免許を取得できる制度が掲載されています。フォークリフト資格の取得支援もあります。支援を受ける条件や、現在お持ちの免許で応募できるかは、採用担当への確認が必要です。',
  },
  {
    id: 'salary',
    label: '給与・待遇',
    examples: ['給与はいくらですか', '月給や年収を知りたい', '賞与や手当はありますか', '福利厚生や待遇について教えてください'],
    answer: '掲載されている正社員・大型ドライバーの月給は28万〜32万円です。賞与年2回、交通費規定支給、各種手当、社会保険完備などの記載があります。給与の内訳・手取り・現在の募集条件は、採用担当にご確認ください。',
  },
  {
    id: 'holidays',
    label: '休日・休暇',
    examples: ['休日はいつですか', '土日は休めますか', '休暇や有給はありますか', '年末年始やお盆の休みを知りたい'],
    answer: '募集要項の休日は「土曜（隔週）・日曜・祝日・その他」です。年末年始・お盆・GW・有休についても記載があります。毎週土日休みとは限らないため、具体的な勤務カレンダーは採用担当にご確認ください。',
  },
  {
    id: 'hours',
    label: '勤務時間・残業',
    examples: ['勤務時間を知りたい', '残業は多いですか', '毎日家に帰れますか', '夜勤や早朝の仕事はありますか'],
    answer: '地場と長距離の輸送があり、拘束時間の短縮に取り組んでいると紹介されています。具体的な勤務時間・残業・夜勤・帰宅頻度は公開情報では分かりません。ご希望の働き方を採用担当に相談するのがおすすめです。',
  },
  {
    id: 'job',
    label: '仕事内容',
    examples: ['どんな仕事ですか', '何を運びますか', '配送エリアやルートを知りたい', '積み込み作業はありますか'],
    answer: '大型ドライバーとして、地場や長距離の輸送配送を行う仕事です。扱う荷物は建築資材・段ボール・原料・機械物など。積み込みは主にパレット物をフォークリフトで行うと掲載されています。担当する車両やルートは採用担当にご確認ください。',
  },
  {
    id: 'location',
    label: '勤務地',
    examples: ['勤務地はどこですか', '会社の住所を知りたい', '亀山市のどのあたりですか', '通勤場所を教えてください'],
    answer: '募集要項の勤務地は三重県亀山市野村町です。会社所在地は「三重県亀山市野村町1789番地の90」です。通勤について気になることがあれば、採用担当へご相談ください。',
  },
  {
    id: 'visit',
    label: '職場見学',
    examples: ['職場見学できますか', '雰囲気を見てから応募したい', '会社を見に行けますか', 'まず話だけ聞くことはできますか'],
    answer: '職場見学を受け付けていると紹介されています。まずは雰囲気を見てみたい方も、公式お問い合わせで「採用について」を選んで相談できます。見学日時は担当者との調整が必要です。このチャットでは予約は確定しません。',
  },
  {
    id: 'apply',
    label: '応募方法',
    examples: ['応募方法を教えてください', '面接までの流れを知りたい', '採用の連絡先はどこですか', '電話番号や問い合わせ先を教えてください'],
    answer: '採用の流れは「応募 → 面接 → 内定 → 入社」です。下の「見学・応募を相談する」から公式お問い合わせへ進み、「採用について」を選んでご連絡ください。お電話は0595-82-3011、窓口は9:00〜17:00（土日祝・GW・夏季・年末年始を除く）です。',
  },
  {
    id: 'women',
    label: '女性ドライバー',
    examples: ['女性でも働けますか', '女性ドライバーは歓迎されていますか', '性別に関係なく応募できますか'],
    answer: '採用ページには、女性ドライバーも歓迎すると記載されています。具体的な設備や配属については公開情報だけでは分からないため、採用担当にご確認ください。',
  },
  {
    id: 'greeting',
    label: '挨拶',
    examples: ['こんにちは', '相談したいです', '採用について聞きたいです', 'はじめまして'],
    answer: 'こんにちは。豊栄物流の採用についてご案内します。未経験からのスタート、免許取得支援、給与・休日、職場見学など、気になることをお聞きください。',
  },
  {
    id: 'thanks',
    label: 'お礼',
    examples: ['ありがとう', '助かりました', 'わかりました', '参考になりました'],
    answer: 'ご相談ありがとうございます。ほかに気になることがあれば、お気軽にお聞きください。職場見学や応募をご希望の場合は「見学・応募を相談する」から公式窓口へ進めます。',
  },
];

let extractorPromise = null;
let indexPromise = null;

export function needsVerifiedGuidance(question) {
  const value = normalizeText(question);
  if (!value) {
    return {topic: 'unknown', answer: unknownAnswer()};
  }
  if (/年齢|\d{2}\s*[歳才]|シニア|定年/.test(value)) {
    return {
      topic: 'age',
      answer: '年齢条件は、掲載情報に「59歳迄」と「年齢不問」の両方の記載があるため、この場では応募可否をお答えできません。現在の募集条件を採用担当へご確認ください。公式のお問い合わせで「採用について」を選ぶと相談できます。',
    };
  }
  if (/(?:予約|応募|申込|申し込|送信).*(?:して|お願い|完了|確定)|(?:予約|応募)(?:する|します|したい)/.test(value)) {
    return {
      topic: 'apply',
      answer: '応募や職場見学をご希望ですね。このチャットでは申し込みの送信・予約確定は行っていません。下の「見学・応募を相談する」から公式お問い合わせページへ進み、「採用について」を選んでご連絡ください。見学日時は担当者との相談で決まります。',
    };
  }
  if (/履歴書|住所|氏名|電話番号|個人情報|免許証|写真|送っていい|ここに入力/.test(value)) {
    return {
      topic: 'privacy',
      answer: 'この公開デモには氏名・電話番号・住所・履歴書などの個人情報を入力しないでください。応募や資料送付が必要な場合は、公式お問い合わせページから採用担当へご連絡ください。',
    };
  }
  return null;
}

export async function answer(question, history = [], onProgress = () => {}) {
  const guarded = needsVerifiedGuidance(question);
  if (guarded) {
    return {
      answer: guarded.answer,
      topic: guarded.topic,
      topics: [guarded.topic],
      score: 1,
      source,
      mode: 'verified-guidance',
      model,
    };
  }

  const context = buildContext(question, history);
  const extractor = await loadExtractor(onProgress);
  const index = await ensureIndex(extractor, onProgress);
  onProgress({stage: 'inferencing', message: '質問の意味を照合しています…'});
  const [queryVector] = await embed(extractor, [context]);
  const ranked = rankTopics(queryVector, index);
  const selected = chooseTopics(ranked);
  const selectedTopics = selected.length ? selected : [{id: 'unknown', score: ranked[0]?.score ?? 0}];
  const selectedAnswers = selected.length
    ? selected.map(item => topics.find(topic => topic.id === item.id).answer).join('\n\n')
    : unknownAnswer();
  onProgress({stage: 'ready', message: '回答を表示します。'});
  return {
    answer: selectedAnswers,
    topic: selectedTopics[0].id,
    topics: selectedTopics.map(item => item.id),
    score: Number((selectedTopics[0].score ?? 0).toFixed(3)),
    source,
    mode: 'browser-ai',
    model,
  };
}

export function chooseTopics(ranked) {
  if (!ranked.length || ranked[0].score < UNKNOWN_THRESHOLD) return [];
  const [first, ...rest] = ranked;
  const selected = [first];
  for (const candidate of rest) {
    if (selected.length >= 2) break;
    if (candidate.score >= Math.max(0.48, first.score - 0.07)) selected.push(candidate);
  }
  return selected;
}

async function loadExtractor(onProgress) {
  onProgress({stage: 'loading', message: 'ブラウザ内のAIモデルを準備しています…'});
  if (!extractorPromise) {
    extractorPromise = import(TRANSFORMERS_URL)
      .then(async ({env, pipeline}) => {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        return pipeline('feature-extraction', MODEL_ID, {
          revision: MODEL_REVISION,
          dtype: 'q8',
          progress_callback: event => onProgress(normalizeProgress(event)),
        });
      });
  }
  try {
    return await extractorPromise;
  } catch (error) {
    extractorPromise = null;
    throw new Error(`ブラウザAIモデルを読み込めませんでした。通信環境をご確認のうえ、もう一度お試しください。(${error.message})`);
  }
}

async function ensureIndex(extractor, onProgress) {
  if (!indexPromise) {
    indexPromise = (async () => {
      onProgress({stage: 'indexing', message: '採用情報の照合準備をしています…'});
      const documents = topics.flatMap(topic => topic.examples.map(example => ({
        id: topic.id,
        text: `${topic.label}。${example}`,
      })));
      const vectors = await embed(extractor, documents.map(document => document.text));
      return documents.map((document, index) => ({...document, vector: vectors[index]}));
    })();
  }
  try {
    return await indexPromise;
  } catch (error) {
    indexPromise = null;
    throw error;
  }
}

async function embed(extractor, texts) {
  const output = await extractor(texts, {pooling: 'mean', normalize: true});
  const width = output.dims?.at(-1) ?? Math.floor(output.data.length / texts.length);
  return texts.map((_, index) => Float32Array.from(output.data.slice(index * width, (index + 1) * width)));
}

function rankTopics(queryVector, index) {
  const scores = new Map();
  for (const candidate of index) {
    const current = scores.get(candidate.id) ?? 0;
    scores.set(candidate.id, Math.max(current, dot(queryVector, candidate.vector)));
  }
  return [...scores.entries()]
    .map(([id, score]) => ({id, score}))
    .sort((a, b) => b.score - a.score);
}

function dot(a, b) {
  let total = 0;
  for (let index = 0; index < a.length; index += 1) total += a[index] * b[index];
  return total;
}

function buildContext(question, history) {
  const recent = Array.isArray(history)
    ? history.filter(message => message?.role === 'user').slice(-2).map(message => message.content).filter(Boolean)
    : [];
  return [...recent, question].join('\n');
}

function normalizeProgress(event = {}) {
  const stage = event.status === 'progress' ? 'download' : 'loading';
  const progress = Number.isFinite(event.progress) ? Math.max(0, Math.min(100, event.progress)) : undefined;
  const file = event.file || event.name || '';
  if (stage === 'download') {
    const percent = progress === undefined ? '' : `（${Math.round(progress)}%）`;
    return {stage, progress, file, message: `AIモデルを読み込んでいます${percent}`};
  }
  if (event.status === 'ready') return {stage: 'ready', file, message: 'AIモデルの準備ができました。'};
  return {stage, file, message: 'AIモデルを準備しています…'};
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function unknownAnswer() {
  return 'その点については、公開されている採用情報では確認できません。正確な条件は採用担当へご相談ください。こちらでは、仕事内容・免許取得支援・給与・休日・職場見学などをご案内できます。';
}
