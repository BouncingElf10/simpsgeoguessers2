<script setup lang="ts">
    import L from "leaflet"
    import {defineProps, onMounted, ref} from "vue";

    const emit = defineEmits<{
        (e: "map-click", coords: { x: number; y: number }): void
    }>()
    let map = ref<L.Map>()
    let guessMarker = ref<L.Marker>()

    onMounted(() => {
        map.value = L.map("map", {
            attributionControl: false,
            crs: L.CRS.Simple,
            minZoom: -1,
            maxZoom: 4,
            zoom: 0,
        })
        const imageUrl = new URL(`../assets/map.png`, import.meta.url).href
        const imageBounds = [[0, 0], [1544, 1555]]
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
            if (guessMarker.value) {
                guessMarker.value.setLatLng(e.latlng)
            } else {
                guessMarker.value = L.marker(e.latlng).addTo(map.value!)
            }
            emit("map-click", { x: e.latlng.lng, y: e.latlng.lat })
        }
        map.value.on("click", onMapClick)
    })

    function showCorrectMarker(correctGuess, actualGuess) {
        console.log("Correct guess:", correctGuess)
        L.marker({
            lat: correctGuess.y,
            lng: correctGuess.x
        }).addTo(map.value!)
        L.polyline(
            [[actualGuess.y, actualGuess.x], [correctGuess.y, correctGuess.x]],
            { color: "red", weight: 3}
        ).addTo(map.value!);
        const bounds = L.latLngBounds([[actualGuess.y, actualGuess.x], [correctGuess.y, correctGuess.x]]);
        map.value!.fitBounds(bounds, { padding: [50, 50], maxZoom: 4 });
    }

    defineExpose({ showCorrectMarker })
</script>

<template>
    <div id="map" class="map">

    </div>
</template>

<style scoped>
.map {
    opacity: 0.5;
    background-color: #000000;
    width: 100%;
    height: 300px;
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

.map:hover {
    opacity: 1;
    height: 500px;
    width: 200%;
    transition-delay: 0s, 0s, 0s;
}

.map:not(:hover) {
    transition-delay: 0s, 0.2s, 0.2s;
}
</style>