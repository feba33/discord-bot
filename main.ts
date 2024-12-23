import { route, type Route } from "@std/http";
import nacl from "https://esm.sh/tweetnacl@v1.0.3?dts";

const PUBLIC_KEY = "f56b84d8db9a8b4e06f727e5243515262dac94a0b666e6e23dcf469f2ed269b0";

function hexToUint8Array(hex: string) {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)),
  );
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
      console.log(req)

      const signature = req.headers.get("X-Signature-Ed25519")!;
      const timestamp = req.headers.get("X-Signature-Timestamp")!;
      const body = await req.text();

      const isVerified = nacl.sign.detached.verify(
        new TextEncoder().encode(timestamp + body),
        hexToUint8Array(signature),
        hexToUint8Array(PUBLIC_KEY),
      );

      if(!isVerified) {
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
        )
      }
      
      return new Response(
        JSON.stringify({
          type: 1,
        }),
        {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        }
      )
    }
  },
  // {
  //   pattern: new URLPattern({ pathname: "/" }),
  //   handler: (req) =>
  //     new Response("Hello World", {
  //       status: 200,
  //       headers: new Headers({ "Content-Type": "text/plain" }),
  //     }),
  // },
];

Deno.serve(route(routes, () => new Response("Not Found", { status: 404 })));
