<script setup lang="ts">
    import L from "leaflet"
    import {defineProps, onMounted, ref} from "vue";

    const emit = defineEmits<{
        (e: "map-click", coords: { x: number; y: number }): void
    }>()
    let map = ref<L.Map>()
    let guessMarker = ref<L.Marker>()
    const imageBounds = [[0, 0], [1544, 1555]]

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
        L.circle([correctGuess.y, correctGuess.x], {radius: 3, color: "red", weight: 3}).addTo(map.value!);
        L.polyline(
            [[actualGuess.y, actualGuess.x], [correctGuess.y, correctGuess.x]],
            { color: "red", weight: 3}
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


    defineExpose({ showCorrectMarker, clearMap, defaultBounds })
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