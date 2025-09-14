<script setup lang="ts">
    import L from "leaflet"
    import {defineProps, onMounted, ref} from "vue";

    const emit = defineEmits<{
        (e: "map-click", coords: { x: number; y: number }): void
    }>()
    let map = ref<L.Map>()
    let guessMarker = ref<L.Marker>()
    const imageBounds = [[0, 0], [1544, 1555]]
    const locked = ref(true)

    onMounted(() => {
        map.value = L.map("map", {
            attributionControl: false,
            crs: L.CRS.Simple,
            minZoom: -1,
            maxZoom: 4,
            zoom: 0,
        })
        const imageUrl = new URL(`../assets/map.png`, import.meta.url).href

        L.imageOverlay(imageUrl, imageBounds).addTo(map.value)
        map.value.fitBounds(imageBounds)

        map.value.on("zoomend", () => {
            const currentZoom = map.value.getZoom()
            const imageLayers = document.querySelectorAll(".leaflet-image-layer")

            imageLayers.forEach((img) => {
                if (currentZoom >= 1) {
                    (img as HTMLElement).style.imageRendering = "pixelated"
                } else {
                    (img as HTMLElement).style.imageRendering = "auto"
                }
            })
        })

        const mapElement = document.getElementById("map")
        if (mapElement) {
            const resizeObserver = new ResizeObserver(() => {
                map.value?.invalidateSize()
            })
            resizeObserver.observe(mapElement)
        }

        function onMapClick(e) {
            if (locked.value) {
                return;
            }
            if (guessMarker.value) {
                guessMarker.value.setLatLng(e.latlng)
            } else {
                guessMarker.value = L.marker(e.latlng).addTo(map.value!)
            }
            emit("map-click", { x: e.latlng.lng, y: e.latlng.lat })
        }
        map.value.on("click", onMapClick)
    })

    function getColorFromRound(round: number, maxRounds: number): string {
        if (!maxRounds || isNaN(round) || isNaN(maxRounds)) {
            return "hsl(0, 0%, 50%)";
        }
        const ratio = Math.max(0, Math.min(1, round / maxRounds));
        const hue = ratio * 360;
        return `hsl(${hue}, 100%, 50%)`;
    }

    function showCorrectMarker(correctGuess, actualGuess, round: number, maxRound: number) {
        const color = getColorFromRound(round, maxRound);
        const flagIcon = L.divIcon({
            html: `
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 0v28" stroke="black" stroke-width="3.5" fill="none"/>
                        <path d="M8 2h14l-2 6 2 6H8" stroke="black" stroke-width="2" fill="${color}"/>
                    </svg>
                `,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [6, 28],
        });
        L.marker([correctGuess.y, correctGuess.x], { icon: flagIcon }).addTo(map.value!);
        L.polyline(
            [[actualGuess.y, actualGuess.x], [correctGuess.y, correctGuess.x]],
            { color, weight: 3 }
        ).addTo(map.value!);
        const bounds = L.latLngBounds([[actualGuess.y, actualGuess.x], [correctGuess.y, correctGuess.x]]);
        map.value!.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
    }

    function clearMap() {
        map.value?.eachLayer((layer) => {
            if (layer instanceof L.TileLayer || layer instanceof L.ImageOverlay) return;
            map.value?.removeLayer(layer);
        });
        guessMarker.value = undefined;
    }

    function defaultBounds() {
        map.value!.fitBounds(imageBounds, { padding: [50, 50], maxZoom: 4 });
    }

    function showAllMarkers(guessHistory, maxRounds: number,) {
        for (const guess of guessHistory) {
            L.marker([guess.guessCoords.y, guess.guessCoords.x]).addTo(map.value!)
            showCorrectMarker(guess.currentCoords, guess.guessCoords, guess.round, maxRounds)
        }
    }

    function lockMap(shouldLock: boolean) {
        locked.value = shouldLock
    }

    defineExpose({ showCorrectMarker, clearMap, defaultBounds, showAllMarkers, lockMap, getColorFromRound})
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
</style>