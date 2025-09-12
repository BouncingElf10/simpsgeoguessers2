<script setup>
import NavBar from "@/components/NavBar.vue";
import Icon from "@/assets/returnarrow.svg";
import NavItem from "@/components/NavItem.vue";
import Map from "@/components/Map.vue";
import MapBar from "@/components/MapBar.vue";

</script>

<template>
    <div class="background">
        <div class="navbar-list">
            <NavBar>
                <NavItem>
                    <Icon class="return-icon" width="32" height="32" />
                </NavItem>
            </NavBar>
            <NavBar>
                <NavItem>Second Item</NavItem>
                <NavItem>Third Item</NavItem>
                <NavItem>yeeah Item</NavItem>
            </NavBar>
        </div>
        <div class="navtopbar-list">
            <NavBar>
                <NavItem>Second Item</NavItem>
                <NavItem>Third Item</NavItem>
                <NavItem>yeeah Item</NavItem>
            </NavBar>
        </div>
        <MapBar />
    </div>
</template>

<style scoped>
.navtopbar-list {
    display: flex;
    top: 0;
    position: absolute;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
}
.navbar-list {
    display: flex;
    bottom: 0;
    position: absolute;
    align-items: flex-end;
}
.return-icon {
    fill: white;
}
.background {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: row;
    background-image: url("https://gaming-cdn.com/images/products/442/orig/minecraft-java-bedrock-edition-java-bedrock-edition-pc-juego-cover.jpg?v=1716387513");
    background-size: cover;
    background-position: center;
}
</style>
