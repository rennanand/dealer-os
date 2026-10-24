import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import '../../components/car-hero.js';
import { Account } from './Account.jsx';
import { Approve } from './Approve.jsx';
import { Ask } from './Ask.jsx';
import { Book } from './Book.jsx';
import { Care } from './Care.jsx';
import { Checkin } from './Checkin.jsx';
import { Docs } from './Docs.jsx';
import { Findings } from './Findings.jsx';
import { Garage } from './Garage.jsx';
import { Health } from './Health.jsx';
import { HealthDetail } from './HealthDetail.jsx';
import { HistDetail } from './HistDetail.jsx';
import { History } from './History.jsx';
import { Home } from './Home.jsx';
import { Loaner } from './Loaner.jsx';
import { LoanerAgree } from './LoanerAgree.jsx';
import { LoanerCheckout } from './LoanerCheckout.jsx';
import { LoanerGuide } from './LoanerGuide.jsx';
import { LoanerReturn } from './LoanerReturn.jsx';
import { Messages } from './Messages.jsx';
import { Notifs } from './Notifs.jsx';
import { Odometer } from './Odometer.jsx';
import { Onboard } from './Onboard.jsx';
import { Pay } from './Pay.jsx';
import { Photos } from './Photos.jsx';
import { Pickup } from './Pickup.jsx';
import { Rate } from './Rate.jsx';
import { Reservation } from './Reservation.jsx';
import { Reserve } from './Reserve.jsx';
import { Rewards } from './Rewards.jsx';
import { Service } from './Service.jsx';
import { Shop } from './Shop.jsx';
import { Storage } from './Storage.jsx';
import { Testdrive } from './Testdrive.jsx';
import { Tires } from './Tires.jsx';
import { Trade } from './Trade.jsx';
import { Updates } from './Updates.jsx';
import { Valet } from './Valet.jsx';
import { Vehicle } from './Vehicle.jsx';

export function CustomerApp({ vm }) {
  return (
    <>
      <div
        style={css(
          "position:relative;height:100%;background:#000;color:#fff;overflow:hidden;font-family:var(--ui-font,'Geist'),'Helvetica Neue',Helvetica,Arial,sans-serif",
        )}
      >
        {vm.toast ? (
          <>
            <div
              style={css(
                'position:absolute;top:calc(var(--sat) + 9px);left:12px;right:12px;z-index:20;background:rgba(40,40,44,.92);backdrop-filter:blur(20px);border-radius:18px;padding:12px 14px;display:flex;gap:11px;align-items:center;animation:toastIn .35s cubic-bezier(.2,.8,.2,1);box-shadow:0 8px 30px rgba(0,0,0,.5)',
              )}
            >
              <div
                style={css(
                  'width:30px;height:30px;border-radius:7px;background:#fff;display:flex;align-items:center;justify-content:center;flex:0 0 auto',
                )}
              >
                <img src="/uploads/ryguys-logo-trim.png" alt="" style={css('height:12px;width:auto')} />
              </div>
              <div style={css('flex:1;min-width:0')}>
                <div style={css('display:flex;justify-content:space-between;font-size:11px;color:rgba(235,235,245,.5)')}>
                  <span>RyGuys</span>
                  <span>now</span>
                </div>
                <div style={css('font-size:13px;line-height:1.3;margin-top:2px')}>{T(vm.toast)}</div>
              </div>
            </div>{' '}
          </>
        ) : null}{' '}
        <div style={css(vm.heroStyle)}>
          <div ref={vm.heroInnerRef} style={css('height:100%;will-change:transform')}>
            <div className="sc-host-x" style={css('height:100%')}>
              <car-hero
                view={vm.heroView}
                paint={vm.heroPaint}
                zoom={vm.heroZoom}
                autorotate={vm.heroAuto}
                drag={'true'}
                model={'/uploads/hardtop.glb.txt /uploads/hardtop.obj'}
                swipeTarget={'#car-strip'}
              />
            </div>
          </div>
        </div>{' '}
        <div
          ref={vm.scrollRef}
          onScroll={vm.onContentScroll}
          style={css('position:absolute;inset:0;overflow-y:auto;overflow-x:hidden')}
          className="hidescroll"
        >
          {vm.pHome ? <Home vm={vm} /> : null}
          {vm.pGarage ? <Garage vm={vm} /> : null}
          {vm.pHealth ? <Health vm={vm} /> : null}
          {vm.pService ? <Service vm={vm} /> : null}
          {vm.pFindings ? <Findings vm={vm} /> : null}
          {vm.pPhotos ? <Photos vm={vm} /> : null}
          {vm.pApprove ? <Approve vm={vm} /> : null}
          {vm.pMessages ? <Messages vm={vm} /> : null}
          {vm.pPay ? <Pay vm={vm} /> : null}
          {vm.pPickup ? <Pickup vm={vm} /> : null}
          {vm.pBook ? <Book vm={vm} /> : null}
          {vm.pCheckin ? <Checkin vm={vm} /> : null}
          {vm.pLoaner ? <Loaner vm={vm} /> : null}
          {vm.pLoanerAgree ? <LoanerAgree vm={vm} /> : null}
          {vm.pLoanerCheckout ? <LoanerCheckout vm={vm} /> : null}
          {vm.pLoanerReturn ? <LoanerReturn vm={vm} /> : null}
          {vm.pLoanerGuide ? <LoanerGuide vm={vm} /> : null}
          {vm.pOnboard ? <Onboard vm={vm} /> : null}
          {vm.pHealthDetail ? <HealthDetail vm={vm} /> : null}
          {vm.pRate ? <Rate vm={vm} /> : null}
          {vm.pCare ? <Care vm={vm} /> : null}
          {vm.pRewards ? <Rewards vm={vm} /> : null}
          {vm.pValet ? <Valet vm={vm} /> : null}
          {vm.pOdometer ? <Odometer vm={vm} /> : null}
          {vm.pTires ? <Tires vm={vm} /> : null}
          {vm.pStorage ? <Storage vm={vm} /> : null}
          {vm.pHistory ? <History vm={vm} /> : null}
          {vm.pHistDetail ? <HistDetail vm={vm} /> : null}
          {vm.pShop ? <Shop vm={vm} /> : null}
          {vm.pVehicle ? <Vehicle vm={vm} /> : null}
          {vm.pReserve ? <Reserve vm={vm} /> : null}
          {vm.pReservation ? <Reservation vm={vm} /> : null}
          {vm.pTestdrive ? <Testdrive vm={vm} /> : null}
          {vm.pAsk ? <Ask vm={vm} /> : null}
          {vm.pTrade ? <Trade vm={vm} /> : null}
          {vm.pUpdates ? <Updates vm={vm} /> : null}
          {vm.pDocs ? <Docs vm={vm} /> : null}
          {vm.pNotifs ? <Notifs vm={vm} /> : null}
          {vm.pAccount ? <Account vm={vm} /> : null}
        </div>
        {vm.showTabs ? (
          <>
            <div
              style={css(
                'position:absolute;left:0;right:0;bottom:0;z-index:6;padding:9px 10px calc(var(--sab) + 9px);background:rgba(0,0,0,.9);backdrop-filter:blur(18px);border-top:1px solid rgba(235,235,245,.07);display:flex;gap:2px',
              )}
            >
              {L(vm.tabs).map((t, _i) => (
                <React.Fragment key={_i}>
                  <div
                    onClick={t?.go}
                    style={css(
                      'flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;padding:7px 0 3px;cursor:pointer;position:relative',
                    )}
                  >
                    <div style={css(t?.glyphStyle)}>
                      <svg viewBox="0 0 24 24" style={css('width:22px;height:22px;display:block')}>
                        <path
                          d={t?.d}
                          style={css(
                            'fill:none;stroke:currentColor;stroke-width:var(--icon-w,1.6px);stroke-linecap:round;stroke-linejoin:round',
                          )}
                        />
                      </svg>
                    </div>
                    <div style={css(t?.labelStyle)}>{T(t?.label)}</div>
                    {t?.badge ? (
                      <>
                        <div
                          style={css(
                            'position:absolute;top:4px;right:calc(50% - 14px);width:7px;height:7px;border-radius:4px;background:#e0312b',
                          )}
                        />
                      </>
                    ) : null}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
