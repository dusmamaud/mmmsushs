// All previous styles and HTML remain exactly the same until the JavaScript part
// Only adding/modifying the control logic

const dusPopup = document.createElement('div');
dusPopup.className = 'dus-popup-overlay';
dusPopup.innerHTML = `
<div class="dus-popup-container">
    <div class="dus-popup-content">
        <div class="dus-logo-container">
            <div class="dus-logo">
                <i class='bx bx-music-note'></i>
            </div>
        </div>
        <h2>Premium Access Required</h2>
        <div class="dus-divider"></div>
        <p>You've reached the free usage limit. Please log in to continue listening to our music collection.</p>
        <form id="dusLoginForm">
            <div class="dus-input-group">
                <div class="dus-input-wrapper">
                    <i class='bx bx-user'></i>
                    <input type="text" id="dusUsername" placeholder="Enter your premium username" required>
                </div>
            </div>
            <div class="dus-input-group">
                <div class="dus-input-wrapper">
                    <i class='bx bx-lock-alt'></i>
                    <input type="password" id="dusPassword" placeholder="Enter your premium password" required>
                </div>
            </div>
            <button type="submit" id="dusLoginBtn">
                <span>Continue Listening</span>
                <i class='bx bx-right-arrow-alt'></i>
            </button>
        </form>
        <div class="dus-contact-admin">
            <p>Don't have premium access?</p>
            <a href="https://instagram.com/your-instagram" target="_blank" class="dus-instagram-link">
                <i class='bx bxl-instagram'></i>
                <span>Contact Admin</span>
            </a>
        </div>
    </div>
</div>
`;

const dusStyles = `
:root {
    --primary-bg: #f5f5f5;
    --secondary-bg: #ffffff;
    --primary-text: #1a1a1a;
    --secondary-text: #666666;
    --accent-color: #ff6b2b;
    --accent-hover: #ff8f5d;
    --neumorph-light: rgba(255, 255, 255, 1);
    --neumorph-dark: rgba(0, 0, 0, 0.1);
    --shadow-large: 20px 20px 60px #d1d1d1, -20px -20px 60px #ffffff;
    --shadow-small: 5px 5px 15px #d1d1d1, -5px -5px 15px #ffffff;
    --gradient-bg: linear-gradient(145deg, #ffffff, #f0f0f0);
}

.dus-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(26, 26, 26, 0.98);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 99999;
    backdrop-filter: blur(10px);
}

.dus-popup-container {
    background: var(--secondary-bg);
    padding: 3rem;
    border-radius: 24px;
    box-shadow: var(--shadow-large);
    max-width: 480px;
    width: 90%;
    transform: scale(0.9);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dus-popup-overlay.active .dus-popup-container {
    transform: scale(1);
    opacity: 1;
}

.dus-logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
}

.dus-logo {
    width: 80px;
    height: 80px;
    background: var(--gradient-bg);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-small);
}

.dus-logo i {
    color: var(--accent-color);
    font-size: 2.5rem;
}

.dus-popup-content h2 {
    color: var(--primary-text);
    margin-bottom: 1rem;
    font-size: 2rem;
    font-weight: 700;
}

.dus-divider {
    width: 60px;
    height: 4px;
    background: var(--accent-color);
    margin: 1.2rem auto;
    border-radius: 2px;
}

.dus-popup-content p {
    color: var(--secondary-text);
    margin-bottom: 2rem;
    line-height: 1.7;
    font-size: 1.1rem;
}

.dus-input-wrapper {
    position: relative;
    margin-bottom: 1.5rem;
}

.dus-input-wrapper i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--secondary-text);
    font-size: 1.2rem;
}

.dus-input-wrapper input {
    width: 100%;
    padding: 15px 15px 15px 45px;
    border: 2px solid var(--primary-bg);
    background: var(--primary-bg);
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
    color: var(--primary-text);
}

.dus-input-wrapper input:focus {
    outline: none;
    border-color: var(--accent-color);
    background: var(--secondary-bg);
}

.dus-input-wrapper input::placeholder {
    color: #999;
}

#dusLoginBtn {
    width: 100%;
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 15px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s ease;
}

#dusLoginBtn i {
    font-size: 1.4rem;
    transition: transform 0.3s ease;
}

#dusLoginBtn:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 107, 43, 0.4);
}

#dusLoginBtn:hover i {
    transform: translateX(5px);
}

.dus-contact-admin {
    margin-top: 2rem;
    text-align: center;
}

.dus-contact-admin p {
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
}

.dus-instagram-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--accent-color);
    text-decoration: none;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.dus-instagram-link i {
    font-size: 1.4rem;
}

.dus-instagram-link:hover {
    background: var(--primary-bg);
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .dus-popup-container {
        width: 95%;
        padding: 2rem;
    }
    
    .dus-popup-content h2 {
        font-size: 1.6rem;
    }
    
    .dus-logo {
        width: 60px;
        height: 60px;
    }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
`;

const dusStyleSheet = document.createElement('style');
dusStyleSheet.textContent = dusStyles;
document.head.appendChild(dusStyleSheet);
document.body.appendChild(dusPopup);

// Function to handle music pause
const pauseMusic = () => {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        if (!audio.paused) {
            audio.pause();
            audio.dataset.wasPlaying = 'true';
        }
    });
};

// Function to resume music
const resumeMusic = () => {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        if (audio.dataset.wasPlaying === 'true') {
            audio.play();
            audio.dataset.wasPlaying = 'false';
        }
    });
};

// Check session status
const checkSessionStatus = () => {
    // Check for permanent access
    if (localStorage.getItem('dusPermanentAccess') === 'true') {
        return;
    }

    // Check for temporary session
    const tempSession = sessionStorage.getItem('dusTemporaryAccess');
    const sessionExpiry = sessionStorage.getItem('dusSessionExpiry');

    if (!tempSession || (sessionExpiry && Date.now() > parseInt(sessionExpiry))) {
        showPopup();
    }
};

// Show popup function
const showPopup = () => {
    pauseMusic();
    dusPopup.style.display = 'flex';
    requestAnimationFrame(() => {
        dusPopup.classList.add('active');
    });
};

// Initialize popup functionality
const initDusPopup = () => {
    if (!localStorage.getItem('dusPermanentAccess')) {
        // Show popup after 1 minute if no permanent access
        setTimeout(() => {
            showPopup();
            // Set initial session state
            sessionStorage.setItem('dusTemporaryAccess', 'false');
        }, 60000);
    }
};

document.getElementById('dusLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('dusUsername').value;
    const password = document.getElementById('dusPassword').value;

    if (username === 'user' && password === 'user123') {
        dusPopup.classList.remove('active');
        setTimeout(() => {
            dusPopup.style.display = 'none';
            resumeMusic();
        }, 300);

        // Set temporary session
        sessionStorage.setItem('dusTemporaryAccess', 'true');
        sessionStorage.setItem('dusSessionExpiry', Date.now() + 90000); // 1.5 minutes

        // Show again after 1.5 minutes
        setTimeout(() => {
            if (!localStorage.getItem('dusPermanentAccess')) {
                sessionStorage.setItem('dusTemporaryAccess', 'false');
                showPopup();
            }
        }, 90000);
    } else if (username.toLowerCase() === 'dusmamud' && password === 'dus123') {
        // Set permanent access
        localStorage.setItem('dusPermanentAccess', 'true');
        dusPopup.classList.remove('active');
        setTimeout(() => {
            dusPopup.style.display = 'none';
            resumeMusic();
        }, 300);
    } else {
        const form = document.getElementById('dusLoginForm');
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
        alert('Invalid credentials! Please try again.');
    }
});

// Check session status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkSessionStatus();
});

// Initialize the popup
initDusPopup();

// Add event listener for visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkSessionStatus();
    }
});