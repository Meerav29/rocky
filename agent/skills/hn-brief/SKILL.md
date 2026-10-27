---
description: Use when the user asks for a Hacker News brief, the top tech stories today, or what is trending on HN.
---

# Hacker News brief

1. Use run to `goto` https://news.ycombinator.com/ in the current browser.
2. Call snapshot and read the front page. Do not open individual stories unless the user asks.
3. Pick the top 5 stories by rank. For each, record the title, the site in parentheses,
   points, and comment count. Skip job posts (they have no points).
4. Reply with a numbered list, one line per story:
   `1. Title (site) - 312 points, 140 comments`
   Then add one sentence on the common theme, if there is one.
5. Take a screenshot so the user can see the page you read.

If the snapshot reports the page as blocked, say so and stop. Do not try other sites.
