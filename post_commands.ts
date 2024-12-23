const APP_ID = Deno.env.get("APP_ID");
const BOT_TOKEN = Deno.env.get("BOT_TOKEN");

console.log("ids:", APP_ID, BOT_TOKEN);

const commands = {
  name: "inspirame",
  type: 1,
  description: "te da una frase bien chingona",
};

const res = await fetch(
  `https://discord.com/api/v10/applications/${APP_ID}/commands`,
  {
    method: "POST",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  }
);

console.log(res);

const data = await res.json();

console.log(data);

console.log("EXIT");
