import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue'

// Routes
const routes = [
    { path: '/', component: App },
    {
        path: '/old',
        redirect: () => {
            window.location.href = '/old-site/index.html';
            return '';
        }
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app');

//TODO: use cookies or sum idk save settings
//TODO: leaderboard
//TODO: sound effects -- egh maybe
//TODO: mobile controls -- maybe