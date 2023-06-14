This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Dependency Management

When updating dependencies, there are various files that must be kept up-to-date. Newly added, or updated dependencies can introduce unwanted/malicious scripts that can introduce risks for users and/or developers. The `lavamoat allow-scripts` feature allows us to deny by default, but adds some additional steps to the usual workflow.

`yarn.lock`:

- Instead of running `yarn` or `yarn install`, run `yarn setup` to ensure the `yarn.lock` file is in sync and that dependency scripts are run according to the `allowScripts` policy (set in `packages.json`)
- If `lavamoat` detects new scripts that are not explicitely allowed/denied, it'll throw and error with details (see below)
- Running `yarn setup` will also dedupe the `yarn.lock` file to reduce the dependency tree. Note CI will fail if there are dupes in `yarn.lock`!

The `allowScripts` configuration in `package.json`:

- There are two ways to configure script policies:
  1. Update the allow-scripts section manually by adding the missing package in the `allowScripts` section in `package.json`
  2. Run `yarn allow-scripts auto` to update the `allowScripts` configuration automatically
- Review each new package to determine whether the install script needs to run or not, testing if necessary.
- Use `npx can-i-ignore-scripts` to help assessing whether scripts are needed

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Creating Color Themes

1. Copy one of the other color themes in [tailwind.config.js](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/tailwind.config.js) (starting line 25)
2. Modify the colors. For the variables bkg-\* and fgd-\* pick a base color for bkg-1 and fgd-1 then adjust the lightness for 2-4. Use this same process to create dark/hover variations for the colors that have these properties. The base color can be anything that works for your theme.
3. Add your corresponding theme values [here](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/styles/colors.ts). The format needs to be converted to HEX, you can paste the HSL values into [Coolors](https://coolors.co/fff05a-ffd25a-ffaa5a-ff785a-191919) to do this.
4. Copy one of the other themes in [global.css](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/styles/globals.css) and modify to match your theme name in tailwind.config.js
5. Add a translation variable for your theme name in [locales](https://github.com/blockworks-foundation/mango-v4-ui/tree/main/public/locales). Theme names are to be added to settings.json and make sure to add this to each locale (they can all be in English to start with). Make sure the value matches data-theme from your css vars in global.css
6. Add your theme to the THEMES array in [display settings](https://github.com/blockworks-foundation/mango-v4-ui/blob/main/components/settings/DisplaySettings.tsx). It should go after mango-classic then in alphabetical order. You need to use the translation key you added to the locales.
