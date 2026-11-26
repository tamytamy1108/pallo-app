import { CLUB_SPOT, MEETS } from '@/data/meet';
import { PLACE_SPOTS } from '@/data/events';

import { areaLine } from '../area';

describe('areaLine', () => {
  it('시 · 구 · 역만 남기고 길 이름 · 출구 · 층은 빼요', () => {
    expect(areaLine('서울 영등포구 영중로 · 영등포역 5번 출구 도보 4분', '서울')).toBe('서울 영등포구 · 영등포역 근처');
    expect(areaLine('경기 성남시 분당구 판교역로 · 판교역 1번 출구 도보 3분', '경기')).toBe('경기 성남시 분당구 · 판교역 근처');
    expect(areaLine('부산 해운대구 구남로 · 해운대역 3번 출구 도보 5분', '부산')).toBe('부산 해운대구 · 해운대역 근처');
  });

  it('역이 없으면 시 · 구만', () => {
    expect(areaLine('서울 은평구 연서로 · 불광천 옆', '서울')).toBe('서울 은평구');
    expect(areaLine('경기 하남시 미사대로 750 · 정문 광장', '경기')).toBe('경기 하남시');
  });

  it('주소가 없으면 지역 이름 + 장소 이름의 역', () => {
    expect(areaLine(undefined, '경기', '판교역 4번 출구')).toBe('경기 · 판교역 근처');
    expect(areaLine(undefined, '서울', '영등포 근처 수제맥주집')).toBe('서울');
    expect(areaLine('접속 링크는 시작 10분 전에 채팅방에 올려요', '')).toBe('');
  });

  it('예시 데이터 어디에도 번지 · 출구 · 길 이름이 새지 않아요', () => {
    const addrs = [...Object.values(CLUB_SPOT).map(([, a]) => a), ...Object.values(PLACE_SPOTS).flat().map(([, , a]) => a)];
    for (const a of addrs) {
      const out = areaLine(a, '');
      expect(out).not.toMatch(/\d|출구|층|도보/);
    }
    for (const m of MEETS) expect(areaLine(m.addr, m.reg, m.place)).not.toMatch(/\d|출구/);
  });
});
