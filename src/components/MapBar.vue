<script setup lang="ts">

import NavBar from "@/components/NavBar.vue";
import NavItem from "@/components/NavItem.vue";
import Map from "@/components/Map.vue";
</script>

<template>
    <div class="navbar-guess">
        <Map />
        <NavBar class="guess-bar">
            <NavItem class="guess-item">Guess</NavItem>
        </NavBar>
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
}
.guess-bar {
    margin-right: 5px;
    width: calc(100% - 15px);
}
.guess-item {
    width: 100%;
}
</style>