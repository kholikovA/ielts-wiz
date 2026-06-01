import React from 'react';
import Icon from '../ui/icons';
import PageHeader from '../ui/PageHeader';

const TaskTrackPage = ({ track, onBack }) => (
  <div className="page-shell">
    <div className="page-section" style={{ maxWidth: '900px' }}>
      <button type="button" className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 'var(--space-5)' }}>
        <Icon name="arrowLeft" size={16} /> Hub
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, borderRadius: 'var(--r-md)',
          background: 'var(--badge-bg)', color: 'var(--purple-300)',
        }}>
          <Icon name={track.iconName} size={22} />
        </div>
        <span className="pill">{track.id}</span>
      </div>

      <PageHeader
        title={track.name}
        lead={track.tagline}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {track.modules.map((mod, i) => (
          <div key={i} className="card">
            <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
              {mod.title}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {mod.items.map((item, j) => (
                <span key={j} style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--answer-bg)',
                  color: 'var(--purple-300)',
                  border: '1px solid var(--purple-500-30)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel panel-info" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <Icon name="lightbulb" size={18} style={{ color: 'var(--amber-400)' }} />
          <strong style={{ color: 'var(--text-primary)' }}>Practice the patterns</strong>
        </div>
        <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
          These modules are reference packs — IELTS-targeted phrase banks you can drop into Writing and Speaking responses. Pair them with the relevant Level 2–3 topics for full drills.
        </p>
      </div>
    </div>
  </div>
);

export default TaskTrackPage;
