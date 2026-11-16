# Fotballbanken

En liten norsk øvelsesbank for barnefotball. React + Vite + ferdige Radix Themes-komponenter. Ingen backend, database eller konto.

**Nettside:** https://test.sellie.no · **Hosting:** GitHub Pages

## Funksjoner

- Ni øvelser med baneskisser, utstyr, instruksjoner og trenertips.
- Søk, aldersfilter og kategorier.
- Favoritter via hjertet på hvert kort og filteret «Mine favoritter».
- Treningsplan med samlet varighet, endring av rekkefølge og utskrift.
- «Mine treninger»: lagre flere navngitte treningsøkter og åpne dem som en stegvis, interaktiv visning med forrige/neste øvelse og avkryssing av fullførte øvelser.
- Automatisk lys/mørk modus som følger systemet og oppdateres uten omlasting.
- Installerbar PWA med appikoner og veiledning for Safari/iOS og nettlesere uten direkte installasjon.
- Offline-støtte etter første nettbesøk og ferdig installert service worker.
- Lokalt pakkede skrifter, ikoner og UI-komponenter. Ingen eksterne API-er eller sporingsskript.

Øvelsene er veiledende demoinnhold, ikke et offisielt treningsprogram.

## Kjør, test og bygg

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

PWA/service worker er aktiv i produksjonsbygget (`npm run preview`), ikke i Vites utviklingsserver. Endre øvelsene i `src/exercises.js`. Appikoner kan regenereres uten ekstra avhengigheter med `python3 scripts/generate-icons.py`.

## Lokal lagring

Alle verdier er JSON i `localStorage`:

| Nøkkel | Innhold |
| --- | --- |
| `fotballbanken-plan-v1` | Øvelses-ID-er i valgt treningsrekkefølge. Samme nøkkel som første versjon. |
| `fotballbanken-favorites-v1` | Favorittøvelsenes ID-er. |
| `fotballbanken-filters-v1` | Alder, kategori og om kun favoritter skal vises. |
| `fotballbanken-trainings-v1` | Lagrede treninger med navn, dato, øvelses-ID-er i rekkefølge og fullførte øvelses-ID-er. |

Lagrede treninger er uavhengige kopier av planen du setter sammen. Du kan laste en trening inn som arbeidsplan igjen uten å endre originalen. Øvelsesframdrift lagres separat for hver trening. Ukjente øvelses-ID-er og ugyldige filterverdier ignoreres. Manglende/blokkert lagring gjør ikke appen ubrukelig; endringer beholdes i minnet og en beskjed vises. Endringer synkroniseres mellom faner på samme origin. Sletting av nettleserdata fjerner også lagrede valg. Ingenting synkroniseres mellom enheter.

Ved hostingflytting beholdes data fordi appen fremdeles bruker samme HTTPS-domene, `test.sellie.no`. En annen adresse, inkludert `erlendsellie.github.io`, har separat nettleserlagring.

## GitHub Pages

`.github/workflows/deploy.yml` kjører tester, bygger og publiserer `dist/` ved push til `main`. Pages-kilden er **GitHub Actions**. `public/CNAME` og Pages-innstillingen bruker `test.sellie.no`, og Vite-base er derfor `/`.

DNS: CNAME `test.sellie.no` → `erlendsellie.github.io` (DNS-only, ikke Cloudflare-proxy). HTTPS administreres av GitHub Pages. Appen trenger ikke den tidligere lokale filserveren eller Cloudflare Tunnel.

`vite-plugin-pwa` genererer manifest og en Workbox-service worker med revisjonerte appfiler og lokal fontcache. Nye bygg oppdaterer appcachen automatisk; favoritter og treningsplan ligger separat i `localStorage` og berøres ikke.
