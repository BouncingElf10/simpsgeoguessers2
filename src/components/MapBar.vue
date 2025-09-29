<script setup lang="ts">

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
        width: 30% !important;
        height: 100%;
    }
}
</style>