import React from 'react';

// Shown by AuthProvider on every page when the device clock is far off (clockSkewOf):
// sign-in can't work until it's corrected, so say exactly how to fix it.
function amount(seconds) {
  const s = Math.abs(seconds);
  if (s >= 5400) return `about ${Math.round(s / 3600)} hours`;
  if (s >= 3000) return 'about an hour';
  return `about ${Math.max(5, Math.round(s / 60))} minutes`;
}

export default function ClockWarning({ skew: clockSkew }) {
  if (!clockSkew) return null;
  return (
    <div className="clock-warning" role="alert">
      <strong>Your device's clock is {amount(clockSkew)} {clockSkew > 0 ? 'ahead' : 'behind'}.</strong>
      <span>
        The site can't keep you signed in until the time is correct.
        {' '}On Windows: Settings, Time &amp; language, Date &amp; time: turn on <b>Set time automatically</b> and
        {' '}<b>Set time zone automatically</b> (or choose <b>(UTC+05:00) Tashkent</b>), then click <b>Sync now</b>.
        {' '}On a phone: Settings, Date &amp; time, turn on <b>Automatic</b>.
      </span>
      <button type="button" onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}
