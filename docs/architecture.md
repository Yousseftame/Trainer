# Frontend Architecture

Scaffold established for the fitness coaching platform (Vite + React 19 + TypeScript).

## Decisions locked in

| Concern | Choice |
|---|---|
| Areas | Public `/`, Admin `/admin/*`, Subscriber `/app/*` |
| Server state | TanStack Query + Firebase reads/mutations |
| Auth session | `AuthProvider` (identity, role, entitlements only) |
| Forms | react-hook-form + zod (when building forms) |
| Global client store | None in v1 |
| i18n | i18next — `en` / `ar` + RTL via `document.dir` |
| Video | `lib/media/video-provider.ts` — not Firebase Storage CDN |
| Admin access | Single dashboard + capability permissions |
| Entitlements | Separate from role (`RequireActiveSubscription`) |

## Layout

- `src/app` — providers, router, guards
- `src/pages` — thin route pages
- `src/features` — domain modules (api/hooks/components as implemented)
- `src/layouts` — public / auth / admin / subscriber shells
- `src/lib` — firebase, query keys, permissions, media
- `src/config` — env, routes, navigation
- `src/i18n` — locales + RTL

## Security note

UI guards are UX only. Firestore rules and Cloud Functions must enforce roles, ownership, and signed file access.

## Next implementation order

1. Auth feature (login/register, profile load, custom claims)
2. Public marketing pages against design
3. Subscribers + subscriptions admin flows
4. Workouts / nutrition
5. Content library + video provider integration
6. Progress + reports
