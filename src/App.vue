<script setup>
import {nextTick, ref} from "vue";

import NavBar from "@/components/NavBar.vue";
import NavItem from "@/components/NavItem.vue";
import MapBar from "@/components/MapBar.vue";
import MapImage from "@/components/MapImage.vue";
import Icon from "@/assets/internal/returnarrow.svg";
import PlacesJson from "@/assets/places.json";
import Map from "@/components/Map.vue";
import InfoComponent from "@/components/InfoComponent.vue";
import InfoText from "@/components/InfoText.vue";

const mapImageRef = ref(null);
const mapRef = ref(null);

const alignmentData = {mapX: 796, mapY: 656, mcX: 169, mcY: 48}
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
const distance = ref(0)
const maxRounds = 5;

const isFullscreen = ref(false);
const isFinished = ref(false);
const gameStarted = ref(false);
const gameFinished = ref(false);

function startGame() {
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
    if (isFinished.value) {
        gameFinished.value = true;
        if (continueButonName.value === "Restart") {
            startGame()
        }
        mapRef.value.clearMap()
        mapRef.value.showAllMarkers(guessHistory.value, maxRounds)
        mapRef.value.defaultBounds()

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
    mapRef.value.defaultBounds()
}

function placedGuess() {
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

    calculatePoints(alignedCurrentCoords, alignedGuessCoords)
    totalPoints.value += points.value;
    guessHistory.value.push({
        guessCoords: alignedGuessCoords,
        currentCoords: alignedCurrentCoords,
        points: points.value,
        distance: distance.value,
        round: round.value,
        roundColor: mapRef.value.getColorFromRound(round.value, maxRounds)
    })

    setTimeout(() => {
        mapRef.value.showCorrectMarker(alignedCurrentCoords, alignedGuessCoords, round.value, maxRounds);
    }, 50);

    if (round.value >= maxRounds) {
        isFinished.value = true;
        continueButonName.value = "Finish"
    }
}

function calculatePoints(currentCoords, guessCoords) {
    const xDiff = Math.abs(currentCoords.x - guessCoords.x)
    const yDiff = Math.abs(currentCoords.y - guessCoords.y)
    distance.value = Math.sqrt(xDiff * xDiff + yDiff * yDiff)
    points.value = clamp(Math.round(100 - (distance.value / 100) * 100), 0, 100)
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
    console.log("Clicked coords in parent:", guessCoords.value)
}

function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}
</script>

<template>
    <MapImage :imageId="currentId" ref="mapImageRef">
        <div class="navbar-list">
            <NavBar>
                <NavItem @click="startGame">
                    <Icon class="return-icon" width="32" height="32" />
                </NavItem>
            </NavBar>
            <NavBar>
                <NavItem>Second Item</NavItem>
                <NavItem>Third Item</NavItem>
                <NavItem>yeeah Item</NavItem>
            </NavBar>
        </div>
        <div class="navtopbar-list">
            <NavBar>
                <NavItem>Second Item</NavItem>
                <NavItem>Third Item</NavItem>
                <NavItem>yeeah Item</NavItem>
            </NavBar>
        </div>
        <MapBar>
            <div :class="{ 'fullscreen-wrapper': isFullscreen, 'normal-wrapper': !isFullscreen }">
                <Map @map-click="handleMapClick" ref="mapRef"/>
            </div>
            <NavBar class="guess-bar">
                <NavItem
                    class="guess-item"
                    @click="placedGuess"
                    :class="{ disabled: !guessCoords.x && !guessCoords.y }"
                    :disabled="!guessCoords.x && !guessCoords.y">
                    Guess
                </NavItem>
            </NavBar>
        </MapBar>
        <MapBar :class="{ 'fullscreen-bar': isFullscreen }" class="not-fullscreen-bar">
            <NavBar class="guess-bar">
                <NavItem
                    class="guess-item"
                    @click="continueGame">
                    {{ continueButonName }}
                </NavItem>
            </NavBar>
        </MapBar>
        <NavBar :class="{ 'fullscreen-bar': isFullscreen, 'not-fullscreen-bar': !isFullscreen }" class="stats-navbar" v-if="!gameFinished">
            <NavItem>Distance: {{ Math.round(distance) }} blocks</NavItem>
            <NavItem>Points: {{ points }}</NavItem>
            <NavItem>Round: {{ round }}/5</NavItem>
        </NavBar>
        <InfoComponent class="end-stats" v-if="gameFinished">
            <InfoText variant="title">Game Over!</InfoText>
            <InfoText variant="body">
                Final Score: <strong>{{ totalPoints }}</strong> / {{ maxRounds * 100 }}
            </InfoText>

            <div class="guess-history">
                <InfoText variant="subtitle">Your Guesses</InfoText>
                <ul>
                    <li v-for="(guess, index) in guessHistory" :key="index">
                        <span :style="{ color: guess.roundColor }">
                            Round {{ guess.round }}
                        </span>:
                        <strong>{{ guess.points }} pts</strong>, Distance: {{ Math.round(guess.distance) }} blocks
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
    </MapImage>
</template>

<style scoped>
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
.return-icon {
    fill: white;
}
.guess-bar {
    margin-right: 5px;
    width: calc(100% - 15px);
}
.guess-item {
    width: 100%;
}
.guess-item[disabled],
.guess-item.disabled {
    pointer-events: none;
    opacity: 0.5;
    background-color: #888;
}
</style>
