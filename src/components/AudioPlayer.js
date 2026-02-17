import React, { useState, useEffect, useRef } from 'react';

const AudioPlayer = ({ testId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef(null);

  const audioUrl = `https://kholikova.github.io/80-listening-audios/TEST%20${testId}.mp3`;
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = (speed) => {
    audioRef.current.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))',
      marginBottom: '1.5rem',
    }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        controlsList="nodownload nofullscreen noremoteplayback"
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Time & Progress */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', minWidth: '45px' }}>
              {formatTime(currentTime)}
            </span>
            
            {/* Progress Bar */}
            <div
              onClick={handleSeek}
              style={{
                flex: 1,
                height: '6px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '3px',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'white',
                borderRadius: '3px',
                transition: 'width 0.1s linear',
              }} />
              <div style={{
                position: 'absolute',
                left: `${progressPercent}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', minWidth: '45px', textAlign: 'right' }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Speed Control */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
            }}
          >
            {playbackRate}x
          </button>
          
          {showSpeedMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '0.5rem',
              background: 'var(--card-bg)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 10,
            }}>
              {speeds.map(speed => (
                <button
                  key={speed}
                  onClick={() => changeSpeed(speed)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: playbackRate === speed ? 'var(--purple-600)' : 'transparent',
                    color: playbackRate === speed ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem', textAlign: 'center' }}>
        🎧 Listen carefully – you will hear the recording only once in the real test
      </p>
    </div>
  );
};

// ==================== TOOLTIP COMPONENT ====================

export default AudioPlayer;
