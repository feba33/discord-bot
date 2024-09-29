import {  } from '@std/http';


Deno.serve((req)=>{
  console.log(req)

  return new Response('Hello World', {
    status: 200,
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  })
})