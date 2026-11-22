/**
 * Lv.1 · 1과 Cafe Complaint (교재 4교) — 가짜 데이터. 값은 프로토타입 LV1_01 · WC_RP · SC_SAY · SC_PH 그대로예요.
 * 맞는 API: 18 `/lessons/:id` (과 콘텐츠 한 덩어리). 실제 앱은 서버에서 받아요.
 */
import type { LessonData } from '@/data/lessons';

export const LV1_01: LessonData = {
  lv: 1,
  unit: 1,
  title: 'Cafe Complaint',
  ice: [
    { en: 'What did you eat or drink today?', ko: '오늘 무엇을 먹거나 마셨나요?', hint: 'I had an iced latte this morning.' },
    { en: 'Have you ever gotten the wrong order?', ko: '주문이 잘못 나온 적이 있나요?', hint: 'Yes. I ordered a hot latte, but I got an iced one.' },
  ],
  patterns: [
    {
      id: 'p1',
      p: "I'd like to + 동사",
      short: "I'd like to",
      m: '~하고 싶어요',
      re: "i'?d like to|i would like to",
      ex: [
        ["I'd like to order an iced latte.", '아이스 라테 한 잔을 주문하고 싶어요.'],
        ["I'd like to sit somewhere quiet.", '좀 조용한 곳에 앉고 싶어요.'],
        ["I'd like to have something light.", '가벼운 걸 먹고 싶어요.'],
        ["I'd like to ask a question.", '질문 하나 하고 싶어요.'],
        ["I'd like to try this on.", '이거 입어 보고 싶어요.'],
        ["I'd like to return this.", '이거 반품하고 싶어요.'],
      ],
    },
    {
      id: 'p2',
      p: 'Do you have + 명사?',
      short: 'Do you have',
      m: '~이/가 있나요?',
      re: 'do you have',
      ex: [
        ['Do you have this in black?', '이거 검은색 있나요?'],
        ['Do you have Wi-Fi?', '와이파이 있나요?'],
        ['Do you have a menu in English?', '영어로 된 메뉴판이 있나요?'],
        ['Do you have a charger?', '충전기 있나요?'],
        ['Do you have any seats by the window?', '창가 쪽 자리가 있나요?'],
      ],
    },
    {
      id: 'p3',
      p: "It doesn't + 동사 / It isn't + 보어",
      short: "It doesn't / isn't",
      m: '~하지 않아요 / ~이 아니에요',
      re: "it (doesn'?t|does not|isn'?t|is not|'s not)",
      ex: [
        ["It doesn't work.", '그거 작동하지 않아요.'],
        ["It doesn't fit me.", '사이즈가 저한테 맞지 않아요.'],
        ["It doesn't look like the photo.", '사진처럼 보이지 않아요.'],
        ["It isn't hot enough.", '충분히 뜨겁지 않아요.'],
        ["It's not iced.", '아이스가 아니에요.'],
      ],
    },
  ],
  dialogue: {
    title: 'Cafe Complaint',
    cast: ['Lily', 'Sonya'],
    roles: { Lily: '카페 직원', Sonya: '손님' },
    lines: [
      ['Lily', 'Hi. What can I get you today?', '안녕하세요. 오늘 무엇을 드릴까요?'],
      ['Sonya', 'Hi. Do you have oat milk?', '안녕하세요. 오트밀크 있나요?', 'Do you have'],
      ['Lily', 'Yes, we do.', '네, 있습니다.'],
      ['Sonya', "I'd like to get an iced latte with oat milk, please.", '오트밀크 아이스 라테로 주세요.', "I'd like to"],
      ['Lily', 'Sure. Here you go.', '네, 여기 있습니다.'],
      ['Sonya', 'Excuse me. I think there is something wrong with my latte.', '실례합니다. 제 라테에 문제가 있는 것 같아요.'],
      ['Lily', "I'm sorry. What's wrong with it?", '죄송합니다. 어떤 문제가 있나요?'],
      ['Sonya', "It doesn't taste like oat milk. Did you use oat milk?", '오트밀크 맛이 아닌 것 같아요. 오트밀크를 넣으셨나요?', "It doesn't"],
    ],
    blank: { sp: 'Lily', ko: 'Lily(직원)가 되어 마지막 대사를 직접 만들어 보세요.', sample: "Oh, I'm so sorry. I used regular milk. I'll make a new one for you." },
  },
  bankName: 'Word Bank',
  bank: [
    ['I think there is a problem with the air conditioner in my room.', 'air conditioner', '제 방 ___에 문제가 있는 것 같아요.', '에어컨'],
    ["The remote doesn't work.", 'remote', '___이 작동하지 않아요.', '리모컨'],
    ['We can move you to another room.', 'move', '다른 객실로 ___ 드릴 수 있어요.', '옮겨'],
    ["It's not connecting.", 'connecting', '___ 않아요.', '연결되지'],
    ['There is a QR code next to the lift.', 'lift', '___ 옆에 QR 코드가 있어요.', '엘리베이터'],
    ["I think it's too blurry.", 'blurry', '너무 ___ 같아요.', '흐릿한 것'],
    ["I bought this shirt today, and I'd like to exchange it.", 'exchange', '오늘 이 셔츠를 샀는데, ___ 싶어요.', '교환하고'],
    ['Do you have the receipt?', 'receipt', '___이 있나요?', '영수증'],
    ['There is no hot water.', 'hot water', '___ 나오지 않아요.', '뜨거운 물이'],
    ['Could you send someone to fix it?', 'fix', '___ 직원을 보내주실 수 있나요?', '고치러 올'],
  ],
  chal: [
    ['카페에서 우유를 두유로 바꿔 달라고 하고 싶어요.', "Excuse me. I'd like to change the milk. Do you have soy milk?"],
    ['어제 산 신발이 맞지 않아서 교환하고 싶어요.', "I bought these shoes yesterday, but they don't fit. I'd like to exchange them."],
    ['호텔 방 와이파이가 연결되지 않아요. 프런트에 전화했어요.', "Hi, the Wi-Fi in my room doesn't work. It isn't connecting. Could you help me?"],
    ['식당에서 창가 자리가 있는지 묻고 싶어요.', "Hi. Do you have any seats by the window? I'd like to sit there."],
    ['주문한 수프가 충분히 뜨겁지 않아요.', "Excuse me. My soup isn't hot enough. I'd like to get a new one, please."],
  ],
  actTitle: 'Look, Find & Choose',
  // 교재 9쪽 그림 · [x, y] = 이름표 자리 (%) — 프로토타입 SC_PH. photo: assets/images/lesson 의 파일 이름 (화면에서 불러와요)
  scene: {
    photo: 'lv1-01-lobby',
    people: [
      { name: 'Logan', x: 51, y: 34, clue: '프런트에서 리모컨을 들고 직원에게 이야기하고 있어요.', say: 'Excuse me. My remote doesn’t work.' },
      { name: 'Lily', x: 80, y: 46, clue: '엘리베이터 옆 QR 코드에 휴대폰을 대고 고개를 갸웃해요.', say: 'Hi. My phone isn’t connecting to the Wi-Fi.' },
      { name: 'Aiden', x: 37, y: 64, clue: '소파에 앉아 셔츠와 영수증을 들고 있어요.', say: 'Hi. I bought this shirt, but it doesn’t fit.' },
      { name: 'Sonya', x: 14, y: 42, clue: '샤워 가운 차림으로 덜덜 떨고 있어요.', say: 'Excuse me. There’s no hot water in my room.' },
    ],
    // 단어 카드 대화: 손님이 말하면 나는 카드로 답을 맞춰요 · 3번 주고받기 (총 6마디) [손님 영어, 손님 뜻, 내 답, 내 답 뜻]
    talks: [
      {
        who: 'Logan',
        me: '프런트 직원',
        lines: [
          ['Hi, excuse me. My remote doesn’t work.', '저기요, 리모컨이 작동하지 않아요.', 'I’m sorry to hear that. Let me check it.', '그러셨군요. 제가 확인해 볼게요.'],
          ['I changed the batteries, but it still doesn’t work. Could you send someone?', '건전지를 바꿨는데도 안 돼요. 사람을 보내 주실 수 있나요?', 'Sure. I’ll send someone right away.', '물론이죠. 바로 사람을 보내 드릴게요.'],
          ['Thank you! Oh, and do you have a phone charger?', '고마워요! 아, 그리고 휴대폰 충전기 있나요?', 'Yes, we have one at the front desk.', '네, 프런트에 하나 있어요.'],
        ],
      },
      {
        who: 'Lily',
        me: '프런트 직원',
        lines: [
          ['Hi! I’m trying to use the Wi-Fi, but the QR code is too blurry.', '안녕하세요! 와이파이를 쓰려는데 QR 코드가 너무 흐려요.', 'I’m sorry about that. Let me help you.', '불편을 드려 죄송해요. 도와드릴게요.'],
          ['My phone isn’t connecting at all. Is there a password I can type?', '휴대폰이 전혀 연결이 안 돼요. 직접 입력할 비밀번호가 있나요?', 'Yes. Here is the password.', '네. 비밀번호 여기 있어요.'],
          ['It works now! Is the Wi-Fi the same in my room?', '이제 돼요! 제 방에서도 같은 와이파이인가요?', 'Yes, it works in every room.', '네, 모든 방에서 돼요.'],
        ],
      },
      {
        who: 'Aiden',
        me: '옷 가게 직원',
        lines: [
          ['Hi. I bought this shirt today, but it doesn’t fit.', '안녕하세요. 오늘 이 셔츠를 샀는데 안 맞아요.', 'I see. Do you have the receipt?', '그렇군요. 영수증 있으세요?'],
          ['Yes, here it is. I’d like to exchange it.', '네, 여기요. 교환하고 싶어요.', 'Sure. What size do you need?', '물론이죠. 어떤 사이즈가 필요하세요?'],
          ['A large, please. Do you have it in blue?', '라지로 주세요. 파란색도 있나요?', 'Let me check. Yes, we have one.', '확인해 볼게요. 네, 있어요.'],
        ],
      },
      {
        who: 'Sonya',
        me: '프런트 직원',
        lines: [
          ['Excuse me. There is no hot water in my room.', '저기요. 제 방에 뜨거운 물이 안 나와요.', 'I’m so sorry. What’s your room number?', '정말 죄송해요. 방 번호가 어떻게 되세요?'],
          ['Room 702. And the air conditioner is too cold.', '702호요. 그리고 에어컨이 너무 추워요.', 'I’ll send someone right away.', '바로 사람을 보내 드릴게요.'],
          ['Thank you. Could I move to another room tonight?', '고마워요. 오늘 밤 다른 방으로 옮길 수 있을까요?', 'Sure. Here is your new key.', '물론이죠. 새 열쇠 여기 있어요.'],
        ],
      },
    ],
  },
  story: {
    title: 'Small Problems, Real Stories',
    ask: '최근에 겪은 작은 문제를 하나 골라요.',
    options: ['배달 주문', '매장이나 온라인에서 산 물건', '호텔이나 숙소', '휴대폰이나 기기 문제', '티켓이나 예약'],
    qs: [
      ['When and where was it?', '언제, 어디에서 있었던 일인가요?'],
      ['What did you want to do?', '무엇을 하고 싶었나요?'],
      ['What did you ask for?', '무엇을 요청했나요?'],
      ['What was wrong?', '무엇이 문제였나요?'],
      ['What did you do then?', '그때 무엇을 했나요?'],
      ['What happened in the end?', '결국 어떻게 되었나요?'],
    ],
    template: 'I was at ___. I said, "I’d like to ___." I asked, "Do you have ___?" I said, "There is a problem. It doesn’t ___." So I ___. In the end, ___.',
    // 주제별 예시 키워드 (질문 6개 순서 · 문단 빈칸에 그대로 들어가는 모양)
    ex: [
      [['home last Friday', 'my office at lunch'], ['order chicken', 'order pizza'], ['extra sauce', 'a coupon'], ['come on time', 'look right'], ['called the store', 'wrote a review'], ['they sent a new one', 'I got a free drink']],
      [['the mall on Sunday', 'an online shop'], ['buy new shoes', 'get a jacket'], ['a bigger size', 'this in blue'], ['fit', 'work'], ['asked for an exchange', 'sent it back'], ['I got the right size', 'I got my money back']],
      [['a hotel in Busan', 'a guesthouse in Jeju'], ['check in early', 'get a quiet room'], ['an extra towel', 'a phone charger'], ['work', 'get hot'], ['went to the front desk', 'called the staff'], ['they moved me to a new room', 'they fixed it quickly']],
      [['a cafe last week', 'home last night'], ['charge my phone', 'use the Wi-Fi'], ['a charger', 'the Wi-Fi password'], ['turn on', 'connect'], ['restarted it', 'asked the staff'], ['it worked again', 'I bought a new one']],
      [['the train station', 'a concert hall'], ['change my ticket', 'book two seats'], ['a later train', 'seats together'], ['show my seat', 'scan'], ['asked the staff', 'called the help desk'], ['I got a new seat', 'they gave me a new ticket']],
    ],
  },
  talk: {
    who: 'Lily',
    lines: [
      ['What do you want in a good hotel room?', '좋은 호텔 방에는 무엇이 있으면 좋나요?'],
      ['Nice! What kind of view do you like?', '좋네요! 어떤 전망을 좋아해요?'],
      ['Have you ever received the wrong food or package?', '잘못된 음식이나 택배를 받아 본 적 있어요?'],
      ['Oh no! What did you do about it?', '저런! 그래서 어떻게 했어요?'],
      ['When something isn’t right, do you say something or let it go?', '뭔가 잘못됐을 때 말하는 편이에요, 넘어가는 편이에요?'],
      ['Thanks for sharing! You used today’s patterns really well.', '이야기해 줘서 고마워요! 오늘 패턴을 잘 썼어요.'],
    ],
    replies: [
      ['I’d like to have a big window and a soft bed.', 'A quiet room is the most important for me.', 'I like rooms with a coffee machine.'],
      ['I like an ocean view.', 'I’d like to see the city at night.', 'A mountain view is my favorite.'],
      ['Yes. I ordered pizza, but I got pasta.', 'Yes. The package wasn’t mine.', 'No, I haven’t. I’m lucky!'],
      ['I called the store and asked for a new one.', 'I just ate it. It was good!', 'I sent it back and got a refund.'],
      ['I usually say something politely.', 'I let it go if it’s small.', 'It depends on the situation.'],
    ],
  },
};
