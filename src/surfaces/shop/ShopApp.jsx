import React from 'react';
import { T, L, css, val } from '../../runtime/tpl.js';
import { Analytics } from './Analytics.jsx';
import { Appointments } from './Appointments.jsx';
import { Checkin } from './Checkin.jsx';
import { Approvals } from './Approvals.jsx';
import { Customer } from './Customer.jsx';
import { Customers } from './Customers.jsx';
import { Empty } from './Empty.jsx';
import { Estimate } from './Estimate.jsx';
import { Fleet } from './Fleet.jsx';
import { Followups } from './Followups.jsx';
import { Inbox } from './Inbox.jsx';
import { LoanersHost } from './LoanersHost.jsx';
import { ShopHost } from './ShopHost.jsx';
import { ShopSettingsLive } from './ShopSettingsLive.jsx';
import { TeamLive } from './TeamLive.jsx';
import { LAUNCH } from '../../state/options.js';
import { Oil } from './Oil.jsx';
import { Overview } from './Overview.jsx';
import { Parts } from './Parts.jsx';
import { Sales } from './Sales.jsx';
import { Schedule } from './Schedule.jsx';
import { Settings } from './Settings.jsx';
import { Techs } from './Techs.jsx';
import { Tires } from './Tires.jsx';

export function ShopApp({ vm }) {
  return (
    <>
      <div style={css('display:flex;height:800px')}>
        <div
          style={css(
            'width:216px;flex:0 0 216px;border-right:1px solid rgba(235,235,245,.07);padding:22px 14px;display:flex;flex-direction:column;gap:2px',
          )}
        >
          <div style={css('display:flex;align-items:center;gap:10px;padding:0 10px 18px')}>
            <img src="/uploads/revyn.png" alt="Revyn" style={css('height:10px;width:auto;display:block')} />
            <div style={css('font-size:12px;color:rgba(235,235,245,.5)')}>Manti, UT</div>
          </div>
          {L(vm.sideNav).map((n, _i) => (
            <React.Fragment key={_i}>
              {n?.divider ? (
                <div style={css('font-family:var(--data-font,inherit);font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(235,235,245,.3);padding:18px 10px 6px')}>
                  Preview · sample data
                </div>
              ) : null}
              <div onClick={n?.go} style={css(n?.style + (n?.preview ? ';opacity:.6' : ''))}>
                <div style={css('display:flex;opacity:.8')}>
                  <svg viewBox="0 0 24 24" style={css('width:16px;height:16px;display:block;flex:0 0 auto')}>
                    <path
                      d={n?.d}
                      style={css('fill:none;stroke:currentColor;stroke-width:1.6px;stroke-linecap:round;stroke-linejoin:round')}
                    />
                  </svg>
                </div>
                <div style={css('flex:1')}>{T(n?.label)}</div>
                {n?.count ? (
                  <>
                    <div style={css(n?.countStyle)}>{T(n?.count)}</div>
                  </>
                ) : null}
              </div>
            </React.Fragment>
          ))}
          <div style={css('flex:1')} />
          <div style={css('display:flex;align-items:center;gap:10px;padding:10px')}>
            <div
              style={css(
                'width:30px;height:30px;border-radius:15px;background:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:11px',
              )}
            >
              {T(vm.staffInitials)}
            </div>
            <div style={css('flex:1;min-width:0')}>
              <div style={css('font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{T(vm.staffName)}</div>
              <div style={css('font-size:11px;color:rgba(235,235,245,.4)')}>{T(vm.staffRole)}</div>
            </div>
            {vm.signOut ? (
              <div onClick={vm.signOut} title="Sign out" style={css('font-size:11px;color:rgba(235,235,245,.4);cursor:pointer;padding:4px 0')} className="px3">
                Sign out
              </div>
            ) : null}
          </div>
        </div>
        <div style={css('flex:1;min-width:0;overflow-y:auto;padding:30px 34px')} className="hidescroll">
          {vm.dOverview && !LAUNCH ? <Overview vm={vm} /> : null}
          {vm.dApprovals ? <Approvals vm={vm} /> : null}
          {vm.dEstimate ? <Estimate vm={vm} /> : null}
          {vm.dInbox ? <Inbox vm={vm} /> : null}
          {vm.dSales ? <Sales vm={vm} /> : null}
          {vm.dTires ? <Tires vm={vm} /> : null}
          {vm.dLoaners ? <LoanersHost /> : null}
          {vm.dAnalytics ? <Analytics vm={vm} /> : null}
          {vm.dSchedule && !LAUNCH ? <Schedule vm={vm} /> : null}
          {LAUNCH && (vm.dAppointments || vm.dCustomers || vm.dOverview || vm.dSchedule || vm.dTechs) ? <ShopHost page={vm.dOverview ? 'overview' : vm.dSchedule ? 'schedule' : vm.dTechs ? 'technicians' : vm.dCustomers ? 'customers' : 'appointments'} goAppointments={(vm.sideNav.find((n) => n.label === 'Appointments') || {}).go} goCheckin={vm.goCheckin} goLoaners={(vm.sideNav.find((n) => n.label === 'Loaners') || {}).go} /> : null}
          {vm.dAppointments && !LAUNCH ? <Appointments vm={vm} /> : null}
          {vm.dCheckin ? <Checkin vm={vm} /> : null}
          {vm.dCustomers && !LAUNCH ? <Customers vm={vm} /> : null}
          {vm.dCustomer ? <Customer vm={vm} /> : null}
          {vm.dParts ? <Parts vm={vm} /> : null}
          {vm.dTechs && !LAUNCH ? <Techs vm={vm} /> : null}
          {vm.dSettings ? (LAUNCH ? <ShopSettingsLive /> : <Settings vm={vm} />) : null}
          {vm.dTeam ? <TeamLive /> : null}
          {vm.dFollowups ? <Followups vm={vm} /> : null}
          {vm.dFleet ? <Fleet vm={vm} /> : null}
          {vm.dOil ? <Oil vm={vm} /> : null}
          {vm.dEmpty ? <Empty vm={vm} /> : null}
        </div>
      </div>
    </>
  );
}
