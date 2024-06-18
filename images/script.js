let currentPage = 1;
const ITEMS_PER_PAGE = 10; // This will be ignored since we want to show all channels.
let filteredChannels = [];
let hls;
let isChannelListVisible = false;
let channels = [];
let currentChannelIndex = 0;
let longPressTimeout;
let isLongPress = false;
const FETCH_INTERVAL = 300000; // Interval in milliseconds (5 minutes)

document.addEventListener('DOMContentLoaded', () => {
    const channelsUrl = 'https://royalchat.net/tv/channels.json';

    // Fetch channels initially
    fetchChannels(channelsUrl);

    // Set interval to fetch channels periodically
    setInterval(() => {
        fetchChannels(channelsUrl);
    }, FETCH_INTERVAL);

    const videoPlayer = document.getElementById('videoPlayer');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.removeItem('darkMode');
            }
        });
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            document.getElementById('fileInput').click();
            closePopupMenu('popupMenu');
        });
    }

    const urlBtn = document.getElementById('urlBtn');
    if (urlBtn) {
        urlBtn.addEventListener('click', () => {
            document.getElementById('urlInputContainer').style.display = 'flex';
            closePopupMenu('popupMenu');
        });
    }

    const playUrlOkBtn = document.getElementById('playUrlOkBtn');
    if (playUrlOkBtn) {
        playUrlOkBtn.addEventListener('click', () => {
            const url = document.getElementById('urlInput').value;
            if (url) {
                const newChannel = {
                    name: "Custom URL",
                    logo: "",
                    url: url
                };
                channels = [newChannel];
                saveChannelsToLocalStorage(channels);
                filteredChannels = channels;
                currentPage = 1;
                renderChannelList();
                populateMediaChannelList(channels);
                playChannel(url);
                document.getElementById('urlInputContainer').style.display = 'none';
            }
        });
    }

    const playUrlCancelBtn = document.getElementById('playUrlCancelBtn');
    if (playUrlCancelBtn) {
        playUrlCancelBtn.addEventListener('click', () => {
            document.getElementById('urlInputContainer').style.display = 'none';
        });
    }

    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            clearData();
            closePopupMenu('popupMenu');
        });
    }

    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            togglePopupMenu('popupMenu');
        });
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            togglePopupMenu('popupSearch');
        });
    }

    const prevChannelBtn = document.getElementById('prevChannelBtn');
    if (prevChannelBtn) {
        prevChannelBtn.addEventListener('click', moveToPrevChannel);
    }

    const nextChannelBtn = document.getElementById('nextChannelBtn');
    if (nextChannelBtn) {
        nextChannelBtn.addEventListener('click', moveToNextChannel);
    }

    const channelListBtn = document.getElementById('channelListBtn');
    if (channelListBtn) {
        channelListBtn.addEventListener('click', toggleFullScreenChannelList);
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    if (videoPlayer) {
        videoPlayer.addEventListener('waiting', showLoadingSpinner);
        videoPlayer.addEventListener('playing', hideLoadingSpinner);
        videoPlayer.addEventListener('error', handleVideoError);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterChannels);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    updateClock();
    setInterval(updateClock, 1000);
});

function fetchChannels(url) {
    const cacheBuster = `?timestamp=${new Date().getTime()}`;
    fetch(url + cacheBuster)
        .then(response => response.json())
        .then(data => {
            console.log('Fetched channels:', data); // Debug log
            channels = data;
            filteredChannels = channels;
            currentPage = 1; // Reset to the first page
            renderChannelList();
            populateMediaChannelList(channels);
            setInitialFocus();

            // Apply saved dark mode preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                document.body.classList.add('dark-mode');
            }
        })
        .catch(error => console.error('Error loading channels:', error));
}

// Handle key events
function handleKeyDown(event) {
    const key = event.key;

    switch (key) {
        case 'ArrowUp':
            moveFocus('up');
            break;
        case 'ArrowDown':
            moveFocus('down');
            break;
        case 'ArrowLeft':
            moveFocus('left');
            break;
        case 'ArrowRight':
            moveFocus('right');
            break;
        case 'Enter':
            longPressTimeout = setTimeout(() => {
                isLongPress = true;
                showChannelList();
            }, 500);
            activateFocusedElement();
            break;
        case 'Backspace':
        case 'Escape':
            navigateBack();
            break;
    }
}

function handleKeyUp(event) {
    if (event.key === 'Enter') {
        clearTimeout(longPressTimeout);
        if (isLongPress) {
            isLongPress = false;
            event.preventDefault();
        }
    }
}

// Update moveFocus function to handle focus correctly within channel list and control buttons
function moveFocus(direction) {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    let nextIndex = currentIndex;

    const isChannelListElement = element => element.closest('.sidebar') !== null || element.closest('.fullscreen-channel-list') !== null;
    const isControlButtonElement = element => element.closest('.controls') !== null;

    const isWithinChannelList = isChannelListElement(document.activeElement);
    const isWithinControlButtons = isControlButtonElement(document.activeElement);

    switch (direction) {
        case 'up':
            if (isWithinChannelList) {
                do {
                    nextIndex = nextIndex > 0 ? nextIndex - 1 : currentIndex; // Prevent moving out of the list
                } while (nextIndex !== currentIndex && !isChannelListElement(focusableElements[nextIndex]));
            }
            break;
        case 'down':
            if (isWithinChannelList) {
                do {
                    nextIndex = (nextIndex + 1) % focusableElements.length;
                } while (nextIndex !== currentIndex && !isChannelListElement(focusableElements[nextIndex]));
                if (nextIndex === 0 || nextIndex < currentIndex) {
                    nextIndex = currentIndex; // Prevent looping back to the top
                } else if (nextIndex === currentIndex) {
                    // If at the last element, load more channels
                    loadMoreChannels();
                }
            }
            break;
        case 'left':
            if (isWithinControlButtons) {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
                while (nextIndex !== currentIndex && !isChannelListElement(focusableElements[nextIndex])) {
                    nextIndex = (nextIndex - 1 + focusableElements.length) % focusableElements.length;
                }
            }
            break;
        case 'right':
            if (isWithinChannelList) {
                do {
                    nextIndex = (nextIndex + 1) % focusableElements.length;
                } while (nextIndex !== currentIndex && !isControlButtonElement(focusableElements[nextIndex]));
            } else if (isWithinControlButtons) {
                nextIndex = (currentIndex + 1) % focusableElements.length;
            }
            break;
    }

    // Ensure the next focusable element is focusable
    while (!focusableElements[nextIndex].hasAttribute('tabindex') || focusableElements[nextIndex].getAttribute('tabindex') == "-1") {
        nextIndex = (nextIndex + 1) % focusableElements.length;
    }

    focusableElements[nextIndex].focus();
}

// Function to load more channels
function loadMoreChannels() {
    currentPage++;
    renderChannelList();
    const channelListButtons = document.querySelectorAll('.channel-list button');
    if (channelListButtons.length > 0) {
        channelListButtons[channelListButtons.length - 1].focus();
    }
}

function getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll('[tabindex]')).filter(el => el.getAttribute('tabindex') >= 0);
}

function activateFocusedElement() {
    const focusedElement = document.activeElement;
    if (focusedElement) {
        focusedElement.click();
    }
}

function navigateBack() {
    const popupMenus = document.querySelectorAll('.popup-menu');
    let menuClosed = false;
    popupMenus.forEach(menu => {
        if (menu.style.display === 'flex') {
            menu.style.display = 'none';
            menuClosed = true;
        }
    });

    const mediaChannelList = document.getElementById('mediaChannelList');
    if (mediaChannelList && mediaChannelList.style.display === 'block') {
        mediaChannelList.style.display = 'none';
        mediaChannelList.classList.remove('fullscreen-channel-list');
        menuClosed = true;
    }

    if (!menuClosed) {
        // If no menu was closed, handle exiting the app or other navigation
        console.log("No menu to close, handle other back navigation or app exit.");
    }
}

function toggleFullScreenChannelList() {
    const mediaChannelList = document.getElementById('mediaChannelList');
    const isVisible = mediaChannelList.style.display === 'block';
    mediaChannelList.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        mediaChannelList.classList.add('fullscreen-channel-list');
    } else {
        mediaChannelList.classList.remove('fullscreen-channel-list');
    }
}

function toggleFullscreen() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!document.fullscreenElement) {
        if (videoPlayer.requestFullscreen) {
            videoPlayer.requestFullscreen().catch(err => {
                console.error(`Failed to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else if (videoPlayer.mozRequestFullScreen) {
            videoPlayer.mozRequestFullScreen().catch(err => {
                console.error(`Failed to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else if (videoPlayer.webkitRequestFullscreen) {
            videoPlayer.webkitRequestFullscreen().catch(err => {
                console.error(`Failed to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else if (videoPlayer.msRequestFullscreen) {
            videoPlayer.msRequestFullscreen().catch(err => {
                console.error(`Failed to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
                console.error(`Failed to exit fullscreen mode: ${err.message} (${err.name})`);
            });
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen().catch(err => {
                console.error(`Failed to exit fullscreen mode: ${err.message} (${err.name})`);
            });
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen().catch(err => {
                console.error(`Failed to exit fullscreen mode: ${err.message} (${err.name})`);
            });
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen().catch(err => {
                console.error(`Failed to exit fullscreen mode: ${err.message} (${err.name})`);
            });
        }
    }
}

function showLoadingSpinner() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.display = 'block';
}

function hideLoadingSpinner() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.display = 'none';
}

function handleVideoError(event) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    console.error('Error occurred while playing video', event);
    loadingSpinner.style.display = 'none';
    displayMessage('Sorry, channel unavailable. You will be moved to the next working channel.');

    let attemptCount = 0;
    const maxAttempts = channels.length;

    function tryNextChannel() {
        moveToNextChannel();
        attemptCount++;
        if (attemptCount < maxAttempts) {
            setTimeout(() => {
                const videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer.readyState === 0 || videoPlayer.error) {
                    tryNextChannel();
                }
            }, 3000);
        } else {
            displayMessage('No working channels available.');
        }
    }

    setTimeout(tryNextChannel, 3000);
}

function handleFullscreenChange() {
    const videoControls = document.getElementById('videoControls');
    const currentChannelInfo = document.getElementById('currentChannelInfo');
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        videoControls.classList.add('fullscreen-controls');
        currentChannelInfo.classList.add('fullscreen');
        document.body.classList.add('fullscreen');
    } else {
        videoControls.classList.remove('fullscreen-controls');
        currentChannelInfo.classList.remove('fullscreen');
        document.body.classList.remove('fullscreen');
    }
}

function initializeHls(url) {
    if (hls) {
        hls.destroy();
    }
    hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60 MB
        maxBufferHole: 0.5,
        lowBufferWatchdogPeriod: 0.5,
        highBufferWatchdogPeriod: 3,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5
    });
    hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    console.error('Network error encountered:', data);
                    moveToNextChannelWithRetry();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error('Media error encountered:', data);
                    hls.recoverMediaError();
                    break;
                default:
                    console.error('Fatal error encountered:', data);
                    displayMessage('Sorry, channel unavailable. You will be moved to the next working channel.');
                    setTimeout(() => {
                        moveToNextChannelWithRetry();
                    }, 3000);
                    break;
            }
        } else {
            console.warn('Non-fatal error encountered:', data);
        }
    });
    hls.loadSource(url);
    hls.attachMedia(document.getElementById('videoPlayer'));
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        document.getElementById('videoPlayer').play().catch(error => {
            console.error('Error playing video:', error);
            showToast('Error playing video.');
            moveToNextChannelWithRetry();
        });
    });
}

function playChannel(url) {
    initializeHls(url);
    console.log(`Attempting to play URL: ${url}`);
    updateCurrentChannelInfo();
}

function moveToNextChannel() {
    currentChannelIndex = (currentChannelIndex + 1) % channels.length;
    playChannel(channels[currentChannelIndex].url);
}

function moveToNextChannelWithRetry() {
    const maxRetries = channels.length;
    let retryCount = 0;

    const tryNextChannel = () => {
        if (retryCount < maxRetries) {
            moveToNextChannel();
            retryCount++;
            setTimeout(() => {
                const videoPlayer = document.getElementById('videoPlayer');
                if (videoPlayer.readyState === 0 || videoPlayer.error) {
                    tryNextChannel();
                }
            }, 3000);
        } else {
            displayMessage('No working channels available.');
        }
    };

    tryNextChannel();
}

function moveToPrevChannel() {
    currentChannelIndex = (currentChannelIndex - 1 + channels.length) % channels.length;
    playChannel(channels[currentChannelIndex].url);
}

const defaultIcon = 'https://upload.wikimedia.org/wikipedia/commons/3/39/Applications-television.svg';

function renderChannelList() {
    const channelList = document.querySelector('.channel-list');
    channelList.innerHTML = '';

    filteredChannels.forEach((channel, index) => {
        const button = document.createElement('button');
        const iconUrl = channel.logo ? channel.logo : defaultIcon;
        button.innerHTML = `<img src="${iconUrl}" class="channel-logo" alt="${channel.name}" onerror="this.src='${defaultIcon}'"> ${channel.name}`;
        button.onclick = () => {
            currentChannelIndex = index;
            playChannel(channel.url);
        };
        button.setAttribute('tabindex', index + 1);
        button.id = `channel-${index}`;
        channelList.appendChild(button);
    });
}

function populateMediaChannelList(channelsData) {
    const mediaChannelList = document.getElementById('mediaChannelList');
    mediaChannelList.innerHTML = '';

    channelsData.forEach((channel, index) => {
        const button = document.createElement('button');
        const iconUrl = channel.logo ? channel.logo : defaultIcon;
        button.innerHTML = `<img src="${iconUrl}" alt="${channel.name}" onerror="this.src='${defaultIcon}'"> ${channel.name}`;
        button.onclick = () => {
            currentChannelIndex = index;
            playChannel(channel.url);
            mediaChannelList.style.display = 'none';
        };
        button.setAttribute('tabindex', index + 1);
        button.id = `media-channel-${index}`;
        mediaChannelList.appendChild(button);
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target.result;
            const newChannels = parseM3U(contents);
            channels = newChannels;
            saveChannelsToLocalStorage(channels);
            filteredChannels = channels;
            currentPage = 1;
            renderChannelList();
            populateMediaChannelList(channels);
        };
        reader.readAsText(file);
    }
}

function parseM3U(contents) {
    const lines = contents.split('\n');
    const channels = [];
    let currentChannel = {};

    lines.forEach(line => {
        if (line.startsWith('#EXTINF:')) {
            const info = line.match(/#EXTINF:-1(?:.*tvg-name="([^"]*)")?(?:.*tvg-logo="([^"]*)")?(?:.*group-title="([^"]*)")?,(.*)/);
            if (info) {
                currentChannel = {
                    name: info[4] || "Unnamed Channel",
                    logo: info[2] || defaultIcon,
                    url: ""
                };
            }
        } else if (line.startsWith('http')) {
            currentChannel.url = line.trim();
            channels.push(currentChannel);
            currentChannel = {};
        }
    });

    return channels;
}

function displayMessage(message) {
    const messageBox = document.querySelector('.message-box');
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function toggleChannelList() {
    const mediaChannelList = document.getElementById('mediaChannelList');
    isChannelListVisible = !isChannelListVisible;
    mediaChannelList.style.display = isChannelListVisible ? 'block' : 'none';
    if (isChannelListVisible) {
        setInitialFocus(mediaChannelList);
    }
}

function handleRemoteControl(event) {
    switch (event.key) {
        case 'ArrowUp':
            navigateChannels(-1);
            break;
        case 'ArrowDown':
            navigateChannels(1);
            break;
        case 'Enter':
            selectChannel(currentChannelIndex);
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            break;
        default:
            break;
    }
}

function navigateChannels(direction) {
    const newIndex = currentChannelIndex + direction;
    if (newIndex >= 0 && newIndex < filteredChannels.length) {
        currentChannelIndex = newIndex;
        displayChannels();
        ensureChannelInView();
    }
}

function ensureChannelInView() {
    const currentChannelElement = document.getElementById(`channel-${currentChannelIndex}`);
    if (currentChannelElement) {
        currentChannelElement.scrollIntoView({ block: "center", behavior: "smooth" });
    }
}

function displayChannels() {
    const channelList = document.getElementById('channelList');
    channelList.innerHTML = '';
    filteredChannels.forEach((channel, index) => {
        const channelElement = document.createElement('div');
        channelElement.className = 'channel-item';
        channelElement.id = `channel-${index}`;
        channelElement.textContent = channel.name;
        if (index === currentChannelIndex) {
            channelElement.classList.add('selected');
        }
        channelList.appendChild(channelElement);
    });
}

function navigateUp() {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    if (currentIndex > 0) {
        focusableElements[currentIndex - 1].focus();
    }
}

function navigateDown() {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    if (currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus();
    }
}

function navigateLeft() {
}

function navigateRight() {
}

function getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll('[tabindex]')).filter(el => el.getAttribute('tabindex') >= 0);
}

function setInitialFocus(container = document) {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

document.querySelector('.controls').appendChild(darkModeToggle);

function saveChannelsToLocalStorage(channels) {
    if (channels.length > 1 || channels[0].name !== "Custom URL") {
        localStorage.setItem('channels', JSON.stringify(channels));
    }
}

function clearData() {
    localStorage.removeItem('channels');
    const channelsUrl = 'https://royalchat.net/tv/channels.json'; // Replace with your actual URL
    fetchChannels(channelsUrl);
    displayConfirmationMessage('Data has been cleared and reloaded.');
}

function togglePopupMenu(menuId) {
    const popupMenu = document.getElementById(menuId);
    const isVisible = popupMenu.style.display === 'block';
    popupMenu.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        const firstFocusableElement = popupMenu.querySelector('[tabindex]');
        if (firstFocusableElement) {
            firstFocusableElement.focus();
        }
        document.addEventListener('keydown', handlePopupClose);
    } else {
        document.removeEventListener('keydown', handlePopupClose);
    }
}

function closePopupMenu(menuId) {
    const popupMenu = document.getElementById(menuId);
    popupMenu.style.display = 'none';
    document.removeEventListener('keydown', handlePopupClose);
}

function handlePopupClose(event) {
    if (event.key === 'Backspace' || event.key === 'Escape') {
        const popupMenus = document.querySelectorAll('.popup-menu');
        popupMenus.forEach(popupMenu => {
            if (popupMenu.style.display === 'block') {
                popupMenu.style.display = 'none';
            }
        });
        document.removeEventListener('keydown', handlePopupClose);
    }
}

function filterChannels() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const searchResults = channels.filter(channel => channel.name.toLowerCase().includes(searchInput));
    renderSearchResults(searchResults);
}

function renderSearchResults(searchResults) {
    const popupSearch = document.getElementById('popupSearch');
    let searchResultsContainer = popupSearch.querySelector('.search-results');

    if (!searchResultsContainer) {
        searchResultsContainer = document.createElement('div');
        searchResultsContainer.className = 'search-results';
        popupSearch.appendChild(searchResultsContainer);
    }

    searchResultsContainer.innerHTML = '';

    searchResults.forEach(channel => {
        const button = document.createElement('button');
        const iconUrl = channel.logo ? channel.logo : defaultIcon;
        button.innerHTML = `<img src="${iconUrl}" alt="${channel.name}" style="width: 20px; height: 20px; margin-right: 10px;"> ${channel.name}`;
        button.onclick = () => {
            playChannel(channel.url);
            togglePopupMenu('popupSearch');
        };
        searchResultsContainer.appendChild(button);
    });
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}`;
}

function updateCurrentChannelInfo() {
    const currentChannel = channels[currentChannelIndex];
    document.getElementById('currentChannel').textContent = currentChannel ? currentChannel.name : 'Unknown Channel';
}

function displayConfirmationMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'confirmation-box';
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => {
            messageBox.remove();
        }, 500);
    }, 3000);
}

function showChannelList() {
    const mediaChannelList = document.getElementById('mediaChannelList');
    mediaChannelList.style.display = 'block';
    mediaChannelList.classList.add('fullscreen-channel-list');
    setInitialFocus(mediaChannelList);
}
