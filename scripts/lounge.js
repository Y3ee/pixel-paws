/* scripts/lounge.js */
import { auth } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const state = window.AppState;
  if (!state) return;

  // Lounge Page Guard: redirect back to homepage if onboarding is not complete
  function guardLounge() {
    if (!state.onboardingComplete) {
      window.location.href = 'index.html';
    }
  }

  // Check immediately based on localStorage
  guardLounge();

  // Also verify when Firestore state loads
  state.on('stateLoaded', () => {
    guardLounge();
  });

  // DOM Elements
  const backToHomeBtn = document.getElementById('back-to-home-btn');
  const coinsDisplay = document.getElementById('stat-coins');
  const badgesDisplay = document.getElementById('nav-badges-count');
  
  const viewportMap = document.getElementById('viewport-map');
  const charSprite = document.getElementById('lounge-character');
  const petSprite = document.getElementById('lounge-pet');
  const charSvgRef = document.getElementById('char-svg-ref');
  const petSvgRef = document.getElementById('pet-svg-ref');
  const charNameLabel = document.getElementById('char-name-label');
  const petNameLabel = document.getElementById('pet-name-label');
  const petHeart = document.getElementById('pet-heart');

  // Room Traversal Elements
  const tabCafe = document.getElementById('tab-room-cafe');
  const tabPark = document.getElementById('tab-room-park');
  const cafeExitDoor = document.getElementById('cafe-exit-door');
  const parkEntryDoor = document.getElementById('park-entry-door');
  const cafeOnlyElements = document.querySelector('.cafe-only-elements');
  const parkOnlyElements = document.querySelector('.park-only-elements');

  // Interactive Chairs & Tables
  const seats = document.querySelectorAll('.seat-interactive');
  const tables = document.querySelectorAll('.table-interactive');

  // Timer HUD Elements
  const statusSelect = document.getElementById('lounge-status-select');
  const timerDisplayClock = document.getElementById('timer-display-clock');
  const timerToggleBtn = document.getElementById('timer-toggle-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const timerTooltipHint = document.getElementById('timer-tooltip-hint');

  // Tamagotchi UI Elements
  const petHungerText = document.getElementById('pet-hunger-text');
  const petHungerFill = document.getElementById('pet-hunger-fill');
  const petHealthText = document.getElementById('pet-health-text');
  const petHealthFill = document.getElementById('pet-health-fill');
  const petStateBadge = document.getElementById('pet-state-badge');
  const buyReviveBtn = document.getElementById('buy-revive-btn');
  const shopItemCards = document.querySelectorAll('.shop-item-card');

  // Task Elements
  const taskInput = document.getElementById('lounge-task-input');
  const taskAddBtn = document.getElementById('lounge-task-add-btn');
  const taskListItems = document.getElementById('lounge-task-items-list');

  // Simulation State Variables
  let currentRoom = 'cafe'; // 'cafe' or 'park'
  let charX = 396;
  let charY = 320;
  let charTargetX = 396;
  let charTargetY = 320;
  let charSpeed = 4;
  let charIsWalking = false;
  let charIsSitting = false;
  let currentTableId = null;

  // Keyboard movement state
  const keysPressed = {};

  

  let petX = 396;
  let petY = 330;
  let petTargetX = 396;
  let petTargetY = 330;
  let petSpeed = 3.5;
  let petIsWalking = false;
  let petWanderTimer = null;

  // Study Timer Variables
  let studyTimer = null;
  let studySeconds = 0;
  let studyTimerActive = false;
  let activeTool = 'none';
  let lastTickTime = 0;

  // Pet Names mapping
  const petNamesList = ["Puppy", "Kitty", "Bunny", "Frog", "Owl"];
  const petSymbols = ["#pet-puppy", "#pet-kitty", "#pet-bunny", "#pet-frog", "#pet-owl"];

  // --- INITIAL DATA SYNC ---
  function syncStateToUI() {
    if (coinsDisplay) coinsDisplay.textContent = state.coins;
    if (badgesDisplay) badgesDisplay.textContent = state.badges;
    if (charNameLabel) charNameLabel.textContent = state.username;
    
    // Load pfp indices
    if (charSvgRef) {
      charSvgRef.setAttribute('href', `#char-avatar-${state.selectedAvatarIndex}`);
    }
    
    const petNameStr = state.petName || petNamesList[state.selectedPetIndex] || "Companion";
    if (petNameLabel) petNameLabel.textContent = petNameStr;
    if (petSvgRef) {
      petSvgRef.setAttribute('href', petSymbols[state.selectedPetIndex] || "#pet-puppy");
    }

    // Sync Tamagotchi bars
    updatePetStatsUI();
  }

  // Update Pet Health/Hunger progress bars
  function updatePetStatsUI() {
    if (petHungerText) petHungerText.textContent = `${Math.round(state.petHunger)}%`;
    if (petHungerFill) petHungerFill.style.width = `${state.petHunger}%`;
    if (petHealthText) petHealthText.textContent = `${Math.round(state.petHealth)}%`;
    if (petHealthFill) petHealthFill.style.width = `${state.petHealth}%`;

    // Dead / Alive class toggle
    if (state.petIsDead) {
      petSprite.classList.add('sprite-fainted');
      if (petStateBadge) {
        petStateBadge.textContent = "Fainted";
        petStateBadge.className = "pet-state-badge badge-fainted";
      }
      if (buyReviveBtn) buyReviveBtn.disabled = false;
      // Disable other shop buttons
      shopItemCards.forEach(card => {
        if (card.id !== 'revive-shop-card') {
          card.querySelector('.shop-buy-btn').disabled = true;
        }
      });
      // Force stand up and stop studying
      if (charIsSitting) standUp();
    } else {
      petSprite.classList.remove('sprite-fainted');
      if (buyReviveBtn) buyReviveBtn.disabled = true;
      
      // Re-enable shop items
      shopItemCards.forEach(card => {
        card.querySelector('.shop-buy-btn').disabled = false;
      });

      if (petStateBadge) {
        if (state.petHunger < 35) {
          petStateBadge.textContent = "Hungry";
          petStateBadge.className = "pet-state-badge badge-hungry";
        } else {
          petStateBadge.textContent = "Happy";
          petStateBadge.className = "pet-state-badge badge-satisfied";
        }
      }
    }
  }

  // --- CHARACTER & PET DIRECTION UPDATES ---
  function updateCharacterDirection(dx, dy) {
    if (!charSvgRef) return;
    
    let suffix = "";
    let scaleX = 1;

    if (charIsSitting) {
      const tId = parseInt(currentTableId);
      if (tId === 10) {
        // Bench 1 (Left vertical) - face right
        suffix = "-side";
        scaleX = 1;
      } else if (tId === 11 || tId === 12) {
        // Bench 2 & 3 (Top horizontal) - face front
        suffix = "";
        scaleX = 1;
      } else if (tId === 13) {
        // Bench 4 (Right vertical) - face left
        suffix = "-side";
        scaleX = -1;
      } else if (tId === 14) {
        // Picnic Table Left - face right
        suffix = "-side";
        scaleX = 1;
      } else if (tId === 15) {
        // Picnic Table Right - face left
        suffix = "-side";
        scaleX = -1;
      } else if (tId === 1) {
        if (charY < 180) {
          suffix = ""; // top chairs face front (downwards)
        } else {
          suffix = "-back"; // bottom chairs face back (upwards)
        }
      } else if (tId === 2) {
        if (charY < 370) {
          suffix = ""; // top chairs face front (downwards)
        } else {
          suffix = "-back"; // bottom chairs face back (upwards)
        }
      } else if (tId === 3 || tId === 5) {
        suffix = "-side";
        if (charX < 680) {
          scaleX = 1; // Left seat faces right towards the table
        } else {
          scaleX = -1; // Right seat faces left towards the table
        }
      } else if (tId === 4) {
        suffix = "-side";
        if (charX < 600) {
          scaleX = 1; // Left seat faces right towards the table
        } else {
          scaleX = -1; // Right seat faces left towards the table
        }
      }
    } else if (dx !== 0 || dy !== 0) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        suffix = "-side";
        scaleX = dx > 0 ? 1 : -1;
      } else {
        suffix = dy > 0 ? "" : "-back";
        scaleX = 1;
      }
    } else {
      return;
    }

    charSvgRef.setAttribute('href', `#char-avatar-${state.selectedAvatarIndex}${suffix}`);
    const svgEl = charSprite.querySelector('svg');
    if (svgEl) {
      svgEl.style.transform = `scaleX(${scaleX})`;
    }
  }

  function updatePetDirection(dx, dy) {
    if (!petSvgRef || state.petIsDead) return;

    let suffix = "";
    let scaleX = 1;

    if (dx !== 0 || dy !== 0) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        suffix = "-side";
        scaleX = dx > 0 ? 1 : -1;
      } else {
        suffix = dy > 0 ? "" : "-back";
        scaleX = 1;
      }
    } else {
      return;
    }

    const petBase = ["puppy", "kitty", "bunny", "frog", "owl"][state.selectedPetIndex] || "puppy";
    petSvgRef.setAttribute('href', `#pet-${petBase}${suffix}`);
    const svgEl = petSprite.querySelector('svg');
    if (svgEl) {
      svgEl.style.transform = `scaleX(${scaleX})`;
    }
  }

  // --- FLOATING SPEECH BUBBLE UTILITY ---
  function showSpeechBubble(targetId, text, duration = 3500) {
    const speechEl = document.getElementById(targetId);
    if (!speechEl) return;
    speechEl.textContent = text;
    speechEl.classList.add('active');

    clearTimeout(speechEl.speechTimeout);
    speechEl.speechTimeout = setTimeout(() => {
      speechEl.classList.remove('active');
    }, duration);
  }

  
  // Swap Cafe <-> Park
  function changeRoom(roomName) {
    if (charIsSitting) standUp();
    
    currentRoom = roomName;
    if (roomName === 'park') {
      const tabCafe = document.getElementById('tab-room-cafe');
      const tabPark = document.getElementById('tab-room-park');
      const cafeOnlyElements = document.querySelector('.cafe-only-elements');
      const parkOnlyElements = document.querySelector('.park-only-elements');
      
      if (tabCafe) tabCafe.classList.remove('active');
      if (tabPark) tabPark.classList.add('active');
      if (cafeOnlyElements) cafeOnlyElements.style.display = 'none';
      if (parkOnlyElements) parkOnlyElements.style.display = 'block';

      // Snap coordinates to entrance door at the bottom gate of the park
      charX = 213;
      charY = 900;
      if (typeof player !== 'undefined' && player) {
        player.setPosition(charX + 22, charY + 42);
      }
      
      petX = 233;
      petY = 910;

      showSpeechBubble('char-speech', "Wow, look at all this green grass! 🌳");
      setTimeout(() => {
        showSpeechBubble('pet-speech', "Let's play! 🐾");
      }, 1500);

      // Phaser sync
      if (typeof phaserScene !== 'undefined' && phaserScene) {
        if (phaserScene.bgImage) phaserScene.bgImage.setTexture('park-bg');
        phaserScene.physics.world.setBounds(0, 0, 1024, 1024);
        phaserScene.cameras.main.setBounds(0, 0, 1024, 1024);
        // Force camera to snap immediately to player's new position
        phaserScene.cameras.main.scrollX = player.x - 400;
        phaserScene.cameras.main.scrollY = player.y - 250;
      }
      if (typeof furnitureCollider !== 'undefined' && furnitureCollider) {
        furnitureCollider.active = false; // Disable cafe collisions in the park
      }
      transitionCooldown = 60; // 1 second cooldown on transition

    } else {
      const tabCafe = document.getElementById('tab-room-cafe');
      const tabPark = document.getElementById('tab-room-park');
      const cafeOnlyElements = document.querySelector('.cafe-only-elements');
      const parkOnlyElements = document.querySelector('.park-only-elements');
      
      if (tabPark) tabPark.classList.remove('active');
      if (tabCafe) tabCafe.classList.add('active');
      if (parkOnlyElements) parkOnlyElements.style.display = 'none';
      if (cafeOnlyElements) cafeOnlyElements.style.display = 'block';

      // Snap coordinates to exit door in cafe (bottom middle)
      charX = 396;
      charY = 320;
      if (typeof player !== 'undefined' && player) {
        player.setPosition(charX + 22, charY + 42);
      }
      
      petX = 396;
      petY = 330;

      showSpeechBubble('char-speech', "Ah, back in the warm cafe! ☕");

      // Phaser sync
      if (typeof phaserScene !== 'undefined' && phaserScene) {
        if (phaserScene.bgImage) phaserScene.bgImage.setTexture('cafe-bg');
        phaserScene.physics.world.setBounds(0, 0, 847, 455);
        phaserScene.cameras.main.setBounds(0, 0, 847, 455);
        // Force camera to snap immediately
        phaserScene.cameras.main.scrollX = player.x - 400;
        phaserScene.cameras.main.scrollY = player.y - 250;
      }
      if (typeof furnitureCollider !== 'undefined' && furnitureCollider) {
        furnitureCollider.active = true; // Enable cafe collisions
      }
      transitionCooldown = 60; // 1 second cooldown on transition
    }

    charSprite.style.left = `${charX}px`;
    charSprite.style.top = `${charY}px`;
    petSprite.style.left = `${petX}px`;
    petSprite.style.top = `${petY}px`;

    charTargetX = charX;
    charTargetY = charY;
    petTargetX = petX;
    petTargetY = petY;
  }

  // --- SEAT DETECTION & SNAP MECHANISM ---
  function checkSeatSnap() {
    seats.forEach(seat => {
      const seatTop = parseInt(seat.style.top);
      const seatLeft = parseInt(seat.style.left);
      
      // check if character stopped close to seat coordinates (radius ~10px)
      const seatTargetX = seatLeft - 6; // offset center
      const seatTargetY = seatTop - 15; 
      
      if (Math.abs(charX - seatTargetX) < 10 && Math.abs(charY - seatTargetY) < 10) {
        snapToSeat(seat, seatTargetX, seatTargetY);
      }
    });
  }

  function snapToSeat(seatEl, targetX, targetY) {
    charIsSitting = true;
    currentTableId = seatEl.dataset.tableId;
    charSprite.classList.add('sprite-sitting');
    
    // exact snap
    charX = targetX;
    charY = targetY;
    charTargetX = targetX;
    charTargetY = targetY;
    charSprite.style.left = `${charX}px`;
    charSprite.style.top = `${charY}px`;

    // Snap the Phaser player so it doesn't fight the DOM
    if (typeof player !== 'undefined' && player) {
      player.setPosition(charX + 22, charY + 42);
    }

    // Move pet to sit right next to owner's chair
    petTargetX = targetX + 30;
    petTargetY = targetY + 25;

    // Enable study HUD
    if (statusSelect) statusSelect.disabled = false;
    if (timerTooltipHint) timerTooltipHint.style.display = 'none';

    updateCharacterDirection(0, 0);

    if (currentRoom === 'park') {
      activeTool = 'rest';
      if (statusSelect) {
        statusSelect.value = 'rest';
      }
      // Reset the rest timer to 0 when sitting in the park
      pauseStudyTimer();
      studySeconds = 0;
      if (timerDisplayClock) timerDisplayClock.textContent = "00:00:00";
      startStudyTimer();
      showSpeechBubble('char-speech', "Ah, sitting on the park bench. Time to relax! 🌳");
    } else {
      showSpeechBubble('char-speech', "Comfy! Let's choose what tool to study with in the status list.");
    }
  }

  function standUp() {
    if (!charIsSitting) return;
    
    // Reset table slot item
    if (currentTableId) {
      const slot = document.getElementById(`table-slot-${currentTableId}`);
      if (slot) slot.innerHTML = '';
    }

    charIsSitting = false;
    currentTableId = null;
    charSprite.classList.remove('sprite-sitting');

    // Reset character sprite to front view
    if (charSvgRef) {
      charSvgRef.setAttribute('href', `#char-avatar-${state.selectedAvatarIndex}`);
      const svgEl = charSprite.querySelector('svg');
      if (svgEl) {
        svgEl.style.transform = 'scaleX(1)';
      }
    }

    // Reset tool status select dropdown
    activeTool = 'none';
    if (statusSelect) {
      statusSelect.value = 'none';
      statusSelect.disabled = true;
    }
    
    // Disable and pause timer
    pauseStudyTimer();
    if (timerToggleBtn) {
      timerToggleBtn.disabled = true;
      timerToggleBtn.textContent = "Start Focus";
    }
    if (timerResetBtn) timerResetBtn.disabled = true;
    if (timerTooltipHint) timerTooltipHint.style.display = 'block';
  }

  // --- INTERACTIVE CLICKS ON VIEWPORT FLOOR ---
  viewportMap.addEventListener('click', (e) => {
    // Prevent walking if clicking interactive overlays (buttons/exit doors)
    if (e.target.closest('.viewport-furniture') || 
        e.target.closest('.viewport-chair') || 
        e.target.closest('.viewport-exit-door')) {
      return;
    }

    const rect = viewportMap.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // If character was sitting, they stand up and walk
    if (charIsSitting) {
      standUp();
    }

    // Set walking destination (adjusting so feet center aligns)
    charTargetX = clickX - 22;
    charTargetY = clickY - 44;

    // Set pet to follow target (lagging behind)
    setTimeout(() => {
      if (!charIsSitting && !state.petIsDead) {
        petTargetX = charTargetX + (Math.random() * 40 - 20);
        petTargetY = charTargetY + 20;
      }
    }, 120);
  });

  // Handle clicking on chair elements directly
  seats.forEach(seat => {
    seat.addEventListener('click', (e) => {
      e.stopPropagation();
      if (charIsSitting) standUp();

      const seatTop = parseInt(seat.style.top);
      const seatLeft = parseInt(seat.style.left);
      
      charTargetX = seatLeft - 6;
      charTargetY = seatTop - 15;
    });
  });

  // Handle clicking on tables (moves player to their adjacent chair)
  tables.forEach(table => {
    table.addEventListener('click', (e) => {
      e.stopPropagation();
      const tableId = table.dataset.tableId;
      const matchingSeat = document.querySelector(`.seat-interactive[data-table-id="${tableId}"]`);
      if (matchingSeat) {
        matchingSeat.click();
      }
    });
  });

  // Handle door triggers manually in case click is easier
  cafeExitDoor.addEventListener('click', (e) => {
    e.stopPropagation();
    charTargetX = 390;
    charTargetY = 465;
  });

  parkEntryDoor.addEventListener('click', (e) => {
    e.stopPropagation();
    charTargetX = 40;
    charTargetY = 220;
  });

  // --- PET RANDOM WANDERING SIMULATOR ---
  function runPetWanderLoop() {
    if (state.petIsDead) return;
    
    // Pick random interval
    const wanderDelay = currentRoom === 'park' ? 4000 + Math.random() * 3000 : 3000 + Math.random() * 2000;
    
    petWanderTimer = setTimeout(() => {
      if (!petIsWalking && !state.petIsDead) {
        if (currentRoom === 'park') {
          // Free wander in park boundaries
          petTargetX = 80 + Math.random() * 650;
          petTargetY = 120 + Math.random() * 300;
        } else {
          // In Cafe: if owner is sitting, wander strictly around table (stay within 60px)
          if (charIsSitting) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 30;
            petTargetX = charX + Math.cos(angle) * dist;
            petTargetY = charY + Math.sin(angle) * dist;
          } else {
            // Wander near character position
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 20;
            petTargetX = charX + Math.cos(angle) * dist;
            petTargetY = charY + Math.sin(angle) * dist;
          }
        }
      }
      runPetWanderLoop();
    }, wanderDelay);
  }

  // Start wandering loop
  runPetWanderLoop();

  // --- DISCORD STATUS TOOL SELECTION ---
  if (statusSelect) {
    statusSelect.addEventListener('change', () => {
      activeTool = statusSelect.value;
      if (!currentTableId) return;

      const slot = document.getElementById(`table-slot-${currentTableId}`);
      if (!slot) return;

      // Update item slot emoji on table
      if (activeTool !== 'none') {
        slot.innerHTML = `<svg style="width: 24px; height: 24px; image-rendering: pixelated;"><use href="#item-${activeTool}"></use></svg>`;
        if (activeTool === 'book') {
          showSpeechBubble('char-speech', "Opened my textbooks. Let's study! 📚");
        } else if (activeTool === 'laptop') {
          showSpeechBubble('char-speech', "Tapped into my laptop. Coding mode: ON! 💻");
        } else if (activeTool === 'ipad') {
          showSpeechBubble('char-speech', "Fired up my ipad. Sketching layout... 📱");
        } else if (activeTool === 'rest') {
          showSpeechBubble('char-speech', "Ah, coffee break time! Relaxing. ☕");
        }
      } else {
        slot.innerHTML = '';
      }

      // Enable timer controls
      if (activeTool !== 'none') {
        if (timerToggleBtn) timerToggleBtn.disabled = false;
        if (timerResetBtn) timerResetBtn.disabled = false;
      } else {
        pauseStudyTimer();
        if (timerToggleBtn) {
          timerToggleBtn.disabled = true;
          timerToggleBtn.textContent = "Start Focus";
        }
        if (timerResetBtn) timerResetBtn.disabled = true;
      }
    });
  }

  // --- SESSION STUDY TIMER (POMODORO) ---
  function startStudyTimer() {
    if (studyTimerActive) return;
    studyTimerActive = true;
    if (timerToggleBtn) timerToggleBtn.textContent = "Pause Focus";

    lastTickTime = Date.now();

    studyTimer = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastTickTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      
      if (elapsedSec >= 1) {
        const lastRewardedSecond = studySeconds;
        studySeconds += elapsedSec;
        
        if (activeTool !== 'rest') {
          state.addStudySecond(elapsedSec);
        } else {
          state.addRestSecond(elapsedSec);
        }
        
        lastTickTime += elapsedSec * 1000;
        
        // Update timer clock UI
        const hrs = Math.floor(studySeconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((studySeconds % 3600) / 60).toString().padStart(2, '0');
        const secs = (studySeconds % 60).toString().padStart(2, '0');
        if (timerDisplayClock) {
          timerDisplayClock.textContent = `${hrs}:${mins}:${secs}`;
        }
  
        // Interactive reward: Earn 1 Coin and 2 XP every 20 seconds of focused study!
        const prevIntervals = Math.floor(lastRewardedSecond / 20);
        const currentIntervals = Math.floor(studySeconds / 20);
        const intervalsCrossed = currentIntervals - prevIntervals;
        
        if (intervalsCrossed > 0) {
          if (activeTool !== 'rest') {
            state.addCoins(1 * intervalsCrossed);
            state.addXp(2 * intervalsCrossed);
            showSpeechBubble('char-speech', `Focused work is paying off! (+${1 * intervalsCrossed} coin, +${2 * intervalsCrossed} XP) 💰`);
            
            // Pet heart effect on focus
            triggerPetHearts();
          } else {
            // rest boosts pet health slowly
            state.petHealth = Math.min(100, state.petHealth + 2 * intervalsCrossed);
            updatePetStatsUI();
            showSpeechBubble('pet-speech', "Yawn! Rest matches focus! ❤️");
          }
        }
      }
    }, 1000);
  }

  function pauseStudyTimer() {
    if (!studyTimerActive) return;
    studyTimerActive = false;
    clearInterval(studyTimer);
    if (timerToggleBtn) timerToggleBtn.textContent = "Start Focus";
  }

  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', () => {
      if (studyTimerActive) {
        pauseStudyTimer();
      } else {
        startStudyTimer();
      }
    });
  }

  if (timerResetBtn) {
    timerResetBtn.addEventListener('click', () => {
      pauseStudyTimer();
      studySeconds = 0;
      if (timerDisplayClock) timerDisplayClock.textContent = "00:00:00";
    });
  }

  function triggerPetHearts() {
    if (!petHeart) return;
    petHeart.classList.remove('active');
    // Trigger animation via DOM reflow
    void petHeart.offsetWidth;
    petHeart.style.opacity = '1';
    petHeart.style.animation = 'heart-float 1.5s ease-out forwards';
  }

  // --- TAMAGOTCHI PET CARE SIMULATOR (DECAY LOOP) ---
  function startPetDecayLoop() {
    // Decays stats every 15 seconds
    setInterval(() => {
      if (state.petIsDead) return;

      // Slower, realistic decay rates:
      // Standard: 8% per hour = 8 / 240 per 15s check
      // Focus: 4% per hour = 4 / 240 per 15s check
      let hungerDecay = 8 / 240;
      if (studyTimerActive && activeTool !== 'rest') {
        hungerDecay = 4 / 240; // Focus keeps pet energised!
      }
      
      state.decayPetStats(hungerDecay, 0);
      updatePetStatsUI();

      // Show warnings if hungry
      if (state.petHunger < 30 && !state.petIsDead && Math.random() > 0.4) {
        showSpeechBubble('pet-speech', "I'm hungry... 🍽️");
      }
    }, 15000);
  }

  // Start stats decay
  startPetDecayLoop();

  // --- PET SHOP TRANSACTIONS ---
  const shopBuyButtons = document.querySelectorAll('.shop-buy-btn');
  shopBuyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.shop-item-card');
      if (!card) return;

      const itemName = card.dataset.itemName;
      const cost = parseInt(card.dataset.itemCost);
      const hunger = parseInt(card.dataset.itemHunger);
      const xp = parseInt(card.dataset.itemXp);

      if (itemName === 'Revival Kit') {
        const success = state.revivePet(cost);
        if (success) {
          triggerPetHearts();
          updatePetStatsUI();
        }
      } else {
        const success = state.feedPet(itemName, cost, hunger, xp);
        if (success) {
          triggerPetHearts();
          updatePetStatsUI();
        }
      }
    });
  });

  // --- STATE CHANGE LISTENERS (Sync dynamic coin changes) ---
  state.on('coinsChange', (data) => {
    if (coinsDisplay) {
      coinsDisplay.textContent = data.coins;
      // little bounce
      coinsDisplay.style.transform = 'scale(1.2)';
      setTimeout(() => { coinsDisplay.style.transform = 'none'; }, 200);
    }
  });

  state.on('badgesChange', (data) => {
    if (badgesDisplay) {
      badgesDisplay.textContent = data.badges;
    }
  });

  state.on('petStatsChange', () => {
    updatePetStatsUI();
  });

  state.on('nameChange', (data) => {
    if (petNameLabel) petNameLabel.textContent = data.name;
  });

  // Helper to sync Achievements UI
  function syncAchievementsUI() {
    const morningEl = document.getElementById('achieve-morning-date');
    const notesEl = document.getElementById('achieve-notes-date');
    const loungeEl = document.getElementById('achieve-lounge-date');
    
    if (morningEl) {
      const isUnlocked = state.goals.study30Mins.claimed || state.goals.study30Mins.completed;
      if (isUnlocked) {
        morningEl.textContent = "Unlocked";
        morningEl.className = "achievement-date unlocked";
        morningEl.style.color = "var(--bg-green)";
        morningEl.style.fontWeight = "bold";
      } else {
        morningEl.textContent = "Locked";
        morningEl.className = "achievement-date locked";
        morningEl.style.color = "";
        morningEl.style.fontWeight = "";
      }
    }
    
    if (notesEl) {
      const isUnlocked = state.totalTasksCompleted > 0 || (state.goals.finishOneTask.claimed || state.goals.finishOneTask.completed);
      if (isUnlocked) {
        notesEl.textContent = "Unlocked";
        notesEl.className = "achievement-date unlocked";
        notesEl.style.color = "var(--bg-green)";
        notesEl.style.fontWeight = "bold";
      } else {
        notesEl.textContent = "Locked";
        notesEl.className = "achievement-date locked";
        notesEl.style.color = "";
        notesEl.style.fontWeight = "";
      }
    }
    
    if (loungeEl) {
      const isUnlocked = state.onboardingComplete;
      if (isUnlocked) {
        loungeEl.textContent = "Unlocked";
        loungeEl.className = "achievement-date unlocked";
        loungeEl.style.color = "var(--bg-green)";
        loungeEl.style.fontWeight = "bold";
      } else {
        loungeEl.textContent = "Locked";
        loungeEl.className = "achievement-date locked";
        loungeEl.style.color = "";
        loungeEl.style.fontWeight = "";
      }
    }
  }

  // achievements modal in lounge nav
  const achievementsNavBtn = document.getElementById('achievements-nav-btn');
  const achievementsModal = document.getElementById('achievements-modal');
  const achievementsModalClose = document.getElementById('achievements-modal-close');

  if (achievementsNavBtn && achievementsModal) {
    achievementsNavBtn.addEventListener('click', () => {
      syncAchievementsUI();
      achievementsModal.classList.add('active');
    });
  }

  if (achievementsModalClose) {
    achievementsModalClose.addEventListener('click', () => {
      achievementsModal.classList.remove('active');
    });
  }

  // Close modals when clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === achievementsModal) {
      achievementsModal.classList.remove('active');
    }
  });

  // Room tabs navigation clicks
  if (tabCafe) {
    tabCafe.addEventListener('click', () => {
      if (currentRoom !== 'cafe') changeRoom('cafe');
    });
  }

  if (tabPark) {
    tabPark.addEventListener('click', () => {
      if (currentRoom !== 'park') changeRoom('park');
    });
  }

  // --- ACTIVE TASKS CHECKLIST LOGIC ---
  const fadingTasks = new Set();
  const activeTimeouts = new Map();

  function renderLoungeTasks() {
    if (!taskListItems) return;
    taskListItems.innerHTML = '';
    
    const tasks = state.customTasks || [];
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-list-item ${task.completed ? 'task-completed' : ''}`;
      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
        <span class="task-text-label">${escapeHtml(task.text)}</span>
        <button class="task-delete-btn" data-task-id="${task.id}">&times;</button>
      `;
      
      const checkbox = li.querySelector('.task-checkbox');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          li.classList.add('task-completed');
          state.completeTask(task.id);
        } else {
          li.classList.remove('task-completed');
          state.toggleTask(task.id);
        }
      });
      
      // Auto-delete fadeout animation handling for completed tasks
      if (task.completed) {
        if (!fadingTasks.has(task.id)) {
          fadingTasks.add(task.id);
          const timeoutId = setTimeout(() => {
            li.style.transition = 'opacity 0.5s ease';
            li.style.opacity = '0';
            const deleteTimeoutId = setTimeout(() => {
              state.deleteTask(task.id);
              fadingTasks.delete(task.id);
              activeTimeouts.delete(task.id);
              activeTimeouts.delete(task.id + '_delete');
            }, 500);
            activeTimeouts.set(task.id + '_delete', deleteTimeoutId);
          }, 2000);
          activeTimeouts.set(task.id, timeoutId);
        } else if (activeTimeouts.has(task.id + '_delete')) {
          li.style.opacity = '0';
        }
      } else {
        if (fadingTasks.has(task.id)) {
          clearTimeout(activeTimeouts.get(task.id));
          clearTimeout(activeTimeouts.get(task.id + '_delete'));
          fadingTasks.delete(task.id);
          activeTimeouts.delete(task.id);
          activeTimeouts.delete(task.id + '_delete');
        }
      }
      
      const deleteBtn = li.querySelector('.task-delete-btn');
      deleteBtn.addEventListener('click', () => {
        state.deleteTask(task.id);
      });
      
      taskListItems.appendChild(li);
    });
  }

  if (taskAddBtn && taskInput) {
    // Add task keypress listener
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        taskAddBtn.click();
      }
    });

    taskAddBtn.addEventListener('click', () => {
      const text = taskInput.value.trim();
      if (!text) return;

      state.addTask(text);
      taskInput.value = '';
      showSpeechBubble('char-speech', "Added a new study focus goal! 📝");
    });
  }

  // Helper escapeHTML
  function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  // Listen to tasks state changes and sync
  state.on('tasksChange', () => {
    renderLoungeTasks();
  });

  state.on('taskCompletedEffect', () => {
    triggerPetHearts();
  });

  state.on('stateLoaded', () => {
    renderLoungeTasks();
  });

  // Initial render of lounge tasks
  renderLoungeTasks();

  // --- REDIRECTIONS ---
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
      state.save();
      window.location.href = 'index.html';
    });
  }

  // --- INITIAL SYNC ON BOOT ---
  syncStateToUI();


  // ==========================================
  // PHASER 3 TILEMAP INTEGRATION
  // ==========================================
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: 'viewport-map',
    transparent: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };

  let player;
  let cursors;
  let furnitureLayer;
  let furnitureCollider;
  let transitionCooldown = 0;

  function preload() {
    this.load.image('cafe-bg', 'assets/lounge_cafe_map.png');
    this.load.image('park-bg', 'assets/lounge_park_map.png');
    this.load.image('cafe-tiles', 'assets/cafe-tiles.png');
    this.load.tilemapTiledJSON('cafe-map', 'assets/cafe-map.json');
  }

  let phaserScene = null;
  function create() {
    phaserScene = this;
    // Hide the CSS background map
    const viewportMap = document.getElementById('viewport-map');
    if (viewportMap) viewportMap.style.backgroundImage = 'none';

    // Render the beautiful cafe design as the background!
    phaserScene.bgImage = this.add.image(0, 0, 'cafe-bg').setOrigin(0, 0);

    const map = this.make.tilemap({ key: 'cafe-map' });
    const tileset = map.addTilesetImage('CafeTileset', 'cafe-tiles');

    const floorLayer = map.createLayer('FloorLayer', tileset, 0, 0);
    furnitureLayer = map.createLayer('FurnitureLayer', tileset, 0, 0);

    // Hide the placeholder tilemap blocks so they are invisible collision walls
    floorLayer.setVisible(false);
    furnitureLayer.setVisible(false);

    furnitureLayer.setCollisionByProperty({ collides: true });

    // Create an invisible player sprite to handle physics
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture('player-box', 32, 32);
    g.destroy();

    player = this.physics.add.sprite(charX, charY, 'player-box');
    player.setCollideWorldBounds(true);

    furnitureCollider = this.physics.add.collider(player, furnitureLayer);

    // Set initial bounds based on currentRoom
    let w = currentRoom === 'park' ? 1024 : 847;
    let h = currentRoom === 'park' ? 1024 : 455;
    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(player);

    cursors = this.input.keyboard.createCursorKeys();
  }

  function update() {
    if (!player) return;

    player.setVelocity(0);

    // Disable movement if typing in an input
    if (document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA' || 
      document.activeElement.tagName === 'SELECT'
    )) {
      return;
    }

    let isKeyboardMoving = false;

    if (cursors.left.isDown || this.input.keyboard.addKey('A').isDown) {
      player.setVelocityX(-160);
      isKeyboardMoving = true;
    } else if (cursors.right.isDown || this.input.keyboard.addKey('D').isDown) {
      player.setVelocityX(160);
      isKeyboardMoving = true;
    }

    if (cursors.up.isDown || this.input.keyboard.addKey('W').isDown) {
      player.setVelocityY(-160);
      isKeyboardMoving = true;
    } else if (cursors.down.isDown || this.input.keyboard.addKey('S').isDown) {
      player.setVelocityY(160);
      isKeyboardMoving = true;
    }

    let isMoving = isKeyboardMoving;

    // Click-to-move logic (runs if keyboard not moving)
    if (!isKeyboardMoving) {
      const targetPx = charTargetX + 22;
      const targetPy = charTargetY + 42;
      const dx = targetPx - player.x;
      const dy = targetPy - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        isMoving = true;
        const speed = 160;
        player.setVelocityX((dx / dist) * speed);
        player.setVelocityY((dy / dist) * speed);
      } else {
        player.setVelocity(0);
      }
    } else {
      // Keyboard input overrides and resets target to current position
      charTargetX = player.x - 22;
      charTargetY = player.y - 42;
    }

    // Sync DOM character sprite to Phaser physics body
    charX = player.x - 22;
    charY = player.y - 42;
    charSprite.style.left = charX + 'px';
    charSprite.style.top = charY + 'px';

    if (isMoving) {
      charSprite.classList.add('sprite-walking');
      updateCharacterDirection(player.body.velocity.x, player.body.velocity.y);
      if (charIsSitting) standUp();
    } else {
      charSprite.classList.remove('sprite-walking');
      if (!charIsSitting) {
        checkSeatSnap();
      }
    }

    // Move pet to target (follows character or wanders)
    if (!state.petIsDead) {
      const distToOwner = Math.hypot(charX - petX, charY - petY);
      let targetX = petTargetX;
      let targetY = petTargetY;

      // If owner is moving or is far away in Cafe, force follow
      const playerIsMoving = isMoving || (player && (player.body.velocity.x !== 0 || player.body.velocity.y !== 0));
      if (playerIsMoving || (currentRoom === 'cafe' && distToOwner > 100)) {
        targetX = charX + (currentRoom === 'cafe' ? 30 : 20);
        targetY = charY + 20;
        // update petTargetX/Y so the next wander step starts near owner
        petTargetX = targetX;
        petTargetY = targetY;
      }

      const dx = targetX - petX;
      const dy = targetY - petY;
      const distToTarget = Math.hypot(dx, dy);

      if (distToTarget > 5) {
        petIsWalking = true;
        petSprite.classList.add('sprite-walking');

        // Move pet smoothly
        const speed = petSpeed;
        if (distToTarget <= speed) {
          petX = targetX;
          petY = targetY;
        } else {
          petX += (dx / distToTarget) * speed;
          petY += (dy / distToTarget) * speed;
        }

        petSprite.style.left = `${petX}px`;
        petSprite.style.top = `${petY}px`;
        updatePetDirection(dx, dy);
      } else {
        if (petIsWalking) {
          petIsWalking = false;
          petSprite.classList.remove('sprite-walking');
        }
      }
    } else {
      petSprite.classList.remove('sprite-walking');
    }

    // Scroll the DOM elements container in sync with the Phaser camera!
    const scrollableContent = document.getElementById('viewport-scrollable-content');
    if (scrollableContent && this.cameras && this.cameras.main) {
      const camera = this.cameras.main;
      scrollableContent.style.transform = `translate(${-camera.scrollX}px, ${-camera.scrollY}px)`;
    }

    // Tick down transition cooldown
    if (transitionCooldown > 0) {
      transitionCooldown--;
    }

    // Dynamic Room Transition Check based on physical position
    if (transitionCooldown === 0) {
      if (currentRoom === 'cafe') {
        if (player.y > 425 && player.x >= 370 && player.x <= 460) {
          changeRoom('park');
        }
      } else if (currentRoom === 'park') {
        if (player.y > 960 && player.x >= 160 && player.x <= 310) {
          changeRoom('cafe');
        }
      }
    }
  }

  // Helper to show cloud sync status toasts
  function showSyncToast(isError, message) {
    const existing = document.querySelector('.sync-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `sync-toast ${isError ? 'error' : 'success'}`;
    toast.innerHTML = isError 
      ? `<span>⚠️ Sync Error: ${message}</span>` 
      : `<span>☁️ Synced with Cloud</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  state.on('syncSuccess', (data) => {
    // Only show sync success toast on foreground saves
    if (data && !data.isBackground) {
      showSyncToast(false);
    }
  });

  state.on('syncError', (err) => {
    showSyncToast(true, err.message || err);
  });

  const game = new Phaser.Game(config);

  // Sync when Firestore finishes loading
  state.on('stateLoaded', () => {
    syncStateToUI();
    if (typeof player !== 'undefined' && player) {
      player.setPosition(charX + 22, charY + 42);
    }
  });
});
