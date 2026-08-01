/**
 * 2D Flat Minimalist Web Controller Logic
 * Integrated with Capacitor Native Haptics (Real iPhone Taptic Engine support via Capacitor.Plugins.Haptics)
 */

document.addEventListener('DOMContentLoaded', () => {
  const screenContainer = document.getElementById('controller-screen');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const iconExpand = fullscreenBtn.querySelector('.expand');
  const iconCompress = fullscreenBtn.querySelector('.compress');

  const roomInput = document.getElementById('room-input');
  const joinBtn = document.getElementById('join-btn');
  const statusIndicator = document.getElementById('status-indicator');

  const joystickContainer = document.getElementById('joystick-container');
  const joystickThumb = document.getElementById('joystick-thumb');

  const btnA = document.getElementById('btn-a');
  const btnB = document.getElementById('btn-b');

  const iosTip = document.getElementById('ios-tip');
  const closeTipBtn = document.getElementById('close-tip');

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  let activeRoom = 'A8F2';
  let isDraggingJoystick = false;
  let joystickTouchId = null;

  let inputState = {
    room: activeRoom,
    joystick: { x: 0, y: 0, angle: 0, magnitude: 0 },
    buttons: { A: false, B: false }
  };

  /* -------------------------------------------------------------------------- */
  /* CAPACITOR & WEB HYBRID HAPTIC ENGINE                                       */
  /* -------------------------------------------------------------------------- */
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTactileImpulse(freq = 240) {
    initAudioContext();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.015);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } catch (e) {}
  }

  // Unified Haptic Function: Fires Capacitor Native iPhone Taptic Engine if available,
  // falling back to navigator.vibrate + Audio Tactile Impulse for browsers.
  function triggerCapacitorHaptic(style = 'HEAVY', duration = 200, audioFreq = 240) {
    // 1. Capacitor Native Taptic Engine (iOS & Android Native App)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
      try {
        window.Capacitor.Plugins.Haptics.impact({ style: style });
        return;
      } catch (err) {
        console.log('Capacitor impact fallback:', err);
      }
    }

    // 2. Audio-Tactile Impulse (Browser Fallback)
    playTactileImpulse(audioFreq);

    // 3. Web Vibration API (Android Browser Fallback)
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch (err) {}
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Universal Mobile Fullscreen + Orientation Lock                             */
  /* -------------------------------------------------------------------------- */
  function toggleFullscreen() {
    triggerCapacitorHaptic('HEAVY', [150, 50, 150], 300);

    const docEl = document.documentElement;
    const isFS = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      screenContainer.classList.contains('fullscreen-active')
    );

    if (!isFS) {
      screenContainer.classList.add('fullscreen-active');
      iconExpand.classList.add('hidden');
      iconCompress.classList.remove('hidden');

      let nativePromise = null;
      if (docEl.requestFullscreen) {
        nativePromise = docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        nativePromise = Promise.resolve(docEl.webkitRequestFullscreen());
      } else if (docEl.mozRequestFullScreen) {
        nativePromise = Promise.resolve(docEl.mozRequestFullScreen());
      } else if (docEl.msRequestFullscreen) {
        nativePromise = Promise.resolve(docEl.msRequestFullscreen());
      }

      if (nativePromise && nativePromise.catch) {
        nativePromise.catch(() => {});
      }

      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      } else if (screen.lockOrientation) {
        screen.lockOrientation('landscape');
      }

      if (isIOS && !window.navigator.standalone && !window.Capacitor) {
        iosTip.classList.remove('hidden');
      }
    } else {
      screenContainer.classList.remove('fullscreen-active');
      iconExpand.classList.remove('hidden');
      iconCompress.classList.add('hidden');

      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }

      if (screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch (e) {}
      }
    }
  }

  fullscreenBtn.addEventListener('click', toggleFullscreen);
  fullscreenBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    toggleFullscreen();
  });

  if (closeTipBtn) {
    closeTipBtn.addEventListener('click', () => {
      iosTip.classList.add('hidden');
    });
  }

  document.addEventListener('fullscreenchange', () => {
    const isFS = !!document.fullscreenElement;
    if (!isFS) {
      screenContainer.classList.remove('fullscreen-active');
      iconExpand.classList.remove('hidden');
      iconCompress.classList.add('hidden');
    }
  });

  /* -------------------------------------------------------------------------- */
  /* Lobby Room Code Typing & Join Logic                                       */
  /* -------------------------------------------------------------------------- */
  roomInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  roomInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      roomInput.blur();
      handleRoomJoin();
    }
  });

  joinBtn.addEventListener('click', () => {
    triggerCapacitorHaptic('MEDIUM', [120, 40, 120], 260);
    handleRoomJoin();
  });

  function handleRoomJoin() {
    const code = roomInput.value.trim();
    if (code.length > 0) {
      activeRoom = code;
      inputState.room = activeRoom;

      statusIndicator.classList.remove('connected');
      statusIndicator.querySelector('.status-text').textContent = 'JOINING...';
      
      setTimeout(() => {
        statusIndicator.classList.add('connected');
        statusIndicator.querySelector('.status-text').textContent = 'READY';
        triggerCapacitorHaptic('HEAVY', [200, 50, 200], 320);
      }, 300);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Multi-Touch Virtual Joystick Physics                                      */
  /* -------------------------------------------------------------------------- */
  function handleJoystickStart(clientX, clientY, touchId = null) {
    isDraggingJoystick = true;
    joystickTouchId = touchId;
    triggerCapacitorHaptic('LIGHT', [80], 180);
    updateJoystickPosition(clientX, clientY);
  }

  function updateJoystickPosition(clientX, clientY) {
    if (!isDraggingJoystick) return;

    const rect = joystickContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = (rect.width / 2) * 0.65;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    let distance = Math.hypot(deltaX, deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
      distance = maxRadius;
    }

    joystickThumb.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    const normX = parseFloat((deltaX / maxRadius).toFixed(3));
    const normY = parseFloat((-deltaY / maxRadius).toFixed(3));
    const magnitude = parseFloat((distance / maxRadius).toFixed(3));

    let angleDeg = Math.round(Math.atan2(-deltaY, deltaX) * (180 / Math.PI));
    if (angleDeg < 0) angleDeg += 360;

    inputState.joystick = {
      x: normX,
      y: normY,
      angle: angleDeg,
      magnitude: magnitude
    };
  }

  function resetJoystick() {
    if (isDraggingJoystick) {
      triggerCapacitorHaptic('LIGHT', [40], 140);
    }
    isDraggingJoystick = false;
    joystickTouchId = null;
    joystickThumb.style.transform = 'translate(0px, 0px)';
    inputState.joystick = { x: 0, y: 0, angle: 0, magnitude: 0 };
  }

  joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isDraggingJoystick) return;
    const touch = e.changedTouches[0];
    handleJoystickStart(touch.clientX, touch.clientY, touch.identifier);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (!isDraggingJoystick) return;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === joystickTouchId) {
        updateJoystickPosition(e.touches[i].clientX, e.touches[i].clientY);
        break;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isDraggingJoystick) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId) {
        resetJoystick();
        break;
      }
    }
  });

  window.addEventListener('touchcancel', resetJoystick);

  // Mouse Fallback
  joystickContainer.addEventListener('mousedown', (e) => {
    handleJoystickStart(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingJoystick && joystickTouchId === null) {
      updateJoystickPosition(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingJoystick && joystickTouchId === null) {
      resetJoystick();
    }
  });

  /* -------------------------------------------------------------------------- */
  /* Action Buttons (Dual Feedback Engine)                                      */
  /* -------------------------------------------------------------------------- */
  function bindActionButton(btnElement, buttonKey, style, vibePattern, audioFreq) {
    btnElement.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btnElement.classList.add('active-touch');
      inputState.buttons[buttonKey] = true;
      triggerCapacitorHaptic(style, vibePattern, audioFreq);
    }, { passive: false });

    btnElement.addEventListener('touchend', (e) => {
      e.preventDefault();
      btnElement.classList.remove('active-touch');
      inputState.buttons[buttonKey] = false;
    }, { passive: false });

    btnElement.addEventListener('mousedown', () => {
      btnElement.classList.add('active-touch');
      inputState.buttons[buttonKey] = true;
      triggerCapacitorHaptic(style, vibePattern, audioFreq);
    });

    btnElement.addEventListener('mouseup', () => {
      btnElement.classList.remove('active-touch');
      inputState.buttons[buttonKey] = false;
    });

    btnElement.addEventListener('mouseleave', () => {
      btnElement.classList.remove('active-touch');
      inputState.buttons[buttonKey] = false;
    });
  }

  bindActionButton(btnA, 'A', 'HEAVY', [200, 50, 150], 280);
  bindActionButton(btnB, 'B', 'HEAVY', [200, 50, 150], 210);
});
