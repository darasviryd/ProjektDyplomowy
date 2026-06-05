# Shopping Notes

Mobilna aplikacja do zarzadzania listami zakupow i subskrypcjami.

## Funkcje

- rejestracja i logowanie uzytkownika;
- osobne listy zakupow dla kazdego konta;
- dodawanie produktow z cena, iloscia, waluta i priorytetem;
- oznaczanie zakupionych produktow;
- miesieczny limit wydatkow;
- obsluga kilku walut bez przeliczania kursow;
- lista subskrypcji z dniem platnosci i przypomnieniem.

## Uruchomienie

```bash
npm install
npx expo start
```

Domyslnie aplikacja laczy sie z backendem na porcie `4000`.
Adres API mozna zmienic przez zmienna `EXPO_PUBLIC_API_URL`.

## Sprawdzenie projektu

```bash
npm run lint
npx tsc --noEmit
```
