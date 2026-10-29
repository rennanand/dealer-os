import React from 'react';
import { css } from '../../runtime/tpl.js';

// Empty states for a customer with no vehicle on file yet. Same page titles as the full
// screens, one short line, and a single action where there is one.

const TITLE = 'font-size:30px;font-weight:600;letter-spacing:-.9px';
const PAGE = 'animation:sIn .28s ease;padding:calc(var(--sat) + 11px) 0 112px;min-height:100%;display:flex;flex-direction:column';
const BODY = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 34px 60px';
const H = 'font-size:22px;font-weight:600;letter-spacing:-.5px;line-height:1.2;text-wrap:pretty';
const P = 'font-size:13.5px;line-height:1.55;color:rgba(235,235,245,.5);margin-top:10px;max-width:280px;text-wrap:pretty';
const CTA = 'margin-top:22px;padding:13px 22px;border-radius:12px;background:#fff;color:#000;font-size:13px;font-weight:600;cursor:pointer';
const LINK = 'margin-top:22px;font-size:13px;font-weight:500;color:#fff;cursor:pointer';

function Page({ title, children }) {
  return (
    <div style={css(PAGE)}>
      {title ? <div style={css('padding:0 22px;' + TITLE)}>{title}</div> : null}
      <div style={css(BODY)}>{children}</div>
    </div>
  );
}

export function HomeEmpty({ vm }) {
  return (
    <div style={css(PAGE)}>
      <div style={css('padding:0 22px;display:flex;justify-content:space-between;align-items:center')}>
        <div style={css('display:flex;flex-direction:column;gap:9px')}>
          <img src="/uploads/revyn.png" alt="Revyn" style={css('height:11px;width:auto;display:block;opacity:.92')} />
          <div style={css('font-size:13.5px;color:rgba(235,235,245,.5)')}>{vm.greeting || 'Welcome.'}</div>
        </div>
        <div onClick={vm.goAccount} style={css('width:34px;height:34px;border-radius:17px;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.07));backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 -1px 0 rgba(0,0,0,.25),0 8px 20px -8px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;cursor:pointer')}>
          {vm.initials || '—'}
        </div>
      </div>
      <div style={css(BODY)}>
        <div style={css(H)}>Add your vehicle to get started.</div>
        <div style={css(P)}>Service updates, photos from your technician, and every record in one place.</div>
        <div onClick={vm.addVehicle} style={css(CTA)}>Add a vehicle</div>
        <div onClick={vm.goBook} style={css(LINK + ';color:rgba(235,235,245,.5)')}>Or book a visit first</div>
      </div>
    </div>
  );
}

export function GarageEmpty({ vm }) {
  return (
    <Page title="Vehicles">
      <div style={css(H)}>No vehicles yet.</div>
      <div style={css(P)}>Add one with its plate or VIN. If RyGuys has serviced it before, its history comes with it.</div>
      <div onClick={vm.addVehicle} style={css(CTA)}>Add a vehicle</div>
    </Page>
  );
}

export function ServiceEmpty({ vm }) {
  return (
    <Page title="Service">
      <div style={css(H)}>Nothing scheduled.</div>
      <div style={css(P)}>Book a visit and this is where you will follow it, from check-in to pickup.</div>
      <div onClick={vm.goBook} style={css(CTA)}>Book a visit</div>
    </Page>
  );
}

export function HealthEmpty({ vm }) {
  return (
    <Page title="Vehicle Health">
      <div style={css(H)}>Fills in after your first inspection.</div>
      <div style={css(P)}>Tires, brakes, battery and fluids, measured by a technician at your visit. Nothing here is read from the car.</div>
      <div onClick={vm.goBook} style={css(LINK)}>Book an inspection</div>
    </Page>
  );
}

export function HistoryEmpty() {
  return (
    <Page title="History">
      <div style={css(H)}>No visits yet.</div>
      <div style={css(P)}>Each visit is saved here with the work done, the photos, and the receipt.</div>
    </Page>
  );
}

export function MessagesEmpty({ vm }) {
  return (
    <Page title="Messages">
      <div style={css(H)}>No messages yet.</div>
      <div style={css(P)}>Your service advisor and technician write here. You can start the conversation any time.</div>
      <div onClick={vm.startMessage} style={css(CTA)}>Message RyGuys</div>
    </Page>
  );
}
