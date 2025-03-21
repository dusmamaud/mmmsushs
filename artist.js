// Global Variables and State
let currentArtist = null;
let artistSongsList = [];
let isPlaying = false;
let currentSongIndex = 0;
let isDraggingProgress = false;
let lastTouchY = null;
let lastTouchX = null;

// Cache DOM Elements
const artistCover = document.getElementById('artistCover');
const artistImage = document.getElementById('artistImage');
const artistName = document.getElementById('artistName');
const monthlyListeners = document.getElementById('monthlyListeners');
const artistBio = document.getElementById('artistBio');
const artistSongs = document.getElementById('artistSongs');
const audioElement = document.getElementById('audioElement');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const miniPlayer = document.getElementById('miniPlayer');
const progressBar = document.querySelector('.progress-bar-fill');
const progressBarContainer = document.querySelector('.progress-bar-container');
const currentTimeDisplay = document.querySelector('.current-time');
const totalDurationDisplay = document.querySelector('.total-duration');
const volumeSlider = document.getElementById('volumeSlider');
const volumeBtn = document.getElementById('volumeBtn');

// Audio Player Class
class AudioPlayer {
    constructor() {
        this.audio = audioElement;
        this.audio.preload = 'auto';
        this.initializeEventListeners();
        this.initializeProgressBar();
    }

    initializeEventListeners() {
        // Audio element events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleSongEnd());
        this.audio.addEventListener('loadedmetadata', () => {
            totalDurationDisplay.textContent = this.formatTime(this.audio.duration);
        });
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            showToast('Please wait :)');
        });

        // Volume control
        this.audio.addEventListener('volumechange', () => this.updateVolumeIcon());
        volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
            localStorage.setItem('volume', e.target.value);
        });
        volumeBtn.addEventListener('click', () => this.toggleMute());

        // Load saved volume
        const savedVolume = localStorage.getItem('volume');
        if (savedVolume !== null) {
            this.audio.volume = savedVolume / 100;
            volumeSlider.value = savedVolume;
        }
    }

    initializeProgressBar() {
        // Mouse events
        progressBarContainer.addEventListener('mousedown', (e) => {
            isDraggingProgress = true;
            this.updateProgressFromEvent(e);
            document.addEventListener('mousemove', this.handleProgressDrag);
            document.addEventListener('mouseup', this.stopProgressDrag);
        });

        // Touch events
        progressBarContainer.addEventListener('touchstart', (e) => {
            isDraggingProgress = true;
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            this.updateProgressFromEvent(e.touches[0]);
        }, { passive: false });

        progressBarContainer.addEventListener('touchmove', (e) => {
            if (!isDraggingProgress) return;
            
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - lastTouchX);
            const deltaY = Math.abs(touch.clientY - lastTouchY);

            // If vertical scrolling is detected, stop progress update
            if (deltaY > deltaX) {
                isDraggingProgress = false;
                return;
            }

            e.preventDefault();
            this.updateProgressFromEvent(touch);
            
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
        }, { passive: false });

        progressBarContainer.addEventListener('touchend', () => {
            isDraggingProgress = false;
            lastTouchX = null;
            lastTouchY = null;
        });

        progressBarContainer.addEventListener('touchcancel', () => {
            isDraggingProgress = false;
            lastTouchX = null;
            lastTouchY = null;
        });
    }

    updateProgressFromEvent(event) {
        const rect = progressBarContainer.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        
        if (this.audio.duration) {
            this.audio.currentTime = percentage * this.audio.duration;
            this.updateProgress();
        }
    }

    handleProgressDrag = (e) => {
        if (isDraggingProgress) {
            this.updateProgressFromEvent(e);
        }
    }

    stopProgressDrag = () => {
        isDraggingProgress = false;
        document.removeEventListener('mousemove', this.handleProgressDrag);
        document.removeEventListener('mouseup', this.stopProgressDrag);
    }

    updateProgress() {
        if (!this.audio.duration) return;
        
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        progressBar.style.width = `${progress}%`;
        currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
    }

    async loadSong(song) {
        if (!song) return;

        try {
            this.audio.src = song.url;
            await this.audio.load();
            this.updateMiniPlayer(song);
            
            if (isPlaying) {
                await this.play();
            }
        } catch (error) {
            console.error('Error loading song:', error);
            showToast('Error loading song');
        }
    }

    async play() {
        try {
            await this.audio.play();
            isPlaying = true;
            this.updatePlayState();
        } catch (error) {
            console.error('Playback error:', error);
            showToast('Please wait :)');
        }
    }

    pause() {
        this.audio.pause();
        isPlaying = false;
        this.updatePlayState();
    }

    togglePlay() {
        if (isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    updatePlayState() {
        playPauseBtn.innerHTML = `<i class='bx bx-${isPlaying ? 'pause' : 'play'}'></i>`;
        document.querySelectorAll('.song-item').forEach((item, index) => {
            const playBtn = item.querySelector('.play-btn i');
            if (index === currentSongIndex) {
                item.classList.toggle('playing', isPlaying);
                playBtn.className = `bx bx-${isPlaying ? 'pause' : 'play'}`;
            } else {
                item.classList.remove('playing');
                playBtn.className = 'bx bx-play';
            }
        });
    }

    updateMiniPlayer(song) {
        document.getElementById('nowPlayingImg').src = song.coverArt;
        document.getElementById('nowPlayingTitle').textContent = song.title;
        document.getElementById('nowPlayingArtist').textContent = song.artist;
        miniPlayer.classList.add('active');
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const volume = this.audio.volume;
        let icon = 'bx-volume-full';
        
        if (this.audio.muted || volume === 0) {
            icon = 'bx-volume-mute';
        } else if (volume < 0.5) {
            icon = 'bx-volume-low';
        }
        
        volumeBtn.innerHTML = `<i class='bx ${icon}'></i>`;
    }

    handleSongEnd() {
        currentSongIndex = (currentSongIndex + 1) % artistSongsList.length;
        this.loadSong(artistSongsList[currentSongIndex]);
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize Player Controls
function initializeControls() {
    const player = new AudioPlayer();

    playPauseBtn.addEventListener('click', () => {
        if (artistSongsList.length) {
            player.togglePlay();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (artistSongsList.length) {
            currentSongIndex = (currentSongIndex - 1 + artistSongsList.length) % artistSongsList.length;
            player.loadSong(artistSongsList[currentSongIndex]);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (artistSongsList.length) {
            currentSongIndex = (currentSongIndex + 1) % artistSongsList.length;
            player.loadSong(artistSongsList[currentSongIndex]);
        }
    });

    return player;
}

// Fetch and Display Artist Data
async function fetchArtistData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const artistId = parseInt(urlParams.get('id'));

        if (!artistId) {
            throw new Error('Artist ID not provided');
        }

        const [artistsResponse, songsResponse] = await Promise.all([
            fetch('artist.json'),
            fetch('music.json')
        ]);

        if (!artistsResponse.ok || !songsResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const artistsData = await artistsResponse.json();
        const songsData = await songsResponse.json();

        currentArtist = artistsData.artists.find(artist => artist.id === artistId);
        
        if (!currentArtist) {
            throw new Error('Artist not found');
        }

        artistSongsList = songsData.songs.filter(song => {
            const artistIds = Array.isArray(song.artistId) ? song.artistId : [song.artistId];
            return artistIds.includes(artistId);
        });

        displayArtistData();
        renderSongs();

    } catch (error) {
        console.error('Error:', error);
        showToast(error.message);
    }
}

// Display Artist Data
function displayArtistData() {
    document.title = `${currentArtist.name} - XO Music`;
    artistCover.src = currentArtist.coverArt;
    artistImage.src = currentArtist.profilePic;
    artistName.textContent = currentArtist.name;
    monthlyListeners.textContent = currentArtist.monthly_listeners;
    artistBio.textContent = currentArtist.bio;

    document.getElementById('spotifyLink').href = currentArtist.socialLinks.spotify;
    document.getElementById('instagramLink').href = currentArtist.socialLinks.instagram;
    document.getElementById('twitterLink').href = currentArtist.socialLinks.twitter;
}

// Render Songs List
function renderSongs() {
    if (!artistSongsList.length) {
        artistSongs.innerHTML = '<p class="no-songs">No songs available</p>';
        return;
    }

    artistSongs.innerHTML = artistSongsList.map((song, index) => `
        <div class="song-item ${currentSongIndex === index && isPlaying ? 'playing' : ''}" 
             data-index="${index}">
            <div class="song-info">
                <div class="song-number">${(index + 1).toString().padStart(2, '0')}</div>
                <div class="song-image">
                    <img src="${song.coverArt}" alt="${song.title}">
                    <button class="play-btn">
                        <i class='bx bx-${currentSongIndex === index && isPlaying ? 'pause' : 'play'}'></i>
                    </button>
                </div>
                <div class="song-details">
                    <h3 class="song-title">${song.title}</h3>
                    <p class="song-artist">${song.artist}</p>
                </div>
            </div>
            <div class="song-duration">${formatTime(song.duration)}</div>
        </div>
    `).join('');

    // Add click handlers
    const player = new AudioPlayer();
    artistSongs.querySelectorAll('.song-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            if (currentSongIndex === index && isPlaying) {
                player.pause();
            } else {
                currentSongIndex = index;
                player.loadSong(artistSongsList[index]);
                player.play();
            }
        });
    });
}

// Utility Functions
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    fetchArtistData();
});