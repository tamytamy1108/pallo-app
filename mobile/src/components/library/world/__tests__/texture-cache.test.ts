/**
 * soft-canvas 칠하기 미루기 + 그림 기억칸: 같은 그리기면 기억한 픽셀을 쓰고, 다르거나 뒤에 바뀌면 다시 칠해요.
 */
import { SoftCanvas, SoftPath2D } from '../soft-canvas';
import { clearTextureMemory } from '../texture-cache';

function draw(c: SoftCanvas, color = '#3a7bd5') {
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, c.height);
  sky.addColorStop(0, '#86C1EA');
  sky.addColorStop(1, '#EEF5FA');
  g.fillStyle = sky;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = color;
  g.beginPath();
  g.arc(40, 40, 20, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)';
  g.lineWidth = 3;
  g.stroke(new SoftPath2D('M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z'));
  return c;
}
/** 기억칸 없이 그냥 칠한 결과 (비교용) */
function fresh(fn: (c: SoftCanvas) => void, w = 96, h = 80) {
  clearTextureMemory();
  const c = new SoftCanvas(w, h);
  fn(c);
  const out = c.px.slice();
  clearTextureMemory();
  return out;
}

beforeEach(() => clearTextureMemory());

describe('텍스처 그림 기억칸', () => {
  it('같은 그리기는 기억한 픽셀을 같이 써요 (다시 칠하지 않아요)', () => {
    const a = draw(new SoftCanvas(96, 80)).px;
    const b = draw(new SoftCanvas(96, 80)).px;
    expect(b).toBe(a);
  });

  it('기억에서 꺼낸 그림에 더 칠해도 기억칸 · 다른 그림판은 그대로예요', () => {
    const a = draw(new SoftCanvas(96, 80));
    const before = a.px.slice();
    const b = draw(new SoftCanvas(96, 80));
    const g = b.getContext('2d');
    g.fillStyle = '#ff0000';
    g.fillRect(0, 0, 30, 30);
    expect(b.px).not.toBe(a.px);
    expect(a.px).toEqual(before);
    expect(draw(new SoftCanvas(96, 80)).px).toEqual(before);
  });

  it('명령이 다르면 다시 칠해요', () => {
    const a = draw(new SoftCanvas(96, 80)).px;
    const b = draw(new SoftCanvas(96, 80), '#e33').px;
    expect(b).not.toBe(a);
    expect(b).not.toEqual(a);
    expect(b).toEqual(fresh((c) => draw(c, '#e33')));
  });

  it('칠한 뒤에 경로 · 그라데이션을 바꿔도 이미 칠한 건 그대로예요', () => {
    const run = (c: SoftCanvas, mutate: boolean) => {
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 96, 0);
      gr.addColorStop(0, '#000');
      gr.addColorStop(1, '#fff');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(10, 10);
      g.lineTo(80, 10);
      g.lineTo(50, 70);
      g.fill();
      if (mutate) {
        gr.addColorStop(0.5, '#f00');
        g.lineTo(5, 70);
        g.closePath();
      }
    };
    const plain = fresh((c) => run(c, false));
    const c = new SoftCanvas(96, 80);
    run(c, true);
    expect(c.px).toEqual(plain);
  });

  it('붙여 쓴 그림판을 뒤에 다시 칠해도 이미 붙인 건 그대로예요', () => {
    const run = (dst: SoftCanvas, src: SoftCanvas, repaint: boolean) => {
      const s = src.getContext('2d');
      s.fillStyle = '#0a0';
      s.fillRect(0, 0, 20, 20);
      dst.getContext('2d').drawImage(src, 10, 10, 40, 40);
      if (repaint) {
        s.fillStyle = '#a00';
        s.fillRect(0, 0, 20, 20);
      }
    };
    const plain = fresh((d) => run(d, new SoftCanvas(20, 20), false));
    const dst = new SoftCanvas(96, 80);
    const src = new SoftCanvas(20, 20);
    run(dst, src, true);
    expect(dst.px).toEqual(plain);
    expect(src.px[0]).toBe(0xaa);
  });

  it('크기를 바꾸면 처음부터 (예전 명령은 버려요)', () => {
    const c = draw(new SoftCanvas(96, 80));
    c.width = 50;
    expect(c.px.length).toBe(50 * 80 * 4);
    expect(c.px.every((v) => v === 0)).toBe(true);
  });
});
