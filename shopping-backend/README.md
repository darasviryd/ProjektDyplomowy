# Shopping Notes API

Backend aplikacji Shopping Notes przygotowany w NestJS. Serwer udostepnia proste API do synchronizacji danych uzytkownika: list zakupow, produktow, ustawien limitu oraz subskrypcji.

## Technologie

- NestJS;
- TypeScript;
- SQLite;
- TypeORM.

## Uruchomienie

```bash
npm install
npm run start
```

Serwer dziala domyslnie pod adresem:

```text
http://localhost:4000
```

## Sprawdzenie projektu

```bash
npm run build
npm run lint
```

## Dane

Baza SQLite jest tworzona lokalnie podczas pracy aplikacji. Dane sa przypisane do konta uzytkownika, dlatego po rejestracji nowe konto nie korzysta z list ani limitow innego uzytkownika.
