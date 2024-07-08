# 🏓 Table Tennis Tracker

## Development

Run the Vite dev server:

```sh
npm run dev
```

### Initial setup

```
npm install
cp .env.local .env
prisma db push
prisma db seed
```

This will create three users

| Username | Password         |
| -------- | ---------------- |
| `Simon`  | `simonpassword`  |
| `Quinn`  | `quinnpassword`  |
| `Shelly` | `shellypassword` |

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
