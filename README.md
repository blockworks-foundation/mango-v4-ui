This repo contains the Next.js app for the Mango v4 user interface.

## ⚡️ Quickstart

To get started, follow these steps:

1. **Clone the repo:** Begin by cloning the repository using the command:

```bash
git clone git@github.com:blockworks-foundation/mango-v4-ui.git
```

2. **Install Dependencies:** Move into the directory and install the dependencies:

```bash
cd mango-v4-ui
yarn setup
```

3. **Run the app:**

```bash
yarn dev
```

4. Browse to http://localhost:3000

## ⌨️ Contributor's Guide

### Code quality

- Avoid duplication
- Consider performance (use useMemo and useCallback where appropriate)
- Create logical components and give them descriptive names
- Destructure objects and arrays
- Define constants for event functions unless they are very simple e.g. a single state update
- Create hooks for shared logic
- Add translation keys in alphabetical order

### Branching

Prefix your branches with your Git username and give them concise and descriptive names
e.g. username/branch-name

### Commits

Add commits for each self-contained change and give your commits clear messages that describe the change. Smaller commits that encompass a specific change are preferred over large commits with many changes

### PRs

All PRs should have a meaningful name and include a description of what the changes are.

- If there are visual changes, include screenshots in the description.

- If the PR is unfinished include a "TODO" section with work not yet completed. If there are known issues/bugs include a section outlining what they are.

#### Drafts

Opening draft PRs is a good way for other contributors to know a feature is being worked on. This is most useful for larger/complex features and is not a requirement. When your feature is at a point where you'd like to gather feedback or it's close to completion open a draft PR and share the preview link in the relevant Discord channel

Prefix "WIP:" to your draft PR name

### Reviews

When your changes are finished, who you request review from depends on the type of changes.

For complex changes e.g. new transactions, large features, lots of client or backend interactions you should at a minimum include @tlrsssss in your review

For changes that affect visual elements of the app (including text changes), request a review from @saml33 at a minimum

If you're unsure, request a review from @tlrssss and @saml33

If your work involves other parts of the stack (backend, client, etc.) request a review from the relevant person in that area

## 🎨 Creating Color Themes

1. Copy one of the other color themes in [tailwind.config.js](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/tailwind.config.js) (starting line 25)
2. Modify the colors. For the variables bkg-\* and fgd-\* pick a base color for bkg-1 and fgd-1 then adjust the lightness for 2-4. Use this same process to create dark/hover variations for the colors that have these properties. The base color can be anything that works for your theme.
3. Add your corresponding theme values [here](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/styles/colors.ts). The format needs to be converted to HEX, you can paste the HSL values into [Coolors](https://coolors.co/fff05a-ffd25a-ffaa5a-ff785a-191919) to do this.
4. Copy one of the other themes in [global.css](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/styles/globals.css) and modify to match your theme name in tailwind.config.js
5. Add a translation variable for your theme name in [locales](https://github.com/blockworks-foundation/mango-v4-ui/tree/main/public/locales). Theme names are to be added to settings.json and make sure to add this to each locale (they can all be in English to start with). Make sure the value matches data-theme from your css vars in global.css
6. Add your theme to the THEMES array in [display settings](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/components/settings/DisplaySettings.tsx). It should go after mango-classic then in alphabetical order. You need to use the translation key you added to the locales.
