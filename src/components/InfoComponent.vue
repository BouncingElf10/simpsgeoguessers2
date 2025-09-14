<script setup lang="ts">
</script>

<template>
    <div class="info-box">
        <slot></slot>
    </div>
</template>

<style scoped>
.info-box {
    display: flex;
    flex-direction: column;

    color: #e0e0e0;
    background: rgba(25, 25, 25, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);

    font-family: "Barlow", sans-serif;
    font-size: 18px;
    line-height: 1.6;
}

.info-box h2 {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #ffffff;
}

.info-box p {
    margin: 0;
    color: #cfcfcf;
}

.info-box strong {
    color: #ffffff;
}
</style>

