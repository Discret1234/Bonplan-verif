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
const fetch = require("node-fetch")

// 🟢 DB CONNECT
mongoose.connect(process.env.MONGO_URI)
console.log("DB connectée")

// 🟢 MODEL USER
const userSchema = new mongoose.Schema({
  discordId: String,
  accessToken: String
})

const User = mongoose.model("User", userSchema)

// 🟢 BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.GuildMember]
})

const VERIFY_URL = "http://localhost:5173/callback"

client.once(Events.ClientReady, () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`)
})

// 🟢 WELCOME + VERIFY BUTTON
client.on(Events.GuildMemberAdd, async (member) => {
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

// 🟢 COMMAND /joinall
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
            body: JSON.stringify({
              access_token: u.accessToken
            })
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

client.login(process.env.TOKEN)