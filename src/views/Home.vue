<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";

import NavBar from "@/components/NavBar.vue";
import NavItem from "@/components/NavItem.vue";
import MapBar from "@/components/MapBar.vue";
import MapImage from "@/components/MapImage.vue";
import ReturnIcon from "@/assets/internal/returnarrow.svg";
import LayersIcon from "@/assets/internal/layers.svg";
import LeaderboardIcon from "@/assets/internal/leaderboard.svg";
import SettingsIcon from "@/assets/internal/settings.svg";
import Map from "@/components/Map.vue";
import InfoComponent from "@/components/InfoComponent.vue";
import InfoText from "@/components/InfoText.vue";
import SettingToggle from "@/components/SettingToggle.vue";
import SettingSlider from "@/components/SettingSlider.vue";
import SettingDropdown from "@/components/SettingDropdown.vue";
import SettingInput from "@/components/SettingInput.vue";

const mapImageRef = ref(null);
const mapRef = ref(null);

const alignmentData = ref(getAlignmentDataForMap(getMapIdFromName("SIMPS SMP Season 2")));
const offset = ref({
    x: alignmentData.value.mapX - alignmentData.value.mcX,
    y: alignmentData.value.mapY - alignmentData.value.mcY,
});

const guessHistory = ref([])

const continueButonName = ref("Continue")
const currentCoords = ref({})
const guessCoords = ref({})
const currentId = ref(0)
const currentPlaceName = ref("")
const round = ref(0)
const points = ref(0)
const totalPoints = ref(0);
const score = ref(0);
const totalScore = ref(0);
const distance = ref(0)
const maxRounds = ref(5);
const timeToGuessSeconds = ref(30);
const timer = ref(0)
const totalTimeTaken = ref(0)
const hasTimer = ref(true)
const tenSecondsLeft = ref(false)
const countdown = ref(0)
const countdownTimeSeconds = ref(3)
let countdownInterval = null
let timerInterval = null
let endTime = null

const isFullscreen = ref(false);
const isFinished = ref(false);
const gameStarted = ref(false);
const gameFinished = ref(false);
const hasGuessedThisRound = ref(false);

const blinkMode = ref(false)
const blinkActive = ref(false)
const invertedMode = ref(false)
const bwMode = ref(false)
const pixelatedMode = ref(false)
const currentPopupOpen = ref(null);
const selectedMap = ref("SIMPS SMP Season 2")
const selectedMapId = ref(getMapIdFromName(selectedMap.value))
const showDebug = ref(false);

const playerName = ref("");
const hasSumbmitted = ref(false);
const statusMessage = ref("");
const hasDefaultSettings = ref(false);
const isSubmitting = ref(false);


const DEFAULT_SETTINGS = {
    hasTimer: true,
    blinkMode: false,
    invertedMode: false,
    bwMode: false,
    pixelatedMode: false,
    countdownTimeSeconds: 3,
    timeToGuessSeconds: 30,
    maxRounds: 5,
};
const SETTINGS_KEY = "simps_geoguesser_settings";

function saveSettings() {
    hasDefaultSettings.value = checkIfDefaultSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        hasTimer: hasTimer.value,
        blinkMode: blinkMode.value,
        invertedMode: invertedMode.value,
        bwMode: bwMode.value,
        pixelatedMode: pixelatedMode.value,
        selectedMap: selectedMap.value,
        showDebug: showDebug.value,
        countdownTimeSeconds: countdownTimeSeconds.value,
        timeToGuessSeconds: timeToGuessSeconds.value,
        maxRounds: maxRounds.value,
    }));
}

function loadSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            hasTimer.value = parsedSettings.hasTimer;
            blinkMode.value = parsedSettings.blinkMode;
            invertedMode.value = parsedSettings.invertedMode;
            bwMode.value = parsedSettings.bwMode;
            pixelatedMode.value = parsedSettings.pixelatedMode;
            selectedMap.value = parsedSettings.selectedMap;
            showDebug.value = parsedSettings.showDebug;
            countdownTimeSeconds.value = parsedSettings.countdownTimeSeconds;
            timeToGuessSeconds.value = parsedSettings.timeToGuessSeconds;
            maxRounds.value = parsedSettings.maxRounds;
            saveSettings();
        } catch (error) {
            console.error("Error loading settings:", error);
            resetToDefaults();
        }
    }
}

function resetToDefaults() {
    closePopup()
    hasTimer.value = DEFAULT_SETTINGS.hasTimer;
    blinkMode.value = DEFAULT_SETTINGS.blinkMode;
    invertedMode.value = DEFAULT_SETTINGS.invertedMode;
    bwMode.value = DEFAULT_SETTINGS.bwMode;
    pixelatedMode.value = DEFAULT_SETTINGS.pixelatedMode;
    countdownTimeSeconds.value = DEFAULT_SETTINGS.countdownTimeSeconds;
    timeToGuessSeconds.value = DEFAULT_SETTINGS.timeToGuessSeconds;
    maxRounds.value = DEFAULT_SETTINGS.maxRounds;
    saveSettings();
    setTimeout(() => {
        openPopup(popups.Settings)
    }, 50);
}

function checkIfDefaultSettings() {
  const keys = [
    "hasTimer",
    "blinkMode",
    "invertedMode",
    "bwMode",
    "pixelatedMode",
    "countdownTimeSeconds",
    "timeToGuessSeconds",
    "maxRounds",
  ];
  return keys.every(key => DEFAULT_SETTINGS[key] === eval(key + ".value"));
}

watch([hasTimer, blinkMode, invertedMode, bwMode, pixelatedMode, selectedMap, showDebug, countdownTimeSeconds, timeToGuessSeconds, maxRounds], saveSettings);

watch(selectedMap, (newVal) => {
    selectedMapId.value = getMapIdFromName(newVal);
    alignmentData.value = getAlignmentDataForMap(selectedMapId.value);
    offset.value = {
        x: alignmentData.value.mapX - alignmentData.value.mcX,
        y: alignmentData.value.mapY - alignmentData.value.mcY,
    };
});

function getAlignmentDataForMap(mapId) {
    switch (mapId) {
        case 2:
            return {mapX: 796, mapY: 656, mcX: 169, mcY: 48};
        case 1:
            return {mapX: 3027, mapY: 2729, mcX: 1491, mcY: 9047};
    }

}

function mapToMc(x, y, alignment) {
    return {
        x: (x - alignment.mapX) + alignment.mcX,
        y: -(y - alignment.mapY) + alignment.mcY,
    };
}
function mcToMap(x, y, alignment) {
    return {
        x: (x - alignment.mcX) + alignment.mapX,
        y: -(y - alignment.mcY) + alignment.mapY,
    };
}

function getMapIdFromName(name) {
    switch (name) {
        case "SIMPS SMP Season 2":
            return 2;
        case "SIMPS SMP Season 1":
            return 1;
        default:
            return 2;
    }
}

const popups = {
    Settings: 0,
    Credits: 1,
    Legal: 2,
    Layers: 3,
    Leaderboard: 4
}

function closePopup() {
    currentPopupOpen.value = null;
}

function openPopup(popup) {
    if (currentPopupOpen.value === popup) {
        closePopup();
        return;
    }
    currentPopupOpen.value = popup;
    if (popup === popups.Leaderboard) {
        fetchLeaderboard();
    }
}

function isPopupOpen(popup) {
    return currentPopupOpen.value === popup;
}

function startGame() {
    resetCountdown()
    gameStarted.value = true;
    mapRef.value.lockMap(false)
    isFullscreen.value = false;
    isFinished.value = false;
    gameFinished.value = false;
    hasSumbmitted.value = false;
    statusMessage.value = "";
    mapRef.value.clearMap()
    mapRef.value.defaultBounds()
    continueButonName.value = "Continue"
    round.value = 0;
    guessHistory.value = [];
    continueGame()
}

function continueGame() {
    restartTimer()
    if (hasTimer.value) {
        startCountdown(countdownTimeSeconds.value)
    }
    if (isFinished.value) {
        gameFinished.value = true;
        if (continueButonName.value === "Restart") {
            startGame()
        }
        mapRef.value.clearMap()
        mapRef.value.showAllMarkers(guessHistory.value, maxRounds.value)
        setTimeout(() => {
            mapRef.value.defaultBounds()
        }, 50);

        continueButonName.value = "Restart"
        return;
    }
    hasSumbmitted.value = false;
    statusMessage.value = "";
    mapRef.value.lockMap(false)
    getRandomPlace(getMapIdFromName(selectedMap.value))
    round.value++
    mapRef.value.clearMap()
    isFullscreen.value = false;
    setTimeout(() => {
        mapRef.value?.invalidateSize?.()
    }, 50);
    guessCoords.value = {}
    hasGuessedThisRound.value = false;
    mapRef.value.defaultBounds()
}

function placedGuess() {
    if (hasGuessedThisRound.value) { return; }
    hasGuessedThisRound.value = true;
    pauseTimer()
    isFullscreen.value = true;
    mapRef.value.lockMap(true)
    if (!currentCoords.value?.x || !currentCoords.value?.y) {
        console.warn("No current place selected yet");
        return;
    }
    const alignedCurrentCoords = {x: currentCoords.value.x, y: currentCoords.value.y};
    const alignedGuessCoords = {x: guessCoords.value.x, y: guessCoords.value.y};

    const timeTaken = timeToGuessSeconds.value - timer.value;
    calculatePoints(alignedCurrentCoords, alignedGuessCoords, timeTaken);
    totalPoints.value += points.value;
    totalScore.value += score.value;
    totalTimeTaken.value += timeTaken;
    guessHistory.value.push({
        guessCoords: alignedGuessCoords,
        currentCoords: alignedCurrentCoords,
        points: points.value,
        distance: distance.value,
        time: timer.value,
        score: score.value,
        round: round.value,
        roundColor: mapRef.value.getColorFromRound(round.value, maxRounds.value)
    })

    setTimeout(() => {
        mapRef.value.showCorrectMarker(
            mcToMap(currentCoords.value.x, currentCoords.value.y, alignmentData.value),
            mcToMap(guessCoords.value.x, guessCoords.value.y, alignmentData.value),
            round.value,
            maxRounds.value
        );
    }, 50);

    if (round.value >= maxRounds.value) {
        isFinished.value = true;
        continueButonName.value = "Finish"
    }
}

import places1 from "@/assets/maps/simps1/places.json";
import places2 from "@/assets/maps/simps2/places.json";

const placesByMap = {
  1: places1,
  2: places2,
};

function getRandomPlace(selectedMapId) {
  const PlacesJson = placesByMap[selectedMapId];
  const randomIndex = Math.floor(Math.random() * PlacesJson.length);
  const randomPlace = PlacesJson[randomIndex];

  currentId.value = randomPlace.id;
  currentCoords.value = { x: randomPlace.coords[0], y: randomPlace.coords[1] };
  currentPlaceName.value = randomPlace.name;
}

function startCountdown(seconds) {
    countdown.value = seconds
    countdownInterval = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            clearInterval(countdownInterval)
            if (blinkMode.value) {
                flashMapImage()
            } else {
                restartTimer()
            }
        }
    }, 1000)
}

function flashMapImage() {
    blinkActive.value = true

    setTimeout(() => {
        blinkActive.value = false
    }, 100)
}

function resetCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
    }
    countdown.value = 0
}

function startTimer() {
    if (timerInterval) return
    if (!hasTimer.value) return

    endTime = performance.now() + timeToGuessSeconds.value * 1000
    timerInterval = setInterval(() => {
        const now = performance.now()
        let remaining = Math.max(0, (endTime - now) / 1000)
        timer.value = remaining

        if (remaining <= 0) {
            clearInterval(timerInterval)
            timerInterval = null
        }
    }, 16)
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
        endTime = performance.now() + timer.value * 1000
    }
}

function restartTimer() {
    pauseTimer()
    timer.value = timeToGuessSeconds.value
    startTimer()
}

function formatTime(seconds) {
    const secNum = Number(seconds) || 0;
    tenSecondsLeft.value = secNum < 10
    if (secNum > 10) {
        const mins = Math.floor(secNum / 60)
        const secs = Math.floor(secNum % 60)
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    } else {
        return secNum.toFixed(2)
    }
}

function finalGuessTime(seconds) {
    const timeTaken = timeToGuessSeconds.value - seconds
    return timeTaken.toFixed(3)
}

function calculatePoints(currentCoords, guessCoords, timeTaken) {
  const xDiff = currentCoords.x - guessCoords.x;
  const yDiff = currentCoords.y - guessCoords.y;
  distance.value = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

  const maxPoints = 100;
  const decayRate = 0.01;

  if (distance.value <= 10) {
    points.value = maxPoints;
  } else {
    const adjustedDistance = distance.value - 10;
    points.value = Math.floor(maxPoints * Math.exp(-decayRate * adjustedDistance));
  }

  const maxBonus = 1.5;
  const decay = 0.307;
  const speedBonus = 1 + (maxBonus - 1) * Math.exp(-decay * timeTaken);

  const precisionMax = 0.6;
  let closeness = 0;
  if (distance.value <= 10) {
    closeness = (10 - distance.value) / 10;
  }
  const timeFactor = Math.min(1, timeTaken / 15);
  const precisionBonus = 1 + precisionMax * closeness * timeFactor;

  score.value = points.value * speedBonus * precisionBonus;
}


function handleMapClick(coords) {
  const mc = mapToMc(coords.x, coords.y, alignmentData.value);
  guessCoords.value = { x: Math.floor(mc.x), y: Math.floor(mc.y) };
}

function handleKeydown(e) {
    if (e.code === "Space") {
        e.preventDefault();
        if (countdown.value > 0 || gameFinished.value) return;

        if (!guessCoords.value.x && !guessCoords.value.y) {
            const mouse = mapRef.value.getMousePos();
            if (!mouse || isNaN(mouse.lat) || isNaN(mouse.lng)) {
                console.warn("Mouse position not available yet");
                return;
            }
            guessCoords.value = {x: Math.floor(coords.x), y: Math.floor(coords.y)};
            mapRef.value.showTempMarker(mouse);
        } else {
            placedGuess();
        }
    }
}

const debugSections = computed(() => ({
    Game: {
        started: gameStarted.value,
        finished: gameFinished.value,
        fullscreen: isFullscreen.value,
        round: `${round.value}/${maxRounds.value}`
    },
    Timers: {
        hasTimer: hasTimer.value,
        countdown: countdown.value,
        timer: timer.value.toFixed(2),
        totalTime: totalTimeTaken.value.toFixed(2),
        active: !!timerInterval
    },
    Scoring: {
        points: points.value,
        score: score.value.toFixed(2),
        totalPoints: totalPoints.value,
        totalScore: totalScore.value.toFixed(2),
        distance: distance.value.toFixed(2)
    },
    Map: {
        selected: selectedMap.value,
        id: selectedMapId.value,
        offset: offset.value
    },
    Coords: {
        currentMC: currentCoords.value,
        guessMC: guessCoords.value,
        currentMap: mcToMap(currentCoords.value?.x || 0, currentCoords.value?.y || 0, alignmentData.value),
        guessMap: mcToMap(guessCoords.value?.x || 0, guessCoords.value?.y || 0, alignmentData.value)
    },
    LocalStorage: {
        defaultSettings: hasDefaultSettings.value,
        JSON: localStorage.getItem(SETTINGS_KEY),
    }
}));

async function submitScore() {
    isSubmitting.value = true;
    statusMessage.value = '';
    try {
        const res = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: playerName.value,
                score: Number(totalScore.value),
                totalTime: Number(totalTimeTaken.value),
                points: Number(totalPoints.value),
                map: Number(selectedMapId.value),
            })
        });

        const data = await res.json();
        if (res.ok) {
            statusMessage.value = `Submitted: ${data.entry.username}   (${data.entry.score})`;
        } else {
            statusMessage.value = `Error: ${data.error}`;
        }
    } catch (e) {
        console.error('Error submitting score:', e);
        statusMessage.value = 'Failed to connect to server';
    }
    isSubmitting.value = false;
}

function cleanUsername(e) {
    const raw = e.target.value;
    playerName.value = raw
        .trim()
        .replace(/[^A-Za-z0-9_]/g, "")
        .substring(0, 20);
}

watch(statusMessage, (newStatus) => {
    if (newStatus === "") return;
    hasSumbmitted.value = true;
})

const leaderboard = ref([]);
const selectedLeaderboardSeason = ref("SIMPS SMP Season 2");
const leaderboardCache = ref({});
const loadingLeaderboard = ref(false);

async function fetchLeaderboard(force = false) {
    const mapId = getMapIdFromName(selectedLeaderboardSeason.value);

    if (!force && leaderboardCache.value[mapId]) {
        leaderboard.value = leaderboardCache.value[mapId];
        return;
    }

    loadingLeaderboard.value = true;
    try {
        const res = await fetch(`/api/submit?map=${mapId}`);
        const data = await res.json();
        leaderboard.value = data.leaderboard || [];

        leaderboardCache.value[mapId] = leaderboard.value;
    } catch (e) {
        console.error("Failed to load leaderboard", e);
        leaderboard.value = [];
    } finally {
        loadingLeaderboard.value = false;
    }
}


onMounted(() => {
    loadSettings();
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
    <div class="map-container"
         :class="[tenSecondsLeft && gameStarted && !gameFinished && hasTimer ? 'vignette' : 'vignette-out']">
        <MapImage :imageId="currentId" :mapId="selectedMapId" ref="mapImageRef" class="background-map"
                  :pixelated="pixelatedMode" :inverted="invertedMode" :bw="bwMode" :blink="blinkActive"/>
        <div
            class="map-blur"
            :class="{ active: (countdown > 0 && gameStarted && !gameFinished) || (!blinkActive && blinkMode), activesmooth: timer <= 0, 'no-transition': blinkActive}">
        </div>

        <div class="navbar-list">
            <NavBar>
                <NavItem @click="startGame">
                    <ReturnIcon width="32" height="32"/>
                </NavItem>
            </NavBar>
        </div>
        <div class="navtopbar-list">
            <NavBar style="margin-right: 5px;">
                <NavItem @click="openPopup(popups.Leaderboard)">
                    <LeaderboardIcon width="32" height="32"/>
                </NavItem>
                <NavItem @click="openPopup(popups.Layers)">
                    <LayersIcon width="32" height="32"/>
                </NavItem>
                <NavItem @click="openPopup(popups.Settings)">
                    <SettingsIcon width="32" height="32"/>
                </NavItem>
            </NavBar>
        </div>
        <MapBar>
            <div :class="{ 'fullscreen-wrapper': isFullscreen, 'normal-wrapper': !isFullscreen }">
                <Map @map-click="handleMapClick" ref="mapRef" :mapToMc="mapToMc" :mcToMap="mcToMap"
                     :alignmentData="getAlignmentDataForMap(getMapIdFromName(selectedMap))" :offset="offset" :mapId="selectedMapId"/>
            </div>
          <NavBar class="guess-bar small-guess-bar">
          <NavItem
                    :class="{disabled: (!guessCoords.x && !guessCoords.y) || countdown > 0,
                        'guess-item': !hasTimer || timer <= 0,
                        'guess-item-timer': hasTimer && timer > 0
                    }"
                    @click="() => {
                        if ((!guessCoords.x && !guessCoords.y) || countdown > 0) return;
                        placedGuess();
                    }">
                    Guess
                </NavItem>
                <NavItem class="timer-item" v-if="hasTimer && timer > 0 ">
                    <span v-if="countdown > 0">{{ countdown }}</span>
                    <span v-else>{{ formatTime(timer) }}</span>
                </NavItem>
            </NavBar>
        </MapBar>
        <MapBar :class="{ 'fullscreen-bar': isFullscreen }" class="not-fullscreen-bar">
            <NavBar class="guess-bar" v-if="!gameFinished">
                <NavItem
                    class="guess-item"
                    @click="continueGame">
                    {{ continueButonName }}
                </NavItem>
                <NavItem class="timer-item" v-if="hasTimer">
                    {{ formatTime(timer) }}
                </NavItem>
            </NavBar>
        </MapBar>
        <NavBar :class="{ 'fullscreen-bar': isFullscreen, 'not-fullscreen-bar': !isFullscreen }" class="stats-navbar" v-if="!gameFinished">
            <NavItem>Distance: {{ Math.round(distance) }} blocks</NavItem>
            <NavItem>Points: {{ points }}</NavItem>
            <NavItem>Score: {{ score.toFixed(2) }}</NavItem>
            <NavItem>Round: {{ round }}/5</NavItem>
        </NavBar>
        <InfoComponent class="end-stats" v-if="gameFinished">
            <InfoText variant="title">Game Over!</InfoText>
            <InfoText variant="body">
                Total Points: <strong>{{ totalPoints }}</strong> / {{ maxRounds * 100 }} <br>
                Total Time Taken: <strong>{{ totalTimeTaken.toFixed(2) }}</strong> seconds <br>
                Total Score: <strong>{{ totalScore.toFixed(2) }}</strong>
            </InfoText>

            <div class="end-stats-text">
                <InfoText variant="subtitle">Your Guesses</InfoText>
                <ul>
                    <li v-for="(guess, index) in guessHistory" :key="index">
                        <span :style="{ color: guess.roundColor }">
                            Round {{ guess.round }}
                        </span>:
                        <strong>{{ guess.points }} pts</strong>, Distance: {{ Math.round(guess.distance) }} blocks, in {{ finalGuessTime(guess.time) }} seconds
                        <br> &nbsp; &nbsp; &nbsp; &nbsp;
                        <span v-if="guess.score === -1" style="color: red; font-weight: bold;">
                            Guessing too fast!
                        </span>
                        <span v-else>Score: {{ guess.score.toFixed(2) }}</span>
                    </li>

                </ul>
            </div>
            <InfoText v-if="!hasDefaultSettings" variant="subtitle">You must have default settings to submit a score!</InfoText>
            <SettingInput
                v-else
                v-model="playerName"
                label="Save your score"
                placeholder="Enter your name..."
                button-text="Submit"
                @submit="submitScore"
                storage-key="username-setting"
                :hasSubmitted="hasSumbmitted"
                @input="cleanUsername"
            />
            <span v-if="isSubmitting" class="loading-dots" style="margin-top: 10px;">
                Submitting score<span class="dots"></span>
            </span>
            <span v-else style="margin-top: 10px;">{{ statusMessage }}</span>
            <NavBar class="restart-bar">
                <NavItem class="guess-item" @click="startGame">Restart Game</NavItem>
            </NavBar>
        </InfoComponent>
        <InfoComponent class="starter-info" v-if="!gameStarted">
            <InfoText variant="title">Welcome to Simps Geoguesser Season 2!</InfoText>
            <InfoText variant="body" class="credits">
                Developed by: <a href="https://github.com/BouncingElf10">BouncingElf10</a>  |  Images taken by: <a href="https://www.youtube.com/@tj_giggles/videos">TJ_Giggles</a>
            </InfoText>
            <InfoText variant="body"><a class="styled-link" href="https://github.com/BouncingElf10/simpsgeoguessers2" target="_blank"><br>If you liked this project make sure to give it a star on Github!</a></InfoText>
            <NavBar class="start-bar">
                <NavItem class="guess-item" @click="startGame">Start Game</NavItem>
            </NavBar>
        </InfoComponent>
        <transition name="fade">
            <InfoComponent v-if="isPopupOpen(popups.Settings)" class="settings-menu">
                <InfoText variant="title" class="settings-title">Settings</InfoText>

                <div class="settings-section">
                    <InfoText variant="subtitle">Game Options</InfoText>
                  <div v-if="!hasDefaultSettings" class="warning-box">
                    Warning: Custom settings are enabled. You must have default settings to submit scores!
                  </div>
                  <div class="settings-grid">
                        <SettingToggle v-model="hasTimer" label="Enable Timer" @update:modelValue="startGame" />
                        <SettingSlider v-model.number="countdownTimeSeconds" label="Countdown" :min="1" :max="10" @update:modelValue="startGame" />
                        <SettingSlider v-model.number="timeToGuessSeconds" label="Guess Time" :min="1" :max="60" @update:modelValue="startGame" />
                        <SettingSlider v-model.number="maxRounds" label="Rounds" :min="1" :max="20" @update:modelValue="startGame" />
                    </div>
                </div>

                <div class="settings-section">
                    <InfoText variant="subtitle">Fun Modes</InfoText>
                    <div class="settings-grid">
                        <SettingToggle v-model="blinkMode" v-if="hasTimer" label="Blink Mode" @update:modelValue="startGame" />
                        <SettingToggle v-model="blinkMode" v-else label="Blink Mode (needs timer on)" @update:modelValue="startGame" />
                        <SettingToggle v-model="invertedMode" label="Inverted Colors" @update:modelValue="startGame" />
                        <SettingToggle v-model="bwMode" label="Black & White" @update:modelValue="startGame" />
                        <SettingToggle v-model="pixelatedMode" label="Pixelated" @update:modelValue="startGame" />
                    </div>
                </div>

                <div class="settings-actions">
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="openPopup(popups.Legal)">Legal</NavItem>
                        <NavItem class="guess-item" @click="openPopup(popups.Credits)">Credits</NavItem>
                        <NavItem class="guess-item" @click="resetToDefaults(); startGame();">Reset To Defaults</NavItem>
                    </NavBar>
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="closePopup()">Close</NavItem>
                    </NavBar>
                </div>
            </InfoComponent>
        </transition>
        <transition name="fade">
            <InfoComponent v-if="isPopupOpen(popups.Legal)" class="settings-menu">
                <InfoText variant="title" class="settings-title">Legal</InfoText>

                <div class="settings-section">
                    <InfoText variant="subtitle"><b>Privacy Policy</b></InfoText>
                    <InfoText variant="body">
                        This website is a simple project of mine, and while I do not collect a lot of data, I do collect some.
                        <br>
                        <br><b>Information Collected:</b>
                        <br>&nbsp; &nbsp; • IP Address – collected only when you submit a score. Used to prevent things like spam, cheating, and offensive usernames.
                        <br>&nbsp; &nbsp; • Username, Score, Time, etc. etc. – whatever you type when submitting a score is saved to the leaderboard.
                        <br><b>How Information Is Used:</b>
                        <br>&nbsp; &nbsp; • IP addresses are checked to enforce bans and keep the leaderboard fair.
                        <br>&nbsp; &nbsp; • Usernames and scores are displayed publicly on the leaderboard.
                        <br>&nbsp; &nbsp; • No other personal data is collected.
                        <br><b>Sharing of Data:</b>
                        <br>&nbsp; &nbsp; • Your information is not sold, shared, or used for advertising.
                        <br>&nbsp; &nbsp; • Only me (BouncingElf10) can view and manage this data.
                        <br><b>Your Choices:</b>
                        <br>&nbsp; &nbsp; • If you don’t want your information collected, don’t submit a score.
                        <br>&nbsp; &nbsp; • If you submitted a score and want it removed, contact me (BouncingElf10).
                        <br>
                        <br>This privacy policy may change if the site’s features change. Updates will be posted here.
                    </InfoText>
                </div>

                <div class="settings-actions">
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="openPopup(popups.Settings)">Back</NavItem>
                    </NavBar>
                </div>
            </InfoComponent>
        </transition>
        <transition name="fade">
            <InfoComponent v-if="isPopupOpen(popups.Credits)" class="settings-menu">
                <InfoText variant="title" class="settings-title">Credits</InfoText>

                <div class="settings-section">
                    <InfoText variant="subtitle">Development</InfoText>
                    <InfoText variant="body">
                        <a class="styled-link" href="https://github.com/BouncingElf10" target="_blank">
                            BouncingElf10
                        </a> – Lead developer, game logic, and UI design
                    </InfoText>
                </div>

                <div class="settings-section">
                    <InfoText variant="subtitle">Map Images</InfoText>
                    <InfoText variant="body">
                        <a class="styled-link" href="https://www.youtube.com/@tj_giggles/videos" target="_blank">
                            TJ_Giggles
                        </a> – Helped me get the Minecraft screenshots
                    </InfoText>
                </div>

                <div class="settings-section">
                    <InfoText variant="subtitle">Special Thanks</InfoText>
                    <InfoText variant="body">
                        • SIMPS SMP community <3 <br>
                        • Vue.js <br>
                        • and prolly more
                    </InfoText>
                </div>

                <div class="settings-section">
                    <InfoText variant="subtitle">Project Links</InfoText>
                    <InfoText variant="body" class="credits">
                        <a class="styled-link" href="https://github.com/BouncingElf10/simpsgeoguessers2" target="_blank">
                            GitHub Repository
                        </a><br>
                        <a class="styled-link" href="https://github.com/BouncingElf10" target="_blank">
                            Developer Profile
                        </a>
                    </InfoText>
                </div>

                <div class="settings-actions">
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="openPopup(popups.Settings)">Back</NavItem>
                    </NavBar>
                </div>
            </InfoComponent>
        </transition>
        <transition name="fade">
            <InfoComponent v-if="isPopupOpen(popups.Layers)" class="settings-menu">
                <InfoText variant="title" class="settings-title">Maps</InfoText>

                <div class="settings-section">
                    <SettingDropdown
                        label="Map Selection"
                        :options="['SIMPS SMP Season 2', 'SIMPS SMP Season 1']"
                        v-model="selectedMap"
                        @update:modelValue="startGame"
                    />
                    <InfoText variant="body" class="credits">
                        <router-link to="/old" class="styled-link">Visit the Old Site</router-link>
                    </InfoText>
                </div>

                <div class="settings-actions">
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="closePopup()">Back</NavItem>
                    </NavBar>
                </div>
            </InfoComponent>
        </transition>
        <transition name="fade">
            <InfoComponent v-if="isPopupOpen(popups.Leaderboard)" class="leaderboard-panel settings-menu">
                <InfoText variant="title" class="settings-title">Leaderboard</InfoText>

                <div class="settings-section" style="margin-top: 0;">
                    <InfoText variant="subtitle">Season</InfoText>
                    <SettingDropdown
                        label="Season"
                        :options="['SIMPS SMP Season 2', 'SIMPS SMP Season 1']"
                        v-model="selectedLeaderboardSeason"
                        @update:modelValue="fetchLeaderboard"
                    />
                </div>

                <div class="settings-section" style="margin-top: 0; padding: 20px;">
                    <InfoText variant="subtitle">Top Players</InfoText>
                    <div v-if="loadingLeaderboard" class="leaderboard-loading">
                        Loading leaderboard...
                    </div>
                    <table v-else-if="leaderboard.length" class="styled-table" style="border-radius: 7px;">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Score</th>
                            <th>Points</th>
                            <th>Time</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(entry, idx) in leaderboard" :key="entry.username + entry.createdAt">
                            <td>{{ idx + 1 }}</td>
                            <td>{{ entry.username }}</td>
                            <td>{{ entry.score.toFixed(2) }}</td>
                            <td>{{ entry.points }}</td>
                            <td>{{ entry.totalTime.toFixed(1) }}s</td>
                        </tr>
                        </tbody>
                    </table>
                    <InfoText v-else variant="body">No scores yet for this season.</InfoText>
                </div>

                <div class="settings-actions">
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="closePopup()">Close</NavItem>
                    </NavBar>
                </div>
            </InfoComponent>
        </transition>

        <div class="debug-overlay" v-if="showDebug">
            <div v-for="(data, title) in debugSections" :key="title" class="debug-section">
                <h4>{{ title }}</h4>
                <ul>
                    <li v-for="(val, key) in data" :key="key">
                        <strong>{{ key }}:</strong> {{ val }}
                    </li>
                </ul>
            </div>
            <button @click="showDebug = false">
                If you ended up here on accident dont worry just click here to close the debug overlay
            </button>
        </div>

    </div>
</template>

<style scoped>
.leaderboard-loading {
    text-align: center;
    font-size: 1.1em;
    font-weight: 500;
    padding: 20px;
    color: #ffffff;
    animation: blink 1.5s infinite;
}

@keyframes blink {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0.5; }
}

.leaderboard-panel {
    background: rgba(0,0,0,0.75);
    color: #ffffff;
    border-radius: 16px;
    padding: 20px 30px;
    max-width: 80%;
    margin: 40px auto;
    font-family: 'Barlow', sans-serif;
}

.styled-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    overflow: hidden;
    font-family: 'Barlow', sans-serif;
}

.styled-table th,
.styled-table td {
    padding: 10px 12px;
    text-align: left;
}

.styled-table th {
    background: rgba(255,255,255,0.1);
    font-weight: 600;
}

.styled-table tr {
    transition: background 0.3s ease;
}

.styled-table tr:hover {
    background: rgba(255,255,255,0.1);
}

.settings-section {
    margin-top: 25px;
    padding: 20px;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    font-family: 'Barlow', sans-serif;
}

.loading-dots .dots::after {
    content: '';
    animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
    0%   { content: ''; }
    25%  { content: '.'; }
    50%  { content: '..'; }
    75%  { content: '...'; }
    100% { content: ''; }
}

.styled-link {
    color: #4da6ff;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease, text-decoration 0.3s ease;
}

.styled-link:hover {
    color: #82c6ff;
    text-decoration: underline;
}

.debug-overlay {
    position: absolute;
    top: 0;
    right: 0;
    background: rgba(0,0,0,0.85);
    color: lime;
    font-size: 12px;
    font-family: monospace;
    padding: 10px;
    max-width: 30%;
    max-height: 50%;
    overflow: auto;
    z-index: 99999;

    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.debug-section {
    border: 1px solid rgba(0,255,0,0.2);
    padding: 5px;
    border-radius: 6px;
    background: rgba(0,0,0,0.3);
}

.debug-section h4 {
    margin: 0 0 4px 0;
    font-size: 13px;
    color: #0f0;
}

.debug-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.settings-menu {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 70%;
    height: auto;
    max-height: 80%;
    overflow-y: auto;

    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 30px;
    border-radius: 16px;

    display: flex;
    flex-direction: column;
    gap: 20px;
}

.settings-title {
    text-align: center;
    margin-bottom: 10px;
}

.settings-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 15px 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  transition: all 0.3s ease-out;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px 20px;
    align-items: center;
}

.warning-box {
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.4);
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
  color: #ff4444;
  font-weight: 500;
  transform-origin: top;
  animation: warning-slide-down 0.3s ease-out;
}

@keyframes warning-slide-down {
  from {
    transform: scaleY(0);
    opacity: 0;
    margin-top: -40px;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
    margin-top: 10px;
  }
}

@media (orientation: portrait) {
    .navbar-list {
        display: flex;
        top: 0;
        bottom: auto !important;
        position: absolute;
        align-items: flex-end;
    }

    .guess-bar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: calc(100% - 60px) !important;
        margin: 0;
        z-index: 1000;
    }

    .small-guess-bar {
        width: calc(100% - 60px) !important;
        font-size: 0.9em;
        opacity: 0.9;
    }

}

.settings-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.settings-bar {
    width: calc(100% - 10px);
    gap: 5px;
    margin: 0;
    justify-content: center;
}

.fade-enter-active, /* THEY ARE BEING USED */
.fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translate(-50%, -45%);
}

.map-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.background-map {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}

.map-wrapper img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.vignette { /* THEY ARE BEING USED */
    box-shadow: inset 0 0 200px rgba(255, 0, 0, 0.7);
    transition: box-shadow 5s linear;
}
.vignette-out { /* THEY ARE BEING USED */
    box-shadow: none !important;
    transition: none !important;
}

.no-transition {
    transition: none !important;
}

.map-effects {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    transition: all 0.5s ease;
}

.map-blur {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    backdrop-filter: blur(0px);
    -webkit-filter: grayscale(0%);
    filter: grayscale(0%);
    transition: all 0.5s ease;
}

.map-blur.activesmooth {
    backdrop-filter: blur(96px);
    -webkit-filter: grayscale(100%);
    filter: grayscale(100%);
    transition: all 0.5s ease;
}

.map-blur.active {
    backdrop-filter: blur(96px);
    -webkit-filter: grayscale(100%);
    filter: grayscale(100%);
    transition: none;
}

.restart-bar {
    margin: 10px 0 0;
    position: static;
    width: calc(100% - 15px);
    justify-content: center;
    gap: 10px;
}

.end-stats {
    position: absolute;
    left: 0;
    margin: 15px;
    z-index: 20000;
    height: fit-content;
    width: 30%;
    padding: 15px;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.start-bar {
    bottom: 0;
    position: absolute;
    width: calc(100% - 15px * 3);
    margin: 15px;
    justify-content: center;
}

.credits a {
    color: #4da6ff;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease, text-decoration 0.3s ease;
}

.credits a:hover {
    color: #82c6ff;
    text-decoration: underline;
}

.starter-info {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 50%;
    height: 50%;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 30px;

    display: flex;
    justify-content: center;
    align-items: center;
}

@media (orientation: portrait) {
    .starter-info {
        width: 85%;
        height: 60%;
        padding: 20px;
    }

    .starter-info :deep(.info-title) {
        font-size: 2em;
        line-height: 1.2;
    }

    .starter-info :deep(.info-body) {
        font-size: 0.9em;
        line-height: 1.4;
    }
}

.stats-navbar {
    position: absolute;
    bottom: 0;
}

@media (orientation: portrait) {
    .stats-navbar {
        position: fixed;
        bottom: 80px;
        height: auto !important;
        margin: 0 20px 0 20px;
        transform: scale(0.5) translate(calc(-50% + 5px), 50%);
    }
}

.fullscreen-bar {
    opacity: 1 !important;
    z-index: 10000 !important;
}
.not-fullscreen-bar {
    opacity: 0;
    z-index: -9999;
}

@media screen and (orientation: landscape) and (max-height: 450px) {
    .normal-wrapper {
        opacity: 1 !important;
        width: 100% !important;
        height: 100% !important;
    }
    .normal-wrapper:hover {
        opacity: 1;
        width: 100% !important;
        height: 100% !important;
    }
}

.normal-wrapper {
    opacity: 0.5;
    width: 100%;
    height: 300px;
    position: relative;
    overflow: hidden;
    display: block;
    margin: 5px 5px 0 5px;
    border-radius: 12px;
    bottom: 0;
    right: 0;
    transition:
        opacity 0.2s ease,
        width 0.2s ease,
        height 0.2s ease;
}

.normal-wrapper:hover {
    opacity: 1;
    height: 500px;
    width: 200%;
    transition-delay: 0s, 0s, 0s;
}

.normal-wrapper:not(:hover) {
    transition-delay: 0s, 0.2s, 0.2s;
}

@media (orientation: portrait) {
    .navtopbar-list {
        display: flex;
        top: 0;
        position: absolute;
        align-items: flex-start;
        justify-content: flex-end !important;
    }

    .normal-wrapper {
    opacity: 1;
    width: 100%;
    height: 50vh;
    margin: 0;
    border-radius: 0;
    position: fixed;
    bottom: 0;
    left: 0;
  }

  .normal-wrapper:hover {
    height: 50vh;
    width: 100%;
  }
}

.fullscreen-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
}

@media (orientation: landscape) {

}

@media (orientation: portrait) {
  .fullscreen-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
  }
}

.navtopbar-list {
    display: flex;
    top: 0;
    position: absolute;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    transition: all 0.3s ease;
}
.navbar-list {
    display: flex;
    bottom: 0;
    position: absolute;
    align-items: flex-end;
}

.guess-bar {
    margin-right: 5px;
    width: calc(100% - 15px);
  z-index: 1000;
}
.guess-item {
    width: 100%;
}
.guess-item-timer {
    width: 70%;
}
.timer-item {
    width: 30%;
}
.guess-item[disabled],
.guess-item.disabled {
    pointer-events: none;
    opacity: 0.5;
    background-color: #888;
}
</style>

<style>
*::-webkit-scrollbar {
    display: none;
}
* {
    scrollbar-width: none;
    -ms-overflow-style: none;
}
</style>
