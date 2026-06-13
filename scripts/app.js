/* app.js */

document.addEventListener('DOMContentLoaded', () => {
  const state = window.AppState;
  if (!state) return;

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
      levelEl.textContent = `Pet Level ${data.level}`;
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
    if (profileNameEl) {
      profileNameEl.textContent = data.name;
    }
  });


  // --- UI INTERACTION HANDLERS ---

  // Edit profile button
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentName = profileNameEl ? profileNameEl.textContent : 'ScholarPaws';
      const newName = prompt('Enter a new name for your pet:', currentName);
      if (newName !== null) {
        state.editPetName(newName);
      }
    });
  }

  // Get Started button
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      state.trigger('speechChange', {
        text: "Let's do this! Pick a goal, start a Pomodoro timer, and let's crush it!"
      });
    });
  }

  // Join Club button
  if (joinClubBtn) {
    joinClubBtn.addEventListener('click', () => {
      state.trigger('speechChange', {
        text: "Welcome to the Study Lounge Club! You're officially one of the cozy crew now. 🐾"
      });
      // Toggle button appearance
      joinClubBtn.textContent = 'Joined!';
      joinClubBtn.style.backgroundColor = 'var(--bg-green)';
      joinClubBtn.style.color = '#FFFDF9';
      joinClubBtn.disabled = true;
      joinClubBtn.style.cursor = 'default';
      joinClubBtn.style.boxShadow = 'none';
      joinClubBtn.style.transform = 'none';
    });
  }

  // View Profile button
  if (viewProfileBtn) {
    viewProfileBtn.addEventListener('click', () => {
      state.trigger('speechChange', {
        text: "Viewing profile details... Look at all those badges! You're a scholar!"
      });
    });
  }

  // Nav link active toggle
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const tab = link.getAttribute('data-tab');
      state.trigger('speechChange', {
        text: `Switched to the ${tab.toUpperCase()} tab! Let's explore!`
      });
    });
  });

  // Initial welcome message (animated)
  setTimeout(() => {
    typeSpeech("It's a brand new day! Ready to level up your focus?");
  }, 500);

});
