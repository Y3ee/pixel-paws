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
  let charX = 200;
  let charY = 350;
  let charTargetX = 200;
  let charTargetY = 350;
  let charSpeed = 4;
  let charIsWalking = false;
  let charIsSitting = false;
  let currentTableId = null;

  // Keyboard movement state
  const keysPressed = {};

  window.addEventListener('keydown', (e) => {
    // Disable movement when typing in a task input or status select
    if (document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA' || 
      document.activeElement.tagName === 'SELECT'
    )) {
      return;
    }

    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault(); // prevent arrow keys scrolling
      keysPressed[key] = true;
      if (charIsSitting) standUp();
    }
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keysPressed) {
      delete keysPressed[key];
    }
  });

  let petX = 240;
  let petY = 370;
  let petTargetX = 240;
  let petTargetY = 370;
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
    
    const petNameStr = petNamesList[state.selectedPetIndex] || "Companion";
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

  // --- COLLISION PHYSICS SYSTEM ---
  function isCollidingCafe(px, py) {
    // 1. Screen boundaries
    if (px < 15 || px > 745 || py < 120 || py > 435) {
      // Rug check: if they are near the bottom center door (x: 330-450, y > 435), allow them to exit!
      if (py > 435 && px >= 330 && px <= 450) {
        return false;
      }
      return true;
    }

    // 2. Bookshelf 1
    if (px >= 180 && px <= 230 && py >= 120 && py <= 185) return true;
    // 3. Bookshelf 2
    if (px >= 560 && px <= 610 && py >= 120 && py <= 185) return true;
    // 4. Fireplace
    if (px >= 635 && px <= 695 && py >= 120 && py <= 185) return true;

    // 5. U-shaped Counter (entire area including inside)
    if (px >= 285 && px <= 525 && py >= 120 && py <= 325) return true;

    // 6. Booth 1 (Top Left Table)
    if (px >= 60 && px <= 95 && py >= 180 && py <= 230) return true;
    // 7. Booth 2 (Bottom Left Table)
    if (px >= 60 && px <= 95 && py >= 370 && py <= 420) return true;

    // 8. Round Table 1 (Top Right)
    if (px >= 660 && px <= 720 && py >= 205 && py <= 260) return true;
    // 9. Round Table 2 (Middle Right)
    if (px >= 580 && px <= 640 && py >= 315 && py <= 370) return true;
    // 10. Round Table 3 (Bottom Right)
    if (px >= 660 && px <= 720 && py >= 415 && py <= 470) return true;

    // 11. Plants
    if (px >= 130 && px <= 160 && py >= 120 && py <= 175) return true;
    if (px >= 10 && px <= 80 && py >= 410 && py <= 450) return true;
    if (px >= 720 && px <= 760 && py >= 315 && py <= 365) return true;
    if (px >= 720 && px <= 760 && py >= 415 && py <= 465) return true;
    if (px >= 710 && px <= 740 && py >= 120 && py <= 175) return true;

    return false;
  }

  function isCollidingPark(px, py) {
    if (px < 15 || px > 745 || py < 120 || py > 435) {
      if (px < 15 && py >= 160 && py <= 260) {
        return false; // Entrance door to Cafe is open
      }
      return true;
    }
    return false;
  }

  // --- MOVEMENT ENGINE (requestAnimationFrame) ---
  function updatePositions() {
    // Check keyboard movement first
    let moveX = 0;
    let moveY = 0;
    
    if (keysPressed['w'] || keysPressed['arrowup']) moveY -= 1;
    if (keysPressed['s'] || keysPressed['arrowdown']) moveY += 1;
    if (keysPressed['a'] || keysPressed['arrowleft']) moveX -= 1;
    if (keysPressed['d'] || keysPressed['arrowright']) moveX += 1;

    let isKeyboardMoving = (moveX !== 0 || moveY !== 0);

    // 1. Walk Character
    let charDx = 0;
    let charDy = 0;
    let isMoving = false;

    if (isKeyboardMoving) {
      isMoving = true;
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      charDx = (moveX / length) * charSpeed;
      charDy = (moveY / length) * charSpeed;
    } else if (charX !== charTargetX || charY !== charTargetY) {
      isMoving = true;
      const dx = charTargetX - charX;
      const dy = charTargetY - charY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= charSpeed) {
        charDx = charTargetX - charX;
        charDy = charTargetY - charY;
      } else {
        charDx = (dx / distance) * charSpeed;
        charDy = (dy / distance) * charSpeed;
      }
    }

    if (isMoving) {
      charIsWalking = true;
      charSprite.classList.add('sprite-walking');

      // Collision check & sliding physics
      let nextX = charX + charDx;
      let nextY = charY + charDy;
      let contactX = nextX + 22;
      let contactY = nextY + 42;

      let allowedDx = charDx;
      let allowedDy = charDy;

      const isColliding = currentRoom === 'cafe' ? isCollidingCafe : isCollidingPark;

      if (isColliding(contactX, contactY)) {
        // Try sliding horizontally
        const slideXCollides = isColliding(nextX + 22, charY + 42);
        // Try sliding vertically
        const slideYCollides = isColliding(charX + 22, nextY + 42);

        if (!slideXCollides) {
          allowedDy = 0; // slide horizontally
        } else if (!slideYCollides) {
          allowedDx = 0; // slide vertically
        } else {
          // Blocked completely
          allowedDx = 0;
          allowedDy = 0;
          
          if (!isKeyboardMoving) {
            // Stop click-movement since we're stuck
            charTargetX = charX;
            charTargetY = charY;
          }
        }
      }

      charX = Math.max(5, Math.min(765, charX + allowedDx));
      charY = Math.max(100, Math.min(460, charY + allowedDy));

      if (isKeyboardMoving) {
        charTargetX = charX;
        charTargetY = charY;
      }

      charSprite.style.left = `${charX}px`;
      charSprite.style.top = `${charY}px`;
      updateCharacterDirection(allowedDx, allowedDy);
    } else {
      if (charIsWalking) {
        charIsWalking = false;
        charSprite.classList.remove('sprite-walking');
        
        // Snapping check: did we walk to a seat?
        checkSeatSnap();
      }
    }

    // 2. Walk Pet (follows character or wanders)
    let finalPetSpeed = petSpeed;
    if (state.petIsDead) {
      // Dead pets don't walk!
      petTargetX = petX;
      petTargetY = petY;
    } else {
      // Make pet follow the moving owner
      if (charIsWalking && Math.random() < 0.04) {
        petTargetX = charX + (Math.random() * 40 - 20);
        petTargetY = charY + 15;
      }

      const dxPet = petTargetX - petX;
      const dyPet = petTargetY - petY;
      const distancePet = Math.sqrt(dxPet * dxPet + dyPet * dyPet);

      if (distancePet > 2) {
        petIsWalking = true;
        petSprite.classList.add('sprite-walking');
        
        let pDx = 0;
        let pDy = 0;
        if (distancePet <= finalPetSpeed) {
          pDx = petTargetX - petX;
          pDy = petTargetY - petY;
          petX = petTargetX;
          petY = petTargetY;
        } else {
          pDx = (dxPet / distancePet) * finalPetSpeed;
          pDy = (dyPet / distancePet) * finalPetSpeed;
          petX += pDx;
          petY += pDy;
        }
        petSprite.style.left = `${petX}px`;
        petSprite.style.top = `${petY}px`;
        updatePetDirection(pDx, pDy);
      } else {
        if (petIsWalking) {
          petIsWalking = false;
          petSprite.classList.remove('sprite-walking');
        }
      }
    }

    // 3. Collision / Map Transition door checks
    checkDoorTransitions();

    requestAnimationFrame(updatePositions);
  }

  // Trigger position update loop
  requestAnimationFrame(updatePositions);

  // Check if character arrived at a door zone to swap rooms
  function checkDoorTransitions() {
    if (currentRoom === 'cafe' && charY >= 450 && charX >= 330 && charX <= 450) {
      // Transitions to Park
      changeRoom('park');
    } else if (currentRoom === 'park' && charX <= 45 && charY >= 160 && charY <= 260) {
      // Transitions to Cafe
      changeRoom('cafe');
    }
  }

  // Swap Cafe <-> Park
  function changeRoom(roomName) {
    if (charIsSitting) standUp();
    
    currentRoom = roomName;
    if (roomName === 'park') {
      tabCafe.classList.remove('active');
      tabPark.classList.add('active');
      cafeOnlyElements.style.display = 'none';
      parkOnlyElements.style.display = 'block';
      viewportMap.className = 'viewport-map map-park';

      // Snap coordinates to entrance door in park (left edge)
      charX = 60;
      charY = 220;
      charTargetX = 65;
      charTargetY = 220;
      
      petX = 85;
      petY = 230;
      petTargetX = 85;
      petTargetY = 230;

      showSpeechBubble('char-speech', "Wow, look at all this green grass! 🌳");
      setTimeout(() => {
        showSpeechBubble('pet-speech', "Woof woof! Let's play!");
      }, 1500);
    } else {
      tabPark.classList.remove('active');
      tabCafe.classList.add('active');
      parkOnlyElements.style.display = 'none';
      cafeOnlyElements.style.display = 'block';
      viewportMap.className = 'viewport-map map-cafe';

      // Snap coordinates to entrance door in cafe (bottom middle)
      charX = 390;
      charY = 440;
      charTargetX = 390;
      charTargetY = 415;
      
      petX = 390;
      petY = 445;
      petTargetX = 390;
      petTargetY = 445;

      showSpeechBubble('char-speech', "Ah, back in the warm cafe counter! ☕");
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
      if (svgEl) svgEl.style.transform = 'scaleX(1)';
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

});
