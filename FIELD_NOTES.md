# Deployment Field Notes

These are the main issues I ran into while building and testing the Papahandmadeit Limited Drop Assistant.

## 1. A normal customer sentence failed the inventory search

### What happened

During testing, I asked:

`Do you have the Indigo Heritage Shirt in Large?`

The tool returned that the item was not found.

When I searched with just:

`Indigo Heritage Shirt`

the same item was found correctly in the Google Sheet.

### How I found the cause

Since the product was clearly in the inventory, I compared the working query with the one that failed.

The first version of my matching logic was too strict. It worked when the input was close to the stored product name, but could fail when the customer used a normal sentence with extra words and the variant included.

### What I did

I updated the inventory matching logic so it could compare the query against the product name, SKU and the product name together with its variant.

I redeployed the MCP server and tested the original sentence again. It then returned the correct product, variant, price and availability.

### What I would improve

I think Chord examples for custom tools could include a little more guidance on handling natural-language input before passing it into business systems.

The model may understand what the customer means, but the tool still needs to safely handle the actual input it receives.

---

## 2. The Direct Line stopped responding without showing a clear failure

### What happened

While testing the teammate through Chord's Direct Line, I reached a point where new messages stopped getting responses.

The teammate was still active and I still had credits available, but the messages stayed unanswered.

I also checked the Activity page and did not see a clear failed run or error explaining what had happened.

### How I investigated it

I first checked whether I had run out of credits or whether the teammate had been paused.

Neither was the case.

I then checked the Activity section to look for an error or failed execution, but there was nothing there that clearly explained why the latest messages had not been processed.

Because I could not see enough information to diagnose the internal cause, I stopped spending time on that thread and continued testing through the simulator instead.

### What I did

I treated the Direct Line issue as a testing problem rather than blocking the rest of the build.

I moved on to the WhatsApp Simulator, which was the channel required for the exercise anyway.

### What I would improve

If a Direct Line message does not start or complete a run, I would like to see that clearly in Activity.

For example, showing a status such as `failed`, `timed out` or `not started`, together with the reason, would make it much easier to know whether the problem is with the Skill, a tool, the model or the Chord platform.

---

## 3. I initially tested the simulator with the wrong teammate

### What happened

After creating the Papahandmadeit teammate, I opened the WhatsApp Simulator and started testing.

The inventory response worked, but I later noticed that the chat header still said:

`Chord Assistant · Test chat`

instead of:

`Papahandmadeit Limited Drop Assistant`

So although I was testing in the simulator, I was not yet using the simulator link for the teammate I had just built.

### How I found the cause

I went back to the WhatsApp Simulator agent list.

There I saw that the original Chord Assistant already had a chat link, while the Papahandmadeit teammate showed that it had no chat link yet.

That explained why the simulator I had opened was still connected to the original assistant.

### What I did

I created a new simulator chat link specifically for the Papahandmadeit Limited Drop Assistant and used that link for the final end-to-end test.

### What I would improve

I would make the teammate connected to a simulator link more obvious from the teammate page.

A direct **Create/Open Simulator Chat** action from the selected teammate would also reduce the chance of opening an older simulator link and testing the wrong agent.