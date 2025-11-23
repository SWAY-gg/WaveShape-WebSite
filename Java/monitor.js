/* monitor.js – CPU+RAM, мини-графики, Users/Guilds из JSON + UPTIME + COMMANDS */

(function () {

  const POLL_INTERVAL = 1800;
  const HISTORY_LENGTH = 40;

  const q = id => document.getElementById(id);
  const fmtPct = v => Math.round(v) + "%";
  const rand = (min, max) => Math.random() * (max - min) + min;

  const state = {
    labels: Array(HISTORY_LENGTH).fill(""),
    cpu: Array(HISTORY_LENGTH).fill(20),
    ram: Array(HISTORY_LENGTH).fill(20),
    timers: []
  };

  // ─────────────────────────────────────────────
  //  Загружаем Users, Guilds, Uptime, Commands
  // ─────────────────────────────────────────────
  async function fetchDiscordStats() {
    try {
      const res = await fetch("./Java/API/status.json?_=" + Date.now());
      if (!res.ok) throw new Error("Status file not found");

      const data = await res.json();

      return {
        users: Number(data.users) || 0,
        guilds: Number(data.guilds) || 0,
        uptime: Number(data.uptime) || 0,

        commands_total: Number(data.commands_total) || 0,
        commands_ok: Number(data.commands_ok) || 0,
        commands_error: Number(data.commands_error) || 0
      };

    } catch (e) {
      console.warn("[Status] Failed to load Discord stats:", e);
      return { users: 0, guilds: 0, uptime: 0, commands_total: 0, commands_ok: 0, commands_error: 0 };
    }
  }

  // ─────────────────────────────────────────────
  //  Форматирование uptime → HH:mm:ss
  // ─────────────────────────────────────────────
  function formatUptime(ms) {
    if (ms < 1000) ms *= 1000;

    let total = Math.floor(ms / 1000);
    let h = Math.floor(total / 3600);
    let m = Math.floor((total % 3600) / 60);
    let s = total % 60;

    return `${h}h ${m}m ${s}s`;
  }

  // ─────────────────────────────────────────────
  //  Генерируем CPU/RAM/Disk (симуляция)
  // ─────────────────────────────────────────────
  async function sampleMetrics() {
    const base = rand(10, 90);

    const sys = {
      cpu: Math.max(5, Math.min(100, base + rand(-15, 15))),
      ram: Math.max(5, Math.min(100, base * 0.6 + rand(-10, 10))),
      disk: Math.max(1, Math.min(100, 40 + Math.sin(Date.now() / 7000) * 40))
    };

    const discord = await fetchDiscordStats();

    return {
      ...sys,
      users: discord.users,
      guilds: discord.guilds,

      uptimeText: formatUptime(discord.uptime),

      commands_total: discord.commands_total,
      commands_ok: discord.commands_ok,
      commands_error: discord.commands_error
    };
  }

  // ─────────────────────────────────────────────
  //  Основной график (CPU + RAM)
  // ─────────────────────────────────────────────
  function createBigChart(ctx) {
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: state.labels.slice(),
        datasets: [
          {
            label: "CPU",
            data: state.cpu.slice(),
            borderWidth: 2,
            tension: 0.40,
            borderColor: "#ff6868",
            backgroundColor: "rgba(255,90,90,0.10)",
            pointRadius: 0,
            fill: true
          },
          {
            label: "RAM",
            data: state.ram.slice(),
            borderWidth: 2,
            tension: 0.40,
            borderColor: "#4da3ff",
            backgroundColor: "rgba(77,163,255,0.10)",
            pointRadius: 0,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        scales: {
          x: { display: false },
          y: { min: 0, max: 100 }
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  //  Мини-графики
  // ─────────────────────────────────────────────
  function drawMini(canvas, values) {
    if (!canvas) return;

    const w = canvas.width = canvas.clientWidth * devicePixelRatio;
    const h = canvas.height = canvas.clientHeight * devicePixelRatio;
    const g = canvas.getContext("2d");

    g.clearRect(0, 0, w, h);

    g.lineWidth = 2 * devicePixelRatio;
    g.strokeStyle = "#4da3ff";

    g.beginPath();
    values.forEach((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - (v / 100) * h * 0.85 - 2;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });

    g.stroke();
  }

  // ─────────────────────────────────────────────
  //  Обновление истории CPU/RAM
  // ─────────────────────────────────────────────
  function updateHistory(cpu, ram) {
    state.cpu.push(cpu);
    state.ram.push(ram);

    if (state.cpu.length > HISTORY_LENGTH) state.cpu.shift();
    if (state.ram.length > HISTORY_LENGTH) state.ram.shift();
  }

  // ─────────────────────────────────────────────
  //  Обновляем UI
  // ─────────────────────────────────────────────
  function refreshUI(metrics, chart, mini) {
    q("cpuVal").textContent = fmtPct(metrics.cpu);
    q("ramVal").textContent = fmtPct(metrics.ram);
    q("diskVal").textContent = fmtPct(metrics.disk);

    q("usersVal").textContent = metrics.users;
    q("guildsVal").textContent = metrics.guilds;

    // uptime card
    q("uptimeText").textContent = metrics.uptimeText;

    // commands card (new tech emoji)
    q("cmdTotal").textContent = "📈 " + metrics.commands_total;
    q("cmdSuccess").textContent = "🟢 " + metrics.commands_ok;
    q("cmdErrors").textContent = "🔴 " + metrics.commands_error;

    // big chart
    chart.data.datasets[0].data = state.cpu.slice();
    chart.data.datasets[1].data = state.ram.slice();
    chart.update("none");

    // mini charts
    drawMini(mini.cpu, state.cpu);
    drawMini(mini.ram, state.ram);
    drawMini(mini.disk, state.cpu.map((v, i) => (v + state.ram[i]) / 2));
  }

  // ─────────────────────────────────────────────
  //  Инициализация
  // ─────────────────────────────────────────────
  function initStatus() {
    const chart = createBigChart(q("monitorChart").getContext("2d"));

    const mini = {
      cpu: q("cpuMini"),
      ram: q("ramMini"),
      disk: q("diskMini")
    };

    async function tick() {
      const metrics = await sampleMetrics();
      updateHistory(metrics.cpu, metrics.ram);
      refreshUI(metrics, chart, mini);
    }

    tick();
    const t = setInterval(tick, POLL_INTERVAL);
    state.timers.push(t);
  }

  window.initStatus = initStatus;

  document.addEventListener("DOMContentLoaded", () => {
    initStatus();
    document.querySelectorAll("[data-stagger]").forEach(e => e.classList.add("in"));
  });

})();
