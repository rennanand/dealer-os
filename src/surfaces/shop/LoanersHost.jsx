import React from 'react';
import { LogicHost } from '../../runtime/LogicHost.jsx';
import { LoanersLogic } from '../../state/loanersLogic.js';
import { LoanersLive } from './LoanersLive.jsx';

/** The Loaners page runs on its own records, separate from the demo view-model. */
export function LoanersHost() {
  return <LogicHost Logic={LoanersLogic}>{(vm) => <LoanersLive vm={vm} />}</LogicHost>;
}
