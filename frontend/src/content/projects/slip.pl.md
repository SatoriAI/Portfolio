---
title: Slip
slug: slip
period: 2026-07 – ongoing
status: pre-launch
role: solo: produkt, projekt graficzny, backend, frontend, wdrożenie i utrzymanie
context: commercial
stack: Python, Django, PostgreSQL, React, TypeScript, Vite, Tailwind CSS, OpenAI, Resend, Docker, Caddy, Railway, Cloudflare
demo: https://slip.today
repository: private
summary: Slip powstał, by uporządkować papierowe paragony i ułatwić ich późniejsze odnajdywanie. Wystarczy zrobić zdjęcie, a AI odczyta i zapisze najważniejsze informacje. Paragony można wyszukiwać za pomocą filtrów lub języka naturalnego. Statystyki wydatków pomagają sprawdzić, na co przeznaczamy pieniądze. Slip umożliwia także tworzenie wspólnych przestrzeni, w których można udostępniać paragony innym osobom.
---

# Slip

## Okres i status

- Pierwszy commit: 29 lipca 2026. Ostatni: 1 października 2026.
- Wersja produkcyjna powstała 31 sierpnia 2026 (PR #10). Tego samego dnia utworzono usługi na Railway.
- Według README Slip ma komplet funkcji i działa produkcyjnie pod adresem slip.today, na Railway, za Cloudflare. Działają: konta, przestrzenie, dodawanie i odczytywanie paragonów, wyszukiwanie, reset hasła oraz instalacja aplikacji na ekranie głównym.
- Obecnie Slipa testują rodzina i znajomi. Otwarcie dla wszystkich użytkowników, razem z wydaniem w App Store i Google Play, jest planowane za kilka miesięcy, prawdopodobnie na początku 2027 roku.

## Rola i kontekst

- W historii gita jest tylko Dawid: commity pod jego nazwiskiem, pull requesty scalane z jego własnego konta na GitHubie (SatoriAI, do którego należy repozytorium) oraz automatyczne aktualizacje zależności (Dependabot).
- W repozytorium jest wszystko, za co odpowiadał: backend, frontend, typowany klient API, konfiguracja pięciu usług na Railway, polecenia monitorujące oraz zapisane decyzje projektowe i decyzje dotyczące tekstów w interfejsie.
- Rola obejmowała też decyzje produktowe i projekt graficzny. Zapisane decyzje wskazują Dawida jako osobę, która je podejmowała: ustalił limity i ceny planów Free i Plus (brak limitów w planie „Friends & Family” to jego wybór) i zdecydował, że miniatury zdjęć pozostają prywatne. Wybrał też klepsydrę zamiast animacji, sam znak „S” zamiast ikony aplikacji na kafelku oraz spokojniejszy sposób pokazywania błędów.
- Projekt komercyjny: Dawid rozwija Slip jako własny produkt. Kod przewiduje plany „Free” i „Friends & Family” z miesięcznymi limitami, a wkrótce ma dojść płatny plan Plus.

## Krótkie podsumowanie

Slip to mobilna aplikacja webowa do przechowywania paragonów. Robisz zdjęcie, a aplikacja odczytuje sklep, datę, sumę i pozycje oraz oznacza to, co wymaga sprawdzenia. Paragony trafiają do przestrzeni tylko dla ciebie albo wspólnej z innymi. Możesz je wyszukiwać, filtrować albo znaleźć, zadając pytanie. Ekran główny pokazuje wydatki z tego miesiąca według kategorii.

## Problem

Dawid trzymał paragony w zamrażarce. To był prawdziwy powód, dla którego zbudował Slipa.

README określa Slip jako aplikację do zarządzania paragonami, projektowaną z myślą o telefonie: zdjęcie paragonu, odczyt danych przez model wizyjny i przechowywanie w przestrzeni współdzielonej z innymi osobami. Wspólne przestrzenie odpowiadają na drugą potrzebę widoczną w konstrukcji aplikacji: wydatki często dzieli się z innymi, na przykład w gospodarstwie domowym.

## Jak to działa dla użytkownika

1. **Rejestracja i logowanie** adresem e-mail i hasłem.
2. **Przestrzeń.** Nowe konto nie ma żadnej przestrzeni, więc zaczyna od ekranu przestrzeni. Przestrzeń to miejsce, w którym odkłada się paragony. Można ją zachować dla siebie albo zaprosić do niej innych. Ma nazwę i znak, który pozwala odróżnić ją od innych na pierwszy rzut oka. Zaproszenia czekają na liście i dołącza się, otwierając zaproszenie. Każdy członek dodaje własne paragony i widzi, co kupili inni i ile to kosztowało. Członkowie mają rolę właściciela albo członka.
3. **Dodanie paragonu.** Przycisk „+”, wybór przestrzeni, potem zdjęcie aparatem albo z galerii. Aplikacja radzi położyć paragon płasko i wypełnić nim kadr. Nie trzeba go przycinać: aplikacja sama znajduje paragon na zdjęciu.
4. **Odczyt.** Aplikacja uzupełnia sklep, datę, sumę i pozycje. Nazwy pozycji podaje w języku osoby, która dodała paragon. Paragon jest gotowy, wymaga sprawdzenia, jest w trakcie odczytu albo nie udało się go odczytać.
5. **Sprawdzenie.** Paragon zostaje oznaczony, gdy brakuje pól, nie odczytano żadnej pozycji, pozycje nie mają ceny, pozycje nie sumują się do kwoty albo części linii nie odczytano. Każdy problem jest wypisany, a dotknięcie go przenosi do pola, które trzeba poprawić. Można edytować sklep, datę, godzinę, sumę, walutę, podatek, rabat, formę płatności, numer paragonu i pozycje. Gdy odczyt się nie udał, można zlecić go ponownie albo zrobić nowe zdjęcie. Zdjęcie można otworzyć na pełnym ekranie i powiększyć.
6. **Przeglądanie i wyszukiwanie.** Wyszukiwanie działa od razu i obejmuje też nazwy kategorii. Filtry: data, kategoria, kwota, waluta, status, sklep i osoba, która dodała paragon. Jest też sortowanie i 15 kategorii, np. spożywcze, restauracje, paliwo.
7. **Pytanie.** Po wpisaniu co najmniej trzech słów aplikacja proponuje zadanie pytania. Odpowiada grupami pasujących paragonów, od najlepiej dopasowanych, a każda grupa prowadzi do pełnej listy.
8. **Podsumowanie** dla jednej przestrzeni: suma i liczba paragonów w tym miesiącu, suma z poprzedniego miesiąca, podział na kategorie, wykres ostatnich sześciu miesięcy oraz liczba paragonów do sprawdzenia lub nieodczytanych. Kwoty w różnych walutach nigdy nie są sumowane razem.
9. **Ustawienia:** plan oraz liczniki paragonów i pytań z bieżącego miesiąca, język (polski, angielski albo zgodny z urządzeniem), wygląd z trybem ciemnym, zmiana i reset hasła, pobranie danych (archiwum zip ze wszystkimi widocznymi paragonami i zdjęciami) oraz usunięcie konta.
10. **Instalacja** na ekranie głównym telefonu jako aplikacja webowa (PWA).

## Opis techniczny

**Stos**

- Backend: Python 3.13, Django 5, Django REST Framework, drf-spectacular (OpenAPI), django-filter, uv; serwer gunicorn.
- Baza: PostgreSQL 17 (psycopg 3 z pulą połączeń). Służy też za kolejkę zadań i pamięć liczników limitów zapytań; nie ma Redisa ani Celery.
- Obrazy: Pillow, pillow-heif (HEIC), OpenCV i NumPy do automatycznego kadrowania.
- Model: SDK OpenAI, domyślnie gpt-4.1-mini; odpowiedzi waliduje pydantic.
- Pliki: django-storages i zgodny z S3 bucket na Railway.
- Frontend: React 19, TypeScript (tryb strict), Vite, Tailwind CSS v4, TanStack Query, React Router 7, openapi-fetch z klientem generowanym ze schematu OpenAPI backendu, vite-plugin-pwa. Narzędzia: oxlint, Vitest, testy w przeglądarce na Playwright Chromium.
- Serwer WWW: Caddy 2. Poczta: SMTP przez Resend.

**Układ kodu**

- Monorepo z katalogami `backend/` i `frontend/`.
- Aplikacje domenowe: `accounts`, `spaces`, `receipts`, `mailer`, `ops`. Cała warstwa HTTP leży w `api/`, więc kontrakt da się przejrzeć w jednym miejscu.
- `clients/` to granica dostawcy modelu. Dwie zasady są kluczowe: aplikacje domenowe nie importują DRF, a typy dostawcy nie wychodzą poza `clients/`.

**Pięć usług z jednego repozytorium**

- **Slip-UI:** Caddy serwuje zbudowaną aplikację i przekazuje `/api/*` do API przez prywatną sieć Railway. Przeglądarka zostaje na jednej domenie, więc ciasteczko sesji jest własne (first-party), a ochrona CSRF prosta. Brzeg Railway nie umie przekazać (proxy) ścieżki do innej usługi, dlatego robi to Caddy.
- **Slip-API:** gunicorn, jeden proces, cztery wątki. Migracje przed wdrożeniem, kontrola zdrowia pod `/healthz`.
- **Slip-Worker:** przetwarza paragony. Tylko on ma klucz OpenAI.
- **Slip-Mail:** wysyła pocztę. Tylko on ma dane dostępowe SMTP.
- **Slip-Scheduler:** co godzinę uruchamia kontrole stanu i porządki.

**Droga paragonu**

1. Wysłanie zdjęcia kończy się odpowiedzią 202, a zadanie trafia do kolejki.
2. Worker pobiera zadanie z kolejki w Postgresie (`SELECT … FOR UPDATE SKIP LOCKED`).
3. Normalizuje obraz: dekodowanie, EXIF, HEIC na JPEG, zmniejszenie do 2000 px. Limit 200 MP sprawdza w nagłówku przed dekodowaniem.
4. Kadruje automatycznie do prostokąta obejmującego druk (OpenCV).
5. Raz wywołuje model z temperaturą 0 i wersjonowanym promptem.
6. Zapisuje paragon i pozycje w jednej transakcji. Każdą liczbę od dostawcy zamienia na Decimal i odrzuca, jeśli nie jest skończona.

**Statusy i uzgadnianie**

- Pięć statusów: uploaded, processing, review_required, completed, failed.
- `review_required` wynika z niepustego, zamkniętego zbioru powodów, a pilnuje tego ograniczenie w bazie. Model nie zwraca żadnej „pewności”.
- Pozycje uzgadnia się z sumą i rabatem. Gdy wyraźnie nie sięgają sumy, następuje drugi odczyt; zgodność obu odczytów rozstrzyga, czy pozycje są zmyślone.

**Pozostałe elementy**

- Pytania: kolejkowane; worker zamienia pytanie na filtry i wskazówki. Model widzi pytanie i wyliczony kalendarz, nigdy paragon.
- Poczta: skrzynka nadawcza (outbox) w Postgresie, opróżniana przez osobny worker. Nic nie jest wysyłane w trakcie obsługi żądania.
- Zdjęcia: prywatny bucket, udostępniane wyłącznie przez widok sprawdzający członkostwo. Aplikacja nie generuje żadnych adresów URL do obrazów.
- Logowanie: sesje Django w ciasteczkach, przedłużane do 30 dni. Liczniki limitów w Postgresie, według `X-Real-IP`; adresy IPv6 liczone po prefiksie /64.
- Dostęp: każde zapytanie jest zawężone do przestrzeni użytkownika; odczyt bez uprawnień zwraca 404.
- Limity: miesięczny przydział na użytkownika, na planie darmowym 20 odczytów i 5 pytań (miesiąc w UTC).
- Koszty: każde wywołanie modelu zapisuje wiersz `ModelCall` z samymi licznikami, bez treści.
- Frontend: wszystkie zapytania to fabryki `queryOptions` nad generowanym klientem. Service worker przechowuje tylko powłokę aplikacji, nigdy `/api/`; praca offline świadomie nie jest celem.
- Języki: angielski i polski. Django kieruje się nagłówkiem `Accept-Language`, a daty i kwoty formatuje frontend.

## Decyzje inżynierskie

- **Postgres jako kolejka zamiast Celery lub Redisa.** Baza i tak jest niezbędna, a SKIP LOCKED to około trzydziestu linii kodu. Dotyczy to też poczty. Z tego samego powodu liczniki limitów trafiły do Postgresa. Wcześniejszy LocMemCache działał w obrębie procesu: dwa workery podwajały limit 10 na minutę, a każdy restart zerował liczniki.
- **Jeden model, wybrany po cichych błędach.** Domyślny model zmienił się z gpt-4o-mini na gpt-4.1-mini po 35 próbach na każdy model na jednym paragonie o znanych wartościach. Przy rozmazanym zdjęciu gpt-4o-mini nie zwrócił żadnych pozycji w 14 z 25 prób; gpt-4.1-mini odczytał wszystkie dziesięć linii w 35 z 35. Wyszedł też taniej: 2,76 USD wobec 6,19 USD za tysiąc paragonów, bo gpt-4o-mini naliczał około 37 tys. tokenów wejściowych na obraz. Najtańszy z testowanych modeli odpadł, bo w 24 z 35 prób wymyślił nieczytelny rok. 11 września 2026 Slip przeszedł wyłącznie na OpenAI, a moduły Anthropic i Gemini usunięto: jeden dostawca do mierzenia, rozliczania i utrzymania.
- **Bez wskaźnika pewności od modelu.** Samoocena modelu nie jest pomiarem, więc flagi do sprawdzenia wynikają z arytmetyki. Same progi wielkości odrzucono: zmyślone koszyki i niepełne odczyty dają sumę poniżej kwoty, więc próg ich nie rozróżni. Rozstrzyga stabilność drugiego odczytu. Drugi odczyt każdego paragonu odrzucono jako zbyt kosztowny.
- **Poprawki promptu regułą, nie tekstem z kasy.** Poprawka linii kaucji cytowała tekst konkretnej kasy, więc test na tym paragonie nie mógł się nie udać; odrzucono ją. Reguła arytmetyczna odzyskała kaucję w 30 z 30 prób, poprzedni prompt w 0 z 30. Zmierzono też celowany drugi przebieg i odrzucono go: więcej mechanizmu, zero zysku.
- **Pola usunięte przez pomiar.** Pole NIP usunięto: model zwrócił wartość dla 12 z 16 zdjęć, żadna nie przeszła sumy kontrolnej mod-11, a 9 w ogóle nie było na paragonie. `receipt_number` zostawiono bez definicji, bo z definicją wyniki były gorsze.
- **Awaria dostawcy odracza, a nie unieważnia odczyt.** Cofnięty klucz, wyczerpany limit, ograniczenie liczby zapytań czy awaria wracają do kolejki z narastającym odstępem, maksymalnie 30 minut. Wcześniej użytkownik widział „nie udało się odczytać zdjęcia” z powodu problemu z rozliczeniem, na który nie miał wpływu.
- **Kadrowanie na serwerze, prostokątem.** Cztery przeciągane narożniki odrzucono: zrzucały na użytkownika pracę, która trwa 13–32 ms. Wykrywanie w przeglądarce oznaczałoby wysyłanie OpenCV jako wasm do aplikacji mobilnej. Czworokąt z korekcją perspektywy nie miał sensu, bo nic nie czyta wyniku OCR, a zmięte paragony słabo do niego pasują. Wykrywany jest druk, nie krawędzie papieru. Za jedyny kosztowny błąd uznano zbyt ciasne kadrowanie, więc każde zabezpieczenie wraca do pełnego kadru.
- **Sesje, identyfikatory, 404.** Sesje zamiast JWT: aplikacja na jednej domenie, sesję da się unieważnić, a JavaScript nie widzi żadnego tokenu. Liczbowe klucze główne zamiast UUID, bo zabezpieczeniem jest zawężanie zapytań. 404 zamiast 403, bo samo istnienie zasobu jest informacją.
- **Pliki w magazynie obiektów.** Nie BinaryField w Postgresie, bo bytea rozdyma kopie zapasowe i uniemożliwia strumieniowanie. Bucket zgodny z S3 jest konieczny, bo API i worker działają w osobnych kontenerach; dysk lokalny po cichu gubiłby zdjęcia.
- **Osobne workery poczty i paragonów.** Dwie niezależne domeny awarii. Worker paragonów nie wystartuje bez dostawcy modelu, a poczta musi działać, żeby zablokowany użytkownik mógł zresetować hasło.
- **Wątki zamiast procesów w API.** API głównie czeka na I/O: około 0,0008 vCPU przy 145 MB pamięci w ciągu tygodnia. Drugi proces mniej więcej podwoiłby koszt usługi rozliczanej za pamięć. Na ekranie paragonów seria zapytań skróciła się z 208 do 46 ms.
- **Ustawienia Railway jako kod.** `.railway/railway.ts` zastąpił ustawienia w panelu. Wcześniejsze pliki `.toml` nie były w ogóle czytane: zapisy do funkcji Config as Code zamknięto 28 sierpnia 2026, a usługi Slipa powstały 31 sierpnia. Pull request pokazuje plan zmian w komentarzu, scalenie go stosuje. Plany destrukcyjne zatrzymuje CI i stosuje się je ręcznie.
- **Nagłówki bezpieczeństwa w Caddy, nie w Django.** Jedna domena i jeden blok nagłówków obejmują powłokę, zasoby, service worker i API. Content Security Policy dopuszcza jedyny skrypt inline przez hash, a nie nonce, bo Caddy serwuje plik statyczny.

## Działanie na produkcji

**Hosting**

- Railway, po jednej replice na usługę; baza PostgreSQL i własny bucket na zdjęcia.
- Przed Railway stoi Cloudflare: TLS na brzegu i przekierowanie z http na https. Domena slip.today jest podpięta do Slip-UI.

**Wdrażanie**

- Railway wdraża scalony kod z GitHuba; API uruchamia migracje przed wdrożeniem.
- Obrazy Dockera przypinają obrazy bazowe po skrócie (digest), więc ponowne wdrożenie nie wciągnie nieprzejrzanej bazy. Kontenery backendu działają bez uprawnień roota.
- Workery mają czas na dokończenie pracy przy wdrożeniu: 120 s (paragony) i 60 s (poczta). Wywołania modelu mają limit 90 s.
- Każdy sekret jest tylko w usłudze, która go czyta.

**CI**

- Backend: najpierw kontrole statyczne (ruff, mypy, straż migracji, rozjazd schematu OpenAPI), potem testy na Postgresie 17.
- Frontend: lint, build, Vitest, testy w przeglądarce Playwright i pilnowanie podbicia wersji w pull requestach.
- `make check` to definicja ukończenia i działa jako hook pre-commit.
- CI dostrojono pod naliczanie minutowe GitHuba: połączono zadania frontendu i ustawiono 10-minutowe limity czasu.

**Monitoring**

- Co godzinę scheduler sprawdza kolejkę paragonów, skrzynkę nadawczą poczty, zdjęcia i liczniki limitów.
- Każde zadanie wysyła sygnał na adres typu dead man's switch, więc alarm podnosi cisza. Bez skonfigurowanego adresu scheduler przy każdym przebiegu loguje błąd, a przebieg crona kończy się niepowodzeniem.
- Powód: awaria dostawcy jest celowo niewidoczna dla użytkowników, więc kontrola kolejki to jedyny alarm.
- Sygnały z produkcji odbiera healthchecks.io, w darmowym planie.

**Koszty**

- Hosting kosztuje obecnie mniej niż dolara miesięcznie.
- OpenAI: 2,76 USD za tysiąc paragonów na gpt-4.1-mini (wartość zmierzona) i około 0,75 USD za tysiąc pytań.
- Polecenie `manage.py model_usage --month` raportuje użycie według celu i modelu. W kodzie nie ma tabeli cen.

**Incydenty i wnioski**

- **Workery padały na błędach bazy.** Railway przestaje restartować usługę po pięciu zakończeniach. Od 14 września 2026 workery łączą się ponownie z narastającym odstępem, a zadanie, które ciągle wywraca worker, kończy się błędem po określonej liczbie prób.
- **API obsługiwało jedno żądanie naraz.** Jeden synchroniczny worker gunicorna kolejkował trzy–cztery równoległe zapytania ekranu. Rozwiązanie: cztery wątki.
- **Nieaktualne połączenia po restarcie Postgresa.** Pierwsze żądanie na każdym workerze kończyło się błędem 500. Pomogła pula psycopg, która sprawdza połączenie przed wydaniem.
- **Brakujący plik serwowany jako aplikacja.** Brakujący fragment z `/assets/` zwracał HTML aplikacji z rocznym nagłówkiem `immutable`, który zapamiętywały Cloudflare i service worker. Po wdrożeniu lub wycofaniu aplikacja mogła otwierać się pusta. Teraz taki adres zwraca 404.
- **Cloudflare nadpisywał nagłówki cache.** Ustawienie Browser Cache TTL przykrywało nagłówki serwera (`/sw.js` wychodził z max-age=14400). 16 września 2026 przestawiono je na respektowanie nagłówków serwera.
- **Brak nagłówków bezpieczeństwa.** Do 15 września 2026 powłoka aplikacji nie wysyłała żadnych. Teraz Caddy ustawia m.in. HSTS i CSP.
- **Niezauważone przestoje kolejki.** W środowisku deweloperskim dwa razy jednego dnia: worker z trzydniowym kodem i worker, który padł na błędzie importu. Stąd restarty i alarm stanu kolejki.
- **Długo działające procesy pamiętają konfigurację.** Worker trzymał stary `.env`. Wniosek: sprawdzać działający proces, nie plik.

## Wyniki

- Według README Slip ma komplet funkcji i działa produkcyjnie na slip.today.
- Na razie korzysta z niego kilku użytkowników w kilku przestrzeniach: rodzina i znajomi, którzy go testują.
- Prace: 450 commitów między 29 lipca a 1 października 2026, pull requesty do numeru #140.
- Pomiary jakości odczytu istnieją w repozytorium (wyniki porównania modeli opisane w decyzjach inżynierskich), ale to pomiary wewnętrzne, nie wyniki użytkowników.
- Dotąd przetworzono około 100 paragonów, a usługa działa od kilku tygodni bez problemów.

## Ograniczenia i dalsze kroki

- **Miesięczne limity.** Plan darmowy: 20 paragonów i 5 pytań miesięcznie; „Friends & Family” bez limitów. Plany przydziela się ręcznie według listy adresów e-mail. Płatności jeszcze nie ma.
- **Płatny plan Plus to najbliższy krok.** Plus ma dawać nielimitowane paragony i 500 pytań w miesiącu za 19,99 zł miesięcznie albo 149 zł rocznie, z płatnościami przez Stripe. Termin: jak najszybciej, w ciągu kilku tygodni. Rejestr kosztów wywołań modelu powstał jako część przygotowania funkcji pytań do rozliczeń. Płatny plan wymaga własnego ekranu, a rozliczenia — reguły, który plan wygrywa, gdy ktoś ma dwa.
- **Otwarcie dla użytkowników.** Za kilka miesięcy, prawdopodobnie na początku 2027 roku, Slip ma zostać udostępniony wszystkim i trafić do App Store i Google Play.
- **Jeden dostawca modelu.** Od 11 września 2026 tylko OpenAI.
- **Bez NIP-u.** Prośba o NIP sklepu sprawia, że model go wymyśla, więc pole usunięto.
- **Paragony czekają, gdy odczyt stoi.** Gdy worker nie działa albo dostawca zawodzi po stronie Slipa, paragon czeka w kolejce zamiast kończyć się błędem.
- **Podstawowy monitoring.** Cogodzinne kontrole i sygnały do healthchecks.io w darmowym planie.
- **Brak pracy offline.** Świadoma decyzja: service worker przechowuje tylko powłokę aplikacji.
- W kodzie nie ma komentarzy TODO ani FIXME i nie ma pliku z planem rozwoju.
