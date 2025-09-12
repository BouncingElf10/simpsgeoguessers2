<script setup>
import { ref } from "vue";

// Components
import NavBar from "@/components/NavBar.vue";
import NavItem from "@/components/NavItem.vue";
import MapBar from "@/components/MapBar.vue";
import MapImage from "@/components/MapImage.vue";
import Icon from "@/assets/internal/returnarrow.svg";
import PlacesJson from "@/assets/places.json";

const mapImageRef = ref(null);

const currentCoords = ref({})
const currentId = ref(0)
const currentPlaceName = ref("")

function startGame() {
    getRandomPlace()
}

function getRandomPlace() {
    const randomIndex = Math.floor(Math.random() * PlacesJson.length);
    const randomPlace = PlacesJson[randomIndex];
    currentId.value = randomPlace.id
    currentCoords.value = randomPlace.coords
    currentPlaceName.value = randomPlace.name
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
        <MapBar />
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
</style>
