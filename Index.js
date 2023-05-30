const Discord = require("discord.js")
const bot = new Discord.Client({intents: 3276799})
const config = require("./config")

bot.login(config.token)
