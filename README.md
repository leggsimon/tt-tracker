# 🏓 Table Tennis Tracker

📖 See the [Remix docs](https://remix.run/docs) and the [Remix Vite docs](https://remix.run/docs/en/main/guides/vite) for details on supported features.

## Development

Run the Vite dev server:

```sh
npm run dev
```

### Database changes

Seed data is in `prisma/seed.ts` To delete and populate with seed data run

```
rm prisma/dev.db &&\
prisma db push &&\
prisma db seed
```

## Deployment

This app is deployed on [fly.io](https://fly.io).

Commits to the `main` branch should be deployed automatically.

### Manual deployment

Manual deployment requires the `flyctl` CLI installed.

To deploy changes:

```sh
fly deploy
```

To open the app

```sh
fly apps open
```
