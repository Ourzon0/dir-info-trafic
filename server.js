const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const express = require("express");

const app = express();


// ==============================
// CONFIGURATION
// ==============================

const PORT = process.env.PORT || 3000;

const DISCORD_TOKEN =
    process.env.DISCORD_TOKEN;

const CHANNEL_ID =
    process.env.DISCORD_CHANNEL_ID;


// ==============================
// SERVEUR WEB
// ==============================

app.use(express.json());


app.get("/", (req, res) => {

    res.send(`
<!DOCTYPE html>

<html lang="fr">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1">

<title>Info Trafic - DIR</title>


<style>

* {
    box-sizing: border-box;
}


body {

    margin: 0;

    padding: 20px;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    background: #f4f5f7;

    color: #202124;

}


.header {

    margin-bottom: 20px;

}


.header h1 {

    margin: 0;

    font-size: 26px;

}


.header p {

    color: #666;

}


.card {

    background: white;

    padding: 18px;

    margin-bottom: 15px;

    border-radius: 8px;

    border-left: 7px solid #777;

    box-shadow:
        0 1px 5px rgba(0,0,0,0.12);

}


.card.red {

    border-left-color: #c62828;

}


.card.orange {

    border-left-color: #ef8c00;

}


.card.green {

    border-left-color: #2e7d32;

}


.title {

    font-size: 18px;

    font-weight: bold;

    margin-bottom: 10px;

}


.content {

    white-space: pre-wrap;

    line-height: 1.5;

}


.date {

    margin-top: 12px;

    padding-top: 10px;

    border-top:
        1px solid #eeeeee;

    color: #777;

    font-size: 12px;

}


.empty {

    background: white;

    padding: 30px;

    border-radius: 8px;

    text-align: center;

}


.error {

    background: #ffebee;

    color: #b71c1c;

    padding: 20px;

    border-radius: 8px;

}

</style>

</head>


<body>


<div class="header">

<h1>INFO TRAFIC</h1>

<p>
État du réseau et événements actuellement signalés.
</p>

</div>


<div id="traffic">

<div class="empty">
Chargement des informations trafic...
</div>

</div>


<script>


function couleur(contenu) {

    contenu = contenu.trim();


    if (contenu.startsWith("🔴")) {

        return "red";

    }


    if (contenu.startsWith("🟠")) {

        return "orange";

    }


    if (contenu.startsWith("🟢")) {

        return "green";

    }


    return "";

}



function dateFrancais(date) {

    return new Date(date).toLocaleString(

        "fr-FR",

        {

            timeZone:
                "Europe/Paris",

            day: "2-digit",

            month: "2-digit",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit"

        }

    );

}



async function chargerTrafic() {

    try {

        const reponse =
            await fetch("/api/traffic");


        if (!reponse.ok) {

            throw new Error(
                "Erreur serveur"
            );

        }


        const messages =
            await reponse.json();


        const zone =
            document.getElementById(
                "traffic"
            );


        zone.innerHTML = "";


        if (
            !messages ||
            messages.length === 0
        ) {

            zone.innerHTML = `

                <div class="empty">

                    🟢 Aucun événement
                    actuellement signalé.

                </div>

            `;

            return;

        }


        messages.forEach(message => {


            const lignes =
                message.content
                .split(/\r?\n/);


            const titre =
                lignes.shift();


            const contenu =
                lignes.join("\n")
                .trim();


            const card =
                document.createElement("div");


            card.className =
                "card " +
                couleur(message.content);


            const title =
                document.createElement("div");


            title.className =
                "title";


            title.textContent =
                titre;


            card.appendChild(title);


            if (contenu) {

                const texte =
                    document.createElement("div");


                texte.className =
                    "content";


                texte.textContent =
                    contenu;


                card.appendChild(texte);

            }


            const date =
                document.createElement("div");


            date.className =
                "date";


            date.textContent =
                "Dernière mise à jour : " +
                dateFrancais(
                    message.timestamp
                );


            card.appendChild(date);


            zone.appendChild(card);

        });


    } catch (erreur) {

        document.getElementById(
            "traffic"
        ).innerHTML = `

            <div class="error">

                Impossible de récupérer
                les informations trafic.

            </div>

        `;

    }

}


// Première récupération

chargerTrafic();


// Actualisation toutes les 60 secondes

setInterval(

    chargerTrafic,

    60000

);

</script>


</body>

</html>
    `);

});


// ==============================
// API TRAFIC
// ==============================

app.get("/api/traffic", async (req, res) => {

    try {

        const channel =
            await client.channels.fetch(
                CHANNEL_ID
            );


        const messages =
            await channel.messages.fetch({
                limit: 20
            });


        const result =
            messages

            .filter(message =>
                !message.author.bot &&
                message.content &&
                message.content.trim() !== ""
            )

            .map(message => ({

                id: message.id,

                content:
                    message.content,

                timestamp:
                    message.createdAt

            }));


        res.json(result);


    } catch (error) {

        console.error(error);

        res.status(500).json({

            error:
                "Impossible de récupérer les messages Discord."

        });

    }

});


// ==============================
// BOT DISCORD
// ==============================

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent

    ]

});


client.once("ready", () => {

    console.log(
        `✅ Bot connecté : ${client.user.tag}`
    );

});


client.on("error", error => {

    console.error(
        "Erreur Discord :",
        error
    );

});


// ==============================
// DÉMARRAGE
// ==============================

app.listen(PORT, () => {

    console.log(
        `🌐 Serveur lancé sur le port ${PORT}`
    );

});


client.login(DISCORD_TOKEN);
