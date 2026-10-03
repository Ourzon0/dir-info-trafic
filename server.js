const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const { marked } = require("marked");

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
   PROTECTION HTML
========================= */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   PROTECTION URL
========================= */

function escapeAttribute(url) {
  return String(url)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================
   PAGE RAILWAY
========================= */

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>Informations trafic</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: #f1f3f5;
  color: #1f2937;
  font-family: Arial, Helvetica, sans-serif;
}

main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

.traffic-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.traffic-card {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 6px solid #64748b;
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

/* =========================
   TEXTE DISCORD
========================= */

.message-content {
  line-height: 1.65;
  font-size: 16px;
}

.message-content h1 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 28px;
  color: #172554;
}

.message-content h2 {
  margin-top: 20px;
  margin-bottom: 15px;
  font-size: 23px;
  color: #172554;
}

.message-content h3 {
  margin-top: 20px;
  margin-bottom: 12px;
  font-size: 20px;
  color: #172554;
}

.message-content p {
  margin: 10px 0;
}

.message-content ul,
.message-content ol {
  padding-left: 28px;
  margin-top: 8px;
  margin-bottom: 15px;
}

.message-content li {
  margin: 5px 0;
}

.message-content hr {
  border: 0;
  border-top: 1px solid #d1d5db;
  margin: 20px 0;
}

.message-content strong {
  font-weight: 700;
}

.message-content em {
  font-style: italic;
}

.message-content blockquote {
  border-left: 4px solid #9ca3af;
  margin: 15px 0;
  padding: 5px 15px;
  color: #4b5563;
  background: #f8fafc;
}

.message-content code {
  background: #e5e7eb;
  padding: 2px 5px;
  border-radius: 4px;
}

.message-content pre {
  background: #111827;
  color: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
}

.message-content a {
  color: #1d4ed8;
  text-decoration: underline;
}

/* =========================
   IMAGES DISCORD
========================= */

.attachments {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.traffic-image {
  display: block;

  width: 100%;
  max-width: 900px;
  max-height: 600px;

  object-fit: contain;

  margin: 0 auto;

  border-radius: 8px;

  border: 1px solid #e5e7eb;

  background: #f8fafc;
}

.date {
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
}

.empty {
  background: white;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  color: #64748b;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

</style>

</head>

<body>

<main>

  <div id="traffic" class="traffic-list">

    <div class="empty">
      Chargement des informations trafic...
    </div>

  </div>

</main>

<script>

async function loadTraffic() {

  const container =
    document.getElementById("traffic");

  try {

    const response =
      await fetch("/api/traffic");

    if (!response.ok) {
      throw new Error("Erreur serveur");
    }

    const data =
      await response.json();

    if (!data.length) {

      container.innerHTML =
        '<div class="empty">' +
        'Aucun événement trafic en cours.' +
        '</div>';

      return;
    }

    let html = "";

    data.forEach(function(item) {

      let statusClass = "";

      if (item.content.indexOf("🔴") === 0) {
        statusClass = "red";
      }

      if (item.content.indexOf("🟠") === 0) {
        statusClass = "orange";
      }

      if (item.content.indexOf("🟢") === 0) {
        statusClass = "green";
      }

      const date =
        new Date(item.timestamp)
          .toLocaleString("fr-FR");

      html +=
        '<article class="traffic-card ' +
        statusClass +
        '">' +

        '<div class="message-content">' +
        item.html +
        '</div>';

      /* =========================
         IMAGES
      ========================= */

      if (
        item.attachments &&
        item.attachments.length > 0
      ) {

        html +=
          '<div class="attachments">';

        item.attachments.forEach(function(image) {

          html +=
            '<img ' +
            'class="traffic-image" ' +
            'src="' + image.url + '" ' +
            'alt="' + image.name + '" ' +
            'loading="lazy"' +
            '>';

        });

        html +=
          '</div>';

      }

      html +=

        '<div class="date">' +
        'Publié le ' +
        date +
        '</div>' +

        '</article>';

    });

    container.innerHTML = html;

  } catch (error) {

    console.error(error);

    container.innerHTML =
      '<div class="empty">' +
      'Impossible de récupérer les informations trafic.' +
      '</div>';

  }

}

/*
 * Première récupération
 */

loadTraffic();

/*
 * Actualisation automatique toutes les 60 secondes
 */

setInterval(
  loadTraffic,
  60000
);

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

    const channel =
      await client.channels.fetch(
        DISCORD_CHANNEL_ID
      );

    if (!channel) {

      return res.status(404).json({
        error: "Salon Discord introuvable"
      });

    }

    const messages =
      await channel.messages.fetch({
        limit: 20
      });

    const traffic =
      messages

        .filter(function(message) {

          return !message.author.bot;

        })

        .filter(function(message) {

          return message.content.trim().length > 0 ||
                 message.attachments.size > 0;

        })

        .map(function(message) {

          /* =========================
             MARKDOWN DISCORD
          ========================= */

          const safeText =
            escapeHtml(message.content);

          const html =
            marked.parse(
              safeText,
              {
                breaks: true,
                gfm: true
              }
            );

          /* =========================
             PIÈCES JOINTES
          ========================= */

          const attachments = [];

          message.attachments.forEach(
            function(attachment) {

              const contentType =
                attachment.contentType || "";

              const isImage =
                contentType.startsWith("image/");

              if (isImage) {

                attachments.push({
                  url: escapeAttribute(
                    attachment.url
                  ),

                  name: escapeHtml(
                    attachment.name ||
                    "Image trafic"
                  )
                });

              }

            }
          );

          return {

            id: message.id,

            content:
              message.content,

            html:
              html,

            attachments:
              attachments,

            timestamp:
              message.createdAt

          };

        });

    res.json(traffic);

  } catch (error) {

    console.error(
      "❌ Erreur API trafic :",
      error
    );

    res.status(500).json({

      error:
        "Impossible de récupérer les messages Discord"

    });

  }

});

/* =========================
   BOT DISCORD
========================= */

client.once("ready", function() {

  console.log(
    "✅ Bot connecté : " +
    client.user.tag
  );

});

/* =========================
   CONNEXION DISCORD
========================= */

client.login(
  DISCORD_TOKEN
);

/* =========================
   SERVEUR RAILWAY
========================= */

app.listen(
  PORT,
  function() {

    console.log(
      "🌐 Serveur lancé sur le port " +
      PORT
    );

  }
);
