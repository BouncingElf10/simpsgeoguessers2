<script setup>
import { ref } from "vue";

const adminToken = ref("");
const isLoggedIn = ref(false);
const message = ref("");
const recent = ref([]);
const banned = ref([]);

async function login() {
    if (!adminToken.value) {
        message.value = "Please enter an admin token";
        return;
    }

    try {
        const res = await fetch("/api/admin/recent", {
            headers: { "x-admin-token": adminToken.value },
        });
        const data = await res.json();

        if (res.ok) {
            recent.value = data.submissions.map(s => typeof s === "string" ? JSON.parse(s) : s);
            await loadBanned();
            isLoggedIn.value = true;
            message.value = "";
        } else {
            message.value = data.error || "Invalid admin token";
        }
    } catch (err) {
        console.error(err);
        message.value = "Network error while validating token";
    }
}

async function loadBanned() {
    try {
        const res = await fetch("/api/admin/banned", {
            headers: { "x-admin-token": adminToken.value }
        });
        const data = await res.json();
        if (res.ok) {
            banned.value = data.bannedList;
        } else {
            message.value = data.error || "Failed to load banned list";
        }
    } catch (err) {
        console.error(err);
        message.value = "Network error while loading banned list";
    }
}

async function banIp(ipHash) {
    if (!confirm(`Ban ipHash: ${ipHash}?`)) return;
    const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-admin-token": adminToken.value,
        },
        body: JSON.stringify({ ipHash, reason: "Manual ban" }),
    });
    const data = await res.json();
    message.value = JSON.stringify(data);
    await loadBanned();
}

async function banUsername(username) {
    if (!confirm(`Ban username: ${username}?`)) return;
    const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-admin-token": adminToken.value,
        },
        body: JSON.stringify({ username, reason: "Manual ban" }),
    });
    const data = await res.json();
    message.value = JSON.stringify(data);
    await loadBanned();
}
</script>

<template>
    <div class="login-screen" v-if="!isLoggedIn">
        <div class="login-box">
            <h2>Admin Login</h2>
            <input
                type="password"
                v-model="adminToken"
                placeholder="Enter admin token"
            />
            <button @click="login">Login</button>
            <p class="message" v-if="message">{{ message }}</p>
        </div>
    </div>

    <div v-else class="admin-panel settings-menu">
        <h2 class="info-text title">Admin Panel – Bans</h2>
        <p class="info-text highlight" v-if="message">{{ message }}</p>

        <div class="settings-section">
            <h3 class="info-text subtitle">Recent Submissions</h3>
            <table v-if="recent.length" class="styled-table">
                <thead>
                <tr>
                    <th>Username</th>
                    <th>Score</th>
                    <th>IP Hash</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="r in recent" :key="r.username + r.createdAt">
                    <td>{{ r.username }}</td>
                    <td>{{ r.score }}</td>
                    <td class="monospace">{{ r.ipHash }}</td>
                    <td class="settings-actions">
                        <button @click="banUsername(r.username)">Ban Username</button>
                        <button @click="banIp(r.ipHash)">Ban IP</button>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

        <div class="settings-section">
            <h3 class="info-text subtitle">Banned List</h3>
            <ul>
                <li v-for="ip in banned" :key="ip" class="info-text body">
                    {{ ip }}
                </li>
            </ul>
        </div>
    </div>

    <div class="background"></div>
</template>

<style scoped>
.login-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #1b1b1b;
    font-family: 'Barlow', sans-serif;
}

.login-box {
    background: rgba(0, 0, 0, 0.8);
    padding: 40px 30px;
    border-radius: 16px;
    color: #fff;
    width: 300px;
    text-align: center;
}

.login-box input {
    width: calc(100% - 25px);
    padding: 10px 12px;
    margin: 12px 0;
    border-radius: 8px;
    border: none;
    font-family: 'Barlow', sans-serif;
}

.login-box button {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    background-color: #d33;
    color: #fff;
    cursor: pointer;
    font-weight: 500;
    width: 100%;
}

.login-box button:hover {
    background-color: #a22;
}

.message {
    color: #f88;
    margin-top: 12px;
}

.background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #1b1b1b;
    background-size: cover;
    z-index: -1;
}

body {
    background-color: #2b2b2b;
    font-family: 'Barlow', sans-serif;
    margin: 0;
    padding: 0;
}

.admin-panel {
    background: rgba(0,0,0,0.75);
    color: #ffffff;
    border-radius: 16px;
    padding: 20px 30px;
    max-width: 80%;
    margin: 40px auto;
    font-family: 'Barlow', sans-serif;
}

.styled-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    overflow: hidden;
    font-family: 'Barlow', sans-serif;
}

.styled-table th, .styled-table td {
    padding: 10px 12px;
    text-align: left;
}

.styled-table th {
    background: rgba(255,255,255,0.1);
    font-weight: 600;
}

.styled-table tr {
    transition: background 0.3s ease;
}

.styled-table tr:hover {
    background: rgba(255,255,255,0.1);
}

button {
    padding: 6px 12px;
    margin: 0;
    background-color: #d33;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-family: 'Barlow', sans-serif;
    transition: background 0.3s ease;
}

button:hover {
    background-color: #a22;
}

.settings-section {
    margin-top: 25px;
    padding: 20px;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    font-family: 'Barlow', sans-serif;
}

.monospace {
    font-family: monospace;
}
</style>
