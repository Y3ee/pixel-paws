/* scripts/lounge.js */

document.addEventListener('DOMContentLoaded', () => {
  const state = window.AppState;
  if (!state) return;

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
    if (petHungerText) petHungerText.textContent = `${state.petHunger}%`;
    if (petHungerFill) petHungerFill.style.width = `${state.petHunger}%`;
    if (petHealthText) petHealthText.textContent = `${state.petHealth}%`;
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
      if (tId === 1) {
        if (charY < 200) {
          suffix = ""; // top chairs face front (downwards)
        } else {
          suffix = "-back"; // bottom chairs face back (upwards)
        }
      } else if (tId === 2 || tId === 3) {
        suffix = "-side";
        const tableMidX = tId === 2 ? 390 : 550;
        if (charX < tableMidX) {
          scaleX = 1; // Left seat faces right towards the table
        } else {
          scaleX = -1; // Right seat faces left towards the table
        }
      } else if (tId === 4) {
        if (charY < 250) {
          suffix = ""; // top chair faces front (downwards)
        } else {
          suffix = "-back"; // bottom chair faces back (upwards)
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
        showSpeechBubble('pet-speech', "Woof woof! Let's play!");
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

    showSpeechBubble('char-speech', "Comfy! Let's choose what tool to study with in the status list.");
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

    studyTimer = setInterval(() => {
      studySeconds++;
      
      // Update timer clock UI
      const hrs = Math.floor(studySeconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((studySeconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (studySeconds % 60).toString().padStart(2, '0');
      if (timerDisplayClock) {
        timerDisplayClock.textContent = `${hrs}:${mins}:${secs}`;
      }

      // Interactive reward: Earn 1 Coin and 2 XP every 20 seconds of focused study!
      if (studySeconds % 20 === 0) {
        if (activeTool !== 'rest') {
          state.addCoins(1);
          state.addXp(2);
          showSpeechBubble('char-speech', "Focused work is paying off! (+1 coin, +2 XP) 💰");
          
          // Pet heart effect on focus
          triggerPetHearts();
        } else {
          // rest boosts pet health slowly
          state.petHealth = Math.min(100, state.petHealth + 2);
          updatePetStatsUI();
          showSpeechBubble('pet-speech', "Yawn! Rest matches focus! ❤️");
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

      // If user is focused study, decay is cut in half!
      let hungerDecay = 3;
      if (studyTimerActive && activeTool !== 'rest') {
        hungerDecay = 1; // Focus keeps pet energised!
      }
      
      state.decayPetStats(hungerDecay, 0);
      updatePetStatsUI();

      // Show warnings if hungry
      if (state.petHunger < 30 && !state.petIsDead && Math.random() > 0.4) {
        showSpeechBubble('pet-speech', "Squeak! I'm hungry... 🦴");
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

  // achievements modal in lounge nav
  const achievementsNavBtn = document.getElementById('achievements-nav-btn');
  if (achievementsNavBtn) {
    achievementsNavBtn.addEventListener('click', () => {
      // Show simple achievements status list inside viewport alert
      const achieveTexts = `Achievements Log: \n\n🏆 Lounge Explorer: ${state.badges >= 1 ? '✓ Unlocked' : 'Locked'}\n📖 Notes Master: ${state.badges >= 2 ? '✓ Unlocked' : 'Locked'}`;
      alert(achieveTexts);
    });
  }

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

      const taskId = `task-${Date.now()}`;
      const li = document.createElement('li');
      li.className = 'task-list-item';
      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" data-task-id="${taskId}">
        <span class="task-text-label">${escapeHtml(text)}</span>
        <button class="task-delete-btn" data-task-id="${taskId}">&times;</button>
      `;

      taskListItems.appendChild(li);
      taskInput.value = '';

      // Bind dynamic listeners
      bindTaskEvents(li);
      showSpeechBubble('char-speech', "Added a new study focus goal! 📝");
    });
  }

  // Bind complete and delete events to task items
  function bindTaskEvents(itemEl) {
    const checkbox = itemEl.querySelector('.task-checkbox');
    const deleteBtn = itemEl.querySelector('.task-delete-btn');

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        itemEl.classList.add('task-completed');
        // Reward 15 coins on goal completion
        state.addCoins(15);
        state.addXp(10);
        showSpeechBubble('char-speech', "Awesome! Task complete! Earned 15 coins & 10 XP! 💰🎉");
        triggerPetHearts();

        // fade out auto delete after 2.5s
        setTimeout(() => {
          itemEl.style.opacity = '0';
          itemEl.style.transition = 'opacity 0.4s ease';
          setTimeout(() => itemEl.remove(), 400);
        }, 2500);
      } else {
        itemEl.classList.remove('task-completed');
      }
    });

    deleteBtn.addEventListener('click', () => {
      itemEl.remove();
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

  // Bind starting task items
  const startingItems = document.querySelectorAll('.task-list-item');
  startingItems.forEach(item => bindTaskEvents(item));

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

    let isMoving = false;

    if (cursors.left.isDown || this.input.keyboard.addKey('A').isDown) {
      player.setVelocityX(-160);
      isMoving = true;
    } else if (cursors.right.isDown || this.input.keyboard.addKey('D').isDown) {
      player.setVelocityX(160);
      isMoving = true;
    }

    if (cursors.up.isDown || this.input.keyboard.addKey('W').isDown) {
      player.setVelocityY(-160);
      isMoving = true;
    } else if (cursors.down.isDown || this.input.keyboard.addKey('S').isDown) {
      player.setVelocityY(160);
      isMoving = true;
    }

    // Sync DOM character sprite to Phaser physics body
    charX = player.x - 22;
    charY = player.y - 42;
    charSprite.style.left = charX + 'px';
    charSprite.style.top = charY + 'px';

    // Sync pet loosely
    if (Math.abs(petX - charX) > 40 || Math.abs(petY - charY) > 40) {
        petX += (charX - petX) * 0.05;
        petY += (charY - petY) * 0.05;
        petSprite.style.left = petX + 'px';
        petSprite.style.top = petY + 'px';
    }

    if (isMoving) {
        updateCharacterDirection(player.body.velocity.x, player.body.velocity.y);
        updatePetDirection(charX - petX, charY - petY);
        if (charIsSitting) standUp();
    } else {
        if (!charIsSitting) {
            checkSeatSnap();
        }
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

  const game = new Phaser.Game(config);

  // Sync when Firestore finishes loading
  state.on('stateLoaded', () => {
    syncStateToUI();
    if (typeof player !== 'undefined' && player) {
      player.setPosition(charX + 22, charY + 42);
    }
  });
});
