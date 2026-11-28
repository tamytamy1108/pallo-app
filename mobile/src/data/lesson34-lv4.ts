/**
 * Lv.4 FREE TALK & DEBATE 회차 콘텐츠 (가짜). 문장 · 순서는 프로토타입 LV4_101 · LV4_HW 그대로예요.
 * 맞는 API: 18 `/lessons/:id` (회차 콘텐츠 한 덩어리) · 21 `/lessons/:id/steps/:step`
 */
import type { Lv4Unit } from '@/data/lessons34';

/** #1 Behind the Mask (앞면 FREE TALK) + Should adults be allowed to sell an organ? (뒷면 DEBATE) */
export const LV4_HW: Lv4Unit = {
  ice: [
    { en: 'Have you ever celebrated Halloween?', ko: '핼러윈을 기념해 본 적이 있나요?', hint: 'Yes, I went to a Halloween party in Itaewon a few years ago.' },
    { en: 'What’s a costume you’ve worn, or one you’d love to pull off?', ko: '입어 본 코스튬이나, 한번 멋지게 소화해 보고 싶은 코스튬이 있나요?', hint: 'I’d love to pull off a vampire costume with fake fangs.' }
  ],
  free: [
    { bg: 'Halloween has no historical roots in Korea, yet every October, streets, cafés, and theme parks fill up with pumpkins, costumes, and themed events.', en: 'Why do you think Halloween took off in Korea despite having no roots?', ko: '뿌리가 없는데도 핼러윈이 한국에서 유행한 이유는 뭘까요?' },
    { bg: 'Every generation grows up with its own scary stories — an urban legend whispered at school, a horror movie everyone watched, or a ghost story told on a school trip.', en: 'What scary story did your generation grow up with, and why did it catch on?', ko: '우리 세대가 자라며 듣던 무서운 이야기는? 왜 퍼졌을까요?' },
    { bg: 'Most of us can explain away a strange noise or a shadow in the dark, but some experiences stay with us, no matter how hard we try to rationalize them.', en: 'Have you ever had a spooky experience that still defies logic?', ko: '아직도 설명이 안 되는 오싹한 경험이 있나요?' },
    { bg: 'Many ghost stories share a pattern: the ghost is someone who was wronged, forgotten, or never given a voice.', en: 'Are ghost stories just stories, or do they reflect something real in society?', ko: '귀신 이야기는 그냥 이야기일까요, 사회의 무언가를 비추는 걸까요?' },
    { bg: 'Every year, debates arise about costumes that might cross the line — cultural appropriation, overly gory outfits, or hyper-sexualized uniforms.', en: 'Where do you draw the line between creative freedom and being insensitive?', ko: '창작의 자유와 무례함 사이, 어디에 선을 긋나요?' }
  ],
  better: [
    ['Young people just liked it.', 'It struck a chord with young people.'],
    ['Everyone knew that story.', 'It was on everyone’s lips for months.'],
    ['It was very scary.', 'It gave me the creeps for weeks.'],
    ['It shows what people are afraid of.', 'It holds up a mirror to what society fears.'],
    ['It depends on the situation.', 'It really comes down to context and intent.']
  ],
  key: [
    ['informed consent', '충분한 설명을 듣고 한 동의', 'Patients must give informed consent before surgery.'],
    ['financial pressure', '경제적 압박', 'Financial pressure can push people into risky choices.'],
    ['drive sales underground', '거래를 음지(불법 시장)로 몰다', 'A total ban might drive sales underground.'],
    ['equitable access', '공평한 접근(기회)', 'Everyone should have equitable access to transplants.'],
    ['jeopardize', '위태롭게 하다', 'Debt could jeopardize a person’s free choice.'],
    ['shift the risk onto', '위험을 ~에게 떠넘기다', 'The system may shift the risk onto the poor.']
  ],
  debate: {
    q: 'Should adults be allowed to sell an organ?', qKo: '성인의 장기 판매를 허용해야 할까요?',
    situation: 'A proposed law would let adults sell a kidney under medical supervision. Supporters say regulation could make transactions safer and reduce transplant waiting lists. Opponents fear that financial pressure could make consent meaningless.',
    situationKo: '의료 감독 아래 성인이 신장을 팔 수 있게 하는 법안이 나왔어요. 찬성 측은 규제가 거래를 더 안전하게 하고 이식 대기 명단을 줄인다고 말하고, 반대 측은 경제적 압박이 동의를 무의미하게 만들 수 있다고 걱정해요.',
    A: { t: 'ALLOW REGULATED SALES', ko: '규제 아래 판매 허용', arg: 'Adults should have the right to make informed choices about their bodies. Legal sales could include screening, fair payment, and lifelong care. A ban may push sales underground.' },
    B: { t: 'KEEP SALES ILLEGAL', ko: '판매는 계속 불법', arg: 'Organ transaction could turn poverty into a forced decision. Debt may undermine genuine consent, while wealthy patients gain an unfair advantage. Improve unpaid donation instead.' },
    askA: ['If a seller cannot pay rent, how voluntary is that choice?', 'What would stop brokers from targeting people in debt?', 'Who should cover a donor’s medical costs years later?'],
    askB: ['If sales continue illegally, how would a ban protect sellers?', 'Should a decision as serious as organ sale be jeopardized by financial pressure?', 'How would you reduce waiting lists without payment?'],
    reply: { A: 'That’s a fair question. Strict screening and lifelong care would make sure no one sells out of desperation.', B: 'Good question. We could expand opt-out donation systems, like Spain does, to shorten waiting lists.' }
  }
};

/** #101 The Present (교재 PDF 그대로: FREE TALK 5 · KEY 12 · SAY IT BETTER 5 / DEBATE: Should concerts go phone-free?) */
export const LV4_101: Lv4Unit = {
  ice: [
    { en: 'What’s the last small thing that made you smile?', ko: '최근에 나를 웃게 한 작은 일은 무엇인가요?', hint: 'A stranger held the door for me this morning, and it made my day.' },
    { en: 'How much would you pay for one extra hour in the day?', ko: '하루에 한 시간이 더 생긴다면 얼마를 낼 건가요?', hint: 'Honestly, I’d pay a lot, maybe 50 dollars, just to sleep more.' }
  ],
  free: [
    { bg: 'A Harvard study found that our minds wander almost half the time, and many of us eat, scroll, and half-listen to a podcast all on autopilot.', en: 'On a scale of 1 (fully here) to 10 (miles away), where are you in the shower, on the bus, or during a movie? What pulls you fully into the moment?', ko: '1점(지금 여기에 온전히 있음)부터 10점(딴생각에 푹 빠짐)까지라면, 샤워할 때 · 버스 안에서 · 영화를 볼 때 나는 몇 점인가요? 나를 지금 이 순간에 온전히 머물게 해 주는 건 무엇인가요?' },
    { bg: '“Day in my life” vlogs follow people from morning coffee to bedtime, and many viewers now try to romanticize their lives, treating the walk home like a movie scene.', en: 'If you filmed your own “day in my life” vlog, what would it be full of, and which moment would you most want to show?', ko: '나만의 “day in my life” 브이로그를 찍는다면 어떤 장면들로 채워질까요? 그중 가장 보여 주고 싶은 순간은 언제인가요?' },
    { bg: 'Psychologists call it “anticipatory nostalgia”: missing a moment before it’s even over, like the last night of a trip or the final episode of a favorite show. It may help us savor a good thing while it lasts.', en: 'What do people do to stretch out a good moment, like one more photo or one more round? Which habit do you secretly love?', ko: '사진 한 장 더, 한 판 더처럼 사람들은 좋은 순간을 늘리려고 무엇을 하나요? 남몰래 좋아하는 나만의 습관이 있나요?' },
    { bg: 'There’s a name for “I’ll be happy when…”: the “arrival fallacy.” We expect lasting joy once we pass the exam or land the job, but the thrill fades and we move the goalposts on ourselves.', en: 'Make the best case for “I’ll be happy when…”: when does chasing the next goal help us, and when should we stop and enjoy the view?', ko: '“~하면 행복해질 거예요”라는 생각을 최대한 편들어 보세요. 다음 목표를 좇는 게 도움이 될 때는 언제이고, 멈춰서 지금을 즐겨야 할 때는 언제인가요?' },
    { bg: 'In one well-known study, people who wrote down a few things they were grateful for each week felt more optimistic about their lives. Yet we rarely count our blessings: Wi-Fi, hot water, and a friend who always has our back go unnoticed until they’re gone.', en: 'What would you miss first if it vanished for a week, and what would you do instead?', ko: '일주일 동안 사라진다면 가장 먼저 아쉬울 것은 무엇인가요? 그동안 대신 무엇을 할 건가요?' }
  ],
  better: [
    ['I’m trying to do too much at once.', 'I’m stretched too thin right now.', '회사에서 일을 더 맡기 어려울 때 정중하게'],
    ['My days are pretty much the same.', 'My days run like clockwork.', '아주 규칙적이고 순조롭게'],
    ['I know I’ll miss this someday.', 'I’ll look back on this time fondly.', '따뜻하고 세련되게 · 송별 메일 · 스피치'],
    ['Don’t wait to enjoy life until you’re promoted.', 'Don’t put your life on hold for a promotion.', '커리어 조언 · 승진 때문에 지금의 삶을 미루지 말라고 할 때'],
    ['I don’t say thanks enough.', 'I should express my appreciation more often.', '격식 · 감사 메일 · 스피치 · 리뷰']
  ],
  key: [
    ['on autopilot', '아무 생각 없이, 기계적으로', 'I drove to work on autopilot and don’t remember the trip at all.'],
    ['be miles away', '딴생각에 빠져 있다', 'Sorry, what did you say? I was miles away.'],
    ['romanticize your life', '평범한 순간을 특별하게 즐기다', 'I romanticize my life by lighting a candle while I cook dinner.'],
    ['while it lasts', '좋은 게 계속되는 동안', 'The weather is perfect, so let’s enjoy it while it lasts.'],
    ['move the goalposts', '목표를 자꾸 바꾸다', 'Every time I hit my target, I move the goalposts on myself.'],
    ['count your blessings', '가진 것에 감사하다', 'When work gets hard, I try to count my blessings.'],
    ['live in the moment', '지금 이 순간을 즐기다', 'Without my phone, I could finally live in the moment.'],
    ['a keepsake', '기념품, 추억의 물건', 'I kept the ticket as a keepsake from my first concert.'],
    ['go too far', '도를 넘다', 'Banning phones completely might go too far.'],
    ['hold someone’s attention', '관심을 붙잡다', 'A great show can hold the audience’s attention without a ban.'],
    ['leak', '(공개 전 자료가) 유출되다', 'The new song leaked online before the album came out.'],
    ['spoil something for someone', '남의 경험을 망치다', 'Phones held up high can spoil the show for people behind you.']
  ],
  debate: {
    q: 'Should concerts go phone-free?', qKo: '콘서트는 휴대폰 금지여야 할까요?',
    warm: [
      ['With a great view or a delicious meal in front of you, do you take a photo first or enjoy it first? Why?', '멋진 풍경이나 맛있는 음식 앞에서 사진 먼저? 즐기기 먼저? 왜요?'],
      ['Is filming a few seconds of a show harmless, or does it spoil it for the people behind you? Where do you draw the line?', '공연을 몇 초 찍는 건 괜찮을까요, 뒷사람에게 방해일까요? 어디까지가 괜찮나요?']
    ],
    situation: 'For years, stars such as Adele and Billie Eilish have asked fans to put their phones down, and a growing number of performers now go further by turning their shows into phone-free zones. Many use pouches from the US company Yondr: phones are sealed inside at the door and can be unlocked only at special stations outside the performance area. Yondr says it has secured more than 20 million devices at 10,000 events, including shows by Bob Dylan, Madonna, and Paul McCartney. In 2026, Harry Styles had phone cameras covered at a show in Manchester and handed out free disposable cameras instead, and one reviewer said everyone was “just there living in the moment.” Supporters say bans stop new songs from leaking and keep screens from distracting other fans, and the lead singer of The Lumineers has said audiences “actually really welcome” the break. Bans have drawbacks, though: entry lines can be long, and phones matter in emergencies; one man at the Styles show needed his to check his wife’s blood sugar levels. Phones can even help artists: when concert clips go viral, they can boost ticket sales and keep artists in the conversation. Blur’s Damon Albarn told the BBC that such bans go too far, asking, “Where does it end?” and arguing that fans won’t want their phones if performers engage them properly. Should concerts go phone-free?',
    situationKo: '아델, 빌리 아일리시 같은 스타들은 오래전부터 팬들에게 휴대폰을 내려놓아 달라고 했고, 이제는 공연을 아예 휴대폰 금지 구역으로 만드는 가수도 늘고 있어요. 입구에서 휴대폰을 파우치에 봉인하고, 공연장 밖 전용 장소에서만 열 수 있어요. 지지하는 쪽은 신곡 유출을 막고 화면이 다른 팬을 방해하지 않는다고 말해요. 하지만 입장 줄이 길어지고, 응급 상황엔 휴대폰이 꼭 필요하며, 공연 영상이 화제가 되면 티켓 판매에도 도움이 돼요. 이런 금지는 지나치다는 의견도 있어요.',
    A: { t: 'GO PHONE-FREE', ko: '“Live it, don’t film it.” · 휴대폰 금지', arg: 'Screens block views and distract everyone behind you. Without them, new songs don’t leak and the whole crowd shares the moment.' },
    B: { t: 'LET FANS DECIDE', ko: '“My ticket, my memories.” · 팬이 결정', arg: 'Fans pay to be there and deserve a keepsake. Phones matter in emergencies, viral clips help artists, and a great show should hold fans’ attention without a ban.' },
    askA: ['If a fan’s family needs to reach them, is a phone-free show still fair?', 'Isn’t it the artist’s job to be more interesting than a phone?', 'If fans paid for a ticket, why shouldn’t they take home a keepsake?'],
    askB: ['How often do you actually watch the videos you film at concerts?', 'Should one fan’s souvenir matter more than another fan’s view?', 'If you filmed the whole show, did you really see it?'],
    reply: { A: 'Fair question. Phones could stay at a station near the exit, so families can still reach fans in an emergency.', B: 'Good question. Honestly, I rarely rewatch them, but a short clip is still a keepsake I care about.' },
    useful: ['Be that as it may, …', 'Be that as it may, a blurry video is no substitute for being there.', '그렇다 하더라도 · 상대 말을 인정하고 반박할 때'],
    dkey: 6   // key의 뒤 6개가 DEBATE KEY EXPRESSIONS
  }
};
