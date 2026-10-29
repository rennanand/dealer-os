import React from 'react';
import { LogicHost } from '../../runtime/LogicHost.jsx';
import { ShopLogic } from '../../state/shopLogic.js';
import { CustomersLive } from './CustomersLive.jsx';
import { AppointmentsLive } from './AppointmentsLive.jsx';
import { OverviewLive } from './OverviewLive.jsx';
import { ScheduleLive } from './ScheduleLive.jsx';

/** Customers and Appointments run on real records, separate from the demo view-model.
 *  One logic instance serves both pages so "Book visit" on a customer opens the form on Appointments. */
export function ShopHost({ page, goAppointments, goCheckin, goLoaners }) {
  return <LogicHost Logic={ShopLogic}>{(vm) => <Page vm={vm} page={page} goAppointments={goAppointments} goCheckin={goCheckin} goLoaners={goLoaners} />}</LogicHost>;
}
function Page({ vm, page, goAppointments, goCheckin, goLoaners }) {
  if (page === 'schedule') return <ScheduleLive vm={vm} />;
  if (page === 'overview') return <OverviewLive vm={vm} goCheckin={goCheckin} goAppointments={goAppointments} goLoaners={goLoaners} />;
  const booking = page === 'customers' && !!vm.newAppt;
  React.useEffect(() => { if (booking && goAppointments) goAppointments(); }, [booking]);
  return page === 'customers' && !booking ? <CustomersLive vm={vm} /> : <AppointmentsLive vm={vm} />;
}
