const config = require('./config.json');
const websites = require('./sites.json');

const Discord = require('discord.js');
const Canvas = require('canvas');

const client = new Discord.Client();
const prefix = config.prefix; 

const { doScrape } = require('./scrape.js');

const easyJSONDiscordFormat = ((e) => {
  return `\`\`\`json\n${e}\`\`\``;
});

client.on('ready', () => {
  console.log(`Bot logged in as: ${client.user.tag}!`);
});

client.on('message', async msg => {

  if (!msg.content.startsWith(prefix)) {
    return;
  }

  const args = msg.content.slice(prefix.length).trim().split(' ');

  if (args[0] === '') {
    const commands = ['sites','image','check']
    msg.channel.send(`>>> **General Commands:**\n${commands.map((command) => config.prefix + ' ' + command + '\n').join('')}`);
    return;
  }

  if (args.length === 1 && args[0] === 'sites') {
    msg.channel.send('**Stock sites currently checked:**');
    msg.channel.send(websites.map((e) => e.name).join('\n'));
    return;
  }

  if (args.length === 1 && args[0] === 'image') {
    const channel = msg.guild.channels.cache.find(ch => ch.name === 'bot');
    if (!channel) return;
    const canvas = Canvas.createCanvas(1260, 570);
    const ctx = canvas.getContext('2d');
    const background = await Canvas.loadImage('./3080.png');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), '3080.png');
    channel.send(`💕 (this image will auto-remove in some seconds)`, attachment)
      .then(msg => msg.delete({ timeout: 1000*14 }))
    return;
  }

  if (args.length === 1 && args[0] === 'check') {
    const images = ['https://i.imgur.com/YbHBOcd.gif', 'https://i.imgur.com/Wp5smBH.gif', 'https://i.imgur.com/w7HO2c8.gif']
    // const images = ['https://i.imgur.com/YbHBOcd.gif'];
    const expectedSeconds = 30;
    const exampleEmbed = new Discord.MessageEmbed()
      .setColor('#eeeeee')
      .setTitle('Performing RTX Stock Check')
      .setAuthor('By @arxpw', '', 'https://github.com/arxpw')
      .setDescription(`Please be patient, this process can take up to ${expectedSeconds} seconds!`)
      .setImage(images[Math.floor(Math.random()*images.length)])
      .setTimestamp()
      .setFooter('Thanks for using RTX TRACKER!');

    msg.channel.send(exampleEmbed);

    const timeStart = new Date().getTime();
    const scraped = await doScrape();

    scraped.map((websiteSingle) => {
      msg.channel.send('>>> ' + websiteSingle.map((scrapeValueSingle, ind) => {
        const emoj = (scrapeValueSingle.status ? '👀' : '❌');
        const pref = (scrapeValueSingle.status ? '**STOCK FOUND**' : 'NO STOCK');
        const header = (ind === 0 ? '```' + scrapeValueSingle.name.toUpperCase() + '```\n' : '');

        return `${header}${emoj} ${pref} <${scrapeValueSingle.url}>\n`;
      }).join(''));
    }).join('');

    const timeEnd = new Date().getTime();

    const timeTakenMS = (timeEnd-timeStart);
    const timeTakenSECS = (timeTakenMS/1000);

    const timeDifference = (expectedSeconds / timeTakenSECS * 100);
    const highLow = (timeDifference < 0 ? '**slower** 🐌' : '**faster** 🚀');

    const differencePercentage = `${(timeDifference < 0 ? timeDifference*-1 : timeDifference).toFixed(2)}%`;
    const timeCalculated = `\`${timeTakenSECS}s\`, \`${differencePercentage}\` ${highLow}`;

    msg.channel.send(`${timeCalculated} than \`${expectedSeconds}s\``);
  }
});
 
client.login(config.token);