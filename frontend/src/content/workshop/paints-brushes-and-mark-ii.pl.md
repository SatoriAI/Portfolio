---
title: Farby, pędzle i Mark II
date: 2026-10-06
format: production
summary: Dlaczego „farby” w Slipie dawały pusty wynik i jak doszliśmy od 49% do 84% trafień przy sześciu fałszywych alarmach.
tags: AI, Inżynieria
related: /#projects
figure: search
stamp: Próba
---

W historiach o Tonym Starku najbardziej lubię sceny z warsztatu. Pomysł, prototyp, próba. I nagle zderzenie z sufitem. Potem poprawka i kolejny test. Tak wygląda inżynieria bez retuszu.

Nasza historia zaczęła się skromniej: od telefonu i pytania o farby.

## Farba to nie farby

W Slipie można przeszukiwać paragony zwykłym zdaniem. Wpisałem „Farby za ok. 100 zł” i dostałem pusty wynik. Tymczasem w bazie był paragon, na którym kasa wydrukowała czarno na białym: FARBY.

Przyczyna była prosta. Model sprowadzał nazwę produktu do formy podstawowej: „farba”. Wyszukiwarka szukała tego fragmentu dosłownie, bez uwzględniania odmiany. A ciągu „farba” w słowie „FARBY” nie ma.

Kasa drukuje nazwę towaru. Model porządkuje język. Wyszukiwarka porównuje litery. Każdy robi swoje, a użytkownik dostaje pusty ekran.

## Pierwsze podejście: przycinamy końcówki

Pierwszy pomysł to uproszczony stemming, czyli skracanie słów, żeby różne formy miały wspólny fragment. Dla słowa mającego co najmniej pięć liter wyszukiwarka sprawdzała również wariant bez ostatniej litery. „Farb” znajdowało FARBY, a „kurtk” znajdowało KURTKI.

Działało, ale kolejne przeglądy zmian ujawniały nowe problemy. „Kurtka zimowa” nie znajdowała KURTKA ZIMOWE. Po następnej poprawce „sok z” tracił „z” i łapał każdy sok, a „cola 20” gubiła liczbę. Każda łatka wymagała kolejnej.

Najlepszy przykład zostawiłem na koniec: angielskie „paint”, przycięte do „pain”, znajdowało PAIN AU CHOCOLAT.

Pytasz o farbę, dostajesz rogalika.

Propozycję zmian #144 zamknąłem bez wdrożenia. Postanowiłem sprawdzić inne podejście: niech model podaje właściwe formy słów, a wyszukiwarka dopasowuje je dosłownie.

## Drugie podejście: niech model mówi językiem kasy

Poprosiliśmy model, żeby podawał liczbę pojedynczą i mnogą: „farba”, „farby”. Dla produktu z przymiotnikiem miał dodawać także sam rzeczownik. Z „opon zimowych” powinny więc powstać również „opona” i „opony”.

Limit generowanych określeń zwiększyliśmy z sześciu do dziesięciu, żeby przy pytaniu o kilka produktów wystarczało miejsca na ich warianty.

Pierwsza wersja przeszła trzy z pięciu przypadków. Model nadal czasem sprowadzał liczbę mnogą do pojedynczej. Pomogło jedno zdanie w instrukcji: „obie formy, nigdy tylko jedna”.

Potem okazało się, że „opony zimowe” wracają wyłącznie jako cała fraza. Dodaliśmy regułę dotyczącą przymiotników.

Końcowa wersja przeszła wszystkie jedenaście przypadków sprawdzających generowanie potrzebnych form. Stary prompt, sprawdzony na wcześniejszym zestawie pięciu przypadków, nie przeszedł żadnego. To wyniki z różnych zestawów, więc nie traktuję ich jako bezpośredniego porównania.

Pięć dodatkowych przypadków sprawdziliśmy dopiero po zakończeniu strojenia, bez dalszych zmian promptu. Była to dodatkowa kontrola, czy poprawka działa również poza przykładami, na których ją dopracowywaliśmy.

## Lek w mleku

Liczba pojedyncza przyniosła nowy problem: krótkie słowa.

„Lek” znajdował MLEKO, a „but” znajdował BUTELKĘ. Poprosiliśmy model, żeby pomijał krótkie określenia, ale w pięciu z 71 przypadków zignorował tę instrukcję.

Prośba w prompcie to jeszcze nie gwarancja.

Regułę przenieśliśmy więc do kodu: określenie mające do trzech liter musi pasować do całego słowa na paragonie. Dzięki temu „lek” przestaje być fragmentem „mleka”.

Ta decyzja ma koszt. „TV” nie znajdzie już TV55UQ7500, ponieważ użyte dopasowanie traktuje litery i cyfry jako jedno słowo. W takim przypadku pomaga pełna nazwa: „telewizor”.

## Pojedynek na liczby

Porównaliśmy cztery warianty na dwunastu pytaniach, każde uruchamiając trzy razy na rzeczywistym modelu.

Jeden pełny przebieg obejmował 36 oczekiwanych trafień. Trzy powtórzenia dawały więc 108 okazji do znalezienia właściwej linii. Dodaliśmy również dziesięć linii-pułapek, między innymi MLEKO, PAIN AU CHOCOLAT i POTATO CHIPS.

Dane przygotowaliśmy na wzór wydruków z kasy. Nie pochodziły z prawdziwych paragonów.

| Podejście                                     | Trafienia (z 108) | Fałszywe |
| --------------------------------------------- | ----------------: | -------: |
| Stary prompt, dopasowanie dosłowne            |      53/108 (49%) |       13 |
| Przycinanie końcówek (#144)                   |      81/108 (75%) |       19 |
| **Nowy prompt i reguła krótkich słów (#145)** |  **91/108 (84%)** |    **6** |
| Oba podejścia naraz                           |      94/108 (87%) |       12 |

Połączenie obu podejść znalazło trzy dodatkowe trafienia, ale podwoiło liczbę fałszywych wyników względem #145. W tym sprawdzianie wybrałem wariant z mniejszą liczbą pomyłek.

To porównanie całych rozwiązań. Wynik #145 obejmuje zarówno nowy prompt, jak i regułę krótkich słów w kodzie. Nie przypisuję całej poprawy samemu modelowi.

## Zepsuj, żeby uwierzyć

To moja ulubiona część pracy.

Każdy sprawdzany mechanizm celowo wyłączyliśmy lub zepsuliśmy i upewniliśmy się, że przestaje przechodzić konkretny test. Dzięki temu wiedzieliśmy, że test potrafi wykryć brak danej poprawki.

Zielony wynik cieszy. Jeszcze bardziej przekonuje mnie test, który robi się czerwony dokładnie wtedy, kiedy powinien.

Na koniec wróciliśmy do pytania, od którego wszystko się zaczęło. „Farby za ok. 100 zł” dało warianty „farba”, „farby”, „paint”, „paints”, a paragon z FARBAMI pojawił się na samej górze.

Pełna ewaluacja obejmuje 71 przypadków, każdy uruchomiony trzy razy, i kosztuje kilka centów. To nieduża cena za sprawdzenie, czy kolejna wersja rzeczywiście poprawia wyniki.

## Mark III

Pozostał problem kas, które drukują bez polskich znaków: ZAROWKA, KRZESLO, PEDZLE. Wszystkie porównywane podejścia miały z nimi trudność.

Kandydatem na następny krok jest rozszerzenie `unaccent` w PostgreSQL. Najpierw trzeba sprawdzić jego dostępność w naszym środowisku na Railway, a potem zmierzyć, czy pomaga i jakie pomyłki może wprowadzić.

Z tej historii zabieram prostą zasadę: model może proponować formy językowe, kod powinien egzekwować reguły, a testy muszą sprawdzać oba.

Stark miał warsztat, zbroję i JARVIS-a. My zaczęliśmy od paragonu z farbami. Schemat pracy pozostaje podobny: zbuduj, sprawdź, popraw. I zachowaj wyniki, żeby następna wersja była lepsza.
