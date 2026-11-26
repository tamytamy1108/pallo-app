/**
 * 참여 · 가입 안 한 사람에게 보여 줄 '대략적인 위치' (안전 — 자세한 주소는 참여한 사람만).
 * 주소 '서울 영등포구 영중로 · 영등포역 5번 출구 도보 4분' → '서울 영등포구 · 영등포역 근처'.
 * 시 · 도 + 시 · 군 · 구(+ 그 아래 구)까지만, 길 이름 · 번지 · 출구 · 층은 빼요. 역은 주소 → 장소 이름 순으로 찾아요.
 * 백엔드도 같은 규칙으로 area 를 내려줘요 (backend api/app/common/PlaceArea.java).
 */

const SIDO = /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/;
const SIGUNGU = /^\S+(시|군|구|도)$/;
const STATION = /(\S{1,10}?역)(?=\s|\d|$|·)/;

/** '서울 은평구' · '경기 성남시 분당구' (모르면 '') */
const cityDistrict = (addr: string) => {
  const t = addr.split('·')[0].trim().split(/\s+/);
  if (!t[0] || !(SIDO.test(t[0]) || SIGUNGU.test(t[0]))) return '';
  const out = [t[0]];
  for (const w of t.slice(1, 3)) {
    if (!SIGUNGU.test(w)) break;
    out.push(w);
  }
  return out.join(' ');
};

/** '연신내역' (모르면 '') — '지역' 같은 낱말은 빼요 */
const station = (s: string) => {
  const m = STATION.exec(s);
  return m && m[1] !== '지역' ? m[1] : '';
};

/**
 * '서울 영등포구 · 영등포역 근처'. 주소에 시 · 구가 없으면 fallback(지역 이름 등), 역을 모르면 역 부분을 빼요.
 * 둘 다 모르면 fallback 만 (빈 문자열일 수 있어요).
 */
export function areaLine(addr: string | undefined, fallback: string, place = ''): string {
  const a = addr ? cityDistrict(addr) : '';
  const st = station(addr ?? '') || station(place);
  return [a || fallback, st ? `${st} 근처` : ''].filter(Boolean).join(' · ');
}
