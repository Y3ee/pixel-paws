/* app.js */

document.addEventListener('DOMContentLoaded', () => {
  const state = window.AppState;
  if (!state) return;
  
  // Initial sync from state
  const coinsEl = document.getElementById('stat-coins');
  const badgesCountEl = document.getElementById('nav-badges-count');

  // Safety reset: ensure page is scrollable on load if onboarding is done
  const _savedRaw = localStorage.getItem('study_lounge_state');
  if (_savedRaw) {
    try {
      const _saved = JSON.parse(_savedRaw);
      if (_saved && _saved.onboardingComplete) {
        document.body.style.overflow = '';
        const _overlay = document.getElementById('onboarding-overlay');
        if (_overlay) { _overlay.classList.remove('active'); }
      }
    } catch(e) {}
  }

  function syncAll() {
    if (coinsEl) coinsEl.textContent = state.coins;
    if (badgesCountEl) badgesCountEl.textContent = state.badges;
    const xpEl = document.getElementById('stat-xp');
    if (xpEl) xpEl.textContent = state.xp;
    const levelEl = document.getElementById('profile-pet-level');
    if (levelEl) levelEl.textContent = `Level ${state.petLevel}`;
    const profileNameEl = document.querySelector('.profile-name');
    if (profileNameEl) profileNameEl.textContent = state.username;
    
    // Auto-hide or show onboarding overlay based on state
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    if (onboardingOverlay) {
      if (state.onboardingComplete) {
        onboardingOverlay.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        onboardingOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }
  }

  // Run initial sync
  syncAll();

  // Listen to Firestore loading updates
  state.on('stateLoaded', () => {
    syncAll();
    typeSpeech(`Welcome back, ${state.username}! Sync complete! 🐾`);
  });

  // DOM Elements
  const xpEl = document.getElementById('stat-xp');
  const levelEl = document.getElementById('profile-pet-level');
  const profileNameEl = document.querySelector('.profile-name');
  const speechTextEl = document.getElementById('speech-bubble-text');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const getStartedBtn = document.getElementById('get-started-btn');
  const joinClubBtn = document.getElementById('join-club-btn');
  const viewProfileBtn = document.getElementById('view-profile-btn');
  const navLinks = document.querySelectorAll('.nav-link');

  // Onboarding DOM Elements
  const onboardingOverlay = document.getElementById('onboarding-overlay');
  const progressBar = document.getElementById('onboarding-progress-bar');
  const skipBtn = document.getElementById('onboarding-skip-btn');
  const step1 = document.getElementById('onboarding-step-1');
  const step2 = document.getElementById('onboarding-step-2');
  const step3 = document.getElementById('onboarding-step-3');
  const step4 = document.getElementById('onboarding-step-4');
  const step5 = document.getElementById('onboarding-step-5');
  const introContinueBtn = document.getElementById('intro-continue-btn');
  const avatarNextBtn = document.getElementById('avatar-next-btn');
  const petNextBtn = document.getElementById('pet-next-btn');
  const usernameInputField = document.getElementById('username-input-field');
  const validationFeedback = document.getElementById('username-validation-feedback');
  const usernameContinueBtn = document.getElementById('username-continue-btn');
  const usernameLaterBtn = document.getElementById('username-later-btn');
  const usernameAvatarPreview = document.getElementById('username-avatar-preview');
  const welcomeAvatarChar = document.getElementById('welcome-avatar-char');
  const welcomeAvatarPet = document.getElementById('welcome-avatar-pet');
  const step5DialogText = document.getElementById('step5-dialog-text');
  const finishBtn = document.getElementById('onboarding-finish-btn');
  
  const avatarPreviewBox = document.getElementById('avatar-preview-box');
  const avatarRandomBtn = document.getElementById('avatar-random-btn');
  const avatarOptionsGrid = document.getElementById('avatar-options-grid');
  const petSelectCards = document.querySelectorAll('.pet-select-card');

  // Modal DOM Elements
  const profileModal = document.getElementById('profile-modal');
  const profileModalClose = document.getElementById('profile-modal-close');
  const profileEditForm = document.getElementById('profile-edit-form');
  const profileUsernameInput = document.getElementById('profile-username-input');
  const profileAgeInput = document.getElementById('profile-age-input');
  const profilePetNameInput = document.getElementById('profile-petname-input');
  const modalAvatarGrid = document.getElementById('modal-avatar-options-grid');
  const modalPetGrid = document.getElementById('modal-pet-options-grid');
  const profileSaveBtn = document.getElementById('profile-save-btn');
  
  const achievementsModal = document.getElementById('achievements-modal');
  const achievementsModalClose = document.getElementById('achievements-modal-close');
  
  const achievementsNavIcon = document.querySelector('button[title="Achievements"]');
  const profileNavIcon = document.querySelector('button[title="Profile"]');

  // Onboarding State trackers
  let currentAvatarIdx = 0;
  let currentPetIdx = 0;
  let currentUsername = "ScholarPaws";
  
  // Modal State trackers (temporary until save)
  let modalAvatarIdx = 0;
  let modalPetIdx = 0;

  const petSymbols = ["#pet-puppy", "#pet-kitty", "#pet-bunny", "#pet-frog", "#pet-owl"];
  const petNamesList = ["Puppy", "Kitty", "Bunny", "Frog", "Owl"];

  // Typewriter effect for speech bubble
  let speechTimeout;
  function typeSpeech(text) {
    if (!speechTextEl) return;
    
    clearTimeout(speechTimeout);
    speechTextEl.textContent = '';
    
    let i = 0;
    function type() {
      if (i < text.length) {
        speechTextEl.textContent += text.charAt(i);
        i++;
        speechTimeout = setTimeout(type, 15); // Cozy fast typing
      }
    }
    type();
  }

  // --- STATE LISTENERS (LOW COUPLING) ---

  // XP change
  state.on('xpChange', (data) => {
    if (xpEl) {
      // Add a little score pop animation
      xpEl.style.transform = 'scale(1.2)';
      xpEl.style.color = 'var(--color-orange)';
      xpEl.textContent = data.xp;
      setTimeout(() => {
        xpEl.style.transform = 'none';
        xpEl.style.color = '';
      }, 300);
    }
  });

  // Level up
  state.on('levelUp', (data) => {
    if (levelEl) {
      levelEl.textContent = `${state.goals.dailyFocus.claimed ? 'Scholar' + (state.selectedPetIndex === 0 ? 'Puppy' : state.selectedPetIndex === 1 ? 'Kitty' : state.selectedPetIndex === 2 ? 'Bunny' : state.selectedPetIndex === 3 ? 'Frog' : 'Owl') : 'Pet'} Level ${data.level}`;
      levelEl.style.fontWeight = 'bold';
      levelEl.style.color = 'var(--color-orange)';
      setTimeout(() => {
        levelEl.style.color = '';
      }, 2000);
    }
  });

  // Mascot speech change
  state.on('speechChange', (data) => {
    typeSpeech(data.text);
  });

  // Name change
  state.on('nameChange', (data) => {
    if (levelEl) {
      levelEl.textContent = `${data.name} Level ${state.petLevel}`;
    }
  });

  // Coins change
  state.on('coinsChange', (data) => {
    const coinsEl = document.getElementById('stat-coins');
    if (coinsEl) {
      coinsEl.style.transform = 'scale(1.25)';
      coinsEl.style.color = '#D4AF37';
      coinsEl.textContent = data.coins;
      setTimeout(() => {
        coinsEl.style.transform = 'none';
        coinsEl.style.color = '';
      }, 300);
    }
  });

  // Badges change
  state.on('badgesChange', (data) => {
    const badgesEl = document.getElementById('nav-badges-count');
    if (badgesEl) {
      badgesEl.style.transform = 'scale(1.3)';
      badgesEl.textContent = data.badges;
      setTimeout(() => {
        badgesEl.style.transform = 'none';
      }, 300);
    }
  });

  // Helper to render the avatar with character + pet overlay
  function renderDualAvatar(containerBox, charIndex, petIndex) {
    if (!containerBox) return;
    const petSymbol = petSymbols[petIndex] || "#pet-puppy";
    containerBox.innerHTML = `
      <svg viewBox="0 0 16 16" style="width: 100%; height: 100%; padding: 4px;"><use href="#char-avatar-${charIndex}"></use></svg>
      <div class="pet-avatar-overlay">
        <svg viewBox="0 0 16 16"><use href="${petSymbol}"></use></svg>
      </div>
    `;
  }

  // Onboarding finished state subscriber
  state.on('onboardingFinished', (data) => {
    // 1. Update Profile Avatar with dual-avatar representation
    const profileAvatarBox = document.getElementById('main-profile-avatar-box');
    renderDualAvatar(profileAvatarBox, data.avatarIndex, data.petIndex);

    // 2. Update Profile Name to selected username
    if (profileNameEl) {
      profileNameEl.textContent = data.username;
    }

    // 3. Update Pet Level name
    if (levelEl) {
      levelEl.textContent = `${data.petName} Level 1`;
    }

    // 4. Unlock the "Lounge Explorer" badge in Achievements Modal
    const achieveLoungeDate = document.getElementById('achieve-lounge-date');
    if (achieveLoungeDate) {
      achieveLoungeDate.textContent = "Unlocked";
      achieveLoungeDate.style.color = "var(--bg-green)";
      achieveLoungeDate.style.fontWeight = "bold";
    }

    // Update the locks or welcome texts
    typeSpeech(`Welcome back, ${data.username}! Let's study together with your cozy ${data.petName}!`);
  });

  // Profile updated state subscriber
  state.on('profileUpdated', (data) => {
    // 1. Update Profile Avatar with updated selections
    const profileAvatarBox = document.getElementById('main-profile-avatar-box');
    renderDualAvatar(profileAvatarBox, data.avatarIndex, data.petIndex);

    // 2. Update Profile Name
    if (profileNameEl) {
      profileNameEl.textContent = data.username;
    }

    // 3. Update Pet Level name
    if (levelEl) {
      levelEl.textContent = `${data.petName} Level 1`;
    }

    // Refresh My Pet page details if active
    if (mypetPage && mypetPage.classList.contains('active')) {
      initMypetPage();
    }
  });


  // --- UI INTERACTION HANDLERS ---


  // Get Started button (trig onboarding overlay)
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      if (onboardingOverlay) {
        onboardingOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset steps
        step1.classList.add('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        step4.classList.remove('active');
        step5.classList.remove('active');
        if (progressBar) progressBar.style.width = '20%';

        // Type onboarding greeting
        const introText = "Hey there! I'm ScholarPaws, your personal study companion!";
        const introEl = document.getElementById('intro-dialog-text');
        if (introEl) {
          introEl.textContent = '';
          let idx = 0;
          function typeIntro() {
            if (idx < introText.length) {
              introEl.textContent += introText.charAt(idx);
              idx++;
              setTimeout(typeIntro, 15);
            }
          }
          typeIntro();
        }
      }
    });
  }

  // Onboarding flow step transitions
  if (introContinueBtn) {
    introContinueBtn.addEventListener('click', () => {
      step1.classList.remove('active');
      step2.classList.add('active');
      if (progressBar) progressBar.style.width = '40%';
    });
  }

  if (avatarNextBtn) {
    avatarNextBtn.addEventListener('click', () => {
      step2.classList.remove('active');
      step3.classList.add('active');
      if (progressBar) progressBar.style.width = '60%';
    });
  }

  if (petNextBtn) {
    petNextBtn.addEventListener('click', () => {
      step3.classList.remove('active');
      step4.classList.add('active');
      if (progressBar) progressBar.style.width = '80%';
      
      // Update avatar preview inside username step
      if (usernameAvatarPreview) {
        usernameAvatarPreview.innerHTML = `
          <svg style="width: 100%; height: 100%;"><use href="#char-avatar-${currentAvatarIdx}"></use></svg>
        `;
      }
    });
  }

  // Username Input validation
  if (usernameInputField) {
    usernameInputField.addEventListener('input', () => {
      const val = usernameInputField.value.trim();
      if (val.length >= 2) {
        validationFeedback.textContent = "✓ Username is available!";
        validationFeedback.classList.remove('invalid');
      } else {
        validationFeedback.textContent = "Username must be at least 2 characters";
        validationFeedback.classList.add('invalid');
      }
    });
  }

  // Helper to load step 5 Welcome screen
  function goToWelcomeStep(username) {
    currentUsername = username;
    step4.classList.remove('active');
    step5.classList.add('active');
    if (progressBar) progressBar.style.width = '100%';

    // Render Character and Pet in Welcome Screen
    if (welcomeAvatarChar) {
      welcomeAvatarChar.innerHTML = `<svg viewBox="0 0 16 16"><use href="#char-avatar-${currentAvatarIdx}"></use></svg>`;
    }
    if (welcomeAvatarPet) {
      welcomeAvatarPet.innerHTML = `<svg viewBox="0 0 16 16"><use href="${petSymbols[currentPetIdx]}"></use></svg>`;
    }

    // Set Welcome Dialog Text
    if (step5DialogText) {
      const petName = petNamesList[currentPetIdx] || "Companion";
      const welcomeText = `Welcome aboard, ${currentUsername}! Let's dive in to study with your cozy ${petName}!`;
      step5DialogText.textContent = '';
      let idx = 0;
      function typeWelcome() {
        if (idx < welcomeText.length) {
          step5DialogText.textContent += welcomeText.charAt(idx);
          idx++;
          setTimeout(typeWelcome, 15);
        }
      }
      typeWelcome();
    }
  }

  if (usernameContinueBtn) {
    usernameContinueBtn.addEventListener('click', () => {
      const val = usernameInputField.value.trim();
      if (val.length < 2) {
        validationFeedback.textContent = "Username must be at least 2 characters";
        validationFeedback.classList.add('invalid');
        return;
      }
      goToWelcomeStep(val);
    });
  }

  if (usernameLaterBtn) {
    usernameLaterBtn.addEventListener('click', () => {
      goToWelcomeStep("ScholarPaws");
    });
  }

  // Finish Onboarding
  function finishOnboardingFlow() {
    state.completeOnboarding(currentAvatarIdx, currentPetIdx, currentUsername);
    if (onboardingOverlay) {
      onboardingOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (finishBtn) {
    finishBtn.addEventListener('click', finishOnboardingFlow);
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', finishOnboardingFlow);
  }

  // Avatar Options selection grid clicks
  if (avatarOptionsGrid) {
    const optionCards = avatarOptionsGrid.querySelectorAll('.customizer-option-card');
    optionCards.forEach(card => {
      card.addEventListener('click', () => {
        optionCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        currentAvatarIdx = parseInt(card.getAttribute('data-avatar-idx')) || 0;
        
        // Update avatar preview box
        if (avatarPreviewBox) {
          avatarPreviewBox.innerHTML = `
            <svg style="width: 100%; height: 100%;"><use href="#char-avatar-${currentAvatarIdx}"></use></svg>
          `;
        }
      });
    });
  }

  // Random Avatar Selection
  if (avatarRandomBtn && avatarOptionsGrid) {
    avatarRandomBtn.addEventListener('click', () => {
      const optionCards = avatarOptionsGrid.querySelectorAll('.customizer-option-card');
      const randIndex = Math.floor(Math.random() * optionCards.length);
      const randCard = optionCards[randIndex];
      if (randCard) {
        randCard.click();
      }
    });
  }

  // Pet Card Selection clicks
  petSelectCards.forEach(card => {
    card.addEventListener('click', () => {
      petSelectCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentPetIdx = parseInt(card.getAttribute('data-pet-idx')) || 0;
    });
  });

  // --- MODALS EVENT LISTENERS ---

  // Achievements Modal open/close
  if (achievementsNavIcon && achievementsModal) {
    achievementsNavIcon.addEventListener('click', () => {
      achievementsModal.classList.add('active');
    });
  }



  if (achievementsModalClose) {
    achievementsModalClose.addEventListener('click', () => {
      achievementsModal.classList.remove('active');
    });
  }

  // Profile Modal open/close
  const openProfileModal = () => {
    if (profileModal) {
      profileModal.classList.add('active');
      
      // Load current state into form inputs
      if (profileUsernameInput) profileUsernameInput.value = state.username;
      if (profileAgeInput) profileAgeInput.value = state.age;
      if (profilePetNameInput) profilePetNameInput.value = state.petName || '';
      
      // Load selection indexes
      modalAvatarIdx = state.selectedAvatarIndex;
      modalPetIdx = state.selectedPetIndex;
      
      // Mark current avatar active in modal grid
      if (modalAvatarGrid) {
        const cards = modalAvatarGrid.querySelectorAll('.customizer-option-card');
        cards.forEach(c => {
          c.classList.remove('active');
          if (parseInt(c.getAttribute('data-avatar-idx')) === modalAvatarIdx) {
            c.classList.add('active');
          }
        });
      }

      // Mark current pet active in modal grid
      if (modalPetGrid) {
        const cards = modalPetGrid.querySelectorAll('.customizer-option-card');
        cards.forEach(c => {
          c.classList.remove('active');
          if (parseInt(c.getAttribute('data-pet-idx')) === modalPetIdx) {
            c.classList.add('active');
          }
        });
      }
    }
  };

  if (profileNavIcon) {
    profileNavIcon.addEventListener('click', openProfileModal);
  }

  if (viewProfileBtn) {
    viewProfileBtn.addEventListener('click', openProfileModal);
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openProfileModal);
  }

  if (profileModalClose) {
    profileModalClose.addEventListener('click', () => {
      profileModal.classList.remove('active');
    });
  }

  // Modal Avatar card selection click
  if (modalAvatarGrid) {
    const cards = modalAvatarGrid.querySelectorAll('.customizer-option-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        modalAvatarIdx = parseInt(card.getAttribute('data-avatar-idx')) || 0;
      });
    });
  }

  // Modal Pet card selection click
  if (modalPetGrid) {
    const cards = modalPetGrid.querySelectorAll('.customizer-option-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        modalPetIdx = parseInt(card.getAttribute('data-pet-idx')) || 0;
      });
    });
  }

  // Save profile edit form submit
  if (profileEditForm) {
    profileEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = profileUsernameInput.value.trim();
      const newAge = profileAgeInput.value;
      const newPetName = profilePetNameInput ? profilePetNameInput.value.trim() : '';
      
      state.updateProfileInfo(newName, newAge, modalAvatarIdx, modalPetIdx, newPetName);
      profileModal.classList.remove('active');
    });
  }

  // Close modals when clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      profileModal.classList.remove('active');
    }
    if (e.target === achievementsModal) {
      achievementsModal.classList.remove('active');
    }
  });

  // Study Lounge nav button click redirect to lounge subpage
  if (joinClubBtn) {
    joinClubBtn.addEventListener('click', () => {
      state.save();
      window.location.href = 'lounge.html';
    });
  }

  // =====================================================
  // MY PET PAGE - TAB SWITCHING & PET ROOM LOGIC
  // =====================================================

  const mainContent   = document.querySelector('.main-content');
  const mypetPage     = document.getElementById('mypet-page');
  const mypetRoom     = document.getElementById('mypet-room');
  const mypetPetSprite  = document.getElementById('mypet-pet-sprite');
  const mypetPetSvg     = document.getElementById('mypet-pet-svg');
  const mypetSpeech     = document.getElementById('mypet-speech');
  const mypetSpeechText = document.getElementById('mypet-speech-text');
  const mypetAvatarSvg  = document.getElementById('mypet-avatar-svg');
  const mypetNameLabel  = document.getElementById('mypet-name-label');
  const mypetLevelLabel = document.getElementById('mypet-level-label');
  const mypetMoodLabel  = document.getElementById('mypet-mood-label');
  const mypetHungerBar  = document.getElementById('mypet-hunger-bar');
  const mypetHungerPct  = document.getElementById('mypet-hunger-pct');
  const mypetHealthBar  = document.getElementById('mypet-health-bar');
  const mypetHealthPct  = document.getElementById('mypet-health-pct');
  const mypetFeedMsg    = document.getElementById('mypet-feed-msg');
  const mypetReviveCard = document.getElementById('mypet-revive-card');
  const mypetReviveBtn  = document.getElementById('mypet-revive-btn');
  const mypetFeedSnack  = document.getElementById('mypet-feed-snack');
  const mypetFeedMeal   = document.getElementById('mypet-feed-meal');
  const mypetFeedTreat  = document.getElementById('mypet-feed-treat');

  // Pet symbols mapping
  const petSyms = ["pet-puppy", "pet-kitty", "pet-bunny", "pet-frog", "pet-owl"];

  const petDialogues = [
    'Let\'s play! 🎾', 'I\'m happy! 😊', 'Pet me! 🥺',
    'Zzzz... 💤', 'What\'s that? 👀', '*Yipeee* 🐾',
    'Yay, you\'re here!', 'I love you! ❤️', 'Feed me? 🍖',
    'Play with me! 🎈', 'Best day ever! ✨', 'I found a ball! ⚽'
  ];

  let petWanderInterval = null;
  let speechHideTimeout = null;
  let petX = 40, petY = 45;

  function getMoodLabel(hunger, health) {
    if (health < 20) return '😵 Fainted';
    if (hunger < 20) return '😰 Starving';
    if (hunger < 40) return '😟 Hungry';
    if (health < 50) return '🤒 Unwell';
    if (hunger > 80 && health > 80) return '😄 Very Happy';
    return '😊 Happy';
  }

  function updateMypetStats() {
    const hunger = state.petHunger;
    const health = state.petHealth;
    const isDead = state.petIsDead;
    if (mypetHungerBar) mypetHungerBar.style.width = hunger + '%';
    if (mypetHungerPct) mypetHungerPct.textContent = hunger + '%';
    if (mypetHealthBar) mypetHealthBar.style.width = health + '%';
    if (mypetHealthPct) mypetHealthPct.textContent = health + '%';
    if (mypetMoodLabel) mypetMoodLabel.textContent = getMoodLabel(hunger, health);
    if (mypetLevelLabel) mypetLevelLabel.textContent = `Level ${state.petLevel}`;
    if (mypetReviveCard) mypetReviveCard.style.display = isDead ? 'block' : 'none';
  }

  function placePet(x, y, animate) {
    if (!mypetPetSprite) return;
    mypetPetSprite.style.transition = animate
      ? 'left 1.4s cubic-bezier(0.45,0,0.55,1), top 1.4s cubic-bezier(0.45,0,0.55,1)'
      : 'none';
    mypetPetSprite.style.left = x + '%';
    mypetPetSprite.style.top  = y + '%';
  }

  function showSpeech(text) {
    if (!mypetSpeech || !mypetSpeechText) return;
    mypetSpeechText.textContent = text;
    mypetSpeech.classList.add('visible');
    clearTimeout(speechHideTimeout);
    speechHideTimeout = setTimeout(() => mypetSpeech.classList.remove('visible'), 2800);
  }

  function startWander() {
    stopWander();
    petWanderInterval = setInterval(() => {
      if (!mypetPage || !mypetPage.classList.contains('active')) return;
      const newX = 8 + Math.random() * 72;
      const newY = 30 + Math.random() * 50;

      const dx = newX - petX;
      const dy = newY - petY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      let suffix = "";
      let scaleX = 1;

      if (absDx > absDy) {
        suffix = "-side";
        scaleX = dx > 0 ? 1 : -1;
      } else {
        suffix = dy > 0 ? "" : "-back";
        scaleX = 1;
      }

      const petIdx = state.selectedPetIndex || 0;
      const petBase = petSyms[petIdx] || "pet-puppy";

      if (mypetPetSvg) {
        mypetPetSvg.innerHTML = `<use href="#${petBase}${suffix}"></use>`;
        mypetPetSvg.style.transform = `scaleX(${scaleX})`;
      }

      petX = newX; petY = newY;
      placePet(petX, petY, true);

      // Return to facing front after arriving (1.4 seconds)
      setTimeout(() => {
        if (!mypetPage || !mypetPage.classList.contains('active')) return;
        if (mypetPetSvg) {
          mypetPetSvg.innerHTML = `<use href="#${petBase}"></use>`;
          mypetPetSvg.style.transform = 'scaleX(1)';
        }
      }, 1400);

      if (Math.random() < 0.10) {
        const line = petDialogues[Math.floor(Math.random() * petDialogues.length)];
        setTimeout(() => showSpeech(line), 700);
      }
    }, 3000);
  }

  function stopWander() {
    if (petWanderInterval) { clearInterval(petWanderInterval); petWanderInterval = null; }
  }

  function initMypetPage() {
    const petIdx = state.selectedPetIndex || 0;
    const sym = petSyms[petIdx] || "pet-puppy";
    if (mypetPetSvg) {
      mypetPetSvg.innerHTML = `<use href="#${sym}"></use>`;
      mypetPetSvg.setAttribute('viewBox', '0 0 16 16');
    }
    if (mypetAvatarSvg) {
      mypetAvatarSvg.innerHTML = `<use href="#${sym}"></use>`;
      mypetAvatarSvg.setAttribute('viewBox', '0 0 16 16');
    }
    const petNames = ['Puppy', 'Kitty', 'Bunny', 'Frog', 'Owl'];
    if (mypetNameLabel) mypetNameLabel.textContent = state.petName || petNames[petIdx] || 'Companion';
    updateMypetStats();
    petX = 35 + Math.random() * 25;
    petY = 38 + Math.random() * 25;
    placePet(petX, petY, false);
    startWander();
  }

  // Feed buttons
  function showFeedMsg(msg) {
    if (!mypetFeedMsg) return;
    mypetFeedMsg.textContent = msg;
    setTimeout(() => { mypetFeedMsg.textContent = ''; }, 2500);
  }

  // Floating hearts logic
  function triggerMypetHearts() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!mypetPetSprite) return;
        const heart = document.createElement('div');
        heart.className = 'mypet-heart-item';
        heart.textContent = '❤️';
        const offsetLeft = (Math.random() * 30 - 15);
        heart.style.left = `calc(50% + ${offsetLeft}px)`;
        const scale = 0.8 + Math.random() * 0.5;
        heart.style.transform = `translateX(-50%) scale(${scale})`;
        
        mypetPetSprite.appendChild(heart);
        
        setTimeout(() => {
          heart.remove();
        }, 1500);
      }, i * 200);
    }
  }

  // Click pet to trigger hearts and speech
  if (mypetPetSprite) {
    mypetPetSprite.addEventListener('click', () => {
      triggerMypetHearts();
      const happyLines = ['*purr* ❤️', '*pant pant* 🐾', 'Hehe, tickles! 😄', 'I love you! ❤️', 'Do you miss me?', 'I  miss you!❤️'];
      showSpeech(happyLines[Math.floor(Math.random() * happyLines.length)]);
    });
  }

  if (mypetFeedSnack) {
    mypetFeedSnack.addEventListener('click', () => {
      if (state.feedPet('Snack', 5, 15, 5)) { 
        updateMypetStats(); 
        showFeedMsg('Yummy snack! +15% 🍪'); 
        showSpeech('Nom nom! 😋'); 
        triggerMypetHearts();
      }
      else showFeedMsg('Not enough coins!');
    });
  }
  if (mypetFeedMeal) {
    mypetFeedMeal.addEventListener('click', () => {
      if (state.feedPet('Meal', 15, 35, 15)) { 
        updateMypetStats(); 
        showFeedMsg('Delicious! +35% 🍖'); 
        showSpeech('So full! 😊'); 
        triggerMypetHearts();
      }
      else showFeedMsg('Not enough coins!');
    });
  }
  if (mypetFeedTreat) {
    mypetFeedTreat.addEventListener('click', () => {
      if (state.feedPet('Treat', 25, 50, 25)) { 
        updateMypetStats(); 
        showFeedMsg('Tasty treat! +50% 🎂'); 
        showSpeech('Best day ever! 🎉'); 
        triggerMypetHearts();
      }
      else showFeedMsg('Not enough coins!');
    });
  }
  if (mypetReviveBtn) {
    mypetReviveBtn.addEventListener('click', () => {
      if (state.revivePet(50)) { 
        updateMypetStats(); 
        showFeedMsg('Pet revived! 🎊'); 
        showSpeech('I\'m back! 🌟'); 
        triggerMypetHearts();
      }
      else showFeedMsg('Need 50 coins to revive!');
    });
  }

  state.on('petStatsChange', () => {
    if (mypetPage && mypetPage.classList.contains('active')) updateMypetStats();
  });

  state.on('taskCompletedEffect', () => {
    triggerMypetHearts();
  });

  // Nav link tab switching
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const tab = link.getAttribute('data-tab');
      if (tab === 'mypet') {
        if (mainContent) mainContent.style.display = 'none';
        if (mypetPage) { mypetPage.classList.add('active'); initMypetPage(); }
        state.trigger('speechChange', { text: 'Say hello to your pet! 🐾' });
      } else {
        if (mainContent) mainContent.style.display = '';
        if (mypetPage) { mypetPage.classList.remove('active'); stopWander(); }
        state.trigger('speechChange', {
          text: `Switched to ${tab === 'learn' ? 'Home' : tab.charAt(0).toUpperCase() + tab.slice(1)}! Let's explore!`
        });
      }
    });
  });

  // Initial welcome message (animated)
  setTimeout(() => {
    typeSpeech("It's a brand new day! Ready to level up your focus?");
  }, 500);

});
