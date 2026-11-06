# Sarab Restaurant CMS – System Zarządzania Treścią Restauracji

> **Projekt laboratoryjny na przedmiot:** Systemy Zarządzania Treścią (SZT)  
> **Uczelnia:** Politechnika Poznańska – Wydział Informatyki i Telekomunikacji  
> **Kierunek:** Informatyka, studia 2. stopnia  
> **Prowadzący:** dr inż. Michał Apolinarski  

---

## O Projekcie

Projekt stanowi dedykowany **System Zarządzania Treścią (CMS)** dla dynamicznej strony internetowej nowoczesnej restauracji fast-casual (*Sarab Restaurant*). 

System składa się z dwóch ściśle zintegrowanych modułów:
1. **Portal klienta (część publiczna)** – wielopodstronowa witryna dla gości restauracji, umożliwiająca przeglądanie aktualnej karty dań, poznanie zespołu kucharzy, sprawdzenie godzin otwarcia, rezerwację stolika online, składanie zapytań kontaktowych oraz wystawianie recenzji.
2. **Panel CMS (część administracyjna)** – chroniony sesją panel oparty o kontrolę dostępu opartą na rolach (**Role-Based Access Control – RBAC**), pozwalający personelowi na sterowanie treścią strony w czasie rzeczywistym.

---

## Dokumentacja Projektowa (Overleaf)

Sprawozdanie laboratoryjne z projektu jest tworzone w systemie LaTeX na platformie Overleaf:
* **Link do projektu w Overleaf:** [Otwórz sprawozdanie w Overleaf (edycja/podgląd)](https://www.overleaf.com/project/6ae8e5f2e5d370fa013d605f/share#333001d2effdd97667c001e3dc80ab66f4d02516b2ac002d)
* **Kod źródłowy szablonu:** Plik szablonu LaTeX ze spisem treści i strukturą wymagań znajduje się lokalnie w repozytorium: [`docs/main.tex`](docs/main.tex).

---

## Szybki Start (Instrukcja dla członków zespołu)

Aby uruchomić projekt lokalnie na swoim komputerze:

### 1. Wymagania wstępne
* Zainstalowane środowisko [Node.js](https://nodejs.org/) (wersja 18.x, 20.x lub 22.x).

### 2. Klonowanie i instalacja zależności
```bash
# 1. Sklonuj repozytorium
git clone <URL_TWOJEGO_REPOZYTORIUM>
cd "Systemy Zarzadzania Trescia"

# 2. Zainstaluj pakiety npm
npm install

# 3. Zainicjalizuj i zasil lokalną bazę SQLite danymi testowymi
npm run init-db

# 4. Uruchom serwer aplikacji
npm start
```

Aplikacja wystartuje domyślnie pod adresem: **http://localhost:3000**

> [!TIP]
> Podczas pisania kodu warto uruchomić serwer w trybie automatycznego odświeżania po zapisie plików:
> ```bash
> npm run dev
> ```

---

## Dane Logowania (Konta Demonstracyjne)

Do panelu administracyjnego można zalogować się pod adresem: **http://localhost:3000/admin/login**

| Rola w systemie | Login | Hasło | Uprawnienia i zakres dostępu |
| :--- | :--- | :--- | :--- |
| **Właściciel (`owner`)** | `admin` | `admin123` | **Pełny dostęp do całego systemu:** zarządzanie kontami użytkowników, moderacja i akceptacja recenzji klientów, edycja kucharzy, konfiguracja danych lokalu + uprawnienia pracownika. |
| **Pracownik (`employee`)** | `pracownik` | `pracownik123` | **Obsługa operacyjna lokalu:** edycja karty menu, wyznaczanie **Dania Dnia**, zmiana statusów rezerwacji stolików, edycja godzin otwarcia lokalu, odczyt wiadomości od klientów. |

*(Na stronie logowania dostępne są także przyciski szybkiego wypełnienia pól jednym kliknięciem).*

---

## Architektura i Organizacja Katalogów

Projekt zrealizowano zgodnie z klasycznym wzorcem **MVC (Model-View-Controller)** oraz renderowaniem po stronie serwera (**Server-Side Rendering – SSR**):

```text
Systemy Zarzadzania Trescia/
├── server.js                  # Główny serwer Express.js i trasy części klienckiej
├── package.json               # Konfiguracja projektu i zależności npm
├── .gitignore                 # Wykluczenia z repozytorium (node_modules, plik sqlite)
│
├── database/                  # MODEL (Baza danych)
│   ├── db.js                  # Moduł połączenia z bazą SQLite (better-sqlite3)
│   ├── init.js                # Skrypt DDL (tworzenie tabel) oraz seed początkowy
│   └── restaurant.sqlite      # Plik bazy danych (generowany przez: npm run init-db)
│
├── routes/                    # KONTROLER (Logika panelu CMS)
│   └── adminRoutes.js         # Trasy panelu, operacje CRUD, ochrona ról (RBAC)
│
├── views/                     # WIDOKI (Szablony EJS)
│   ├── client/                # Podstrony restauracji (Home, Menu, About, Chefs itd.)
│   │   └── partials/          # Wspólne elementy klienta (header, footer, banner)
│   └── admin/                 # Widoki panelu CMS AdminLTE
│       ├── partials/          # Wspólny header, navbar z profilem, sidebar, footer
│       ├── menu/              # Lista potraw (index.ejs) i edycja/dodawanie (form.ejs)
│       └── ...                # Rezerwacje, opinie, godziny otwarcia, użytkownicy
│
├── client/                    # Assety statyczne strony gościa (CSS, JS, obrazy, fonty)
├── admin/                     # Assety statyczne panelu AdminLTE (CSS, JS, ikony)
└── docs/                      # Wymagania formalne przedmiotu i notatki
```

---

## Wykorzystane Technologie

* **Runtime:** [Node.js](https://nodejs.org/) (silnik JavaScript po stronie serwera).
* **Framework Webowy:** [Express.js](https://expressjs.com/) (routing HTTP, potok middleware, obsługa sesji i plików statycznych).
* **Silnik Szablonów (SSR):** [EJS (Embedded JavaScript)](https://ejs.co/) (modułowa budowa layoutów, wstrzykiwanie danych z bazy bez wycieku kodu na frontend).
* **Baza Danych:** [SQLite](https://www.sqlite.org/) z biblioteką [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (szybka relacyjna baza plikowa, klucze obce, transakcyjność, brak konieczności konfiguracji zewnętrznych serwerów bazy danych).
* **Autoryzacja i Bezpieczeństwo:** [`express-session`](https://github.com/expressjs/session) (zarządzanie sesjami użytkowników, ciasteczka sesyjne, kontrola ról RBAC).
* **Stylizacja i UI:** HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, FontAwesome 6.

---

## Podział Funkcjonalności na Aktorów

Zgodnie z wymaganiami projektowymi zdefiniowano następujące role użytkowników:

### 1. Gość restauracji (Klient):
* Przeglądanie 7 dedykowanych podstron: Strona główna, O nas, Karta menu, Kucharze, Rezerwacje, Opinie, Kontakt.
* Filtrowanie potraw wg kategorii (Burgery, Pizza, Kurczak, Wrapy, Makarony, Desery).
* Podgląd szczegółów dania w oknie modalnym (kalorie, czas przygotowania, alergeny).
* Składanie rezerwacji stolika online z wyborem liczby gości, terminu i godziny.
* Dodawanie własnej opinii i oceny w skali 1–5 gwiazdek (opinia trafia do moderacji).
* Wysyłanie wiadomości przez formularz kontaktowy.

### 2. Pracownik (`employee`):
* Pełny CRUD karty dań (dodawanie nowych potraw, edycja cen, kalorii, opisów, usuwanie).
* **Szybkie zarządzanie „Daniem Dnia”** – możliwość oznaczenia wybranego dania jednym kliknięciem (natychmiastowe wyróżnienie etykietą na stronie).
* Przeglądanie nadesłanych rezerwacji stolików i zmiana ich statusów (*Potwierdzona*, *Odrzucona*, *Zakończona*).
* Edycja harmonogramu godzin otwarcia lokalu dla każdego dnia tygodnia (oraz oznaczenia lokalu jako zamknięty).
* Odczyt i usuwanie zapytań klientów z formularza kontaktowego.

### 3. Właściciel (`owner`):
* Wszystkie uprawnienia pracownika.
* **Moderacja opinii** – weryfikacja i akceptacja recenzji dodanych przez gości przed ich publikacją na stronie głównej.
* Zarządzanie zespołem kucharzy prezentowanym w serwisie.
* Edycja kluczowych danych lokalu (telefon, adres, e-mail, treść promocyjna).
* **Zarządzanie użytkownikami** – tworzenie nowych kont dla personelu z przypisaniem roli oraz usuwanie kont.

---

## Źródła Szablonów i Licencje (Credits & Attribution)

Projekt korzysta z darmowych, otwartoźródłowych szablonów HTML/CSS (zgodnie z wytycznymi laboratoryjnymi dr. inż. Michała Apolinarskiego dopuszczającymi wykorzystanie gotowych szablonów dla części publicznej oraz panelu administracyjnego):

1. **Część publiczna (Strona restauracji):**
   * Szablon: **Sarab – Fast Food & Restaurant HTML Template**
   * Autorzy: [Bestwpware](https://bestwpware.com/) / Dystrybucja: [ThemeWagon](https://themewagon.com/themes/sarab/)
   * Licencja: **MIT License**
   * Zakres zmian własnych: pocięcie szablonu One-Page na 7 niezależnych podstron EJS, dynamiczne generowanie zawartości z bazy SQLite, integracja formularzy rezerwacji i recenzji.

2. **Część administracyjna (Panel CMS):**
   * Szablon: **AdminLTE v4 (Bootstrap 5)**
   * Autorzy: [ColorlibHQ](https://github.com/ColorlibHQ/AdminLTE)
   * Licencja: **MIT License**
   * Zakres zmian własnych: adaptacja do silnika EJS, usunięcie kodu demo, personalizacja kolorystyczna pod markę Sarab, implementacja widoków formularzy i tabel połączonych z backendem Express.js oraz mechanizmem sesji RBAC.
