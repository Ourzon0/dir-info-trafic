const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

if (!DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN manquant");
  process.exit(1);
}

if (!DISCORD_CHANNEL_ID) {
  console.error("❌ DISCORD_CHANNEL_ID manquant");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* =========================
   PAGE INFO TRAFIC
========================= */

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>INFO TRAFIC — DIR</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #f1f3f5;
      color: #1f2937;
    }

    header {
      background: #172554;
      color: white;
      padding: 25px;
      text-align: center;
    }

    header h1 {
      margin: 0;
      font-size: 28px;
    }

    header p {
      margin: 8px 0 0;
      opacity: 0.85;
    }

    main {
      max-width: 1000px;
      margin: 30px auto;
      padding: 0 20px;
    }

    .topbar {
      background: white;
      border-radius: 10px;
      padding: 18px 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .topbar strong {
      color: #172554;
    }

    .traffic-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .traffic-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 6px solid #64748b;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .traffic-card.red {
      border-left-color: #dc2626;
    }

    .traffic-card.orange {
      border-left-color: #f59e0b;
    }

    .traffic-card.green {
      border-left-color: #16a34a;
    }

    .date {
      margin-top: 12px;
      font-size: 13px;
      color: #64748b;
    }

    .empty {
      background: white;
      padding: 35px;
      border-radius: 10px;
      text-align: center;
      color: #64748b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    footer {
      text-align: center;
      padding: 30px 20px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>

<body>

<header>
  <h1>INFO TRAFIC</h1>
  <p>DIRECTION INTERDÉPARTEMENTALE DES ROUTES — GALAX RÔLEPLAY</p>
</header>

<main>

  <div class="topbar">
    <strong>État du réseau</strong>
    <div id="lastUpdate">Chargement...</div>
  </div>

  <div id="traffic" class="traffic-list">
    <div class="empty">
      Chargement des informations trafic...
    </div>
  </div>

</main>

<footer>
  SITE FICTIF — GALAX RÔLEPLAY
</footer>

<script>
async function loadTraffic() {
  const container = document.getElementById("traffic");
  const lastUpdate = document.getElementById("lastUpdate");

  try {
    const response = await fetch("/api/traffic");

    if (!response.ok) {
      throw new Error("Erreur serveur");
    }

    const data = await response.json();

    if (!data.length) {
      container.innerHTML = \`
        <div class="empty">
          Aucun événement trafic en cours.
        </div>
      \`;
    } else {
      container.innerHTML = data.map(item => {

        let statusClass = "";

        if (item.content.startsWith("🔴")) {
          statusClass = "red";
        } else if (item.content.startsWith("🟠")) {
          statusClass = "orange";
        } else if (item.content.startsWith("🟢")) {
          statusClass = "green";
        }

        const date = new Date(item.timestamp).toLocaleString("fr-FR");

        return \`
          <div class="traffic-card \${statusClass}">
            <div>\${escapeHtml(item.content)}</div>
            <div class="date">
              Mise à jour : \${date}
            </div>
          </div>
        \`;

      }).join("");
    }

    lastUpdate.textContent =
      "Dernière actualisation : " +
      new Date().toLocaleTimeString("fr-FR");

  } catch (error) {

    console.error(error);

    container.innerHTML = \`
      <div class="empty">
        Impossible de récupérer les informations trafic.
      </div>
    \`;

    lastUpdate.textContent = "Erreur de connexion";
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

loadTraffic();

setInterval(loadTraffic, 60000);
</script>

</body>
</html>
  `);
});

/* =========================
   API TRAFIC DISCORD
========================= */

app.get("/api/traffic", async (req, res) => {
  try {
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);

    if (!channel) {
      return res.status(404).json({
        error: "Salon Discord introuvable"
      });
    }

    const messages = await channel.messages.fetch({
      limit: 20
    });

    const traffic = messages
      .filter(message => !message.author.bot)
      .filter(message => message.content.trim().length > 0)
      .map(message => ({
        id: message.id,
        content: message.content,
        timestamp: message.createdAt
      }));

    res.json(traffic);

  } catch (error) {

    console.error("Erreur API trafic :", error);

    res.status(500).json({
      error: "Impossible de récupérer les messages Discord"
    });
  }
});

/* =========================
   DISCORD
========================= */

client.once("ready", () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);

/* =========================
   SERVEUR
========================= */

app.listen(PORT, () => {
  console.log(`🌐 Serveur lancé sur le port ${PORT}`);
});
