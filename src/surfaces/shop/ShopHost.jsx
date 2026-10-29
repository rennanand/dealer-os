import React from 'react';
import { LogicHost } from '../../runtime/LogicHost.jsx';
import { ShopLogic } from '../../state/shopLogic.js';
import { CustomersLive } from './CustomersLive.jsx';
import { AppointmentsLive } from './AppointmentsLive.jsx';
import { OverviewLive } from './OverviewLive.jsx';
import { ScheduleLive } from './ScheduleLive.jsx';
import { TechniciansLive } from './TechniciansLive.jsx';
import { Inbox } from './Inbox.jsx';
import { Approvals } from './Approvals.jsx';
import { Followups } from './Followups.jsx';
import { Analytics } from './Analytics.jsx';
import { TiresLive } from './TiresLive.jsx';
import { css } from '../../runtime/tpl.js';

/** Customers and Appointments run on real records, separate from the demo view-model.
 *  One logic instance serves both pages so "Book visit" on a customer opens the form on Appointments. */
export function ShopHost({ page, goAppointments, goCheckin, goLoaners, goInbox }) {
  return <LogicHost Logic={ShopLogic}>{(vm) => <Page vm={vm} page={page} goAppointments={goAppointments} goCheckin={goCheckin} goLoaners={goLoaners} goInbox={goInbox} />}</LogicHost>;
}
function Page({ vm, page, goAppointments, goCheckin, goLoaners, goInbox }) {
  const wantInbox = vm.inbox.goInboxFlag;
  React.useEffect(() => { if (wantInbox) { vm.inbox.clearGoInbox(); if (goInbox) goInbox(); } }, [wantInbox]);
  const booking = page === 'customers' && !!vm.newAppt;
  React.useEffect(() => { if (booking && goAppointments) goAppointments(); }, [booking]);
  if (page === 'schedule') return <ScheduleLive vm={vm} />;
  if (page === 'technicians') return <TechniciansLive vm={vm} />;
  if (page === 'approvals') return <Approvals vm={{ queueFull: vm.approvals.queueFull, estSel: vm.approvals.estSel, sendReminder: vm.approvals.sendReminder }} />;
  if (page === 'followups') return <Followups vm={vm.followups} />;
  if (page === 'analytics') return <Analytics vm={vm.reports} />;
  if (page === 'tires') return <TiresLive vm={vm} />;
  if (page === 'inbox') {
    const ib = vm.inbox;
    if (ib.none) return (
      <div style={css('animation:sIn .28s ease')}>
        <div style={css('font-size:32px;font-weight:600;letter-spacing:-1px')}>Inbox</div>
        <div style={css('padding:48px 20px;text-align:center;font-size:13px;color:rgba(235,235,245,.45);line-height:1.6')}>No messages yet.<br />Customers write from the app; replies land on their phone.</div>
      </div>
    );
    const t = ib.thread || { who: '', initials: '', context: '', state: '', stateColor: '', msgs: [], placeholder: 'Reply' };
    return <Inbox vm={{ inboxSections: ib.sections, dThread: t, dReply: ib.reply, onDReply: ib.onReply, onDReplyKey: ib.onReplyKey, sendDReply: ib.send }} />;
  }
  if (page === 'overview') return <OverviewLive vm={vm} goCheckin={goCheckin} goAppointments={goAppointments} goLoaners={goLoaners} />;
  return page === 'customers' && !booking ? <CustomersLive vm={vm} /> : <AppointmentsLive vm={vm} />;
}
