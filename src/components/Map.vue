<script setup lang="ts">
    import L from "leaflet"
    import {computed, defineProps, nextTick, onMounted, ref, watch} from "vue";

    const props = defineProps({
        alignmentData: Object,
        offset: Object,
        mapToMc: Function,
        mcToMap: Function,
        mapId: Number
    });

    const emit = defineEmits<{
        (e: "map-click", coords: { x: number; y: number }): void
    }>()
    let map = ref<L.Map>()
    let guessMarker = ref<L.Marker>()

    const imageBounds = computed(() => {
        if (props.mapId === 1) {
            return [[0, 0], [5632, 6144]];
        } else if (props.mapId === 2) {
            return [[0, 0], [4096, 4096]];
        }
        return [[0, 0], [5632, 6144]];
    });

    const locked = ref(true)
    const mousePos = ref({x: 0, y: 0})

    const imageUrl = computed(() =>
        new URL(`../assets/maps/simps${props.mapId}/map.png`, import.meta.url).href
    )
    let imageOverlay: L.ImageOverlay | null = null;

    onMounted(() => {
        const { m, overlay } = initMap();
        map.value = m;
        imageOverlay = overlay;
    });

    function initMap() {
        const m = L.map("map", {
            attributionControl: false,
            crs: L.CRS.Simple,
            minZoom: -3,
            maxZoom: 4,
            zoom: 0,
        });

        const overlay = L.imageOverlay(imageUrl.value, imageBounds.value).addTo(m);
        m.fitBounds(imageBounds.value);

        const coordsControl = L.control({ position: "topright" });
        coordsControl.onAdd = function () {
            const div = L.DomUtil.create("div", "coords-display");
            div.innerHTML = "x: -, y: -";
            return div;
        };
        coordsControl.addTo(m);

        m.on("mousemove", (e) => {
            const coordsDiv = document.querySelector(".coords-display");
            if (coordsDiv) {
                const mcCoords = e.latlng;
                mousePos.value = props.mapToMc(mcCoords.lng, mcCoords.lat, props.alignmentData);
                coordsDiv.innerHTML = `x: ${mousePos.value.x.toFixed(0)}, y: ${mousePos.value.y.toFixed(0)}`;
            }
        });

        m.on("zoomend", () => {
            const currentZoom = m.getZoom();
            const imageLayers = document.querySelectorAll(".leaflet-image-layer");
            imageLayers.forEach((img) => {
                (img as HTMLElement).style.imageRendering = currentZoom >= 1 ? "pixelated" : "auto";
            });
        });

        const mapElement = document.getElementById("map");
        if (mapElement) {
            const resizeObserver = new ResizeObserver(() => {
                try {
                    m.invalidateSize();
                } catch (e) {

                }
            });
            resizeObserver.observe(mapElement);
        }

        m.on("click", (e) => {
            if (locked.value) return;
            if (guessMarker.value) {
                guessMarker.value.setLatLng(e.latlng);
            } else {
                guessMarker.value = L.marker(e.latlng).addTo(m);
            }
            emit("map-click", { x: e.latlng.lng, y: e.latlng.lat });
        });

        return { m, overlay };
    }

    watch(() => props.mapId, async () => {
        if (map.value) {
            map.value.remove();
            map.value = undefined;
            guessMarker.value = undefined;
        }

        await nextTick();

        const { m, overlay } = initMap();
        map.value = m;
        imageOverlay = overlay;
    });

    function getColorFromRound(round: number, maxRounds: number): string {
        if (!maxRounds || isNaN(round) || isNaN(maxRounds)) {
            return "hsl(0, 0%, 50%)";
        }
        const ratio = Math.max(0, Math.min(1, round / maxRounds));
        const hue = ratio * 360;
        return `hsl(${hue}, 100%, 50%)`;
    }

    function showCorrectMarker(correctGuess, actualGuess, round: number, maxRound: number) {
        if (!map.value) return;

        map.value.whenReady(() => {
            const color = getColorFromRound(round, maxRound);
            const flagIcon = L.divIcon({
                html: `
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 21V3.90002C5 3.90002 5.875 3 8.5 3C11.125 3 12.875 4.8 15.5 4.8C18.125 4.8 19 3.9 19 3.9V14.7C19 14.7 18.125 15.6 15.5 15.6C12.875 15.6 11.125 13.8 8.5 13.8C5.875 13.8 5 14.7 5 14.7" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    `,
                className: "",
                iconSize: [32, 32],
                iconAnchor: [5, 22],
            });
            L.marker([correctGuess.y, correctGuess.x], { icon: flagIcon }).addTo(map.value!);
            L.polyline(
                [[actualGuess.y, actualGuess.x], [correctGuess.y, correctGuess.x]],
                { color, weight: 3 }
            ).addTo(map.value!);
            const bounds = L.latLngBounds([[actualGuess.y, actualGuess.x], [correctGuess.y, correctGuess.x]]);
            map.value!.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
        });
    }

    function clearMap() {
        map.value?.eachLayer((layer) => {
            if (layer instanceof L.TileLayer || layer instanceof L.ImageOverlay) return;
            map.value?.removeLayer(layer);
        });
        guessMarker.value = undefined;
    }

    function defaultBounds() {
        map.value!.fitBounds(imageBounds.value, { padding: [50, 50], maxZoom: 4 });
    }

    function showAllMarkers(guessHistory, maxRounds: number) {
        for (const guess of guessHistory) {
            const mapGuessCoords = props.mcToMap(guess.guessCoords.x, guess.guessCoords.y, props.alignmentData);
            L.marker([mapGuessCoords.y, mapGuessCoords.x]).addTo(map.value!);

            const mapCurrentCoords = props.mcToMap(guess.currentCoords.x, guess.currentCoords.y, props.alignmentData);
            const mapGuessCoordsForCorrect = props.mcToMap(guess.guessCoords.x, guess.guessCoords.y, props.alignmentData);
            showCorrectMarker(mapCurrentCoords, mapGuessCoordsForCorrect, guess.round, maxRounds);
        }
    }



    function lockMap(shouldLock: boolean) {
        locked.value = shouldLock
    }

    function showTempMarker(coords) {
        if (guessMarker.value) {
            guessMarker.value.setLatLng([coords.lat, coords.lng])
        } else {
            guessMarker.value = L.marker([coords.lat, coords.lng]).addTo(map.value!)
        }
    }

    function getMousePos() {
        return mousePos.value
    }

    defineExpose({ showCorrectMarker, clearMap, defaultBounds, showAllMarkers, lockMap, getColorFromRound, showTempMarker, getMousePos})
</script>

<template>
    <div id="map" class="map">

    </div>
</template>

<style scoped>
.map {
    background-color: #000000;
    height: 100%;
    width: 100%;
}
:deep(.coords-display) { /* ITS BEING USED */
    width: auto;
    display: flex;
    color: #ffffff;
    background: rgba(32, 32, 32, 0.44);
    border: 2px solid rgba(32, 32, 32, 0.44);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    padding: 5px 10px;
    justify-content: center;
    align-items: center;
    font-size: 15px;
    font-family: "Barlow", sans-serif;
    font-weight: 500;
    font-style: normal;
    line-height: normal;
    vertical-align: middle;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
</style>