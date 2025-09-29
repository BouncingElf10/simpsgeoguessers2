<script setup lang="ts">

import NavBar from "@/components/NavBar.vue";
import NavItem from "@/components/NavItem.vue";
import Map from "@/components/Map.vue";
</script>

<template>
    <div class="navbar-guess">
        <slot></slot>
    </div>
</template>

<style scoped>
.navbar-guess {
    display: flex;
    bottom: 0;
    right: 0;
    width: 25%;
    position: absolute;
    align-items: flex-end;
    flex-direction: column;
    transition: all 0.3s ease-in-out;
}

@media screen and (orientation: landscape) and (max-height: 450px) {
    .navbar-guess {
        width: 40% !important;
        height: 100%;
    }
}
</style>