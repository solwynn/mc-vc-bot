const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require(__dirname + '/../config.json');
const fs = require('fs');
let channels = require(__dirname + '/../channels.json');

function updateChannels() {
    fs.writeFileSync(__dirname + '/../channels.json', JSON.stringify(channels));
}

function purge() {
    let isPurged = 0;

    Object.keys(channels).forEach(async (id) => {
        if (channels[id].setToPurge) {
            const textChan = bot.channels.get(channels[id].textChannel);
            while (!isPurged) {
                await textChan.fetchMessages({ limit: 100 }).then(async (messages) => {
                    if (messages.array().length > 0) {
                        await textChan.bulkDelete(messages);
                    } else {
                        isPurged = 1;
                    }
                });
            }
            channels[id].setToPurge = false;
            updateChannels();
        }
    });
}

bot.on('voiceStateUpdate', (oldMember, newMember) => {
    
    // Dealing with a purge channel
    if (channels[oldMember.voiceChannelID]) {
        console.log(oldMember.voiceChannelID);
        let channel = bot.channels.get(oldMember.voiceChannelID);
        if (!channel.members.length) {
            channels[oldMember.voiceChannelID].setToPurge = true;
            updateChannels();
        }
    }

    // Dealing with a purge channel
    if (channels[newMember.voiceChannelID]) {
        channels[newMember.voiceChannelID].setToPurge = false;
        updateChannels();
    }

});

bot.on('ready', () => {
    setInterval(purge, 1800000);
});

bot.login(config.token);