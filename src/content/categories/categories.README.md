# categories.json — placeholder localization status

The `name.{en,de,ru}` and `subcategories[].name.{en,de,ru}` values in
`categories.json` are **TR placeholders** at v1.1 prep (Task 13). They
intentionally repeat the TR string verbatim — fast to write, fast to
recognize as not-yet-translated.

## When fetch.php first pushes real data

The production fetch pipeline (PHP, daily on the WordPress server)
runs DeepL on every category and subcategory name and writes proper
EN/DE/RU translations into this file as part of its normal flow.
After the first fetch.php push, all four locales should differ.

## Drift test

`src/content/categories/categories.test.ts` walks this file and warns
if any locale's value still equals the TR value. The warning is
intentional — it catches forgotten placeholders that survive past the
first fetch.php run.

A failing drift warning means: either fetch.php didn't run, or
fetch.php ran but didn't reach DeepL for that string. Investigate
both paths before suppressing.
