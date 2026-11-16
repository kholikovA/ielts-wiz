import React, { useEffect, useState } from 'react';
import Icon from '../components/ui/icons';
import { HubLink } from './ui';
import { isComplete } from './homework';
import { slotTime } from './schedule/timetable';
import {
  greetings, MOTIVATION, dailyIndex, nextSlot, sessionName, sessionTip, dayLabel, countdown,
} from './welcome';
import './welcome.css';

const ROTATE_MS = 7000;
const HOUR = 3600000;

function useNow(everyMs) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

// The next session: the weekly timetable first, then a one-off class session.
function upcoming(slots, session, now) {
  const hit = nextSlot(slots, now);
  if (hit) {
    return {
      ...hit,
      name: sessionName(hit.slot),
      where: [hit.slot.class_name, `${dayLabel(hit.start, now)} ${slotTime(hit.slot)}`].filter(Boolean).join(' · '),
      pending: hit.slot.pending,
    };
  }
  if (!session) return null;
  const start = new Date(session.held_at);
  if (start <= now) return null;
  const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return {
    slot: null, start, end: start, live: false,
    name: session.topic || 'Class',
    where: [session.classes?.name, `${dayLabel(start, now)} ${time}`].filter(Boolean).join(' · '),
  };
}

function Greeting({ name }) {
  const [turn, setTurn] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTurn((t) => t + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, []);
  const heads = greetings(name);
  const line = MOTIVATION[(dailyIndex() + turn) % MOTIVATION.length];
  return (
    <div className="hero-greet">
      {/* Re-keyed each turn so the text fades in again. */}
      <div className="hero-greet-turn" key={turn}>
        <h1>{heads[turn % heads.length]}</h1>
        <p>{line}</p>
      </div>
    </div>
  );
}

export default function DashboardHero({ name, slots, session, homework }) {
  const now = useNow(1000);
  const next = upcoming(slots, session, now);
  const dueBefore = next
    ? homework.filter((a) => a.due_at && !isComplete(a.status) && new Date(a.due_at) > now && new Date(a.due_at) <= next.start).length
    : 0;
  const soon = next && !next.live && next.start - now < HOUR;

  return (
    <div className="dash3-level hero">
      <span className="dash3-eyebrow">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      <Greeting name={name} />
      {next ? (
        <HubLink to="/schedule" className={`hero-session${next.live ? ' is-live' : ''}${soon ? ' is-soon' : ''}`}>
          <span className="hero-session-label">
            {next.live ? <><i className="hero-live-dot" /> Happening now</> : <><Icon name="calendar" size={13} /> Next session</>}
          </span>
          <strong className="hero-session-name">{next.name}</strong>
          <span className="hero-session-where">{next.where}{next.pending ? ' · to be confirmed' : ''}</span>
          <span className="hero-count" role="timer" aria-label={next.live ? 'Time left' : 'Time until it starts'}>
            <small>{next.live ? 'Ends in' : 'Starts in'}</small>
            <span className="hero-count-cells">
              {countdown((next.live ? next.end : next.start) - now).map((c) => (
                <span key={c.unit} className="hero-cell"><b>{String(c.value).padStart(2, '0')}</b><i>{c.unit}</i></span>
              ))}
            </span>
          </span>
          <span className="hero-tip"><Icon name="lightbulb" size={14} /><span>{sessionTip(next.slot, { dueBefore, live: next.live })}</span></span>
        </HubLink>
      ) : (
        <div className="hero-session hero-session--none">
          <span className="hero-session-label"><Icon name="calendar" size={13} /> Next session</span>
          <span className="hero-session-where">Nothing on your timetable yet. Use the time to get ahead on homework.</span>
        </div>
      )}
    </div>
  );
}
