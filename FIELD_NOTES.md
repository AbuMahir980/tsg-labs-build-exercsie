## Real Problem 1

### Problem — Paystack test request failed because of curl formatting

**Date/time:** 27 October 2026, evening  
**Area:** Paystack

**What happened**

I wanted to confirm that my Paystack test secret key was working before building the payment tools. My first request failed instead of returning the account balance.

**Exact error / response**

```text
No Authorization header was found

curl: (3) URL rejected: Malformed input to a URL function
```

**What I initially suspected**

- I first thought there might be a problem with the Paystack test key or that the environment variable had not loaded properly.

**How I investigated**

1. I checked whether `PAYSTACK_SECRET_KEY` was actually loaded from `.env`.
2. The terminal confirmed that the key was loaded.
3. I then looked at the curl command itself and noticed the multiline formatting was being interpreted wrongly.
4. I changed the request to a single-line curl command.

**Root cause**

The Paystack key was fine. The problem was how I entered the multiline curl command. The line-continuation characters caused the command to be read incorrectly, so the Authorization header was not sent properly.

**Fix or workaround**

I used a single-line request instead:

```bash
curl https://api.paystack.co/balance -H "Authorization: Bearer $PAYSTACK_SECRET_KEY"
```

**How I verified the fix**

Paystack returned:

```text
status: true
message: Balances retrieved
```

That confirmed that the secret key and Paystack API connection were working.

**What I would improve in Chord / docs / API**

For quick setup checks, it would help to include a single-line curl example as well as the multiline version. It is easier to copy into a terminal and avoids this type of formatting issue.

**Status:** Resolved

---

## Real Problem 2

### Problem — TypeScript showed errors for Node APIs even though the server could run

**Date/time:** 27 October 2026, evening  
**Area:** Tool / MCP setup

**What happened**

While setting up the MCP HTTP server, VS Code started showing TypeScript errors around Node features such as `node:http`, `node:url` and `process.env`.

The confusing part was that the MCP server itself could still run.

**Exact error / response**

```text
The exact VS Code error text was not saved, but the editor highlighted Node imports
and Node globals such as node:http, node:url and process.env.
```

**What I initially suspected**

- I thought I might have imported the Node modules wrongly or that there was a problem with the MCP packages.

**How I investigated**

1. I confirmed that Node itself was installed and working.
2. I ran the MCP server and confirmed that it could start successfully.
3. Since the runtime worked but VS Code still complained, I checked the TypeScript setup.
4. I found that the Node type definitions were not installed.

**Root cause**

The project did not have `@types/node`, so TypeScript did not have the type information for Node's built-in modules and globals.

**Fix or workaround**

I installed the Node type definitions:

```bash
npm install -D @types/node
```

**How I verified the fix**

The Node-related TypeScript errors cleared while the MCP server continued to run normally.

**What I would improve in Chord / docs / API**

For a Node + TypeScript MCP example, I would include `@types/node` in the setup steps. Without it, the code can run while the editor still shows errors, which can make it look like the setup is broken.

**Status:** Resolved

---

## Real Problem 3

### Problem — The basic MCP setup did not directly match the server type Chord needed

**Date/time:** 27 October 2026, evening  
**Area:** Chord / Tool

**What happened**

I used the MCP getting-started documentation to create the server and register my first tool.

That part was useful, but I then realised that Chord needed the MCP server to be reachable remotely through Streamable HTTP and eventually through a public HTTPS URL.

The basic MCP setup I was following did not take me directly through that full Chord-compatible setup.

**Exact error / response**

```text
No runtime error.

The issue was that I had to move between the MCP getting-started documentation,
the HTTP-serving documentation and the Chord MCP documentation to understand
the complete setup Chord required.
```

**What I initially suspected**

- At first I thought creating the `McpServer` and registering the tool might be enough for Chord to use it.

**How I investigated**

1. I checked the Chord MCP documentation again.
2. I confirmed that Chord acts as the MCP client and requires a remote Streamable HTTP server.
3. I then checked the MCP HTTP-serving documentation.
4. I added the Node HTTP adapter and exposed the MCP handler through a local `/mcp` endpoint.
5. I tested the endpoint directly before moving on to the external systems.

**Root cause**

The beginner MCP setup and Chord's actual deployment requirement were at different levels. The beginner guide explained how to build the MCP server and tools, while Chord required the additional HTTP and remote-access setup.

**Fix or workaround**

I kept the MCP server/tool structure from the getting-started guide and added the Streamable HTTP setup separately.

My local MCP endpoint became:

```text
http://127.0.0.1:3000/mcp
```

**How I verified the fix**

I called `tools/list` against the local MCP endpoint and it successfully returned:

```text
check_inventory
```

I later used the same endpoint successfully for `check_inventory`, `create_reservation` and `create_payment`.

**What I would improve in Chord / docs / API**

I would add a very small "Chord-compatible MCP server" example to the Chord docs, showing the full path from creating an MCP server to exposing it through Streamable HTTP.

That would make it easier for someone building their first Chord tool to know which parts of the general MCP documentation they actually need.

**Status:** Resolved