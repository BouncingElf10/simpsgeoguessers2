<script setup lang="ts">
    import L from "leaflet"
    import {onMounted, ref} from "vue";

    let map = ref<L.Map>()

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
            console.log("Clicked at:", e.latlng)
        }
        map.value.on("click", onMapClick)
    })
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