import React from 'react';
import { T, L, css } from '../../runtime/tpl.js';

// Tesla-flat: black canvas, charcoal cards, title + chevron rows. No gradients, borders or blur in HTML;
// the only glass is the native iOS tab bar (GlassTabs.swift, UIGlassEffect).
const CARD = 'background:#141416;border-radius:16px';
const ROW = 'display:flex;align-items:center;gap:16px;padding:18px 0;cursor:pointer';
const ICON = 'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round';
const Chevron = () => (
  <svg viewBox="0 0 24 24" style={css('width:16px;height:16px;display:block;flex:0 0 auto;color:rgba(235,235,245,.3)')}><path d="M9 6l6 6-6 6" style={css(ICON)} /></svg>
);
const colorOf = (s) => ((s || '').match(/color:\s*([^;]+)/) || [])[1] || '#3d8bfd';

export function Home({ vm }) {
  const rows = L(vm.tabs).filter((t) => t && t.label && !/home/i.test(t.label));
  return (
    <div style={css('animation:sIn .28s ease;padding:calc(var(--sat) + 10px) 0 120px')}>
      <div style={css('padding:0 22px;display:flex;justify-content:space-between;align-items:flex-start')}>
        <div style={css('min-width:0')}>
          <div onClick={vm.multiCar ? vm.nextCar : null} style={css('display:flex;align-items:center;gap:10px;cursor:' + (vm.multiCar ? 'pointer' : 'default'))}>
            <div style={css('font-size:28px;font-weight:600;letter-spacing:-.6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(vm.car0?.name)}</div>
            {vm.multiCar ? <svg viewBox="0 0 24 24" style={css('width:18px;height:18px;display:block;color:rgba(235,235,245,.6)')}><path d="M6 9l6 6 6-6" style={css(ICON)} /></svg> : null}
          </div>
          <div style={css('font-size:14px;color:rgba(235,235,245,.55);margin-top:8px')}>{T(vm.car0?.sub)}</div>
          <div style={css('font-size:15px;font-weight:500;margin-top:6px;color:' + colorOf(vm.homeKickerStyle))}>{T(vm.homeKicker)}</div>
        </div>
        <div style={css('display:flex;align-items:center;gap:4px;background:#141416;border-radius:22px;padding:4px;flex:0 0 auto;margin-top:2px')}>
          <div onClick={vm.goUpdates} style={css('width:38px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;color:#fff')}>
            <svg viewBox="0 0 24 24" style={css('width:19px;height:19px;display:block')}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" style={css(ICON)} /></svg>
            {vm.hasUnread ? <span style={css('position:absolute;top:7px;right:9px;width:7px;height:7px;border-radius:4px;background:#e0312b;box-shadow:0 0 0 2px #141416')} /> : null}
          </div>
          <div onClick={vm.goAccount} style={css('width:36px;height:36px;border-radius:18px;background:#2a2a2e;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;letter-spacing:.3px;cursor:pointer;color:#fff')}>{vm.initials || 'R'}</div>
        </div>
      </div>

      <div id="car-strip" onScroll={vm.onHeroScroll} style={css('display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin-top:4px;height:236px')} className="hidescroll">
        {L(vm.myCars).map((car, _i) => <div key={_i} style={css('flex:0 0 100%;scroll-snap-align:start;height:236px')} />)}
      </div>
      {vm.multiCar ? (
        <div style={css('display:flex;justify-content:center;gap:6px;margin-top:-6px')}>{L(vm.dots).map((d, _i) => <div key={_i} style={css(d?.style)} />)}</div>
      ) : null}

      <div style={css('padding:10px 22px 0;display:grid;grid-template-columns:repeat(4,1fr)')}>
        {L(vm.shortcuts).map((q, _i) => (
          <div key={_i} onClick={q?.go} style={css('display:flex;flex-direction:column;align-items:center;gap:9px;padding:10px 0;cursor:pointer;color:#fff')} className="px3">
            <svg viewBox="0 0 24 24" style={css('width:26px;height:26px;display:block')}><path d={q?.d} style={css(ICON)} /></svg>
            <div style={css('font-size:11px;color:rgba(235,235,245,.55)')}>{T(q?.label)}</div>
          </div>
        ))}
      </div>

      <div style={css(CARD + ';margin:18px 16px 0;overflow:hidden')}>
        <div onClick={vm.homeGo} style={css('display:flex;align-items:center;gap:16px;padding:20px 18px;cursor:pointer')}>
          {vm.homeRings ? (
            <div style={css('width:52px;height:52px;flex:0 0 auto;position:relative')}>
              <svg viewBox="0 0 120 120" style={css('width:52px;height:52px;display:block;transform:rotate(-90deg)')}>
                <circle cx="60" cy="60" r="54" style={css('fill:none;stroke:rgba(255,255,255,.12);stroke-width:6')} />
                <circle cx="60" cy="60" r="54" style={css('fill:none;stroke:' + colorOf(vm.homeKickerStyle) + ';stroke-width:6;stroke-linecap:round;stroke-dasharray:' + (3.39 * (Number(vm.statusPct) || 0)) + ' 1000;transition:stroke-dasharray .6s ease')} />
              </svg>
              <div style={css('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--data-font,inherit);font-size:11px;font-weight:500')}>{T(vm.statusPct)}%</div>
            </div>
          ) : null}
          <div style={css('flex:1;min-width:0')}>
            <div style={css('font-size:19px;font-weight:600;line-height:1.25;letter-spacing:-.3px;text-wrap:pretty')}>{T(vm.homeTitle)}</div>
            <div style={css('font-size:13.5px;line-height:1.4;color:rgba(235,235,245,.5);margin-top:4px')}>{T(vm.homeSub)}</div>
          </div>
          <Chevron />
        </div>
        {vm.homeCta ? (
          <div onClick={vm.homeGo} style={css('border-top:1px solid rgba(255,255,255,.06);padding:15px 18px;font-size:15px;font-weight:500;color:' + colorOf(vm.homeKickerStyle) + ';cursor:pointer')}>{T(vm.homeCta)}</div>
        ) : null}
      </div>

      <div style={css('margin:22px 22px 0')}>
        {rows.map((t, i) => (
          <div key={i} onClick={t.go} style={css(ROW + (i ? ';border-top:1px solid rgba(255,255,255,.06)' : ''))}>
            <svg viewBox="0 0 24 24" style={css('width:24px;height:24px;display:block;flex:0 0 auto;color:rgba(235,235,245,.8)')}><path d={t.d} style={css(ICON)} /></svg>
            <div style={css('flex:1;min-width:0')}>
              <div style={css('font-size:19px;font-weight:600;letter-spacing:-.3px')}>{T(t.label)}</div>
              {t.sub ? <div style={css('font-size:13.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(t.sub)}</div> : null}
            </div>
            <Chevron />
          </div>
        ))}
      </div>

      {vm.showExtras === false ? null : (
        <div style={css('margin:14px 22px 0')}>
          <div style={css('display:flex;justify-content:space-between;align-items:baseline;padding:12px 0 4px')}>
            <div style={css('font-size:13px;color:rgba(235,235,245,.45)')}>Next due</div>
            <div onClick={vm.goOdometer} style={css('font-size:13px;color:#3d8bfd;cursor:pointer')}>{T(vm.odoLabel)} · Update</div>
          </div>
          {L(vm.nextDue).map((r, _i) => (
            <div key={_i} onClick={r?.go} style={css('padding:14px 0;border-top:1px solid rgba(255,255,255,.06);cursor:pointer')}>
              <div style={css('display:flex;justify-content:space-between;align-items:baseline;gap:12px')}>
                <div style={css('font-size:15px;font-weight:500')}>{T(r?.name)}</div>
                <div style={css(`font-size:13px;color:${r?.c ?? 'rgba(235,235,245,.5)'}`)}>{T(r?.due)}</div>
              </div>
              <div style={css('margin-top:9px;height:3px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden')}><div style={css(r?.bar)} /></div>
            </div>
          ))}
          {vm.showPlans === false ? null : (
            <>
              <div onClick={vm.goCare} style={css(ROW + ';border-top:1px solid rgba(255,255,255,.06)')}>
                <div style={css('flex:1')}><div style={css('font-size:17px;font-weight:600')}>RyGuys Care</div><div style={css('font-size:13.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.careSub)}</div></div>
                <div style={css(vm.careTagStyle)}>{T(vm.careTag)}</div><Chevron />
              </div>
              <div onClick={vm.goRewards} style={css(ROW + ';border-top:1px solid rgba(255,255,255,.06)')}>
                <div style={css('flex:1')}><div style={css('font-size:17px;font-weight:600')}>{T(vm.pointsLabel)}</div><div style={css('font-size:13.5px;color:rgba(235,235,245,.5);margin-top:3px')}>{T(vm.rewardsSub)}</div></div>
                <Chevron />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
