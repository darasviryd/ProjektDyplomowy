# Shopping Notes API

Backend aplikacji Shopping Notes przygotowany w NestJS. Serwer obsluguje konta uzytkownikow, listy zakupow, produkty, synchronizacje danych oraz import paragonu.

## Technologie

- NestJS
- TypeScript
- SQLite
- TypeORM
- JWT
- bcrypt
- Gemini API

## Uruchomienie

```bash
npm install
npm run start
```

Serwer dziala pod adresem `http://localhost:4000`.

## Konfiguracja

Backend korzysta z pliku `.env`.

```bash
GEMINI_API_KEY=...
GEMINI_VISION_MODEL=gemini-2.0-flash
JWT_SECRET=...
TYPEORM_SYNCHRONIZE=true
CORS_ORIGIN=http://localhost:8081,http://localhost:19006
```

`JWT_SECRET` jest wymagany. Bez tej zmiennej serwer nie uruchomi sie, poniewaz tokeny JWT nie powinny byc podpisywane stalym sekretem wpisanym w kodzie.

`TYPEORM_SYNCHRONIZE=true` jest ustawieniem do lokalnego sprawdzania projektu z SQLite. W wersji produkcyjnej nalezaloby ustawic `false` i zastosowac migracje.

## Endpointy

- `POST /auth/register`
- `POST /auth/login`
- `GET /lists`
- `POST /lists`
- `PATCH /lists/:id`
- `DELETE /lists/:id`
- `POST /items`
- `PATCH /items/:id`
- `DELETE /items/:id`
- `POST /sync`
- `POST /receipt-ai/analyze`
- `POST /receipt-ai/import`

## Testy

```bash
npm run test
```

Dodany test sprawdza parser paragonu, rozpoznawanie pozycji, sumy i waluty.
