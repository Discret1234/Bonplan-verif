require("dotenv").config()

const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js")

const mongoose = require("mongoose")
const express = require("express")
const app = express()

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://bonplan-verif.onrender.com")
  res.header("Access-Control-Allow-Headers", "Content-Type")
  next()
})
app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
console.log("DB connectée")

const userSchema = new mongoose.Schema({
  discordId: String,
  accessToken: String
})
const User = mongoose.model("User", userSchema)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.GuildMember]
})

const VERIFY_URL = "https://bonplan-verif.onrender.com"
const GUILD_ID = "1503065658714230864"
const ROLE_NON_VERIFIE = "1507903340237820036"
const ROLE_VERIFIE = "1507903448669094028"

client.once(Events.ClientReady, () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`)
})

client.on(Events.GuildMemberAdd, async (member) => {
  await member.roles.add(ROLE_NON_VERIFIE).catch(console.error)

  const channel = member.guild.channels.cache.get("1507495314033082400")
  if (!channel) return

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("✅ Vérifier")
      .setStyle(ButtonStyle.Link)
      .setURL(VERIFY_URL)
  )

  channel.send({
    content: `Bienvenue ${member} 👋\nClique pour vérifier.`,
    components: [row]
  })
})

app.get("/callback", async (req, res) => {
  const code = req.query.code
  if (!code) return res.send("Pas de code.")

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "1508173505844215989",
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://bonplann-verif.onrender.com/callback"
      })
    })

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const userData = await userRes.json()
    const discordId = userData.id

    await User.findOneAndUpdate(
      { discordId },
      { discordId, accessToken },
      { upsert: true }
    )

    const guild = client.guilds.cache.get(GUILD_ID)
    if (guild) {
      const member = await guild.members.fetch(discordId).catch(() => null)
      if (member) {
        await member.roles.add(ROLE_VERIFIE).catch(console.error)
        await member.roles.remove(ROLE_NON_VERIFIE).catch(console.error)
      }
    }

    res.send("<h1>✅ Vérifié ! Tu peux retourner sur Discord.</h1>")
  } catch (e) {
    console.error(e)
    res.send("Erreur lors de la vérification.")
  }
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  if (interaction.commandName === "joinall") {
    const users = await User.find()
    let count = 0

    for (const u of users) {
      try {
        await fetch(
          `https://discord.com/api/guilds/${interaction.guild.id}/members/${u.discordId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bot ${process.env.TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ access_token: u.accessToken })
          }
        )
        count++
      } catch (e) {
        console.log("fail:", u.discordId)
      }
    }

    await interaction.reply(`✅ Migration terminée : ${count} users`)
  }
})

app.listen(3000, () => console.log("✅ Serveur callback sur port 3000"))
client.login(process.env.TOKEN)