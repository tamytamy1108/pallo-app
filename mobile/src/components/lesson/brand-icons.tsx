import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

/**
 * PALLO 전용 아이콘 (프로토타입 ICONS · 48×48 · 진한 테두리 · 일부에 PALLO 눈 · 심볼). 완료 화면 숫자 카드에 써요.
 */
const INK = '#1E1A2B';
const SYMBOL =
  'M374.44,140.26h-62.65l40.05-59.4c16.01-23.75,9.74-55.98-14.01-71.99h0c-23.75-16.01-55.98-9.74-71.99,14.01l-54.77,81.24-42.86-63.57c-16.01-23.75-48.24-30.02-71.99-14.01h0c-23.75,16.01-30.02,48.24-14.01,71.99l28.13,41.73h-58.47c-28.64,0-51.86,23.22-51.86,51.86h0c0,28.64,23.22,51.86,51.86,51.86h64.91s-35.8,53.1-35.8,53.1c-16.01,23.75-9.74,55.98,14.01,71.99h0c23.75,16.01,55.98,9.74,71.99-14.01l44.08-65.39,36.42,54.03c16.01,23.75,48.24,30.02,71.99,14.01h0c23.75-16.01,30.02-48.24,14.01-71.99l-28.13-41.73h69.09c28.64,0,51.86-23.22,51.86-51.86h0c0-28.64-23.22-51.86-51.86-51.86Z';

/** PALLO 눈 한 쌍 (굵은 잉크 테두리 + 흰자 + 왼쪽으로 몰린 눈동자) */
function Eyes({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  const eye = (x: number) => (
    <G key={x}>
      <Ellipse cx={x} cy={0} rx={4.1} ry={5.4} fill={INK} />
      <Ellipse cx={x + 0.35} cy={-0.1} rx={2.75} ry={4} fill="#fff" />
      <Ellipse cx={x - 0.55} cy={0.15} rx={2.15} ry={3.25} fill={INK} />
    </G>
  );
  return <G transform={`translate(${cx} ${cy}) scale(${s})`}>{[eye(-4.6), eye(4.6)]}</G>;
}

export type BrandIconName = 'coin' | 'target' | 'bolt' | 'flag';

export function BrandIcon({ name, size = 30 }: { name: BrandIconName; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {name === 'coin' && (
        <>
          <Circle cx={24} cy={24} r={19} fill="#FFE200" stroke={INK} strokeWidth={2.8} />
          <Circle cx={24} cy={24} r={13.5} fill="none" stroke={INK} strokeWidth={1.6} />
          <G transform={`translate(14 15.5) scale(${20 / 426.31})`}>
            <Path d={SYMBOL} fill="#493087" stroke={INK} strokeWidth={22} />
          </G>
        </>
      )}
      {name === 'target' && (
        <>
          <Circle cx={22} cy={26} r={18} fill="#C9BBF7" stroke={INK} strokeWidth={2.8} />
          <Circle cx={22} cy={26} r={11.5} fill="#fff" stroke={INK} strokeWidth={2.4} />
          <Circle cx={22} cy={26} r={5.5} fill="#493087" stroke={INK} strokeWidth={2} />
          <Path d="M22 26 40 8" stroke={INK} strokeWidth={2.8} strokeLinecap="round" />
          <Path d="M36 6l6-1-1 6-4 1z" fill="#FFE200" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <Eyes cx={22} cy={37.5} s={0.62} />
        </>
      )}
      {name === 'bolt' && <Path d="M27 4 10 27h12l-3 17 19-26H26l3-14z" fill="#FFE200" stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
      {name === 'flag' && (
        <>
          <Path d="M11 6v38" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          <Path d="M12 8c6-3 11 2 17 0s9-2 11 0v17c-2-2-5-2-11 0s-11-3-17 0z" fill="#F2A8BA" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
          <Eyes cx={26} cy={16} s={0.78} />
          <Path d="M8 44h7" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
