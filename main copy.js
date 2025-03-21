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
            showToast('Playback error');
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

    updatePlayPauseButton() {
        playPauseBtn.innerHTML = `<i class='bx bx-${isPlaying ? 'pause' : 'play'}'></i>`;
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

function renderSongs(songs, startIndex = 0, count = DISPLAY_COUNTS.INITIAL_SONGS) {
    const songsToShow = songs.slice(startIndex, startIndex + count);
    
    songsContainer.innerHTML += songsToShow.map(song => `
        <div class="song-card" data-song-id="${song.id}">
            <div class="song-image">
                <img class="song-image" src="${song.coverArt}" alt="${song.title}" loading="lazy">
                <button class="play-btn" aria-label="Play ${song.title}">
                    <i class='bx bx-play'></i>
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
}

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