const API_SERVERS = [
    'https://all.api.radio-browser.info',
    'https://fi1.api.radio-browser.info',
    'https://de2.api.radio-browser.info'
];
const MAX_RETRIES = 3;
const MIN_STATION_COUNT = 1;
const TEST_STREAM_TIMEOUT = 2000;
const SKIP_STREAM_TEST = true;
const BATCH_SIZE = 100;
const HEARTBEAT_INTERVAL = 60000;
const BASE_RECONNECT_DELAY = 500;
const DELAY_INCREMENT = 500;
const MAX_RECONNECT_DELAY = 10000;
const MAX_RECONNECT_ATTEMPTS = 5;
const CACHE_KEY = 'world_fm_radio_stations';
const CACHE_DURATION = 60 * 60 * 1000;
const NOTIFICATION_TITLE = 'World FM Radio';

const audio = new Audio();
let currentStation = null;
let isPlaying = false;
let hasError = false;
let countryStations = [];
let stations = [];
let heartbeatTimer = null;
let reconnectAttempts = 0;
let isRetrying = false;
let lastError = { message: null, showRetry: false };

const LANGUAGE_NORMALIZATION = {
    'arabic': 'Arabic', 'arabe': 'Arabic', 'العربية': 'Arabic', 'modern standard arabic': 'Arabic',
    'egyptian arabic': 'Arabic', 'levantine arabic': 'Arabic', 'maghrebi arabic': 'Arabic',
    'bengali': 'Bengali', 'bangla': 'Bengali', 'বাংলা': 'Bengali', 'bangla,bengali': 'Bengali',
    'bengali,hindi': 'Bengali', 'bengali,english,hindi': 'Bengali', 'chinese': 'Chinese',
    'mandarin': 'Chinese', '中文': 'Chinese', 'zhongwen': 'Chinese', 'putonghua': 'Chinese',
    'cantonese': 'Chinese', 'yue': 'Chinese', 'english': 'English', 'british english': 'English',
    'american english': 'English', 'australian english': 'English', 'canadian english': 'English', 'englsih': 'English',
    'english,spanish': 'English', 'english,hindi': 'Hindi', 'english,hindi,marathi': 'Hindi',
    'english,hindi,punjabi': 'Hindi', 'english hindi': 'Hindi', 'english,hindi,urdu': 'Hindi',
    'english,english hindi,hindi': 'Hindi', 'english,malayalam,tamil': 'Malayalam',
    'english,kannada,malayalam,tamil,telugu,urdu': 'Kannada', 'english,online radio,tamil': 'Tamil',
    'french': 'French', 'français': 'French', 'francais': 'French', 'quebec french': 'French',
    'canadian french': 'French', 'german': 'German', 'deutsch': 'German', 'high german': 'German',
    'swiss german': 'German', 'austrian german': 'German', 'hindi': 'Hindi', 'हिन्दी': 'Hindi',
    'hindustani': 'Hindi', 'hindi,english': 'Hindi', 'hindi,english assamese': 'Hindi',
    'hindi,indian': 'Hindi', 'hindi,kashmiri,urdu': 'Hindi', 'hindi,marathi': 'Hindi',
    'hindi,marathi,sanskrit': 'Hindi', 'hindi,punjabi': 'Hindi', 'hindi,telugu': 'Hindi',
    'hindi,english,hindi': 'Hindi', 'haryanvi': 'Hindi', 'haryanvi,hindi,punjabi': 'Hindi',
    'chhattisgarhi,hindi': 'Hindi', 'bhojpuri': 'Hindi', 'classical,evergreens,hindi': 'Hindi',
    'italian': 'Italian', 'italiano': 'Italian', 'japanese': 'Japanese', '日本語': 'Japanese',
    'nihongo': 'Japanese', 'korean': 'Korean', '한국어': 'Korean', 'hanguk-eo': 'Korean',
    '조선말': 'Korean', 'joseongeul': 'Korean', 'portuguese': 'Portuguese', 'português': 'Portuguese',
    'portugues': 'Portuguese', 'brazilian portuguese': 'Portuguese', 'european portuguese': 'Portuguese',
    'russian': 'Russian', 'русский': 'Russian', 'russkiy': 'Russian', 'spanish': 'Spanish',
    'español': 'Spanish', 'castilian': 'Spanish', 'castellano': 'Spanish', 'latin american spanish': 'Spanish',
    'tamil': 'Tamil', 'தமிழ்': 'Tamil', 'telugu': 'Telugu', 'తెలుగు': 'Telugu', 'urdu': 'Urdu',
    'اردو': 'Urdu', 'swahili': 'Swahili', 'kiswahili': 'Swahili', 'dutch': 'Dutch', 'nederlands': 'Dutch',
    'flemish': 'Dutch', 'afrikaans': 'Afrikaans', 'turkish': 'Turkish', 'türkçe': 'Turkish',
    'turkce': 'Turkish', 'polish': 'Polish', 'polski': 'Polish', 'vietnamese': 'Vietnamese',
    'tiếng việt': 'Vietnamese', 'tieng viet': 'Vietnamese', 'thai': 'Thai', 'ไทย': 'Thai',
    'phasa thai': 'Thai', 'greek': 'Greek', 'ελληνικά': 'Greek', 'ellinika': 'Greek', 'hebrew': 'Hebrew',
    'עברית': 'Hebrew', 'ivrit': 'Hebrew', 'persian': 'Persian', 'farsi': 'Persian', 'پارسی': 'Persian',
    'dari': 'Persian', 'malay': 'Malay', 'bahasa melayu': 'Malay', 'bahasa malaysia': 'Malay',
    'indonesian': 'Indonesian', 'bahasa indonesia': 'Indonesian', 'filipino': 'Filipino',
    'tagalog': 'Filipino', 'pilipino': 'Filipino', 'ukrainian': 'Ukrainian', 'українська': 'Ukrainian',
    'ukrayinska': 'Ukrainian', 'czech': 'Czech', 'čeština': 'Czech', 'cestina': 'Czech',
    'swedish': 'Swedish', 'svenska': 'Swedish', 'norwegian': 'Norwegian', 'norsk': 'Norwegian',
    'bokmål': 'Norwegian', 'nynorsk': 'Norwegian', 'danish': 'Danish', 'dansk': 'Danish',
    'finnish': 'Finnish', 'suomi': 'Finnish', 'hungarian': 'Hungarian', 'magyar': 'Hungarian',
    'romanian': 'Romanian', 'română': 'Romanian', 'romana': 'Romanian', 'bulgarian': 'Bulgarian',
    'български': 'Bulgarian', 'balgarski': 'Bulgarian', 'serbian': 'Serbian', 'српски': 'Serbian',
    'srpski': 'Serbian', 'croatian': 'Croatian', 'hrvatski': 'Croatian', 'slovak': 'Slovak',
    'slovenčina': 'Slovak', 'slovencina': 'Slovak', 'slovenian': 'Slovenian', 'slovenščina': 'Slovenian',
    'slovenscina': 'Slovenian', 'assamese': 'Assamese', 'gujarati': 'Gujarati', 'gujrati': 'Gujarati', 'gujarati,hindi': 'Gujarati',
    'kannada': 'Kannada', 'malayalam': 'Malayalam', 'malayalam,ml': 'Malayalam', 'malayalam,tamil': 'Malayalam',
    'marathi': 'Marathi', 'nepali': 'Nepali', 'odia': 'Odia', 'punjabi': 'Punjabi', 'sanskrit': 'Sanskrit',
    'estonian': 'Estonian', 'dan': 'Danish', 'englishish': 'English', 'konkani': 'Konkani', 'magesh': 'Marathi', 'bihari': 'Hindi', 'chhattisgarhi': 'Hindi', 'indian': 'Hindi'
};

const STATIC_COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' }, { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' }, { code: 'CV', name: 'Cape Verde' }, { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
    { code: 'CD', name: 'Congo (DRC)' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: "Côte d'Ivoire" },
    { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' }, { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' }, { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' }, { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' }, { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' }, { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' }, { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' },
    { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' }, { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' }, { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' }, { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' }, { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' }, { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' }, { code: 'KN', name: 'Saint Kitts and Nevis' }, { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' }, { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'São Tomé and Príncipe' }, { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' }, { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' }, { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' }, { code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' },
    { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' }
];

audio.autoplay = false;
audio.preload = 'auto';
audio.setAttribute('playsinline', '');

function getAudioErrorMessage(error) {
    if (!error) return 'Unknown playback error.';
    const audioError = error.target.error;
    if (!audioError) return 'Playback failed for an unknown reason.';
    switch (audioError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
            return 'Playback was aborted.';
        case MediaError.MEDIA_ERR_NETWORK:
            return 'Network error: Couldn’t load the stream.\nCheck your connection.';
        case MediaError.MEDIA_ERR_DECODE:
            return 'Stream decoding error: Format may be unsupported.';
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            return 'Playback interrupted \nStream not supported: Invalid or unavailable source.';
        default:
            return `Playback error (Code ${audioError.code}): ${audioError.message || 'Unknown issue.'}`;
    }
}

audio.addEventListener('suspend', () => {
    console.log('Audio suspended, attempting to resume...');
    if (isPlaying && currentStation) {
        audio.play().catch(err => {
            console.error('Failed to resume audio on suspend:', err);
            showError(`Couldn't resume playback.\nTry pressing play or selecting a new station.\n${err.message}`, true);
        });
    }
});

audio.addEventListener('playing', () => {
    isPlaying = true;
    hasError = false;
    reconnectAttempts = 0;
    updatePlayerDisplay();
    clearError();
    showLoading(false);
    startHeartbeat();
    updateMediaSession();
    if (currentStation) showRadioNotification(currentStation);
    console.log('Audio is playing');
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    stopHeartbeat();
    updatePlayerDisplay();
    updateMediaSession();
    if (currentStation) showRadioNotification(currentStation);
    console.log('Audio paused');
});

audio.addEventListener('error', (e) => {
    hasError = true;
    console.error('Audio error:', e);
    stopHeartbeat();
    const errorMessage = getAudioErrorMessage(e);
    if (currentStation && isPlaying) {
        showError(`${errorMessage}\nAttempting to reconnect to ${currentStation.name}...`, false);
        attemptReconnect();
    } else if (!isPlaying) {
        showError(`${errorMessage}\nSelect a station to play.`, false);
        showLoading(false);
    }
});

audio.addEventListener('canplay', () => {
    console.log('Audio can play');
});

audio.addEventListener('stalled', () => {
    console.log('Audio stalled');
    hasError = true;
    stopHeartbeat();
    if (currentStation && isPlaying) {
        showError(`Stream stalled for ${currentStation.name}.\nAttempting to reconnect...`, false);
        attemptReconnect();
    }
});

audio.addEventListener('ended', () => {
    console.log('Audio stream ended');
    hasError = true;
    stopHeartbeat();
    if (currentStation && isPlaying) {
        showError(`Stream ended for ${currentStation.name}.\nAttempting to reconnect...`, false);
        attemptReconnect();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isPlaying && currentStation) {
        console.log('App minimized or screen off, ensuring audio continues...');
        audio.play().catch(err => {
            console.error('Failed to keep audio playing in background:', err);
            showError(`Background playback stopped.\nTry resuming manually.\n${err.message}`, true);
        });
    }
});

async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications.");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
}

async function showRadioNotification(station) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const options = {
        body: `Now Playing: ${station.name}${station.language ? ` (${normalizeLanguage(station.language)})` : ''}`,
        icon: 'https://via.placeholder.com/96x96', // Replace with your app icon
        badge: 'https://via.placeholder.com/96x96', // Small icon for notification
        actions: [
            { action: 'previous', title: 'Previous', icon: 'https://via.placeholder.com/64x64' },
            { action: isPlaying ? 'pause' : 'play', title: isPlaying ? 'Pause' : 'Play', icon: 'https://via.placeholder.com/64x64' },
            { action: 'next', title: 'Next', icon: 'https://via.placeholder.com/64x64' }
        ],
        tag: 'radio-notification',
        renotify: true,
        silent: false,
        vibrate: [200, 100, 200]
    };

    registration.showNotification(NOTIFICATION_TITLE, options);
}

function closeNotification() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.getNotifications({ tag: 'radio-notification' }).then(notifications => {
                notifications.forEach(notification => notification.close());
            });
        });
    }
}

function updateMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentStation ? currentStation.name : 'World FM Radio',
            artist: 'World FM Radio',
            album: 'Live Stream',
            artwork: [
                { src: 'https://via.placeholder.com/96x96', sizes: '96x96', type: 'image/png' },
                { src: 'https://via.placeholder.com/128x128', sizes: '128x128', type: 'image/png' },
            ]
        });

        navigator.mediaSession.setActionHandler('play', async () => {
            if (currentStation) {
                audio.play().then(() => {
                    isPlaying = true;
                    updatePlayerDisplay();
                    startHeartbeat();
                    showRadioNotification(currentStation);
                }).catch(err => {
                    console.error('Media Session play failed:', err);
                    showError(`Can't start playback.\nTry again or pick a different station.\n${err.message}`, true);
                });
            }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
            isPlaying = false;
            stopHeartbeat();
            updatePlayerDisplay();
            showRadioNotification(currentStation);
        });

        navigator.mediaSession.setActionHandler('stop', () => {
            stopPlayback();
            showError('Playback stopped.', false);
            closeNotification();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            previousStation();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            nextStation();
        });

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
}

async function fetchFromFastestServer(endpoint, retryCount = 0) {
    const fetchPromises = API_SERVERS.map(server =>
        fetch(`${server}${endpoint}`).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        }).catch(err => {
            console.error(`Server ${server} failed:`, err);
            return null;
        })
    );
    try {
        const results = await Promise.race(fetchPromises.filter(p => p));
        if (!results) throw new Error('All servers failed');
        return results;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log('Retrying fetch, attempt:', retryCount + 1);
            return fetchFromFastestServer(endpoint, retryCount + 1);
        }
        throw error;
    }
}

async function getUserCountryCode() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('User country detected:', data.country_code);
        return data.country_code || 'IN';
    } catch (error) {
        console.error('Failed to detect user country:', error);
        return 'IN';
    }
}

async function initializeApp() {
    console.log('Starting app initialization...');
    showLoading(true);

    const populateCountriesWithRetry = async (retries = 3, delay = 100) => {
        let attempts = 0;
        while (attempts < retries) {
            const countrySelect = document.getElementById('countrySelect');
            if (countrySelect) {
                console.log('Populating country dropdown...');
                populateCountryDropdown(STATIC_COUNTRIES);
                console.log('Country dropdown populated with', STATIC_COUNTRIES.length, 'countries');
                return countrySelect;
            }
            console.warn(`Country select not found, retrying (${attempts + 1}/${retries})...`);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        throw new Error('Country select element not found after retries');
    };

    try {
        const countrySelect = await populateCountriesWithRetry();
        const userCountryCode = await getUserCountryCode();
        const validCountry = STATIC_COUNTRIES.some(c => c.code === userCountryCode);
        const selectedCountry = validCountry ? userCountryCode : 'IN';
        countrySelect.value = selectedCountry;
        console.log('Selected country:', selectedCountry);

        updateFlagDisplay(selectedCountry);
        await fetchAndDisplayAllStations(selectedCountry);
        await requestNotificationPermission();
        showError('');
    } catch (error) {
        console.error('Initialization error:', error);
        showError(`Failed to initialize app.\nCountries may not have loaded.\nCheck your connection and press retry.\n${error.message}`, true);
        const countrySelect = document.getElementById('countrySelect');
        if (!countrySelect || !countrySelect.children.length) {
            populateCountryDropdown(STATIC_COUNTRIES);
        }
    } finally {
        showLoading(false);
        console.log('App initialization complete');
    }
}

function mergeDuplicateStations(stations) {
    const seen = new Map();
    const deduplicated = [];

    for (const station of stations) {
        const normalizedLanguage = normalizeLanguage(station.language);
        const key = `${station.name.toLowerCase()}|${normalizedLanguage || 'unknown'}`;

        if (!seen.has(key)) {
            seen.set(key, station);
            deduplicated.push(station);
        } else {
            console.log(`Duplicate station found and merged: ${station.name} (${normalizedLanguage})`);
        }
    }

    console.log(`Reduced stations from ${stations.length} to ${deduplicated.length} after merging duplicates`);
    return deduplicated;
}

async function fetchAndDisplayAllStations(countryCode) {
    showLoading(true);
    try {
        const cacheKey = `${CACHE_KEY}_${countryCode}`;
        const cachedData = localStorage.getItem(cacheKey);
        let allStations = null;

        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            const now = Date.now();
            if (now - timestamp < CACHE_DURATION) {
                console.log('Using cached stations for country:', countryCode);
                allStations = data;
            } else {
                console.log('Cache expired for country:', countryCode);
                localStorage.removeItem(cacheKey);
            }
        }

        if (!allStations) {
            console.log('Fetching stations for country code:', countryCode);
            allStations = await fetchFromFastestServer(`/json/stations/bycountrycodeexact/${countryCode}?hidebroken=true&order=votes&reverse=true`);
            if (!allStations || !allStations.length) throw new Error(`No stations found for ${countryCode}`);
            localStorage.setItem(cacheKey, JSON.stringify({
                data: allStations,
                timestamp: Date.now()
            }));
            console.log('Stations cached for country:', countryCode);
        }

        countryStations = mergeDuplicateStations(allStations);
        stations = [...countryStations];
        console.log('All stations after deduplication:', countryStations.length);

        const stationSelect = document.getElementById('stationSelect');
        stationSelect.innerHTML = '<option value="">Select Station</option>';
        let index = 0;

        const renderBatch = () => {
            const fragment = document.createDocumentFragment();
            const end = Math.min(index + BATCH_SIZE, stations.length);
            for (; index < end; index++) {
                const station = stations[index];
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${station.name} ${station.bitrate ? `(${station.bitrate}kbps)` : ''}`;
                option.style.color = station.votes > 100 ? '#00ff00' : station.votes < 10 ? '#ff0000' : 'inherit';
                fragment.appendChild(option);
            }
            stationSelect.appendChild(fragment);

            if (index < stations.length) {
                requestAnimationFrame(renderBatch);
            } else {
                stationSelect.disabled = false;
                console.log('All stations rendered:', stations.length);
                populateLanguageDropdown();
                showLoading(false);
            }
        };

        requestAnimationFrame(renderBatch);
    } catch (error) {
        console.error('Error fetching stations:', error);
        showError(`No stations loaded for ${countryCode}.\nTry another country.\n${error.message}`, false);
        document.getElementById('stationSelect').disabled = true;
        showLoading(false);
    }
}

function populateCountryDropdown(countries) {
    const countrySelect = document.getElementById('countrySelect');
    if (!countrySelect) {
        console.error('Country select element not found in DOM');
        showError(`App error: Country list not found.\nPlease refresh the page.`, true);
        return;
    }
    countrySelect.innerHTML = '<option value="">Select Country</option>';
    const fragment = document.createDocumentFragment();
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        option.style.backgroundImage = `url('https://flagcdn.com/24x18/${country.code.toLowerCase()}.png')`;
        fragment.appendChild(option);
    });
    countrySelect.appendChild(fragment);
    countrySelect.disabled = false;
    console.log('Country dropdown populated with', countries.length, 'countries');

    if (!countrySelect.dataset.listenerAdded) {
        countrySelect.addEventListener('change', async (e) => {
            const countryCode = e.target.value;
            updateFlagDisplay(countryCode);
            if (countryCode) {
                clearError();
                await fetchAndDisplayAllStations(countryCode);
                document.getElementById('languageSelect').disabled = false;
                document.getElementById('stationSelect').disabled = false;
            } else {
                clearError();
                document.getElementById('languageSelect').innerHTML = '<option value="">Select country first</option>';
                document.getElementById('languageSelect').disabled = true;
                document.getElementById('stationSelect').innerHTML = '<option value="">Select language first</option>';
                document.getElementById('stationSelect').disabled = true;
            }
        });
        countrySelect.dataset.listenerAdded = 'true';
    }
}

function updateFlagDisplay(countryCode) {
    const countrySelect = document.getElementById('countrySelect');
    if (countryCode) {
        countrySelect.style.backgroundImage = `url('https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png')`;
    } else {
        countrySelect.style.backgroundImage = 'none';
    }
}

function normalizeLanguage(rawLanguage) {
    if (!rawLanguage) return null;
    const cleanedLanguage = rawLanguage.toLowerCase().replace(/[^a-z\s,;-]/g, '').trim();
    if (!cleanedLanguage) return null;

    const languages = cleanedLanguage.split(/[,;-]/).map(lang => lang.trim());
    for (let lang of languages) {
        if (lang && LANGUAGE_NORMALIZATION[lang]) {
            return LANGUAGE_NORMALIZATION[lang];
        }
    }

    const firstLang = languages[0];
    if (firstLang && /^[a-z]+$/.test(firstLang)) {
        return firstLang.charAt(0).toUpperCase() + firstLang.slice(1);
    }

    return null;
}

function populateLanguageDropdown() {
    const languageSelect = document.getElementById('languageSelect');
    const languageCounts = new Map();

    stations.forEach(station => {
        const normalizedLanguage = normalizeLanguage(station.language);
        if (normalizedLanguage) {
            languageCounts.set(normalizedLanguage, (languageCounts.get(normalizedLanguage) || 0) + 1);
        }
    });

    const sortedLanguages = Array.from(languageCounts.keys()).sort();

    languageSelect.innerHTML = '<option value="">All Languages</option>';
    sortedLanguages.forEach(lang => {
        const count = languageCounts.get(lang);
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = `${lang} (${count} station${count !== 1 ? 's' : ''})`;
        languageSelect.appendChild(option);
    });

    languageSelect.disabled = false;
    languageSelect.addEventListener('change', (e) => {
        const selectedLanguage = e.target.value;
        filterStationsByLanguage(selectedLanguage);
    });
}

function filterStationsByLanguage(language) {
    if (!language) {
        stations = [...countryStations];
    } else {
        stations = countryStations.filter(station => {
            const normalizedLanguage = normalizeLanguage(station.language);
            return normalizedLanguage === language;
        });
    }

    const stationSelect = document.getElementById('stationSelect');
    stationSelect.innerHTML = '<option value="">Select Station</option>';
    let index = 0;

    const renderBatch = () => {
        const fragment = document.createDocumentFragment();
        const end = Math.min(index + BATCH_SIZE, stations.length);
        for (; index < end; index++) {
            const station = stations[index];
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${station.name} ${station.bitrate ? `(${station.bitrate}kbps)` : ''}`;
            option.style.color = station.votes > 100 ? '#00ff00' : station.votes < 10 ? '#ff0000' : 'inherit';
            fragment.appendChild(option);
        }
        stationSelect.appendChild(fragment);

        if (index < stations.length) {
            requestAnimationFrame(renderBatch);
        } else {
            stationSelect.disabled = false;
        }
    };

    requestAnimationFrame(renderBatch);
}

async function testStream(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TEST_STREAM_TIMEOUT);
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.error('Stream test failed for URL:', url, error);
        return false;
    }
}

async function playStation(station) {
    showLoading(true);
    clearError();
    hasError = false;
    reconnectAttempts = 0;

    try {
        audio.pause();
        audio.src = '';
        audio.currentTime = 0;

        let workingUrl = station.url_resolved || station.url;
        console.log('Initial URL:', workingUrl);

        if (workingUrl.endsWith('.m3u') || workingUrl.endsWith('.pls')) {
            console.log('Detected playlist file, fetching and parsing:', workingUrl);
            const response = await fetch(workingUrl);
            if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.statusText}`);
            const text = await response.text();
            const lines = text.split('\n');
            let foundStreamUrl = false;
            for (const line of lines) {
                if (line.trim().startsWith('http')) {
                    workingUrl = line.trim();
                    foundStreamUrl = true;
                    console.log('Extracted stream URL from playlist:', workingUrl);
                    break;
                }
            }
            if (!foundStreamUrl) throw new Error('No valid stream URL found in playlist file');
        }

        if (!SKIP_STREAM_TEST) {
            const urlsToTry = [workingUrl, ...(station.url_alt || []).filter(url => url)].filter(url => url && url.startsWith('http'));
            let streamTestPassed = false;
            for (const url of urlsToTry) {
                console.log('Testing URL:', url);
                if (await testStream(url)) {
                    workingUrl = url;
                    streamTestPassed = true;
                    break;
                }
            }
            if (!streamTestPassed) {
                throw new Error('No working stream URL found after testing');
            }
        }

        console.log('Playing URL:', workingUrl);
        audio.src = workingUrl;
        audio.volume = document.getElementById('volume').value;

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Stream loading timed out after 10 seconds')), 10000);
            audio.addEventListener('canplay', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
            audio.addEventListener('error', (e) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to load stream: ${getAudioErrorMessage(e)}`));
            }, { once: true });
            audio.load();
        });

        currentStation = station;
        await audio.play().catch(err => {
            throw new Error(`Playback failed: ${err.message}`);
        });
        isPlaying = true;

        const stationIndex = stations.indexOf(station);
        document.getElementById('stationSelect').value = stationIndex;

        updatePlayerDisplay();
        updateMediaSession();
        await showRadioNotification(station);
    } catch (error) {
        console.error('Play error:', error);
        hasError = true;
        showError(`Can't play ${station.name}.\n${error.message}\nCheck your connection or try another station.`, false);
        isPlaying = false;
        currentStation = null;
        updatePlayerDisplay();
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const player = document.querySelector('.player');
    loading.style.display = show ? 'block' : 'none';
    player.classList.toggle('connecting', show);
}

function showError(message, showRetry = false) {
    const errorContainer = document.getElementById('errorContainer');
    if (!message) {
        errorContainer.innerHTML = '';
        lastError = { message: null, showRetry: false };
        return;
    }

    if (lastError.message === message && lastError.showRetry === showRetry) {
        return;
    }

    lastError = { message, showRetry };
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container';

    const errorMessage = document.createElement('div');
    errorMessage.className = 'error';
    errorMessage.textContent = message;
    errorDiv.appendChild(errorMessage);

    if (showRetry) {
        const retryButton = document.createElement('button');
        retryButton.className = 'retry-button';
        retryButton.innerHTML = `
            <span class="retry-text">Retry</span>
            <span class="spinner"><i class="fas fa-spinner fa-spin"></i></span>
        `;
        retryButton.addEventListener('click', async () => {
            if (isRetrying) return;
            isRetrying = true;
            retryButton.classList.add('loading');
            retryButton.disabled = true;

            try {
                if (currentStation) {
                    await playStation(currentStation);
                } else {
                    const countryCode = document.getElementById('countrySelect').value;
                    if (countryCode) {
                        await fetchAndDisplayAllStations(countryCode);
                    } else {
                        await initializeApp();
                    }
                }
            } catch (error) {
                console.error('Retry failed:', error);
                showError(`Retry failed.\n${error.message}`, true);
            } finally {
                isRetrying = false;
                retryButton.classList.remove('loading');
                retryButton.disabled = false;
            }
        });
        errorDiv.appendChild(retryButton);
    }

    errorContainer.innerHTML = '';
    errorContainer.appendChild(errorDiv);
}

function clearError() {
    showError('');
}

function updatePlayerDisplay() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const previousBtn = document.getElementById('previousBtn');
    const nextBtn = document.getElementById('nextBtn');
    const nowPlaying = document.getElementById('nowPlaying');
    const span = nowPlaying.querySelector('span');
    
    playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    playPauseBtn.disabled = !currentStation;
    playPauseBtn.classList.toggle('active', isPlaying && currentStation);
    stopBtn.disabled = !currentStation;

    const currentIndex = currentStation ? stations.indexOf(currentStation) : -1;
    previousBtn.disabled = !currentStation || stations.length <= 1 || currentIndex === 0;
    nextBtn.disabled = !currentStation || stations.length <= 1 || currentIndex === stations.length - 1;

    if (currentStation) {
        const text = isRetrying 
            ? `Connecting to ${currentStation.name} (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
            : `Now Playing: ${currentStation.name}${currentStation.language ? ` (${normalizeLanguage(currentStation.language)})` : ''}`;
        span.textContent = text;
        const isOverflowing = span.scrollWidth > nowPlaying.clientWidth;
        nowPlaying.classList.toggle('overflowing', isOverflowing);
        nowPlaying.classList.toggle('playing', isPlaying && !isRetrying);
    } else {
        span.textContent = 'Select a station to play';
        nowPlaying.classList.remove('playing', 'overflowing');
    }
}

function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
        console.log('Heartbeat: Checking stream status...');
        if (!isPlaying || hasError) {
            stopHeartbeat();
            attemptReconnect();
        }
    }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

async function attemptReconnect() {
    if (!currentStation) {
        console.log('No current station to reconnect to.');
        return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnect attempts reached, giving up.');
        isPlaying = false;
        hasError = true;
        showError(`Failed to reconnect to ${currentStation.name} after ${MAX_RECONNECT_ATTEMPTS} attempts.\nPlease try again or select another station.`, true);
        updatePlayerDisplay();
        return;
    }

    reconnectAttempts++;
    const delay = Math.min(BASE_RECONNECT_DELAY + (reconnectAttempts - 1) * DELAY_INCREMENT, MAX_RECONNECT_DELAY);
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}), waiting ${delay}ms...`);

    isRetrying = true;
    showLoading(true);
    updatePlayerDisplay();

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
        await playStation(currentStation);
    } catch (error) {
        console.error(`Reconnect attempt ${reconnectAttempts} failed:`, error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            attemptReconnect();
        } else {
            isPlaying = false;
            hasError = true;
            showError(`Failed to reconnect to ${currentStation.name} after ${MAX_RECONNECT_ATTEMPTS} attempts.\n${error.message}\nPlease try again or select another station.`, true);
            updatePlayerDisplay();
        }
    } finally {
        isRetrying = false;
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            showLoading(false);
        }
    }
}

function stopPlayback() {
    audio.pause();
    audio.src = '';
    audio.currentTime = 0;
    isPlaying = false;
    currentStation = null;
    stopHeartbeat();
    updatePlayerDisplay();
    clearError();
    closeNotification();
}

function previousStation() {
    const stationSelect = document.getElementById('stationSelect');
    const currentIndex = parseInt(stationSelect.value, 10);
    if (currentIndex > 0) {
        stationSelect.value = currentIndex - 1;
        const station = stations[currentIndex - 1];
        playStation(station);
    }
}

function nextStation() {
    const stationSelect = document.getElementById('stationSelect');
    const currentIndex = parseInt(stationSelect.value, 10);
    if (currentIndex < stations.length - 1) {
        stationSelect.value = currentIndex + 1;
        const station = stations[currentIndex + 1];
        playStation(station);
    }
}

document.getElementById('stationSelect').addEventListener('change', (e) => {
    const index = parseInt(e.target.value, 10);
    if (!isNaN(index)) {
        const station = stations[index];
        playStation(station);
    }
});

document.getElementById('playPauseBtn').addEventListener('click', async () => {
    if (!currentStation) {
        showError('No station selected.\nPlease select a station to play.', true);
        return;
    }

    try {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            stopHeartbeat();
            console.log('Paused audio');
        } else {
            if (!audio.src || hasError) {
                console.log('Audio source lost or error occurred, reloading station');
                await playStation(currentStation);
            } else {
                console.log('Resuming audio from current live position');
                audio.volume = document.getElementById('volume').value;
                await audio.play().catch(err => {
                    throw new Error(`Resume failed: ${err.message}`);
                });
                isPlaying = true;
                startHeartbeat();
                console.log('Resumed audio from current time');
            }
            clearError();
        }
        updatePlayerDisplay();
    } catch (error) {
        console.error('Play/pause error:', error);
        hasError = true;
        showError(`Playback issue.\n${error.message}\nTry again or switch stations.`, true);
        isPlaying = false;
        updatePlayerDisplay();
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    stopPlayback();
    showError('Playback stopped.', false);
});

document.getElementById('previousBtn').addEventListener('click', () => {
    previousStation();
});

document.getElementById('nextBtn').addEventListener('click', () => {
    nextStation();
});

document.getElementById('muteBtn').addEventListener('click', () => {
    const muteBtn = document.getElementById('muteBtn');
    const volume = document.getElementById('volume');
    if (audio.muted) {
        audio.muted = false;
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        volume.value = audio.volume;
    } else {
        audio.muted = true;
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        volume.value = 0;
    }
    document.getElementById('volumeLevel').textContent = `${Math.round(audio.volume * 100)}%`;
});

document.getElementById('volume').addEventListener('input', (e) => {
    const volume = e.target.value;
    audio.volume = volume;
    audio.muted = volume === '0';
    document.getElementById('muteBtn').innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    document.getElementById('volumeLevel').textContent = `${Math.round(volume * 100)}%`;
});

window.addEventListener('online', async () => {
    console.log('Network restored.');
    if (currentStation && !isPlaying) {
        console.log('Attempting to automatically resume playback...');
        await playStation(currentStation);
    }
});

window.addEventListener('offline', () => {
    console.log('Network lost, stopping playback...');
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        updatePlayerDisplay();
        showError('Network disconnected.\nPlease reconnect and select a station to resume.', false);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing app...');
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initializeApp();
    } else {
        window.addEventListener('load', initializeApp, { once: true });
    }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.error('Service Worker registration failed', err));

    navigator.serviceWorker.addEventListener('message', (event) => {
        const { action } = event.data;
        switch (action) {
            case 'play':
                if (currentStation && !isPlaying) {
                    audio.play().then(() => {
                        isPlaying = true;
                        updatePlayerDisplay();
                        startHeartbeat();
                        showRadioNotification(currentStation);
                    }).catch(err => {
                        console.error('Service Worker play failed:', err);
                        showError(`Can't start playback.\n${err.message}`, true);
                    });
                }
                break;
            case 'pause':
                if (isPlaying) {
                    audio.pause();
                    isPlaying = false;
                    stopHeartbeat();
                    updatePlayerDisplay();
                    showRadioNotification(currentStation);
                }
                break;
            case 'previous':
                previousStation();
                break;
            case 'next':
                nextStation();
                break;
        }
    });
}