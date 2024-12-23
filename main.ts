import { route, type Route } from "@std/http";
import nacl from "https://esm.sh/tweetnacl@v1.0.3?dts";

const PUBLIC_KEY =
  "f56b84d8db9a8b4e06f727e5243515262dac94a0b666e6e23dcf469f2ed269b0";
const INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
};

function hexToUint8Array(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)));
}

function buildCallbackQuery(
  interactionID: string,
  interactionToken: string,
  body: any
) {
  return fetch(
    `https://discord.com/api/v10/interactions/${interactionID}/${interactionToken}/callback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
}

async function getQuote() {
  const res = await fetch(
    "http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en"
  );
  const body = await res.json();

  return {
    text: body.quoteText,
    author: body.quoteAuthor,
  };
}

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/" }),
    handler: (req) =>
      new Response("Hello World", {
        status: 200,
        headers: new Headers({ "Content-Type": "text/plain" }),
      }),
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/api" }),
    handler: async (req) => {
      // console.log(req);

      const signature = req.headers.get("X-Signature-Ed25519")!;
      const timestamp = req.headers.get("X-Signature-Timestamp")!;
      const body = await req.text();

      const isVerified = nacl.sign.detached.verify(
        new TextEncoder().encode(timestamp + body),
        hexToUint8Array(signature),
        hexToUint8Array(PUBLIC_KEY)
      );

      if (!isVerified) {
        return new Response(
          JSON.stringify({
            type: 4,
            data: {
              content: "Signature is invalid",
            },
          }),
          {
            status: 401,
            headers: new Headers({ "Content-Type": "application/json" }),
          }
        );
      }

      const parsedBody = JSON.parse(body);
      // console.log(parsedBody);

      switch (parsedBody.type) {
        case INTERACTION_TYPE.PING:
          return new Response(
            JSON.stringify({
              type: 1,
            }),
            {
              status: 200,
              headers: new Headers({ "Content-Type": "application/json" }),
            }
          );
        case INTERACTION_TYPE.APPLICATION_COMMAND: {
          setTimeout(async () => {
            const quote = await getQuote();

            await buildCallbackQuery(
              parsedBody.id,
              parsedBody.token,
              {
                type: 4,
                data: {
                  content: "",
                  embeds: [
                    {
                      title: `" ${quote.text} "`,
                      description: `-${quote.author}`,
                    },
                  ],
                },
              }
            );
          }, 0);

          return new Response(JSON.stringify(undefined), {
            status: 202,
            headers: new Headers({ "Content-Type": "application/json" }),
          });
        }
        default:
          return new Response(undefined, { status: 404 });
      }
    },
  },
];

Deno.serve(route(routes, () => new Response("Not Found", { status: 404 })));
