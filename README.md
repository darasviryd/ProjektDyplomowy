Shopping Notes
Aplikacja mobilna przygotowana jako projekt dyplomowy. Sluzy do tworzenia list zakupow, kontrolowania wydatkow oraz zapisywania subskrypcji.

Projekt sklada sie z dwoch czesci:

shopping-notes - aplikacja mobilna;
shopping-backend - backend aplikacji.
Technologie
Frontend:

React Native
Expo
JavaScript
React Navigation
AsyncStorage
Backend:

NestJS
TypeScript
SQLite
TypeORM
JWT
Uruchomienie
Backend:

cd shopping-backend
npm install
npm run start
Aplikacja mobilna:

cd shopping-notes
npm install
npx expo start
Backend dziala domyslnie na porcie 4000.

Opis
Uzytkownik moze zakladac konto, tworzyc listy zakupow, dodawac produkty, oznaczac je jako kupione oraz ustawic limit wydatkow. W aplikacji mozna tez zapisac subskrypcje i dzien ich platnosci.

Waluty nie sa przeliczane wedlug kursu online. Kwoty sa wyswietlane w walucie, w ktorej zostaly dodane.
