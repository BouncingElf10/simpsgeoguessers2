<script setup>
import {nextTick, onMounted, onUnmounted, ref} from "vue";

import NavBar from "@/components/NavBar.vue";
import NavItem from "@/components/NavItem.vue";
import MapBar from "@/components/MapBar.vue";
import MapImage from "@/components/MapImage.vue";
import ReturnIcon from "@/assets/internal/returnarrow.svg";
import LayersIcon from "@/assets/internal/layers.svg";
import LeaderboardIcon from "@/assets/internal/leaderboard.svg";
import SettingsIcon from "@/assets/internal/settings.svg";
import PlacesJson from "@/assets/places.json";
import Map from "@/components/Map.vue";
import InfoComponent from "@/components/InfoComponent.vue";
import InfoText from "@/components/InfoText.vue";
import SettingToggle from "@/components/SettingToggle.vue";
import SettingSlider from "@/components/SettingSlider.vue";

const mapImageRef = ref(null);
const mapRef = ref(null);

const alignmentData = {mapX: 796, mapY: 656, mcX: 169, mcY: 48} // also in Map.vue
const offset = {x: 796 - 169, y: 656 - 48}

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
const timeToGuessSeconds = ref(14);
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
const showSettings = ref(false);

const blinkMode = ref(false)
const invertedMode = ref(false)
const bwMode = ref(false)
const pixelatedMode = ref(false)
const showLegal = ref(false)
const showCredits = ref(false)
function openLegal() {
    showLegal.value = true
    showSettings.value = false
}
function openCredits() {
    showCredits.value = true
    showSettings.value = false
}

function toggleSettings() {
    showSettings.value = !showSettings.value;
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
    getRandomPlace()
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
    const alignedCurrentCoords = {
        x: currentCoords.value.x + offset.x,
        y: (offset.y - currentCoords.value.y) + alignmentData.mcY * 2
    }
    const alignedGuessCoords = {
        x: guessCoords.value.x + offset.x,
        y: (offset.y - guessCoords.value.y) - alignmentData.mcY * 2
    }
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
        mapRef.value.showCorrectMarker(alignedCurrentCoords, alignedGuessCoords, round.value, maxRounds.value);
    }, 50);

    if (round.value >= maxRounds.value) {
        isFinished.value = true;
        continueButonName.value = "Finish"
    }
}

function startCountdown(seconds) {
    countdown.value = seconds
    countdownInterval = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            clearInterval(countdownInterval)
            restartTimer()
        }
    }, 1000)
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

    endTime = performance.now() + timeToGuessSeconds.value * 1000

    timerInterval = setInterval(() => {
        const now = performance.now()
        const remaining = Math.max(0, (endTime - now) / 1000)
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

function getRandomPlace() {
    const randomIndex = Math.floor(Math.random() * PlacesJson.length);
    const randomPlace = PlacesJson[randomIndex];

    currentId.value = randomPlace.id;
    currentCoords.value = {
        x: randomPlace.coords[0],
        y: randomPlace.coords[1],
    };
    currentPlaceName.value = randomPlace.name;
}

function handleMapClick(coords) {
    guessCoords.value = {
        x: Math.floor(coords.x) - offset.x,
        y: (offset.y - Math.floor(coords.y)) - alignmentData.mcY * 2
    }
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
            guessCoords.value = {
                x: Math.floor(mouse.lng) - offset.x,
                y: (offset.y - Math.floor(mouse.lat)) - alignmentData.mcY * 2
            };
            mapRef.value.showTempMarker(mouse);
        } else {
            placedGuess();
        }
    }
}

onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
    <MapImage :imageId="currentId" ref="mapImageRef"
               :class="[tenSecondsLeft && gameStarted && !gameFinished ? 'vignette' : 'vignette-out']">
        <div
            class="map-blur"
            :class="{ active: (countdown > 0 && gameStarted && !gameFinished), activesmooth: timer <= 0}">
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
                <NavItem>
                    <LayersIcon width="32" height="32"/>
                </NavItem>
                <NavItem @click="toggleSettings">
                    <SettingsIcon width="32" height="32"/>
                </NavItem>
            </NavBar>
        </div>
        <MapBar>
            <div :class="{ 'fullscreen-wrapper': isFullscreen, 'normal-wrapper': !isFullscreen }">
                <Map @map-click="handleMapClick" ref="mapRef"/>
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
                Total Points: <strong>{{ totalPoints }}</strong> / {{ maxRounds.value * 100 }} <br>
                Total Time Taken: <strong>{{ totalTimeTaken.toFixed(2) }}</strong> seconds <br>
                Total Score: <strong>{{ totalScore.toFixed(2) }}</strong>
            </InfoText>

            <div class="guess-history">
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
            <InfoComponent v-if="showSettings" class="settings-menu">
                <InfoText variant="title">Settings</InfoText>

                <SettingToggle v-model="hasTimer" label="Enable Timer" @update:modelValue="startGame" />
                <SettingSlider v-model.number="countdownTimeSeconds" label="Countdown" :min="1" :max="10" @update:modelValue="startGame" />
                <SettingSlider v-model.number="timeToGuessSeconds" label="Guess Time" :min="1" :max="60" @update:modelValue="startGame" />

                <SettingSlider v-model.number="maxRounds" label="Rounds" :min="1" :max="20" @update:modelValue="startGame" />

                <InfoText variant="subtitle">Fun Modes</InfoText>
                <SettingToggle v-model="blinkMode" label="Blink Mode" @update:modelValue="startGame" />
                <SettingToggle v-model="invertedMode" label="Inverted Colors" @update:modelValue="startGame" />
                <SettingToggle v-model="bwMode" label="Black & White" @update:modelValue="startGame" />
                <SettingToggle v-model="pixelatedMode" label="Pixelated" @update:modelValue="startGame" />

                <div class="settings-actions">
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="openLegal">Legal</NavItem>
                        <NavItem class="guess-item" @click="openCredits">Credits</NavItem>
                    </NavBar>
                    <NavBar class="settings-bar">
                        <NavItem class="guess-item" @click="showSettings = false">Close</NavItem>
                    </NavBar>
                </div>
            </InfoComponent>
        </transition>
        <transition name="fade">
            <InfoComponent v-if="showLegal" class="settings-menu">
                <InfoText variant="title">Legal</InfoText>
                <InfoText variant="body">
                    blah blah blah legal stuff goes here
                </InfoText>
                <NavBar class="restart-bar">
                    <NavItem class="guess-item" @click="showLegal = false">Back</NavItem>
                </NavBar>
            </InfoComponent>
        </transition>
        <transition name="fade">
            <InfoComponent v-if="showCredits" class="settings-menu">
                <InfoText variant="title">Credits</InfoText>
                <InfoText variant="body">
                    Developed by <a href="https://github.com/BouncingElf10">BouncingElf10</a>
                    Images by <a href="https://www.youtube.com/@tj_giggles/videos">TJ_Giggles</a>
                </InfoText>
                <NavBar class="restart-bar">
                    <NavItem class="guess-item" @click="showCredits = false">Back</NavItem>
                </NavBar>
            </InfoComponent>
        </transition>
    </MapImage>
</template>

<style scoped>

.settings-bar {
    width: calc(100% - 15px * 3.5);
}

.settings-actions {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.settings-menu {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 75%;
    height: 75%;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 30px;

    display: flex;
    justify-content: center;
    align-items: center;
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
    height: calc(100% - 15px * 4);
    width: 30%;
    padding: 15px;
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
