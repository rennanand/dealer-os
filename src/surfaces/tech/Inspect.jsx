import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';

export function Inspect({ vm }) {
  return (
    <>
      <div style={css('animation:sIn .22s ease;height:100%;display:flex;flex-direction:column;padding:30px 34px')}>
        <div style={css('display:flex;align-items:center;gap:16px')}>
          <div
            onClick={vm.tgoJob}
            style={css('font-size:13px;color:#e0312b;cursor:pointer;display:inline-flex;align-items:center;gap:2px;font-weight:500')}
          >
            <svg viewBox="0 0 24 24" style={css('width:15px;height:15px;display:block;flex:0 0 auto')}>
              <path
                d="M15 6l-6 6 6 6"
                style={css('fill:none;stroke:currentColor;stroke-width:2px;stroke-linecap:round;stroke-linejoin:round')}
              />
            </svg>
            Inspection
          </div>
          <div style={css('flex:1')} />
          {L(vm.posDots).map((d, _i) => (
            <React.Fragment key={_i}>
              <div style={css(d?.style)}>{T(d?.l)}</div>
            </React.Fragment>
          ))}
        </div>
        <div style={css('display:flex;gap:28px;margin-top:22px;flex:1;min-height:0')}>
          <div style={css('flex:1;min-width:0;display:flex;flex-direction:column')}>
            <div style={css('font-size:14px;color:rgba(235,235,245,.5)')}>{T(vm.catName)}</div>
            <div style={css('font-size:38px;font-weight:600;letter-spacing:-1.2px;margin-top:4px')}>{T(vm.posName)}</div>
            {vm.hasMeasure ? (
              <>
                <div style={css('margin-top:22px;font-size:12px;color:rgba(235,235,245,.45)')}>{T(vm.measureLabel)}</div>
                <div style={css('margin-top:10px;display:flex;align-items:center;gap:14px')}>
                  <div
                    onClick={vm.decM}
                    style={css(
                      'width:64px;height:64px;border-radius:16px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:300;cursor:pointer',
                    )}
                    className="px0"
                  >
                    −
                  </div>
                  <div
                    style={css(
                      'flex:1;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);height:64px;display:flex;align-items:baseline;justify-content:center;gap:6px',
                    )}
                  >
                    <div
                      style={css(
                        'font-family:var(--data-font,inherit);font-size:38px;font-weight:500;letter-spacing:-.8px;line-height:64px',
                      )}
                    >
                      {T(vm.tfM)}
                    </div>
                    <div style={css('font-size:16px;color:rgba(235,235,245,.5)')}>{T(vm.unit)}</div>
                  </div>
                  <div
                    onClick={vm.incM}
                    style={css(
                      'width:64px;height:64px;border-radius:16px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:300;cursor:pointer',
                    )}
                    className="px0"
                  >
                    +
                  </div>
                </div>
              </>
            ) : null}
            {vm.hasPsi ? (
              <>
                <div style={css('margin-top:22px;display:flex;justify-content:space-between;align-items:baseline')}>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>Pressure · measured</div>
                  <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>
                    {'Door placard '}
                    {T(vm.placard)}
                    {' psi'}
                  </div>
                </div>
                <div style={css('margin-top:10px;display:flex;align-items:center;gap:14px')}>
                  <div
                    onClick={vm.decP}
                    style={css(
                      'width:64px;height:64px;border-radius:16px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:300;cursor:pointer',
                    )}
                    className="px0"
                  >
                    −
                  </div>
                  <div
                    style={css(
                      'flex:1;background:#141416;border-radius:16px;border:1px solid rgba(255,255,255,.06);height:64px;display:flex;align-items:baseline;justify-content:center;gap:6px',
                    )}
                  >
                    <div
                      style={css(
                        'font-family:var(--data-font,inherit);font-size:38px;font-weight:500;letter-spacing:-.8px;line-height:64px',
                      )}
                    >
                      {T(vm.tfPsi)}
                    </div>
                    <div style={css('font-size:16px;color:rgba(235,235,245,.5)')}>psi</div>
                  </div>
                  <div
                    onClick={vm.incP}
                    style={css(
                      'width:64px;height:64px;border-radius:16px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:300;cursor:pointer',
                    )}
                    className="px0"
                  >
                    +
                  </div>
                  <div onClick={vm.setPlacard} style={css(vm.placardStyle)}>
                    {T(vm.placardLabel)}
                  </div>
                </div>
                <div style={css('margin-top:22px;font-size:12px;color:rgba(235,235,245,.45)')}>TPMS sensor</div>
                <div style={css('margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px')}>
                  {L(vm.tpms).map((c, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={c?.pick} style={css(c?.style)}>
                        {T(c?.label)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : null}
            <div style={css('margin-top:22px;font-size:12px;color:rgba(235,235,245,.45)')}>Condition</div>
            <div style={css('margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px')}>
              {L(vm.conds).map((c, _i) => (
                <React.Fragment key={_i}>
                  <div onClick={c?.pick} style={css(c?.style)}>
                    {T(c?.label)}
                  </div>
                </React.Fragment>
              ))}
            </div>
            {vm.hasRotor ? (
              <>
                <div style={css('margin-top:22px;font-size:12px;color:rgba(235,235,245,.45)')}>Rotor</div>
                <div style={css('margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px')}>
                  {L(vm.rotors).map((c, _i) => (
                    <React.Fragment key={_i}>
                      <div onClick={c?.pick} style={css(c?.style)}>
                        {T(c?.label)}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : null}
            <div style={css('margin-top:22px;font-size:12px;color:rgba(235,235,245,.45)')}>Notes</div>
            <textarea
              value={val(vm.tfNote)}
              onChange={vm.onTfNote}
              placeholder="Optional. Customers see a plain-language version."
              style={css(
                'margin-top:10px;width:100%;min-height:80px;resize:none;background:#1c1c1e;border:none;border-radius:14px;padding:14px 16px;color:#fff;font-size:15px;line-height:1.5;outline:none;font-family:inherit',
              )}
            />
          </div>
          <div style={css('width:300px;flex:0 0 300px;display:flex;flex-direction:column')}>
            {vm.inspScene ? (
              <>
                <div className="sc-host-x" style={css('height:170px')}>
                  <service-scene scene={vm.inspScene} phase={vm.inspPhase} params={vm.inspParams} />
                </div>
              </>
            ) : null}
            <div style={css('font-size:12px;color:rgba(235,235,245,.45)')}>Photo</div>
            <div onClick={vm.tgoPhoto} style={css(vm.photoTileStyle)}>
              {vm.photoAdded ? (
                <>
                  <div
                    style={css('position:absolute;left:36%;top:28%;width:72px;height:72px;border:3px solid #e0312b;border-radius:50%')}
                  />
                  <div style={css('position:absolute;left:12px;bottom:10px;font-size:12px;color:#30d158;font-weight:500')}>
                    In customer report
                  </div>
                </>
              ) : null}
              {vm.noPhoto ? (
                <>
                  <div style={css('font-size:15px;font-weight:500')}>+ Add photo</div>
                </>
              ) : null}
            </div>
            <div style={css('flex:1')} />
            <div style={css('font-size:12px;line-height:1.6;color:rgba(235,235,245,.35)')}>{T(vm.savedHint)}</div>
            <div
              onClick={vm.saveInsp}
              style={css(
                'margin-top:14px;text-align:center;padding:20px 0;border-radius:14px;background:#fff;color:#000;font-size:16px;font-weight:500;cursor:pointer',
              )}
              className="px2"
            >
              {T(vm.saveLabel)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
