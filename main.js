// Global Variables
let audioContext;
let currentSong = null;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none'; // none, one, all
let currentPlaylist = [];
let currentSongIndex = 0;
let isDraggingProgress = false;

// DOM Elements
const miniPlayer = document.getElementById('miniPlayer');
const audioElement = document.getElementById('audioElement');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressBar = document.querySelector('.progress-bar-fill');
const progressBarContainer = document.querySelector('.progress-bar-container');
const currentTimeDisplay = document.querySelector('.current-time');
const totalDurationDisplay = document.querySelector('.total-duration');
const volumeSlider = document.getElementById('volumeSlider');
const volumeBtn = document.getElementById('volumeBtn');
const songsContainer = document.getElementById('songsContainer');
const artistsGrid = document.getElementById('artistsGrid');
const loadMoreArtists = document.getElementById('loadMoreArtists');
const loadMoreSongs = document.getElementById('loadMoreSongs');
const themeToggle = document.getElementById('themeToggle');

// Constants
const STORAGE_KEYS = {
    CURRENT_SONG: 'xoMusic_currentSong',
    VOLUME: 'xoMusic_volume',
    THEME: 'xoMusic_theme',
    SHUFFLE: 'xoMusic_shuffle',
    REPEAT: 'xoMusic_repeat'
};

const DISPLAY_COUNTS = {
    INITIAL_ARTISTS: 4,
    MORE_ARTISTS: 2,
    INITIAL_SONGS: 20,
    MORE_SONGS: 5
};

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    themeToggle.innerHTML = `<i class='bx bx-${theme === 'dark' ? 'moon' : 'sun'}'></i>`;
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Audio Player Class
class AudioPlayer {
    constructor() {
        this.audio = audioElement;
        this.audio.preload = 'auto';
        this.initializeEventListeners();
        this.loadSettings();
    }

    loadSettings() {
        // Load volume
        const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
        if (savedVolume !== null) {
            this.audio.volume = parseFloat(savedVolume);
            volumeSlider.value = parseFloat(savedVolume) * 100;
        }

        // Load shuffle and repeat states
        isShuffle = localStorage.getItem(STORAGE_KEYS.SHUFFLE) === 'true';
        repeatMode = localStorage.getItem(STORAGE_KEYS.REPEAT) || 'none';
        this.updateShuffleButton();
        this.updateRepeatButton();
    }

    initializeEventListeners() {
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('error', (e) => this.handleError(e));
        this.audio.addEventListener('volumechange', () => this.handleVolumeChange());
        this.audio.addEventListener('loadedmetadata', () => this.updateDurationDisplay());
    }

    handleSongEnd() {
        if (repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else {
            this.playNext();
        }
    }

    handleError(error) {
        console.error('Audio error:', error);
        showToast('Error playing audio');
    }

    handleVolumeChange() {
        localStorage.setItem(STORAGE_KEYS.VOLUME, this.audio.volume);
        this.updateVolumeIcon();
    }

    async loadSong(song) {
        try {
            if (!song || !song.url) {
                throw new Error('Invalid song data');
            }

            currentSong = song;
            this.audio.src = song.url;
            localStorage.setItem(STORAGE_KEYS.CURRENT_SONG, JSON.stringify(song));
            this.updateMiniPlayer(song);
            await this.play();
        } catch (error) {
            console.error('Error loading song:', error);
            showToast('Error loading song');
        }
    }

    async play() {
        try {
            await this.audio.play();
            isPlaying = true;
            this.updatePlayPauseButton();
            miniPlayer.classList.add('active');
        } catch (error) {
            console.error('Playback error:', error);
            showToast('Please Wait :)');
        }
    }

    pause() {
        this.audio.pause();
        isPlaying = false;
        this.updatePlayPauseButton();
    }

    togglePlay() {
        if (this.audio.src) {
            if (isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        }
    }

    updateProgress() {
        if (!isDraggingProgress && !isNaN(this.audio.duration)) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            progressBar.style.width = `${progress}%`;  // Changed from transform to width
            currentTimeDisplay.textContent = formatTime(this.audio.currentTime);
            totalDurationDisplay.textContent = formatTime(this.audio.duration);
        }
    }

     // Update the progress bar interaction methods
  handleProgressBarClick(e) {
    const rect = progressBarContainer.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const newProgress = (clickPosition / rect.width);
    if (this.audio.duration) {
        this.audio.currentTime = newProgress * this.audio.duration;
        progressBar.style.width = `${newProgress * 100}%`;  // Changed from transform to width
    }
}

    updateDurationDisplay() {
        totalDurationDisplay.textContent = formatTime(this.audio.duration);
    }

    // Update the updatePlayPauseButton method in your AudioPlayer class
updatePlayPauseButton() {
    playPauseBtn.innerHTML = `<i class='bx bx-${isPlaying ? 'pause' : 'play'}'></i>`;
    
    // Update the current song card's play button if it exists
    if (currentSong) {
        const currentCard = document.querySelector(`.song-card[data-song-id="${currentSong.id}"]`);
        if (currentCard) {
            const playBtn = currentCard.querySelector('.play-btn i');
            if (playBtn) {
                playBtn.classList.remove('bx-play', 'bx-pause');
                playBtn.classList.add(isPlaying ? 'bx-pause' : 'bx-play');
            }
        }
    }
}

    updateMiniPlayer(song) {
        const miniPlayerImg = document.querySelector('.now-playing-img img');
        const miniPlayerTitle = document.querySelector('.now-playing-title');
        const miniPlayerArtist = document.querySelector('.now-playing-artist');

        miniPlayerImg.src = song.coverArt;
        miniPlayerTitle.textContent = song.title;
        miniPlayerArtist.textContent = song.artist;

        this.updateMediaSession(song);
    }

    updateMediaSession(song) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                artwork: [{ src: song.coverArt }]
            });

            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
        }
    }

    updateVolumeIcon() {
        const volume = this.audio.volume;
        let icon = volume === 0 ? 'mute' : volume < 0.5 ? 'low' : 'full';
        volumeBtn.innerHTML = `<i class='bx bx-volume-${icon}'></i>`;
    }

    updateShuffleButton() {
        shuffleBtn.classList.toggle('active', isShuffle);
        localStorage.setItem(STORAGE_KEYS.SHUFFLE, isShuffle);
    }

    updateRepeatButton() {
        repeatBtn.classList.remove('active');
        let icon = 'bx-repeat';
        
        switch (repeatMode) {
            case 'one':
                icon = 'bx-repeat-1';
                repeatBtn.classList.add('active');
                break;
            case 'all':
                repeatBtn.classList.add('active');
                break;
        }
        
        repeatBtn.innerHTML = `<i class='bx ${icon}'></i>`;
        localStorage.setItem(STORAGE_KEYS.REPEAT, repeatMode);
    }

    playNext() {
        if (currentPlaylist.length === 0) return;
        
        if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * currentPlaylist.length);
        } else {
            currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
        }
        
        this.loadSong(currentPlaylist[currentSongIndex]);
    }

    playPrevious() {
        if (currentPlaylist.length === 0) return;
        
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        if (isShuffle) {
            currentSongIndex = Math.floor(Math.random() * currentPlaylist.length);
        } else {
            currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        }
        
        this.loadSong(currentPlaylist[currentSongIndex]);
    }
}

// All previous styles and HTML remain exactly the same until the JavaScript part
// Only adding/modifying the control logic

const dusPopup = document.createElement('div');
dusPopup.className = 'dus-popup-overlay';
dusPopup.innerHTML = `
<div class="dus-popup-container">
    <div class="dus-popup-content">
        <div class="dus-logo-container">
            <div class="dus-logo">
                <i class='bx bxs-music'></i>
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
            <a href="https://instagram.com/dvmx_19" target="_blank" class="dus-instagram-link">
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

// Update the progress bar interaction functions
function handleProgressBarInteraction(e) {
    e.preventDefault();
    isDraggingProgress = true;
    updateProgressFromPointer(e);
  }

  function handleProgressBarDrag(e) {
    if (!isDraggingProgress) return;
    e.preventDefault();
    updateProgressFromPointer(e);
  }
  
  function stopProgressBarDrag() {
    isDraggingProgress = false;
  }

  function updateProgressFromPointer(e) {
    const rect = progressBarContainer.getBoundingClientRect();
    const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const percentage = Math.min(Math.max((x - rect.left) / rect.width, 0), 1);
    
    if (player.audio.duration) {
        player.audio.currentTime = percentage * player.audio.duration;
        progressBar.style.width = `${percentage * 100}%`;  // Changed from transform to width
        currentTimeDisplay.textContent = formatTime(player.audio.currentTime);
    }
  }

// UI Rendering
function renderArtists(artists, startIndex = 0, count = DISPLAY_COUNTS.INITIAL_ARTISTS) {
    const artistsToShow = artists.slice(startIndex, startIndex + count);
    
    artistsGrid.innerHTML += artistsToShow.map(artist => `
        <a href="artist.html?id=${artist.id}" class="artist-card">
            <div class="artist-image-container">
                <img class="artist-image" src="${artist.profilePic}" alt="${artist.name}" loading="lazy">
            </div>
            <h3 class="artist-name">${artist.name}</h3>
        </a>
    `).join('');

    loadMoreArtists.style.display = 
        startIndex + count >= artists.length ? 'none' : 'block';
}

// Add this to your existing code
function handleSongCardClick() {
    // Only add these handlers for mobile view
    if (window.innerWidth <= 768) {
        const songCards = document.querySelectorAll('.song-card');
        
        songCards.forEach(card => {
            let clickTimeout;
            
            card.addEventListener('click', function(e) {
                const isPlayButton = e.target.closest('.play-btn');
                
                // Clear any existing timeout
                clearTimeout(clickTimeout);
                
                // Remove active class from all other cards
                songCards.forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('active');
                        otherCard.classList.remove('clicked');
                    }
                });
  
                // If clicking the play button, handle playback
                if (isPlayButton) {
                    const songId = parseInt(card.dataset.songId);
                    const song = currentPlaylist.find(s => s.id === songId);
                    
                    if (song) {
                        if (currentSong?.id === song.id && isPlaying) {
                            player.pause();
                            card.classList.remove('clicked');
                            const playBtn = card.querySelector('.play-btn i');
                            playBtn.classList.remove('bx-pause');
                            playBtn.classList.add('bx-play');
                        } else {
                            currentSongIndex = currentPlaylist.indexOf(song);
                            player.loadSong(song);
                            card.classList.add('clicked');
                            const playBtn = card.querySelector('.play-btn i');
                            playBtn.classList.remove('bx-play');
                            playBtn.classList.add('bx-pause');
                        }
                    }
                } else {
                    // Toggle active state for play button visibility
                    card.classList.toggle('active');
                    
                    // Set timeout to hide the button after 2 seconds
                    clickTimeout = setTimeout(() => {
                        card.classList.remove('active');
                    }, 2000);
                }
            });
        });
    }
}

// Update your renderSongs function
function renderSongs(songs, startIndex = 0, count = DISPLAY_COUNTS.INITIAL_SONGS) {
    const songsToShow = songs.slice(startIndex, startIndex + count);
    
    songsContainer.innerHTML += songsToShow.map(song => `
        <div class="song-card ${currentSong?.id === song.id ? 'clicked' : ''}" data-song-id="${song.id}">
            <div class="song-image">
                <img class="song-image" src="${song.coverArt}" alt="${song.title}" loading="lazy">
                <button class="play-btn" aria-label="Play ${song.title}">
                    <i class='bx ${currentSong?.id === song.id && isPlaying ? 'bx-pause' : 'bx-play'}'></i>
                </button>
            </div>
            <div class="song-info">
                <h3 class="song-title">${song.title}</h3>
                <p class="song-artist">${song.artist}</p>
                <span class="song-duration">${formatTime(song.duration)}</span>
            </div>
        </div>
    `).join('');
  
    loadMoreSongs.style.display = 
        startIndex + count >= songs.length ? 'none' : 'block';
        
    // Initialize click handlers after rendering
    handleSongCardClick();
}

// Add resize listener to handle mobile/desktop transitions
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
      handleSongCardClick();
  }, 250);
});

// Utility Functions
function formatTime(time) {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Event Listeners
function initializeEventListeners() {
    // Progress bar events
    progressBarContainer.addEventListener('mousedown', handleProgressBarInteraction);
    progressBarContainer.addEventListener('touchstart', handleProgressBarInteraction);
    document.addEventListener('mousemove', handleProgressBarDrag);
    document.addEventListener('touchmove', handleProgressBarDrag);
    document.addEventListener('mouseup', stopProgressBarDrag);
    document.addEventListener('touchend', stopProgressBarDrag);

    // Progress bar events
  progressBarContainer.addEventListener('mousedown', (e) => {
    handleProgressBarInteraction(e);
    player.handleProgressBarClick(e);
});

progressBarContainer.addEventListener('touchstart', (e) => {
    handleProgressBarInteraction(e);
    player.handleProgressBarClick(e.touches[0]);
});

    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        player.audio.volume = e.target.value / 100;
    });

    volumeBtn.addEventListener('click', () => {
        if (player.audio.volume > 0) {
            player.audio.volume = 0;
        } else {
            player.audio.volume = volumeSlider.value / 100;
        }
    });

    // Playback controls
    playPauseBtn.addEventListener('click', () => player.togglePlay());
    prevBtn.addEventListener('click', () => player.playPrevious());
    nextBtn.addEventListener('click', () => player.playNext());
    
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        player.updateShuffleButton();
    });
    
    repeatBtn.addEventListener('click', () => {
        switch (repeatMode) {
            case 'none': repeatMode = 'all'; break;
            case 'all': repeatMode = 'one'; break;
            case 'one': repeatMode = 'none'; break;
        }
        player.updateRepeatButton();
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Song selection
    songsContainer.addEventListener('click', (e) => {
        const songCard = e.target.closest('.song-card');
        if (!songCard) return;

        const songId = parseInt(songCard.dataset.songId);
        const song = currentPlaylist.find(s => s.id === songId);
        
        if (song) {
            currentSongIndex = currentPlaylist.indexOf(song);
            player.loadSong(song);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                player.togglePlay();
                break;
            case 'arrowright':
                if (e.shiftKey) player.playNext();
                break;
            case 'arrowleft':
                if (e.shiftKey) player.playPrevious();
                break;
            case 'm':
                player.audio.muted = !player.audio.muted;
                break;
        }
    });
}

// Initialize App
async function initializeApp() {
    try {
        // Initialize theme
        initializeTheme();

        // Initialize audio context
        document.addEventListener('click', () => {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        });

        // Fetch data
        const [songsResponse, artistsResponse] = await Promise.all([
            fetch('music.json'),
            fetch('artist.json')
        ]);

        const songsData = await songsResponse.json();
        const artistsData = await artistsResponse.json();

        currentPlaylist = songsData.songs;
        
        // Initialize player
        const player = new AudioPlayer();
        window.player = player; // Make player accessible globally

        // Render initial content
        renderArtists(artistsData.artists);
        renderSongs(songsData.songs);

        // Set up load more functionality
        let currentArtistCount = DISPLAY_COUNTS.INITIAL_ARTISTS;
        loadMoreArtists.addEventListener('click', () => {
            renderArtists(
                artistsData.artists,
                currentArtistCount,
                DISPLAY_COUNTS.MORE_ARTISTS
            );
            currentArtistCount += DISPLAY_COUNTS.MORE_ARTISTS;
        });

        let currentSongCount = DISPLAY_COUNTS.INITIAL_SONGS;
        loadMoreSongs.addEventListener('click', () => {
            renderSongs(
                songsData.songs,
                currentSongCount,
                DISPLAY_COUNTS.MORE_SONGS
            );
            currentSongCount += DISPLAY_COUNTS.MORE_SONGS;
        });

        // Initialize event listeners
        initializeEventListeners();

    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing app');
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', initializeApp);

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.error('ServiceWorker registration failed:', err);
        });
    });
}