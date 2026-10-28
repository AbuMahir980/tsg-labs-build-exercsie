# TSG Labs Build Exercise — Deployment Field Notes

## Real Problem 1

### Problem — Paystack test request failed because the Authorization header was not sent correctly

**Date/time:** 27 October 2026, during local integration testing  
**Area:** Paystack / Tool

**What happened**

While testing the Paystack API from the terminal, the first request failed even though I had already added my Paystack test secret key to the environment.

**Exact error / response**

```text
No Authorization header was found

curl: (3) URL rejected: Malformed input to a URL function
```

**What I initially suspected**

- I first thought the Paystack test key might be wrong or not loading from the environment.

**How I investigated**

1. I confirmed that the test key existed in my `.env`.
2. I checked the curl command I had pasted into the terminal.
3. I noticed that the command formatting caused the Authorization header not to be included properly in the request.

**Root cause**

The problem was not Paystack or the API key. The curl command was formatted incorrectly, so the Authorization header was not being sent as part of the request.

**Fix or workaround**

I corrected the curl command and made sure the Authorization header was passed properly:

```text
Authorization: Bearer <test-secret-key>
```

**How I verified the fix**

I ran the Paystack balance request again and got a successful response showing:

```text
Balances retrieved
```

**What I would improve in Chord / docs / API**

A copy-paste-ready example for testing external APIs from the command line would be useful, especially showing correct multiline curl formatting. A small formatting mistake can look like an authentication problem when the real issue is just the request syntax.

**Status:** Resolved

---

## Real Problem 2

### Problem — TypeScript showed errors for Node APIs even though the MCP server could run

**Date/time:** 27 October 2026, during MCP server setup  
**Area:** Tool / TypeScript / MCP

**What happened**

After setting up the TypeScript MCP server, VS Code started showing several TypeScript errors around Node-specific imports and globals such as `process`.

The code itself was close to working, but the editor was reporting a lot of problems, which made it look like there were issues with the MCP implementation.

**Exact error / response**

```text
VS Code showed multiple TypeScript errors around Node imports and Node globals such as process.
```

There was no single runtime error because this was mainly a TypeScript/editor issue.

**What I initially suspected**

- I thought I might be importing the MCP or Node packages incorrectly.
- I also checked whether the Node version was causing the issue.

**How I investigated**

1. I checked the Node version and confirmed Node was installed correctly.
2. I checked the packages already installed in the MCP server.
3. I noticed that the Node type definitions were missing.
4. I installed `@types/node`.

**Root cause**

The project had Node installed, but TypeScript did not have the Node type definitions it needed to understand Node APIs and globals.

**Fix or workaround**

I installed the Node type definitions as a development dependency:

```text
npm install -D @types/node
```

**How I verified the fix**

The Node-related TypeScript problems were resolved, and the MCP server continued to run successfully.

**What I would improve in Chord / docs / API**

For a TypeScript custom MCP example, it would help if the setup instructions explicitly included `@types/node` in the required development dependencies. It is a small dependency, but missing it creates a lot of noise in the editor.

**Status:** Resolved

---

## Real Problem 3

### Problem — The basic MCP setup did not directly match what Chord needed for deployment

**Date/time:** 27 October 2026, during MCP integration  
**Area:** Chord / MCP / Deployment

**What happened**

When I first started building the MCP server, most of the beginner MCP material I was working from was centred around local MCP usage.

My server was initially running locally at:

```text
http://127.0.0.1:3000/mcp
```

Later, when preparing to connect it to Chord, I found that Chord needed a publicly reachable HTTPS MCP server using Streamable HTTP.

So there was an extra deployment step between “my MCP server works locally” and “Chord can actually use it”.

**Exact error / response**

```text
No single error message.

The local MCP server worked, but a localhost address could not be used as the Chord custom MCP server URL.
```

**What I initially suspected**

- At first I thought getting the MCP server working locally would be enough to connect it to Chord.
- I later realised Chord needed a remote Streamable HTTP endpoint.

**How I investigated**

1. I confirmed the MCP tools were working locally with `tools/list`.
2. I checked Chord's custom MCP requirements.
3. I changed the server configuration so it could listen on the deployment host and port.
4. I deployed the MCP server to Render.
5. I added bearer authentication and registered the public URL in Chord.

**Root cause**

The MCP development setup and the Chord deployment setup are two different stages. Localhost is useful for development, but Chord needs a public HTTPS endpoint.

**Fix or workaround**

I deployed the MCP server to Render and exposed:

```text
https://<render-service>/mcp
```

using Streamable HTTP and bearer-token authentication.

**How I verified the fix**

First, I called `tools/list` against the public Render endpoint and got all five tools.

I then added the server in Chord, and Chord successfully discovered:

```text
check_inventory
create_reservation
create_payment
verify_payment
update_fulfilment
```

**What I would improve in Chord / docs / API**

It would help to have one small end-to-end TypeScript example in the Chord docs showing the full path:

```text
local MCP server
→ Streamable HTTP
→ deploy to public HTTPS
→ add authentication
→ register in Chord
→ confirm tool discovery
```

That would make the jump from local MCP development to a Chord-ready server much clearer.

**Status:** Resolved

---

## Real Problem 4

### Problem — Skill updates depend on manually uploading a local folder

**Date/time:** 28 October 2026, during teammate setup  
**Area:** Chord / Skill

**What happened**

When creating the teammate, Chord asked me to upload the Skill as a local file or folder.

This worked, but it made me think about the update workflow. The Skill itself is a `SKILL.md` file with YAML frontmatter, which is already quite developer-oriented. In my case, I am developing the Skill alongside the rest of the project and tracking the project in GitHub.

If I make a change to the Skill later, I have to update the file in my project and then manually upload or update it in Chord again.

**Exact error / response**

```text
No error message.

The teammate creation flow asked me to choose a local Skill file or folder.
```

**What I initially suspected**

- I expected there might be an option to connect the Skill directly to a GitHub repository or branch instead of uploading the folder manually.

**How I investigated**

1. I checked the teammate creation flow.
2. The options available were to choose a local file or folder.
3. I did not see an option on that screen to connect the Skill directly to a GitHub repository.

**Root cause**

The Skill setup flow I used is upload-based, while my development workflow is source-control based.

**Fix or workaround**

I uploaded the local `papahandmadeit-limited-drop` folder into Chord.

I continue to keep the project version under source control and manually update the Skill in Chord when the Skill changes.

**How I verified the fix**

Chord read the folder correctly and detected:

```text
papahandmadeit-limited-drop/SKILL.md
```

The Skill was then published to the teammate successfully.

**What I would improve in Chord / docs / API**

For technical users, it would be useful to support connecting a Skill directly to a GitHub repository and branch, with an option to sync or refresh it when the source changes.

Since creating a `SKILL.md` with YAML frontmatter already assumes some technical familiarity, a Git-based workflow would fit naturally and would reduce the chance of the Skill running in Chord becoming different from the version in the repository.

The local upload option can still remain for users who do not use Git.

**Status:** Workaround

---

## Real Problem 5

### Problem — Inventory worked with the product name but failed with a normal customer sentence

**Date/time:** 28 October 2026, during Chord end-to-end testing  
**Area:** Chord / MCP Tool / Google Sheets

**What happened**

During the first real test with the Chord teammate, I asked:

```text
Do you have the Indigo Heritage Shirt in Large?
```

The teammate checked inventory but told me that the item could not be found.

This was incorrect because the Google Sheet had:

```text
SKU: PHM-002
Product: Indigo Heritage Shirt
Variant: Large
Available: 4
```

When I asked again using only:

```text
Do you have the Indigo Heritage Shirt?
```

the tool found the item correctly and returned the live inventory.

**Exact error / response**

The first response was essentially:

```text
The Indigo Heritage Shirt in Large isn't in the listed inventory right now.
```

The second test returned:

```text
SKU: PHM-002
Variant: Large
Price: ₦35,000
Available: 4
```

**What I initially suspected**

- I first wanted to confirm whether the teammate actually had access to the MCP tool.
- I also considered whether the item name or variant in the Google Sheet was different from what I expected.

**How I investigated**

1. I confirmed that Chord had discovered the `check_inventory` MCP tool.
2. I tested the same item again without adding “in Large”.
3. The second request returned the correct live data.
4. I checked the matching logic inside `check-inventory.ts`.
5. I found that the search logic was too strict when the model passed a longer natural-language phrase.

**Root cause**

The inventory tool had been designed mainly around clean product-name inputs.

A normal WhatsApp-style input such as:

```text
Indigo Heritage Shirt in Large
```

was longer than the stored product name:

```text
Indigo Heritage Shirt
```

so the original string matching could fail even though the correct product was present.

**Fix or workaround**

I updated the matching logic so it can recognise the product name inside a longer customer query and can also compare the product name together with the variant.

This allowed normal phrases such as:

```text
Do you have the Indigo Heritage Shirt in Large?
```

to find the correct product.

**How I verified the fix**

I pushed the change, allowed Render to redeploy the MCP server, and repeated the original question in Chord.

The teammate then returned:

```text
Indigo Heritage Shirt
Large
₦35,000
Available: 4
```

using the live Google Sheet data.

**What I would improve in Chord / docs / API**

Custom-tool examples could make it clearer that tool arguments generated by an AI teammate may come from normal customer language rather than clean database-style values.

A short example showing how to normalise or safely match natural-language arguments before querying an external system would help builders avoid designing tools that only work with perfect test inputs.

**Status:** Resolved