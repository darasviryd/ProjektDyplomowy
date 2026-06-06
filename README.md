[README.md](https://github.com/user-attachments/files/28664610/README.md)
# Shopping Notes

Shopping Notes to aplikacja mobilna przygotowana jako projekt dyplomowy. Projekt pomaga planowac zakupy, kontrolowac budzet, zapisywac wydatki i pilnowac cyklicznych platnosci.

Repozytorium sklada sie z dwoch czesci.

- `shopping-notes` aplikacja mobilna w Expo
- `shopping-backend` backend w NestJS

## Najwazniejsze funkcje

- rejestracja i logowanie uzytkownika
- oddzielne dane dla kazdego konta
- tworzenie list zakupow i wishlist
- dodawanie produktow z cena, iloscia, waluta i linkiem
- pobieranie zdjecia produktu z linku i wyswietlanie go w notatce
- oznaczanie produktow jako kupione
- kontrola limitu listy i limitu globalnego
- obsluga kilku walut bez automatycznego przeliczania kursu
- subskrypcje z dniem platnosci i przypomnieniami
- import paragonu z tekstu
- analiza zdjecia paragonu przez AI
- synchronizacja danych list i produktow z backendem

## Technologie

Frontend

- React Native
- Expo
- JavaScript
- React Navigation
- AsyncStorage
- Expo Notifications
- Expo Image Picker

Backend

- NestJS
- TypeScript
- SQLite
- TypeORM
- JWT
- bcrypt

## Uruchomienie

Backend

```bash
cd shopping-backend
npm install
npm run start
```

Aplikacja mobilna

```bash
cd shopping-notes
npm install
npx expo start
```

Backend dziala domyslnie na porcie `4000`.



## Bezpieczenstwo i konfiguracja

Tokeny JWT sa podpisywane sekretem z `JWT_SECRET`.

TypeORM ma wlaczona synchronizacje schematu tylko przez zmienna `TYPEORM_SYNCHRONIZE`. W projekcie dyplomowym zostala wartosc `true`, bo SQLite jest lokalna baza do prostego sprawdzenia aplikacji. Przy wdrozeniu produkcyjnym nalezaloby ustawic `false` i zastosowac migracje.

CORS jest ograniczony do adresow podanych w `CORS_ORIGIN`. Przy testach w Expo mozna dopisac kolejny adres, jezeli Metro lub aplikacja dziala pod innym hostem.

W konfiguracji iOS wlaczony jest dostep do lokalnej sieci przez `NSAllowsLocalNetworking`. Nie jest wlaczone globalne `NSAllowsArbitraryLoads`, wiec aplikacja nie wylacza kontroli SSL dla wszystkich adresow.

## Testy

Backend ma prosty test parsera paragonow. Po instalacji zaleznosci mozna go uruchomic poleceniem.

```bash
cd shopping-backend
npm run test
```

Test sprawdza rozpoznawanie produktow, sumy paragonu i zachowanie waluty z tekstu paragonu.
