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

const currentCoords = ref({})
const guessCoords = ref({})
const currentId = ref(0)
const currentPlaceName = ref("")

const offset = {x: 796 - 169, y: 656 - 48}

function startGame() {
    getRandomPlace()
}

function placedGuess() {

}

function getRandomPlace() {
    const randomIndex = Math.floor(Math.random() * PlacesJson.length);
    const randomPlace = PlacesJson[randomIndex];
    currentId.value = randomPlace.id
    currentCoords.value = randomPlace.coords
    currentPlaceName.value = randomPlace.name
}

function handleMapClick(coords) {
    guessCoords.value = {x: Math.floor(coords.x) - offset.x, y: Math.floor(coords.y) - offset.y}
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
            <Map @map-click="handleMapClick" />
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
    </MapImage>
</template>

<style scoped>
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
