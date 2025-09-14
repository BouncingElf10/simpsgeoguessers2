<script setup lang="ts">
    import L from "leaflet"
    import {defineProps, onMounted, ref} from "vue";

    const emit = defineEmits<{
        (e: "map-click", coords: { x: number; y: number }): void
    }>()
    let map = ref<L.Map>()
    let guessMarker = ref<L.Marker>()

    const alignmentData = {mapX: 796, mapY: 656, mcX: 169, mcY: 48} // also in Map.vue
    const offset = {x: 796 - 169, y: 656 - 48}

    const imageBounds = [[0, 0], [1544, 1555]]
    const locked = ref(true)
    const mousePos = ref({x: 0, y: 0})

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

        const coordsControl = L.control({ position: "topright" })
        coordsControl.onAdd = function () {
            const div = L.DomUtil.create("div", "coords-display")
            div.innerHTML = "x: -, y: -"
            return div
        }
        coordsControl.addTo(map.value)

        map.value.on("mousemove", (e) => {
            const coordsDiv = document.querySelector(".coords-display")
            if (coordsDiv) {
                const alignedCoords = {
                    x: e.latlng.lng - offset.x,
                    y: (offset.y - e.latlng.lat) + alignmentData.mcY * 2,
                }
                mousePos.value = e.latlng
                coordsDiv.innerHTML = `x: ${alignedCoords.x.toFixed(0)}, y: ${alignedCoords.y.toFixed(0)}`
            }
        })


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