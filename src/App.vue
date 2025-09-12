<script setup>
import { ref } from "vue";

import NavBar from "@/components/NavBar.vue";
import NavItem from "@/components/NavItem.vue";
import MapBar from "@/components/MapBar.vue";
import MapImage from "@/components/MapImage.vue";
import Icon from "@/assets/internal/returnarrow.svg";
import PlacesJson from "@/assets/places.json";
import Map from "@/components/Map.vue";

const mapImageRef = ref(null);
const mapRef = ref(null);

const alignmentData = {mapX: 796, mapY: 656, mcX: 169, mcY: 48}
const offset = {x: 796 - 169, y: 656 - 48}

const currentCoords = ref({})
const guessCoords = ref({})
const currentId = ref(0)
const currentPlaceName = ref("")
const round = ref(0)
const isFullscreen = ref(false);

function startGame() {
    continueGame()
}

function continueGame() {
    getRandomPlace()
    round.value++
    isFullscreen.value = false;
    setTimeout(() => {
        mapRef.value?.invalidateSize?.()
    }, 50);
    guessCoords.value = {}
}

function placedGuess() {
    isFullscreen.value = true;
    if (!currentCoords.value?.x || !currentCoords.value?.y) {
        console.warn("No current place selected yet");
        return;
    }
    mapRef.value.showCorrectMarker({
        x: currentCoords.value.x + offset.x,
        y: (offset.y - currentCoords.value.y) + alignmentData.mcY * 2
        }, {
        x: guessCoords.value.x + offset.x,
        y: (offset.y - guessCoords.value.y) - alignmentData.mcY * 2
        });
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
            <Map @map-click="handleMapClick" ref="mapRef" :class="{ 'fullscreen-map': isFullscreen, 'map': !isFullscreen }"/>
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
                    Continue
                </NavItem>
            </NavBar>
        </MapBar>
    </MapImage>
</template>

<style scoped>
.fullscreen-bar {
    opacity: 1 !important;
    z-index: 10000 !important;
}
.not-fullscreen-bar {
    opacity: 0;
    z-index: -9999;
}

.fullscreen-map {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999 !important;
    border-radius: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    opacity: 1 !important;
    transition: none !important;
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
