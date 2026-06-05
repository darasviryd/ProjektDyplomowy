# Shopping Notes

Mobilna aplikacja do planowania zakupow, wishlist, limitow budzetowych i subskrypcji.

## Funkcje

- logowanie i rejestracja
- osobne dane dla kazdego konta
- listy zakupow i listy na konkretne wydarzenia
- produkty z cena, iloscia, waluta, priorytetem i linkiem
- pobieranie zdjecia produktu z linku
- oznaczanie produktow jako kupione
- podsumowanie wydatkow w walutach, w ktorych produkty zostaly dodane
- globalny limit wydatkow
- subskrypcje z dniem platnosci i przypomnieniami
- import paragonu z tekstu
- analiza zdjecia paragonu przez backend i Gemini API
- praca lokalna z synchronizacja danych list i produktow

## Uruchomienie

```bash
npm install
npx expo start
```

Aplikacja laczy sie z backendem dzialajacym na porcie `4000`. Adres API mozna ustawic w `.env` przez `EXPO_PUBLIC_API_URL`.

## Konfiguracja iOS

W `app.json` wlaczony jest dostep do lokalnej sieci, zeby aplikacja mogla polaczyc sie z backendem uruchomionym na komputerze. Nie jest wlaczone globalne `NSAllowsArbitraryLoads`.

## Sprawdzenie projektu

```bash
npm run lint
```
