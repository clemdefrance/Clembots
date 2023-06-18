// Importer les modules nécessaires
const Discord = require("discord.js")
const ytdl = require("ytdl-core")
const youtubeSearch = require("youtube-search")
const config = require("./config")

// Créer un client Discord avec les intents nécessaires
const bot = new Discord.Client({intents: 21})

// Définir le préfixe des commandes et la clé d'API YouTube
const prefix = "!"
const youtubeApiKey = "AIzaSyAnypXzUAovUngiMRYKI-xkecVC9l6u5HI"

// Créer une variable pour stocker le salon vocal où le bot est connecté
let voiceChannel = null

// Créer une variable pour stocker le stream de la vidéo en cours
let stream = null

// Créer une variable pour stocker la file d'attente des vidéos à jouer
let queue = []

// Créer une fonction pour rechercher une vidéo sur YouTube en fonction d'un terme
async function searchVideo(term) {
  // Utiliser l'API YouTube Data pour faire une requête de recherche
  let options = {
    maxResults: 1,
    key: youtubeApiKey,
    type: "video"
  }
  let result = await youtubeSearch(term, options)
  // Retourner le premier résultat trouvé ou null si aucun résultat
  return result.results[0] || null
}

// Créer une fonction pour se connecter à un salon vocal et jouer une vidéo
async function playVideo(video) {
  // Vérifier si le bot est déjà connecté à un salon vocal
  if (voiceChannel) {
    // Se déconnecter du salon vocal actuel
    voiceChannel.leave()
    voiceChannel = null
  }
  // Vérifier si la vidéo existe
  if (video) {
    // Trouver le salon vocal où se trouve l'utilisateur qui a envoyé la commande
    voiceChannel = bot.channels.cache.find(channel => channel.type === "GUILD_VOICE" && channel.members.has(message.author.id))
    // Vérifier si le salon vocal existe
    if (voiceChannel) {
      // Se connecter au salon vocal et créer un stream avec le son de la vidéo
      let connection = await voiceChannel.join()
      stream = connection.play(ytdl(video.link))
      // Ajouter un événement end pour passer à la vidéo suivante dans la file d'attente
      stream.on("finish", () => {
        // Retirer la première vidéo de la file d'attente
        queue.shift()
        // Vérifier s'il reste des vidéos dans la file d'attente
        if (queue.length > 0) {
          // Jouer la prochaine vidéo dans la file d'attente
          playVideo(queue[0])
        } else {
          // Se déconnecter du salon vocal et réinitialiser les variables
          voiceChannel.leave()
          voiceChannel = null
          stream = null
        }
      })
    } else {
      // Envoyer un message d'erreur si le salon vocal n'existe pas
      message.channel.send("Tu dois être dans un salon vocal pour utiliser cette commande.")
    }
  } else {
    // Envoyer un message d'erreur si la vidéo n'existe pas
    message.channel.send("Aucune vidéo trouvée.")
  }
}

// Créer une fonction pour mettre en pause ou reprendre le stream de la vidéo en cours
function pauseResumeStream() {
  // Vérifier si le stream existe
  if (stream) {
    // Vérifier si le stream est en pause ou non
    if (stream.paused) {
      // Reprendre le stream
      stream.resume()
    } else {
      // Mettre en pause le stream
      stream.pause()
    }
  } else {
    // Envoyer un message d'erreur si le stream n'existe pas
    message.channel.send("Aucune vidéo en cours de lecture.")
  }
}

// Créer une fonction pour passer à la vidéo suivante dans la file d'attente
function skipVideo() {
  // Vérifier si le stream existe
  if (stream) {
    // Arrêter le stream
    stream.end()
  } else {
    // Envoyer un message d'erreur si le stream n'existe pas
    message.channel.send("Aucune vidéo en cours de lecture.")
  }
}

// Créer une fonction pour arrêter la lecture et vider la file d'attente
function stopVideo() {
  // Vérifier si le stream existe
  if (stream) {
    // Arrêter le stream
    stream.end()
    // Vider la file d'attente
    queue = []
  } else {
    // Envoyer un message d'erreur si le stream n'existe pas
    message.channel.send("Aucune vidéo en cours de lecture.")
  }
}

// Ajouter un événement ready pour savoir quand le bot est connecté et prêt à recevoir des commandes
bot.on("ready", () => {
  console.log("Bot connecté et prêt !")
})

// Ajouter un événement messageCreate pour écouter les messages envoyés dans les salons textuels et exécuter les commandes correspondantes
bot.on("messageCreate", async (message) => {
  // Vérifier si le message commence par le préfixe des commandes et si il n'est pas envoyé par un bot
  if (message.content.startsWith(prefix) && !message.author.bot) {
    // Extraire la commande et les arguments du message
    let args = message.content.slice(prefix.length).trim().split(/ +/)
    let command = args.shift().toLowerCase()
    // Utiliser un switch ou un if/else pour vérifier la commande et appeler la fonction appropriée
    switch (command) {
      case "play":
        // Vérifier s'il y a un argument après la commande
        if (args.length > 0) {
          // Rechercher une vidéo sur YouTube avec l'argument comme terme de recherche
          let video = await searchVideo(args.join(" "))
          // Ajouter la vidéo à la file d'attente
          queue.push(video)
          // Vérifier si le bot est déjà en train de jouer une vidéo ou non
          if (!stream) {
            // Jouer la première vidéo de la file d'attente
            playVideo(queue[0])
          } else {
            // Envoyer un message pour confirmer que la vidéo a été ajoutée à la file d'attente
            message.channel.send(`Vidéo ajoutée à la file d'attente : ${video.title}`)
          }
        } else {
          // Envoyer un message d'erreur s'il n'y a pas d'argument après la commande
          message.channel.send("Tu dois indiquer le nom ou le lien d'une vidéo YouTube après la commande.")
        }
        break;
      case "pause":
        // Mettre en pause ou reprendre le stream de la vidéo en cours
        pauseResumeStream()
        break;
      case "skip":
        // Passer à la vidéo suivante dans la file d'attente
        skipVideo()
        break;
      case "stop":
        // Arrêter la lecture et vider la file d'attente
        stopVideo()
        break;
      default:
        // Envoyer un message d'erreur si la commande n'est pas reconnue
        message.channel.send("Commande inconnue.")
        break;
    }
  }
})

// Se connecter au bot avec le token secret
bot.login("config.token")
