import React from 'react';
import { LogicHost } from '../../runtime/LogicHost.jsx';
import { ShopLogic } from '../../state/shopLogic.js';
import { CustomersLive } from './CustomersLive.jsx';
import { AppointmentsLive } from './AppointmentsLive.jsx';
import { OverviewLive } from './OverviewLive.jsx';
import { ScheduleLive } from './ScheduleLive.jsx';
import { TechniciansLive } from './TechniciansLive.jsx';
import { InboxLive } from './InboxLive.jsx';
import { EstimatesLive } from './EstimatesLive.jsx';
import { JobBoardLive } from './JobBoardLive.jsx';
import { PartsLive } from './PartsLive.jsx';
import { RegisterLive } from './RegisterLive.jsx';
import { SettingsLive } from './SettingsLive.jsx';
import { FleetLive } from './FleetLive.jsx';
import { MarketingLive } from './MarketingLive.jsx';
import { ReportsLive } from './ReportsLive.jsx';
import { Followups } from './Followups.jsx';
import { TiresLive } from './TiresLive.jsx';
import { css } from '../../runtime/tpl.js';

/** Customers and Appointments run on real records, separate from the demo view-model.
 *  One logic instance serves both pages so "Book visit" on a customer opens the form on Appointments. */
export function ShopHost({ page, goAppointments, goCheckin, goLoaners, goInbox, goEstimates }) {
  return <LogicHost Logic={ShopLogic}>{(vm) => <Page vm={vm} page={page} goAppointments={goAppointments} goCheckin={goCheckin} goLoaners={goLoaners} goInbox={goInbox} goEstimates={goEstimates} />}</LogicHost>;
}
function NotAllowed({ what }) {
  return <div style={css('animation:sIn .28s ease')}><div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>{what}</div><div style={css('padding:48px 20px;text-align:center;font-size:13px;color:rgba(235,235,245,.45);line-height:1.6')}>This page is for the owner and advisors. Ask the owner if you need it — it is a switch under Settings · Permissions.</div></div>;
}
function Page({ vm, page, goAppointments, goCheckin, goLoaners, goInbox, goEstimates }) {
  const wantInbox = vm.inbox.goInboxFlag;
  React.useEffect(() => { if (wantInbox) { vm.inbox.clearGoInbox(); if (goInbox) goInbox(); } }, [wantInbox]);
  const wantEst = vm.goEstimatesFlag;
  React.useEffect(() => { if (wantEst) { vm.clearGoEstimates(); if (goEstimates) goEstimates(); } }, [wantEst]);
  const booking = (page === 'customers' || page === 'followups' || page === 'schedule') && !!vm.newAppt;
  React.useEffect(() => { if (booking && goAppointments) goAppointments(); }, [booking]);
  if (page === 'schedule') return <ScheduleLive vm={vm} />;
  if (page === 'technicians') return <TechniciansLive vm={vm} />;
  if (page === 'approvals') return <EstimatesLive vm={vm} />;
  if (page === 'board') return <JobBoardLive vm={vm} />;
  if (page === 'parts') return <PartsLive vm={vm} />;
  if (page === 'register') return vm.can('payments') || vm.can('reports') ? <RegisterLive vm={vm} /> : <NotAllowed what="Payments" />;
  if (page === 'analytics' && !vm.can('reports')) return <NotAllowed what="Reports" />;
  if (page === 'settings') return <SettingsLive vm={vm} />;
  if (page === 'followups') return <Followups vm={vm.followups} />;
  if (page === 'analytics') return <ReportsLive vm={vm} />;
  if (page === 'fleet') return <FleetLive vm={vm} />;
  if (page === 'marketing') return <MarketingLive vm={vm} />;
  if (page === 'tires') return <TiresLive vm={vm} />;
  if (page === 'inbox') return <InboxLive vm={vm} />;
  if (page === 'overview') return <OverviewLive vm={vm} goCheckin={goCheckin} goAppointments={goAppointments} goLoaners={goLoaners} />;
  return page === 'customers' && !booking ? <CustomersLive vm={vm} /> : <AppointmentsLive vm={vm} />;
}
