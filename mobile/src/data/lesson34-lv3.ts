/**
 * Lv.3 TOPIC TALK #101 The Present — 회차 콘텐츠 (가짜). 문장 · 순서는 프로토타입 LV3_101 그대로예요.
 * 맞는 API: 18 `/lessons/:id` (회차 콘텐츠 한 덩어리) · 21 `/lessons/:id/steps/:step`
 */
import type { LiveFix, Lv3Unit, SpeakItem } from '@/data/lessons34';

/** 현재진행형 → 현재형으로 되돌릴 때 (프로토타입 unIng) */
const unIng = (w: string) => {
  const b = w.replace(/ing$/i, '');
  if (/(.)\1$/.test(b) && !/(ll|ss|ff|zz)$/.test(b)) return b.slice(0, -1);
  return /^(tak|mak|hav|us|rid|driv|liv|com|giv|writ|lov|lik|hat|serv|mov|danc|smil|clos)$/i.test(b) ? b + 'e' : b;
};
const SUBJ: Record<string, string> = { "i'm": 'I', 'i am': 'I', "you're": 'you', 'you are': 'you', "we're": 'we', 'we are': 'we', "they're": 'they', 'they are': 'they', "he's": 'he', 'he is': 'he', "she's": 'she', 'she is': 'she' };
const BE = "(i'm|i am|you're|you are|we're|we are|they're|they are|he's|he is|she's|she is)";
const BASE: Record<string, string> = { lik: 'like', lov: 'love', believ: 'believe', hat: 'hate' };
const third = (subj: string) => (subj === 'he' || subj === 'she' ? 's' : '');

/** 대화 중 바로 짚어 주는 현재형 실수 [찾기, 고치기, 이유] (프로토타입 LV3_101.live — 실제 앱은 AI 교정) */
const LIVE: LiveFix[] = [
  [/\b(i'm|i am|you're|you are|we're|we are|they're|they are|he's|he is|she's|she is)\s+agree\b/i,
    (v: string) => v.replace(/\b(i'm|i am)\s+agree/i, 'I agree').replace(/\b(you|we|they)('re| are)\s+agree/i, '$1 agree').replace(/\b(he|she)('s| is)\s+agree/i, '$1 agrees'), 'agree는 동사라 be동사를 붙이지 않아요'],
  [new RegExp(`\\b${BE}\\s+(want|know|lik|lov|need|believ|understand|hat|prefer)ing\\b`, 'i'),
    (v: string) => v.replace(new RegExp(`\\b${BE}\\s+(want|know|lik|lov|need|believ|understand|hat|prefer)ing\\b`, 'i'), (_m: string, p: string, b: string) => { const subj = SUBJ[p.toLowerCase()]; return `${subj} ${BASE[b.toLowerCase()] ?? b}${third(subj)}`; }), 'know · like · want 같은 상태동사는 -ing를 안 써요'],
  [new RegExp(`\\b${BE}\\s+(usually|always|often|never)\\s+\\w+ing\\b`, 'i'),
    (v: string) => v.replace(new RegExp(`\\b${BE}\\s+(usually|always|often|never)\\s+(\\w+ing)\\b`, 'i'), (_m: string, p: string, adv: string, vb: string) => { const subj = SUBJ[p.toLowerCase()]; return `${subj} ${adv} ${unIng(vb)}${third(subj)}`; }), '늘 하는 습관은 현재형'],
  [/\bi\s+(work|study|learn|prepare|try)\s+(on\s+)?(\w+\s+){0,5}(these days|this week|this month|right now|lately)\b/i,
    (v: string) => v.replace(/\bi\s+(work|study|learn|prepare|try)\b/i, (_m: string, vb: string) => `I’m ${vb === 'try' ? 'trying' : vb === 'prepare' ? 'preparing' : vb + 'ing'}`), '요즘 · 이번 주처럼 잠깐 하는 일은 현재진행형'],
];

export const LV3_101: Lv3Unit = {
  title: 'Let’s talk about the present',
  daily: [
    { en: 'What is everyone crazy about right now that you just don’t understand?', ko: '요즘 다들 열광하는데 나만 이해가 안 되는 것은 무엇인가요?', kw: [0, 1],
      fq: [['Why do you think people love it so much?', '사람들이 왜 그렇게 좋아한다고 생각해요?'], ['Have you ever tried it yourself?', '직접 해 본 적 있어요?']],
      more: ['Is there anything you’re hooked on that others don’t get?', '반대로 나만 빠져 있는 건 있어요?'], tw: /crazy|popular|everyone|trend|understand|hooked|love|obsess|fan|why/i },
    { en: 'What part of your daily routine would you happily skip if you could?', ko: '할 수만 있다면 건너뛰고 싶은 일과는 무엇인가요?', kw: [2, 3],
      fq: [['How much time does it take every day?', '매일 시간이 얼마나 걸려요?'], ['What would you do with that extra time?', '그 시간이 생기면 뭘 하고 싶어요?']],
      more: ['Is there any part of your routine you actually enjoy?', '오히려 즐기는 일과도 있어요?'], tw: /routine|skip|morning|commute|work|every day|daily|wake|cook|clean/i },
    { en: 'What do you do to relax when life gets too busy?', ko: '일상이 너무 바쁠 때 쉬어 가기 위해 하는 것은 무엇인가요?', kw: [4, 5],
      fq: [['How often do you get to do that?', '얼마나 자주 그렇게 해요?'], ['Does it really help you recharge?', '정말 재충전이 돼요?']],
      more: ['What would your perfect lazy day look like?', '완벽하게 쉬는 하루는 어떤 모습이에요?'], tw: /relax|busy|rest|break|sleep|walk|music|recharge|calm|stress/i },
    { en: 'What is something you didn’t like before but enjoy these days?', ko: '예전엔 별로였지만 요즘 즐기게 된 것은 무엇인가요?', kw: [6, 7],
      fq: [['What changed your mind?', '뭐가 생각을 바꿨어요?'], ['Would you recommend it to a friend?', '친구에게도 추천할 거예요?']],
      more: ['Is there something you used to love but don’t anymore?', '반대로 예전엔 좋았는데 지금은 별로인 건요?'], tw: /before|used to|these days|now|enjoy|like|didn|change|grow/i },
    { en: 'What are you giving up right now to get what you want?', ko: '원하는 것을 얻기 위해 지금 포기하고 있는 것이 있나요?', kw: [8, 9],
      fq: [['Is it worth it so far?', '지금까지는 그럴 만한 가치가 있어요?'], ['When do you think you’ll reach your goal?', '언제쯤 목표에 닿을 것 같아요?']],
      more: ['What will you do first when you reach your goal?', '목표에 닿으면 제일 먼저 뭘 할 거예요?'], tw: /give up|giving up|save|goal|want|money|time|instead|trade|sacrifice/i },
    { en: 'What is normal now that will look strange in 20 years?', ko: '지금은 당연하지만 20년 후에는 이상해 보일 것은 무엇일까요?', kw: [10, 11],
      fq: [['Why do you think it will change?', '왜 바뀔 거라고 생각해요?'], ['Is that a good change or a bad one?', '좋은 변화일까요, 나쁜 변화일까요?']],
      more: ['What is something from 20 years ago that already looks strange?', '20년 전 것 중 벌써 이상해 보이는 건요?'], tw: /normal|strange|future|years|now|phone|people|change|norm|weird/i }
  ],
  keywords: [   // [표현, 뜻, 예문, 예문 뜻]
    ['hooked on', '~에 빠진', 'I got hooked on a Spanish drama last month, and now I watch two episodes every night.', '지난달 스페인 드라마에 빠져서, 지금은 매일 밤 두 편씩 봐요.'],
    ['can’t get enough of', '~을 못 끊다, 아무리 해도 질리지 않다', 'I can’t get enough of spicy tteokbokki, so I eat it at least three times a week.', '매운 떡볶이를 끊을 수가 없어서 일주일에 적어도 세 번은 먹어요.'],
    ['daily grind', '고된 일상', 'After a long week of the daily grind, I just want to lie on my couch all weekend.', '고된 일상을 보낸 긴 한 주가 끝나면 주말 내내 소파에 눕고만 싶어요.'],
    ['on autopilot', '기계적으로, 생각 없이', 'I take the same bus every morning, so I do my whole commute on autopilot.', '매일 아침 같은 버스를 타서 출근길 내내 기계적으로 움직여요.'],
    ['rat race', '치열한 경쟁', 'My cousin quit the rat race in Seoul and opened a small cafe by the beach on Jeju Island.', '사촌은 서울의 치열한 경쟁을 그만두고 제주 바닷가에 작은 카페를 열었어요.'],
    ['slow down', '쉬엄쉬엄하다, 속도를 늦추다', 'My doctor told me to slow down because I was working twelve hours a day.', '하루 12시간씩 일하고 있어서 의사가 쉬엄쉬엄하라고 했어요.'],
    ['grow on', '(점점) 좋아지다', 'I used to think hiking was boring, but it has really grown on me, and now I go every weekend.', '예전엔 등산이 지루했는데 점점 좋아져서 지금은 주말마다 가요.'],
    ['simple pleasures', '작은 행복', 'These days, I enjoy simple pleasures like a hot shower and a good night’s sleep.', '요즘은 뜨거운 샤워나 푹 자는 것 같은 작은 행복을 즐겨요.'],
    ['trade-off', '얻고 잃는 것, 맞바꿈', 'I took a job with a lower salary, but it’s a good trade-off because I get home by six.', '월급이 적은 일을 택했지만 6시면 집에 오니까 괜찮은 맞바꿈이에요.'],
    ['breathing room', '여유', 'I finally paid off my credit card, so now I have some breathing room in my monthly budget.', '드디어 카드값을 다 갚아서 한 달 예산에 여유가 좀 생겼어요.'],
    ['peer pressure', '또래 압박', 'Many students feel peer pressure to go to expensive cram schools because all their friends go.', '친구들이 다 다니니까 많은 학생이 비싼 학원에 가야 한다는 또래 압박을 느껴요.'],
    ['the norm', '당연한 일, 보통', 'Working late used to be the norm in Korea, but that is slowly changing these days.', '한국에선 야근이 당연한 일이었지만 요즘은 조금씩 바뀌고 있어요.']
  ],
  prev: [['reminisce', '추억하다, 옛일을 회상하다', 'My friends and I love to reminisce about our college days.', 'Old songs always make me reminisce about high school.'], ['rebellious', '반항적인', 'I was a bit rebellious as a teenager.', 'My little brother is going through a rebellious phase.'], ['curfew', '통금 시간', 'My parents gave me a 10 p.m. curfew in high school.', 'The dorm has a midnight curfew on weekdays.'], ['romanticize', '미화하다', 'People often romanticize life in the countryside.', 'It’s easy to romanticize the past when you miss it.']],
  topic: {
    title: 'Forgotten Name',
    follow: ['Have you ever forgotten someone’s name right after meeting them?', '누군가를 만나자마자 이름을 잊어버린 적이 있나요?'],
    lines: [
      ['On my first day at a new job, a friendly coworker introduced himself at lunch.', '새 직장 첫날, 친절한 동료가 점심시간에 자기소개를 했어요.'],
      ['We talked for an hour, but by the end of the day, I had completely forgotten his name.', '한 시간이나 이야기했는데, 그날이 끝날 무렵 그의 이름을 완전히 잊어버렸어요.'],
      ['I knew it started with an M.', 'M으로 시작한다는 건 알았어요.'],
      ['It was on the tip of my tongue, but it just wouldn’t come out.', '생각날 듯 말 듯했지만 도무지 떠오르지 않았어요.'],
      ['The next morning, he smiled and said, “Good morning!” and then my name.', '다음 날 아침, 그는 웃으며 “좋은 아침!” 하고 제 이름을 불렀어요.'],
      ['He always greeted me by name, which made me feel even worse.', '그는 늘 제 이름을 부르며 인사해서 저는 더 미안해졌어요.'],
      ['So I decided to play it cool.', '그래서 태연한 척하기로 했어요.'],
      ['Whenever I needed him, I just said “Hey!” or tapped him on the shoulder.', '그가 필요할 때마다 그냥 “저기요!” 하거나 어깨를 톡톡 쳤어요.'],
      ['I tried to sneak a peek at his ID card, but it was always flipped over.', '사원증을 몰래 보려 했지만 늘 뒤집혀 있었어요.'],
      ['I even searched the company chat for hours, but his profile name was just a cat emoji.', '회사 메신저를 몇 시간이나 뒤졌는데 프로필 이름이 고양이 이모지뿐이었어요.'],
      ['Weeks turned into months, and asking became more awkward every day.', '몇 주가 몇 달이 되었고, 묻기는 날마다 더 어색해졌어요.'],
      ['When my boss asked who helped me with my report, I had to dodge the question and just point at him.', '상사가 보고서를 누가 도와줬냐고 묻자, 질문을 피하고 그를 손가락으로 가리킬 수밖에 없었어요.'],
      ['Finally, I couldn’t take it anymore and decided to come clean.', '결국 더는 못 견디고 사실대로 털어놓기로 했어요.'],
      ['I walked to his desk and said, “I’m so sorry, but I forgot your name a long time ago.”', '그의 자리로 가서 “정말 미안한데, 이름을 오래전에 잊어버렸어요.”라고 했어요.'],
      ['He stared at me for a second and then started laughing.', '그는 잠깐 저를 쳐다보더니 웃기 시작했어요.'],
      ['“Thank goodness,” he said. “I forgot yours on the first day too. I’ve been reading it off your coffee mug.”', '“다행이다. 저도 첫날 당신 이름을 잊었어요. 그동안 커피 머그에 적힌 걸 보고 읽었어요.”'],
      ['I was so relieved that I almost cried.', '너무 안심돼서 울 뻔했어요.'],
      ['To save face, we told everyone we were laughing at a funny video.', '체면을 지키려고, 다들에게 웃긴 영상을 보고 웃는 거라고 했어요.'],
      ['Now we both wear name tags at lunch, just in case.', '이제 우리 둘 다 혹시 몰라 점심때 이름표를 달아요.']
    ],
    expr: [['on the tip of my tongue', '생각날 듯 말 듯하다'], ['play it cool', '태연한 척하다'], ['sneak a peek', '몰래 보다'], ['dodge', '피하다'], ['come clean', '사실대로 털어놓다'], ['save face', '체면을 지키다']],
    check: [
      ['How did the writer try to find out the coworker’s name?', '글쓴이는 동료 이름을 알아내려고 어떻게 했나요?', 'The writer tried to sneak a peek at his ID card and searched the company chat for hours.', ['The writer asked the manager to introduce him again.', 'The writer called him by a nickname until he said his name.']],
      ['How did the coworker know the writer’s name?', '동료는 글쓴이 이름을 어떻게 알았나요?', 'He read it off the writer’s coffee mug.', ['He checked the writer’s ID card at lunch.', 'A friend told him the writer’s name.']]
    ]
  },
  journal: { title: 'JOURNAL', q: 'What does your life look like these days?', ko: '요즘 내 일상은 어떤가요? 현재형 · 현재진행형으로 써 봐요',
    use: ['hooked on', 'daily grind', 'slow down', 'grow on', 'breathing room', 'the norm'],
    sample: 'These days, I’m working on a big project, so the daily grind feels heavy. I usually wake up at seven and do my commute on autopilot. Lately, yoga has really grown on me, and it helps me slow down.' },
  live: LIVE,
};

/** 스피킹 퀴즈: 키워드 예문 + 지문 표현 문장 (한국어 보고 영어로 · 프로토타입 LV3_101.sq) */
export const LV3_101_SQ: SpeakItem[] = [
  ...LV3_101.keywords.map(([w, , en, ko]) => ({ en, ko, hint: w })),
  { en: 'It was on the tip of my tongue, but it just wouldn’t come out.', ko: '생각날 듯 말 듯했지만 도무지 떠오르지 않았어요.', hint: 'on the tip of my tongue' },
  { en: 'So I decided to play it cool.', ko: '그래서 태연한 척하기로 했어요.', hint: 'play it cool' },
  { en: 'I tried to sneak a peek at his ID card.', ko: '그의 사원증을 몰래 보려고 했어요.', hint: 'sneak a peek' },
  { en: 'I had to dodge the question.', ko: '그 질문을 피해야 했어요.', hint: 'dodge' },
  { en: 'Finally, I decided to come clean.', ko: '결국 사실대로 털어놓기로 했어요.', hint: 'come clean' },
  { en: 'To save face, we told everyone we were laughing at a video.', ko: '체면을 지키려고 영상 보고 웃는 거라고 했어요.', hint: 'save face' }
];
