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
import PlacesJson from "@/assets/maps/simps2/places.json";
import Map from "@/components/Map.vue";
import InfoComponent from "@/components/InfoComponent.vue";
import InfoText from "@/components/InfoText.vue";
import SettingToggle from "@/components/SettingToggle.vue";
import SettingSlider from "@/components/SettingSlider.vue";
import SettingDropdown from "@/components/SettingDropdown.vue";

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

const DEFAULT_SETTINGS = {
    hasTimer: true,
    blinkMode: false,
    invertedMode: false,
    bwMode: false,
    pixelatedMode: false,
    selectedMap: "SIMPS SMP Season 2",
    showDebug: false,
    countdownTimeSeconds: 3,
    timeToGuessSeconds: 30,
    maxRounds: 5,
};
const SETTINGS_KEY = "simps_geoguesser_settings";

function saveSettings() {
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
    selectedMap.value = DEFAULT_SETTINGS.selectedMap;
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
    Layers: 3
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

async function getRandomPlace(selectedMapId) {
    const PlacesJson = await import(
        new URL(`./assets/maps/simps${selectedMapId}/places.json`, import.meta.url)
        ).then(m => m.default);

    const randomIndex = Math.floor(Math.random() * PlacesJson.length);
    // const randomIndex = 0
    const randomPlace = PlacesJson[randomIndex];

    currentId.value = randomPlace.id;
    currentCoords.value = {
        x: randomPlace.coords[0],
        y: randomPlace.coords[1],
    };
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
    if (distance.value <= 10) {
        points.value = 100;
    } else {
        points.value = Math.max(0, Math.floor(100 - distance.value));
    }
    const maxBonus = 2;
    const bonus = 1 + (maxBonus - 1) * Math.exp(-timeTaken);
    score.value = points.value * bonus / 2;
    if (score.value > 90) {
        score.value = -1;
    }
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
        JSON: localStorage.getItem(SETTINGS_KEY),
    }
}));


onMounted(() => {
    loadSettings();
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
    <MapImage :imageId="currentId" :mapId="selectedMapId" ref="mapImageRef"
              :pixelated="pixelatedMode" :inverted="invertedMode" :bw="bwMode" :blink="blinkActive"
              :class="[tenSecondsLeft && gameStarted && !gameFinished && hasTimer ? 'vignette' : 'vignette-out']">
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
            <NavBar>
                <NavItem>
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
            <NavBar class="guess-bar">
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

            <NavBar class="restart-bar">
                <NavItem class="guess-item" @click="startGame">Restart Game</NavItem>
            </NavBar>
        </InfoComponent>
        <InfoComponent class="starter-info" v-if="!gameStarted">
            <InfoText variant="title">Welcome to Simps Geoguesser Season 2!</InfoText>
            <InfoText variant="body" class="credits">
                Developed by: <a href="https://github.com/BouncingElf10">BouncingElf10</a>  |  Images taken by: <a href="https://www.youtube.com/@tj_giggles/videos">TJ_Giggles</a>
            </InfoText>
            <NavBar class="start-bar">
                <NavItem class="guess-item" @click="startGame">Start Game</NavItem>
            </NavBar>
        </InfoComponent>
        <transition name="fade">
            <InfoComponent v-if="isPopupOpen(popups.Settings)" class="settings-menu">
                <InfoText variant="title" class="settings-title">Settings</InfoText>

                <div class="settings-section">
                    <InfoText variant="subtitle">Game Options</InfoText>
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
                    <InfoText variant="body">
                        blah blah blah legal stuff goes here
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
                <InfoText variant="title" class="settings-title" @click="showDebug = true">Credits</InfoText>

                <div class="settings-section">
                    <InfoText variant="body">
                        Developed by <a href="https://github.com/BouncingElf10">BouncingElf10</a><br>
                        Images by <a href="https://www.youtube.com/@tj_giggles/videos">TJ_Giggles</a>
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

    </MapImage>
</template>

<style scoped>

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
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px 20px;
    align-items: center;
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
    position: absolute;
    bottom: 13px;
    width: calc(100% - 15px * 3.5);
}

.end-stats {
    position: absolute;
    left: 0;
    margin: 15px;
    z-index: 20000;
    height: fit-content;
    width: 30%;
    padding: 15px;
}
.end-stats-text {
    margin-bottom: 60px;
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

    width: 40%;
    height: 40%;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 30px;

    display: flex;
    justify-content: center;
    align-items: center;
}


.stats-navbar {
    position: absolute;
    bottom: 0;
}

.fullscreen-bar {
    opacity: 1 !important;
    z-index: 10000 !important;
}
.not-fullscreen-bar {
    opacity: 0;
    z-index: -9999;
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

.fullscreen-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
}

.navtopbar-list {
    display: flex;
    top: 0;
    position: absolute;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
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
