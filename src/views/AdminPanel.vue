<script setup>
import { ref } from "vue";

const adminToken = ref("");
const isLoggedIn = ref(false);
const message = ref("");
const recent = ref([]);
const banned = ref([]);

const cleanupMap = ref("");
const cleanupLoading = ref(false);
const cleanupStats = ref(null);
const cleanupError = ref("");

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

async function runCleanup() {
    if (!cleanupMap.value.trim()) {
        cleanupError.value = "Please enter a map ID.";
        return;
    }
    cleanupLoading.value = true;
    cleanupStats.value = null;
    cleanupError.value = "";
    try {
        const res = await fetch("/api/admin/cleanup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-admin-token": adminToken.value,
            },
            body: JSON.stringify({ map: cleanupMap.value.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
            cleanupStats.value = data;
        } else {
            cleanupError.value = data.error || "Cleanup failed.";
        }
    } catch (err) {
        console.error(err);
        cleanupError.value = "Network error during cleanup.";
    } finally {
        cleanupLoading.value = false;
    }
}
</script>

<template>

    <div class="login-screen" v-if="!isLoggedIn">
        <div class="login-box">
            <h2>Admin Login</h2>
            <input type="password" v-model="adminToken" placeholder="Enter admin token" />
            <button @click="login" style="margin: 0">Login</button>
            <p class="message" v-if="message">{{ message }}</p>
        </div>
    </div>

    <div v-else class="admin-panel settings-menu">
        <h2 class="info-text title">Admin Panel</h2>
        <p class="info-text highlight" v-if="message">{{ message }}</p>

        <div class="settings-section cleanup-section">
            <h3 class="info-text subtitle">
                <span class="section-icon">🧹</span> DB Cleanup
            </h3>
            <p class="info-text body section-desc">
                Removes duplicate usernames from a leaderboard, keeping only each player's highest score.
            </p>

            <div class="cleanup-controls">
                <input
                    v-model="cleanupMap"
                    placeholder="Enter map ID (e.g. 1)"
                    class="cleanup-input"
                    @keyup.enter="runCleanup"
                />
                <button
                    @click="runCleanup"
                    :disabled="cleanupLoading"
                    class="cleanup-btn"
                >
                    <span v-if="cleanupLoading" class="spinner"></span>
                    <span v-else>Run Cleanup</span>
                </button>
            </div>

            <p class="cleanup-error" v-if="cleanupError">{{ cleanupError }}</p>

            <transition name="fade-up">
                <div v-if="cleanupStats" class="stats-card">
                    <div class="stats-header">
                        <span class="stats-map">{{ cleanupStats.map }}</span>
                        <span class="stats-badge success">Done</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-cell">
                            <span class="stat-value">{{ cleanupStats.before }}</span>
                            <span class="stat-label">Entries Before</span>
                        </div>
                        <div class="stat-divider">→</div>
                        <div class="stat-cell">
                            <span class="stat-value">{{ cleanupStats.after }}</span>
                            <span class="stat-label">Entries After</span>
                        </div>
                        <div class="stat-cell highlight-cell">
                            <span class="stat-value removed">−{{ cleanupStats.removed }}</span>
                            <span class="stat-label">Duplicates Removed</span>
                        </div>
                    </div>
                    <div class="stats-bar-wrap">
                        <div class="stats-bar-label">
                            <span>Retained</span>
                            <span>{{ Math.round((cleanupStats.after / cleanupStats.before) * 100) }}%</span>
                        </div>
                        <div class="stats-bar-track">
                            <div
                                class="stats-bar-fill"
                                :style="{ width: (cleanupStats.after / cleanupStats.before * 100) + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>

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

        <!-- ── BANNED LIST ── -->
        <div class="settings-section">
            <h3 class="info-text subtitle">Banned List</h3>
            <ul>
                <li v-for="ip in banned" :key="ip" class="info-text body">{{ ip }}</li>
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
    background: rgba(0,0,0,0.8);
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
.login-box button:hover { background-color: #a22; }
.message { color: #f88; margin-top: 12px; }

.background {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: #1b1b1b;
    background-size: cover;
    z-index: -1;
}

.admin-panel {
    background: rgba(0,0,0,0.75);
    color: #fff;
    border-radius: 16px;
    padding: 20px 30px;
    max-width: 80%;
    margin: 40px auto;
    font-family: 'Barlow', sans-serif;
}
.settings-section {
    margin-top: 25px;
    padding: 20px;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
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
.styled-table th, .styled-table td { padding: 10px 12px; text-align: left; }
.styled-table th { background: rgba(255,255,255,0.1); font-weight: 600; }
.styled-table tr { transition: background 0.3s ease; }
.styled-table tr:hover { background: rgba(255,255,255,0.1); }

button {
    padding: 6px 12px;
    margin: 0 4px;
    background-color: #d33;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-family: 'Barlow', sans-serif;
    transition: background 0.3s ease;
}
button:hover { background-color: #a22; }
button:disabled { background-color: #555; cursor: not-allowed; }

.monospace { font-family: monospace; }

.cleanup-section { border: 1px solid rgba(211, 51, 51, 0.25); }

.section-icon { margin-right: 6px; }

.section-desc {
    color: rgba(255,255,255,0.5);
    font-size: 0.88rem;
    margin: 4px 0 16px;
}

.cleanup-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}

.cleanup-input {
    flex: 1;
    min-width: 200px;
    padding: 9px 14px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    color: #fff;
    font-family: 'Barlow', sans-serif;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
}
.cleanup-input:focus { border-color: #d33; }
.cleanup-input::placeholder { color: rgba(255,255,255,0.3); }

.cleanup-btn {
    padding: 9px 22px;
    background-color: #d33;
    min-width: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
.cleanup-btn:hover:not(:disabled) { background-color: #a22; }

.cleanup-error {
    margin-top: 10px;
    color: #f88;
    font-size: 0.9rem;
}

.spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.stats-card {
    margin-top: 18px;
    background: rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 18px 20px;
}

.stats-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.stats-map {
    font-family: monospace;
    font-size: 1rem;
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.07);
    padding: 3px 10px;
    border-radius: 6px;
}

.stats-badge {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 20px;
}
.stats-badge.success {
    background: rgba(60, 200, 100, 0.15);
    color: #5ef0a0;
    border: 1px solid rgba(60, 200, 100, 0.3);
}

.stats-grid {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 18px;
}

.stat-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 12px 22px;
    flex: 1;
    min-width: 90px;
}

.highlight-cell {
    background: rgba(211, 51, 51, 0.1);
    border: 1px solid rgba(211, 51, 51, 0.25);
}

.stat-value {
    font-size: 1.9rem;
    font-weight: 700;
    line-height: 1;
    color: #fff;
}

.stat-value.removed { color: #f06060; }

.stat-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
    margin-top: 5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    text-align: center;
}

.stat-divider {
    color: rgba(255,255,255,0.25);
    font-size: 1.4rem;
    flex: 0;
    padding: 0 4px;
}

.stats-bar-wrap { margin-top: 4px; }

.stats-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
    margin-bottom: 6px;
}

.stats-bar-track {
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 99px;
    overflow: hidden;
}

.stats-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #d33, #ff6060);
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-up-enter-active {
    transition: opacity 0.35s ease, transform 0.35s ease;
}
.fade-up-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
</style>