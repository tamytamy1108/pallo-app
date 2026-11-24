import { Image } from 'expo-image';
import { useRef, useState, type ReactNode } from 'react';
import { Linking, Modal, Platform, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { SheetButton } from '@/components/common/sheet-parts';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { BR_BOARDS, MY_BRANCHES, type BranchItem, type Partner, type PartnerLink, type PartnerLinkKind, type PartnerPoster } from '@/data/my';
import { sfx } from '@/lib/feedback';

import { CourseProgressSheet } from './course-progress';
import { Lift } from './lift';

/** 지점 안내 아이콘 (프로토타입 BR_IC) */
const BR_IC = {
  park: 'M4 3h16v18H4zM9 17V7h4a3 3 0 0 1 0 6H9',
  wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
  loc: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  tel: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  pin: 'M12 17v5M9 3h6l-1 6 3 3H7l3-3z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  cal: 'M4 6h16v15H4zM4 10h16M8 3v5M16 3v5M8 14h2M14 14h2M8 17h2',
  clk: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  x: 'M6 6l12 12M18 6 6 18',
  prev: 'M15 4.5L7.5 12l7.5 7.5',
  next: 'M9 4.5l7.5 7.5L9 19.5',
} as const;
function BrIc({ k, size = 20, color = Colors.ink }: { k: keyof typeof BR_IC; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={BR_IC[k]} />
    </Svg>
  );
}

type NavLike = { clipboard?: { writeText: (t: string) => Promise<void> } };
const copyText = (v: string) => {
  if (Platform.OS !== 'web') return;
  const nav = (globalThis as { navigator?: NavLike }).navigator;
  nav?.clipboard?.writeText(v).catch(() => {});
};

/** 지점 둘 이상이면 위 칸 고르기 (프로토타입 .br-seg) */
function BranchSeg({ value, onChange }: { value: string; onChange: (b: string) => void }) {
  if (MY_BRANCHES.length < 2) return null;
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {MY_BRANCHES.map((b) => {
        const on = b === value;
        return (
          <Pressable
            key={b}
            onPress={() => {
              sfx('tap');
              onChange(b);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segBtn, on && styles.segOn]}>
            <PText style={[styles.segT, on && styles.segTOn]}>{b}</PText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * 마이 › 지점 안내 보드 (프로토타입 #brBoard .brb): 지점 고르기 · 자주 찾는 4칸 + 교재 전체 진도 칸 · 매니저 고정 글.
 * [전체 보기 ›] · 칸 · 고정 글을 누르면 지점 안내 전체 (프로토타입은 겹쳐 뜨는 화면 — 앱은 키 큰 시트).
 */
export function BranchBoard() {
  const [sel, setSel] = useState(MY_BRANCHES[0]);
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState(false);
  const partner = usePartnerSheet(sel);
  const B = BR_BOARDS[sel] ?? BR_BOARDS['하남점'];
  const star = B.items.filter((x) => x.star).slice(0, 4);
  const go = () => {
    sfx('tap');
    setOpen(true);
  };
  return (
    <>
      <Raised radius={Radius.card} style={styles.boardWrap}>
        <View style={styles.board}>
          <View style={styles.hd}>
            <PText style={styles.hdT}>{MY_BRANCHES.length > 1 ? '지점 안내' : `${sel} 안내`}</PText>
            <Pressable onPress={go} accessibilityRole="button" accessibilityLabel="지점 안내 전체 보기" hitSlop={10}>
              <PText style={styles.hdLink}>전체 보기 ›</PText>
            </Pressable>
          </View>
          <BranchSeg value={sel} onChange={setSel} />
          <View style={styles.sc}>
            {star.map((x) => (
              <Pressable key={x.t} onPress={go} accessibilityRole="button" accessibilityLabel={x.t} style={styles.it}>
                {({ pressed }) => (
                  <>
                    <Lift radius={16} pressed={pressed}>
                      <View style={[styles.itIc, { backgroundColor: x.bg }]}>
                        <BrIc k={x.ic} size={22} />
                      </View>
                    </Lift>
                    <PText style={styles.itT} numberOfLines={1}>
                      {x.s || x.t.split(' · ')[0]}
                    </PText>
                  </>
                )}
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                sfx('tap');
                setCourse(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="교재 전체 진도"
              style={styles.it}>
              {({ pressed }) => (
                <>
                  <Lift radius={16} pressed={pressed}>
                    <View style={[styles.itIc, styles.itCourse]}>
                      <BrIc k="cal" size={22} />
                    </View>
                  </Lift>
                  <PText style={styles.itT} numberOfLines={1}>
                    전체 진도
                  </PText>
                </>
              )}
            </Pressable>
          </View>
          {B.pin && (
            <Pressable onPress={go} accessibilityRole="button" style={styles.pin}>
              <View style={styles.pinIc}>
                <BrIc k="pin" size={15} />
              </View>
              <PText style={styles.pinT}>
                {B.pin.t} · {B.pin.by}
              </PText>
            </Pressable>
          )}
          <Partners list={B.partners} small onPick={partner.open} />
        </View>
      </Raised>
      <CourseProgressSheet open={course} onClose={() => setCourse(false)} />
      <BranchInfoSheet open={open} onClose={() => setOpen(false)} sel={sel} onSel={setSel} />
      {partner.sheet}
    </>
  );
}

/** 지점 안내 전체 (프로토타입 brInfoHTML): 지점 카드 · 고정 글 · 협업 업체 · 항목(복사 · 지도 · 전화) */
function BranchInfoSheet({ open, onClose, sel, onSel }: { open: boolean; onClose: () => void; sel: string; onSel: (b: string) => void }) {
  const B = BR_BOARDS[sel] ?? BR_BOARDS['하남점'];
  // 아이폰: 시트 위에 시트를 띄우려면 그 시트 안에 두어야 해요 (밖에 두면 안 뜨고, 그 뒤로 업체를 눌러도 반응이 없어요)
  const partner = usePartnerSheet(sel);
  const loc = B.items.find((x) => x.ic === 'loc');
  const act = (x: BranchItem) => {
    if (!x.act) return;
    const [k, v] = x.act;
    showToast(k === 'map' ? '지도 앱으로 길찾기를 열어요' : `${v}로 전화를 걸어요`);
  };
  return (
    <Sheet open={open} onClose={onClose} title="지점 안내" tall label="지점 안내">
      <BranchSeg value={sel} onChange={onSel} />
      <Raised radius={Radius.card}>
        <View style={styles.hero}>
          <PText style={styles.heroK}>MY BRANCH</PText>
          <PText style={styles.heroB}>{sel}</PText>
          <PText style={styles.heroS}>{B.addr}</PText>
          <PText style={styles.heroS}>{B.hrs}</PText>
          {loc && (
            <Pressable onPress={() => act(loc)} accessibilityRole="button" accessibilityLabel="지도" style={styles.heroMap}>
              <BrIc k="loc" size={14} />
              <PText style={styles.heroMapT}>지도</PText>
            </Pressable>
          )}
          <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.heroImg} contentFit="contain" />
        </View>
      </Raised>
      {B.pin && (
        <View style={styles.pin}>
          <View style={styles.pinIc}>
            <BrIc k="pin" size={15} />
          </View>
          <PText style={styles.pinT}>
            {B.pin.t} · {B.pin.by}
          </PText>
        </View>
      )}
      <Partners list={B.partners} onPick={partner.open} />
      {partner.sheet}
      <Raised radius={Radius.card}>
        <View style={styles.list}>
          {B.items
            .filter((x) => x.ic !== 'loc')
            .map((x, i) => (
              <View key={x.t} style={[styles.li, i > 0 && styles.liLine]}>
                <View style={[styles.liIc, { backgroundColor: x.bg }]}>
                  <BrIc k={x.ic} size={18} />
                </View>
                <View style={styles.liTx}>
                  <PText style={styles.liB}>{x.t}</PText>
                  {!!x.d && <PText style={styles.liP}>{x.d}</PText>}
                  {x.cp?.length === 1 && <PText style={[styles.liP, styles.liCl]}>{x.cp[0][0]}</PText>}
                  {(x.cp ?? []).map(([l, v]) => (
                    <Pressable
                      key={v}
                      onPress={() => {
                        copyText(v);
                        sfx('tap');
                        showToast(`${l.split(' · ')[0]} 복사했어요 · ${v}`);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${l} ${v} 복사`}
                      style={styles.val}>
                      <PText style={styles.valCode}>{v}</PText>
                      <View style={styles.valCi}>
                        <BrIc k="copy" size={16} color={Colors.purple} />
                      </View>
                    </Pressable>
                  ))}
                </View>
                {x.act && (
                  <Pressable onPress={() => act(x)} accessibilityRole="button" style={styles.liGo}>
                    <PText style={styles.liGoT}>{x.act[0] === 'map' ? '지도' : '전화'}</PText>
                  </Pressable>
                )}
              </View>
            ))}
        </View>
      </Raised>
    </Sheet>
  );
}

/**
 * 협업 업체 · 멤버 혜택: 지점 안내 보드(small)와 지점 안내 전체 위쪽에 바로 보여요.
 * 업체가 없는 지점은 COMING SOON 카드.
 */
function Partners({ list, small, onPick }: { list: Partner[]; small?: boolean; onPick: (p: Partner) => void }) {
  const pick = (p: Partner) => {
    sfx('tap');
    onPick(p);
  };
  return (
    <View style={small && styles.phSmall}>
      <View style={styles.ph}>
        <PText style={styles.phB}>협업 업체 · 멤버 혜택</PText>
        {list.length > 0 && <PText style={styles.phS}>{list.length}곳</PText>}
      </View>
      {list.length === 0 ? (
        <View style={styles.soon}>
          <PText style={styles.soonK}>COMING SOON</PText>
          <PText style={styles.soonT}>이 지점의 협업 업체를 준비하고 있어요</PText>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ptn}>
          {list.map((p) =>
            small ? (
              <Pressable key={p.n} onPress={() => pick(p)} accessibilityRole="button" accessibilityLabel={`${p.n} 자세히, ${p.b}`} style={styles.pm}>
                <View style={[styles.pmIc, { backgroundColor: p.c }]}>
                  {p.posters?.[0] != null ? (
                    // 작은 칸: 대표 사진을 칸에 꽉 차게 (가운데를 잘라요)
                    <Image source={posterSrc(p.posters[0])} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <PText style={styles.pmW} numberOfLines={2}>
                      {p.w}
                    </PText>
                  )}
                </View>
                <View style={styles.pmTx}>
                  <PText style={styles.pmN} numberOfLines={1}>
                    {p.n}
                  </PText>
                  <PText style={styles.pmB} numberOfLines={1}>
                    {p.b}
                  </PText>
                </View>
              </Pressable>
            ) : (
              <Pressable key={p.n} onPress={() => pick(p)} accessibilityRole="button" accessibilityLabel={`${p.n} 자세히, ${p.b}`}>
                {({ pressed }) => (
                  <Lift radius={Radius.card} pressed={pressed}>
                    <View style={styles.pc}>
                      <View style={[styles.pcIm, { backgroundColor: p.c }]}>
                        {p.posters?.[0] != null ? <PosterFit src={p.posters[0]} /> : <PText style={styles.pcW}>{p.w}</PText>}
                      </View>
                      <View style={styles.pcB}>
                        <PText style={styles.pcK}>협업 업체</PText>
                        <PText style={styles.pcN}>{p.n}</PText>
                        <PText style={styles.pcS}>{p.b}</PText>
                      </View>
                    </View>
                  </Lift>
                )}
              </Pressable>
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}

type InfoRow = { icon: ReactNode; t: string; s?: string; go?: { label: string; run: () => void } };

/** 링크 종류별 아이콘 · 기본 이름 · 설명 */
const LINK_KIND: Record<PartnerLinkKind, { t: string; s: string; icon: ReactNode }> = {
  naver: {
    t: '네이버 플레이스',
    s: '리뷰 · 메뉴 · 길찾기',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Rect x={2} y={2} width={20} height={20} rx={6} fill="#03C75A" />
        <Path d="M8 7h2.6l2.8 4.3V7H16v10h-2.6l-2.8-4.3V17H8z" fill="#fff" />
      </Svg>
    ),
  },
  insta: {
    t: '인스타그램',
    s: '인스타그램',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.2}>
        <Rect x={3} y={3} width={18} height={18} rx={5} />
        <Circle cx={12} cy={12} r={4} />
        <Circle cx={17.3} cy={6.7} r={1} fill={Colors.ink} stroke="none" />
      </Svg>
    ),
  },
  kakao: {
    t: '카카오톡 채널',
    s: '문의 · 예약',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Rect x={2} y={2} width={20} height={20} rx={6} fill="#FEE500" />
        <Path d="M12 6.5c-3.6 0-6.5 2.2-6.5 5 0 1.8 1.2 3.4 3 4.3l-.6 2.4 2.7-1.8c.5.1.9.1 1.4.1 3.6 0 6.5-2.2 6.5-5s-2.9-5-6.5-5z" fill="#1E1A2B" />
      </Svg>
    ),
  },
  web: {
    t: '홈페이지',
    s: '홈페이지',
    icon: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.2} strokeLinecap="round">
        <Circle cx={12} cy={12} r={9} />
        <Path d="M3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9z" />
      </Svg>
    ),
  },
};

/** 인스타그램은 주소에서 @아이디, 홈페이지는 도메인을 이름으로 */
function linkTitle(l: PartnerLink) {
  if (l.label) return l.label;
  const host = l.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (l.kind === 'insta') return `@${host.replace(/^(www\.)?instagram\.com\//, '').split(/[/?]/)[0]}`;
  if (l.kind === 'web') return host.replace(/^www\./, '').split('/')[0];
  return LINK_KIND[l.kind].t;
}

const openLink = (url: string) => {
  sfx('tap');
  Linking.openURL(url).catch(() => showToast('링크를 열 수 없어요'));
};

const linkRow = (l: PartnerLink): InfoRow => ({ icon: LINK_KIND[l.kind].icon, t: linkTitle(l), s: LINK_KIND[l.kind].s, go: { label: '열기', run: () => openLink(l.url) } });

function PartnerGo({ go, name }: { go: { label: string; run: () => void }; name: string }) {
  return (
    <Pressable onPress={go.run} accessibilityRole="button" accessibilityLabel={`${name} ${go.label}`} style={styles.liGo}>
      <PText style={styles.liGoT}>{go.label}</PText>
    </Pressable>
  );
}

/**
 * 협업 업체 상세 시트 + 여는 함수. 시트를 띄우는 화면(마이 · 지점 안내 전체)마다 따로 써요.
 * 닫히는 동안에도 내용이 남게 업체는 따로 들고 있어요.
 */
function usePartnerSheet(branch: string) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const open = (p: Partner) => {
    setPartner(p);
    setIsOpen(true);
  };
  const sheet = <PartnerSheet partner={partner} open={isOpen} branch={branch} onClose={() => setIsOpen(false)} />;
  return { open, sheet };
}

/** 협업 업체 자세히 (프로토타입 .br-pd2): 큰 색 머리 · 소개 · 멤버 혜택 쿠폰 · 주소 · 전화 · 영업 시간 */
function PartnerSheet({ partner: p, open, branch, onClose }: { partner: Partner | null; open: boolean; branch: string; onClose: () => void }) {
  const [view, setView] = useState<number | null>(null);
  if (!p) return null;
  const pct = p.b.match(/\d+%/)?.[0] ?? '';
  const rest = p.b.replace(pct, '').trim();
  const rows: InfoRow[] = [];
  if (p.addr) rows.push({ icon: <BrIc k="loc" size={18} />, t: p.addr, go: { label: '지도', run: () => showToast('지도 앱으로 길찾기를 열어요') } });
  if (p.tel) rows.push({ icon: <BrIc k="tel" size={18} />, t: p.tel, go: { label: '전화', run: () => showToast(`${p.tel}로 전화를 걸어요`) } });
  if (p.hrs) rows.push({ icon: <BrIc k="clk" size={18} />, t: p.hrs, s: '영업 시간' });
  // 추가 정보: 네이버 플레이스 · 인스타그램 · 카카오톡 채널 · 홈페이지
  for (const l of p.links ?? []) rows.push(linkRow(l));
  return (
    <Sheet open={open} onClose={onClose} tall label={p.n} footer={<SheetButton label="확인" size="foot" onPress={onClose} />}>
      {p.posters?.length ? (
        // 포스터가 있으면 맨 위에 원래 비율 그대로 넘겨 보기 + 아래에 이름
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gal}>
            {p.posters.map((src, i) => (
              <PosterFull key={i} src={src} onPress={() => setView(i)} />
            ))}
          </ScrollView>
          <PosterViewer list={p.posters} start={view} name={p.n} onClose={() => setView(null)} />
          <View style={styles.pdTitle}>
            <View style={[styles.pdDot, { backgroundColor: p.c }]} />
            <View style={styles.liTx}>
              <PText style={styles.pdK2}>협업 업체 · {branch}</PText>
              <PText style={styles.pdN2}>{p.n}</PText>
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.pdHd, { backgroundColor: p.c }]}>
          <PText style={styles.pdW}>{p.w}</PText>
          <PText style={styles.pdK}>협업 업체 · {branch}</PText>
          <PText style={styles.pdN}>{p.n}</PText>
        </View>
      )}
      {!!p.info && (
        <View>
          <PText style={styles.pdH3}>소개</PText>
          <PText style={styles.pdP}>{p.info}</PText>
        </View>
      )}
      <View style={styles.cp}>
        <View style={styles.cpL}>
          {pct ? (
            <>
              <PText style={styles.cpPct}>{pct}</PText>
              <PText style={styles.cpRest}>{rest || '할인'}</PText>
            </>
          ) : (
            <PText style={styles.cpSm}>{p.b}</PText>
          )}
        </View>
        <View style={styles.cpR}>
          <PText style={styles.cpK}>PALLO 멤버 혜택</PText>
          <PText style={styles.cpT}>{p.how || '결제할 때 PALLO 앱 멤버 화면을 보여 주세요'}</PText>
        </View>
      </View>
      {rows.length > 0 && (
        <View>
          <PText style={styles.pdH3}>정보</PText>
          <View style={styles.pdRows}>
            {rows.map((r, i) => (
              <View key={`${r.t}-${i}`} style={[styles.pr, i > 0 && styles.liLine]}>
                <View style={styles.prIc}>{r.icon}</View>
                <View style={styles.liTx}>
                  <PText style={styles.prT}>{r.t}</PText>
                  {!!r.s && <PText style={styles.prS}>{r.s}</PText>}
                </View>
                {r.go && <PartnerGo go={r.go} name={p.n} />}
              </View>
            ))}
          </View>
        </View>
      )}
    </Sheet>
  );
}

const posterSrc = (p: PartnerPoster) => (typeof p === 'string' ? { uri: p } : p);

/**
 * 크기가 제각각인 포스터를 정해진 칸에 넣기: 자르지 않고 칸 안에 다 보이게 (글자가 안 잘려요).
 * 남는 곳은 같은 사진을 흐리게 깔아 채워요.
 */
function PosterFit({ src }: { src: PartnerPoster }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={posterSrc(src)} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={18} />
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
      <Image source={posterSrc(src)} style={StyleSheet.absoluteFill} contentFit="contain" />
    </View>
  );
}

const GAL_H = 280;
/** 상세 맨 위 포스터 · 사진: 원본 비율 그대로 (세로 포스터는 좁게 · 가로 사진은 넓게) */
function PosterFull({ src, onPress }: { src: PartnerPoster; onPress: () => void }) {
  const [ratio, setRatio] = useState(0.75);
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="포스터 크게 보기"
      style={[styles.galIt, { width: Math.round(GAL_H * ratio) }]}>
      <Image source={posterSrc(src)} style={StyleSheet.absoluteFill} contentFit="contain" onLoad={(e) => e.source.width && e.source.height && setRatio(e.source.width / e.source.height)} />
    </Pressable>
  );
}

/** 포스터 크게 보기: 화면 가득 · 옆으로 넘기기 · 몇 번째인지 (동아리 사진첩 AlbumViewer 와 같은 모양) */
function PosterViewer({ list, start, name, onClose }: { list: PartnerPoster[]; start: number | null; name: string; onClose: () => void }) {
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const ref = useRef<ScrollViewInstance>(null);
  const insets = useSafeAreaInsets();
  const go = (k: number) => {
    const n = Math.max(0, Math.min(list.length - 1, k));
    ref.current?.scrollTo({ x: n * w, animated: true });
    setI(n);
  };
  return (
    <Modal visible={start != null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.pv} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={[styles.pvTop, { paddingTop: insets.top + 10 }]}>
          <PText style={styles.pvN}>{name}</PText>
          {list.length > 1 && <PText style={styles.pvC}>{`${i + 1} / ${list.length}`}</PText>}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={styles.pvX} hitSlop={8}>
            <BrIc k="x" size={22} color={Colors.white} />
          </Pressable>
        </View>
        {w ? (
          <ScrollView
            ref={ref}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (start ?? 0) * w, y: 0 }}
            onLayout={() => {
              setI(start ?? 0);
              ref.current?.scrollTo({ x: (start ?? 0) * w, animated: false });
            }}
            onScroll={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / w))}
            scrollEventThrottle={64}>
            {list.map((src, j) => (
              <View key={j} style={[styles.pvPage, { width: w, paddingTop: insets.top + 64, paddingBottom: insets.bottom + 40 }]}>
                <Image source={posterSrc(src)} style={styles.pvImg} contentFit="contain" accessibilityLabel={`${name} 포스터 ${j + 1}`} />
              </View>
            ))}
          </ScrollView>
        ) : null}
        {/* 손가락으로 밀기 어려운 컴퓨터 화면을 위해 양옆 화살표도 둬요 */}
        {list.length > 1 && i > 0 && (
          <Pressable onPress={() => go(i - 1)} accessibilityRole="button" accessibilityLabel="이전 사진" style={[styles.pvArrow, styles.pvPrev]}>
            <BrIc k="prev" size={22} color={Colors.white} />
          </Pressable>
        )}
        {list.length > 1 && i < list.length - 1 && (
          <Pressable onPress={() => go(i + 1)} accessibilityRole="button" accessibilityLabel="다음 사진" style={[styles.pvArrow, styles.pvNext]}>
            <BrIc k="next" size={22} color={Colors.white} />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  boardWrap: { marginTop: 12 },
  board: { padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  hd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hdT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  hdLink: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple, paddingVertical: 6 },
  seg: { flexDirection: 'row', gap: 4, marginTop: 10, padding: 4, borderRadius: 14, backgroundColor: '#EFE8D8' },
  segBtn: { flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  segT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  segTOn: { color: Colors.ink },
  sc: { flexDirection: 'row', gap: 4, marginTop: 12 },
  it: { flex: 1, alignItems: 'center', gap: 6 },
  itIc: { width: 48, height: 48, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  itCourse: { backgroundColor: Colors.lavender },
  itT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, letterSpacing: -0.2 },
  pin: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#FFF6C2' },
  pinIc: { marginTop: 2 },
  pinT: { flex: 1, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18 },
  hero: { overflow: 'hidden', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 18, borderRadius: Radius.card, backgroundColor: Colors.purple, borderWidth: 2, borderColor: Colors.ink, gap: 2 },
  heroK: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.yellow, letterSpacing: 1 },
  heroB: { fontFamily: Font.display, fontSize: 22, lineHeight: 28, color: Colors.white, marginTop: 2, marginBottom: 4 },
  heroS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: '#E3DBF7', maxWidth: '76%' },
  heroMap: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  heroMapT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  heroImg: { position: 'absolute', right: -6, bottom: -14, width: 84, height: 54 },
  list: { overflow: 'hidden', borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  li: { flexDirection: 'row', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  liLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  liIc: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  liTx: { flex: 1, minWidth: 0 },
  liB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  liP: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  liCl: { fontSize: 11, marginTop: 6 },
  val: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%', marginTop: 6 },
  valCode: { flexShrink: 1, fontFamily: Font.body900, fontSize: 13, lineHeight: 18, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F3EEE2', overflow: 'hidden' },
  valCi: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EEE2' },
  liGo: { alignSelf: 'center', height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, justifyContent: 'center' },
  liGoT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  pdHd: { height: 150, overflow: 'hidden', justifyContent: 'flex-end', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink },
  pdW: { position: 'absolute', right: 14, top: 10, fontFamily: Font.display, fontSize: 30, lineHeight: 36, color: Colors.white, opacity: 0.25 },
  pv: { flex: 1, backgroundColor: 'rgba(20,17,30,0.94)', justifyContent: 'center' },
  pvTop: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 10, zIndex: 2 },
  pvN: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20, color: Colors.white },
  pvC: { fontFamily: Font.display, fontSize: 12, lineHeight: 16, color: Colors.yellow },
  pvX: { position: 'absolute', right: 14, bottom: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pvPage: { height: '100%', paddingHorizontal: 16 },
  pvImg: { flex: 1 },
  pvArrow: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  pvPrev: { left: 10 },
  pvNext: { right: 10 },
  pdTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pdDot: { width: 12, height: 40, borderRadius: 6, borderWidth: 2, borderColor: Colors.ink },
  pdK2: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.purple },
  pdN2: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  dim: { backgroundColor: 'rgba(30,26,43,0.18)' },
  gal: { gap: 10, paddingRight: 8 },
  galIt: { height: GAL_H, overflow: 'hidden', borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  pdK: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.yellow },
  pdN: { marginTop: 2, fontFamily: Font.display, fontSize: 22, lineHeight: 28, color: Colors.white },
  pdH3: { marginBottom: 6, fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  pdP: { fontFamily: Font.body700, fontSize: 14, lineHeight: 23 },
  cp: { flexDirection: 'row', overflow: 'hidden', borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, boxShadow: `4px 4px 0 ${Colors.ink}` },
  cpL: { width: 96, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 6, backgroundColor: Colors.yellow, borderRightWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink },
  cpPct: { fontFamily: Font.display, fontSize: 24, lineHeight: 28 },
  cpRest: { marginTop: 4, fontFamily: Font.body900, fontSize: 11.5, lineHeight: 15, textAlign: 'center' },
  cpSm: { fontFamily: Font.body900, fontSize: 13, lineHeight: 17, textAlign: 'center' },
  cpR: { flex: 1, justifyContent: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 14 },
  cpK: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  cpT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19 },
  pdRows: { overflow: 'hidden', borderWidth: 2, borderColor: Colors.line, borderRadius: 16, backgroundColor: Colors.white },
  pr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  prIc: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream },
  prT: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19 },
  prS: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  ph: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, marginBottom: 8 },
  phSmall: { marginTop: 14, paddingTop: 12, borderTopWidth: 1.5, borderColor: Colors.line },
  soon: { alignItems: 'center', gap: 2, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C9C2B4', backgroundColor: '#FBF8F1' },
  soonK: { fontFamily: Font.display, fontSize: 13, lineHeight: 17, letterSpacing: 1, color: Colors.purple },
  soonT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  pm: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 200, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  pmIc: { width: 50, height: 44, overflow: 'hidden', borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  pmW: { fontFamily: Font.display, fontSize: 9, lineHeight: 11, color: Colors.white, textAlign: 'center' },
  pmTx: { flex: 1, minWidth: 0 },
  pmN: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  pmB: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.purple },
  phB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  phS: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple },
  ptn: { gap: 10, paddingTop: 2, paddingBottom: 4, paddingRight: 8 },
  pc: { width: 150, overflow: 'hidden', borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  pcIm: { overflow: 'hidden', height: 80, justifyContent: 'flex-end', paddingVertical: 8, paddingHorizontal: 10 },
  pcW: { fontFamily: Font.display, fontSize: 13, lineHeight: 17, color: Colors.white },
  pcB: { paddingTop: 9, paddingHorizontal: 10, paddingBottom: 11 },
  pcK: { fontFamily: Font.body900, fontSize: 10.5, lineHeight: 14, color: Colors.purple },
  pcN: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  pcS: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
});
