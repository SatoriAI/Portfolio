---
title: Kiedy sieć odkrywa zegar
date: 2026-10-01
format: figure
summary: Grokking, symetrie i poszukiwanie reguł ukrytych w modelu.
related: /research
figure: grokking
tags: AI, Nauka
---

Gdybym miał JARVIS-a, szybko przestałoby mi wystarczać, że podaje poprawne odpowiedzi. Chciałbym zajrzeć pod maskę. Dowiedzieć się, jak dochodzi do wyniku, co zapamiętał i czy potrafi wykorzystać poznaną regułę w nowej sytuacji.

Jako matematyk i inżynier mam podobną ciekawość wobec sieci neuronowych. Wynik na ekranie jest początkiem rozmowy. Najciekawsze pytanie brzmi: co wydarzyło się wewnątrz?

W naszym projekcie badamy moment, w którym mały transformer, trenowany na prostym zadaniu arytmetycznym, zaczyna poprawnie odpowiadać również na przykładach spoza zbioru treningowego. Szukamy śladów struktury matematycznej, która wyłania się podczas tego procesu.

Pierwsza wskazówka prowadzi do zegara.

## Długo nic, potem nagle działa

Wyobraźmy sobie model, który świetnie radzi sobie z przykładami używanymi podczas treningu. Pokazujemy mu nowe przypadki i skuteczność gwałtownie spada.

Trenujemy dalej. Przez długi czas wyniki na nowych danych pozostają słabe. W końcu następuje wyraźna poprawa, choć model już wcześniej opanował zbiór treningowy.

Takie opóźnione uogólnianie nazywamy **grokkingiem**. Zjawisko opisali [Power i współautorzy](https://arxiv.org/abs/2201.02177), badając małe zadania algorytmiczne.

Łatwo powiedzieć, że sieć wreszcie „zrozumiała”. To sugestywna metafora, ale badacz potrzebuje czegoś bardziej konkretnego. Chcę wiedzieć, jakie zmiany w obliczeniach modelu towarzyszą poprawie i czy da się je zmierzyć.

Dlatego oprócz odpowiedzi analizujemy aktywacje, czyli wewnętrzne wartości powstające podczas przetwarzania danych.

## Arytmetyka z zawijaniem

Nasze zadanie to dodawanie modulo 113.

Model otrzymuje dwie liczby od 0 do 112. Ma je dodać i zwrócić resztę z dzielenia wyniku przez 113. Na przykład:

$$110 + 7 ≡ 4 \text{ (mod 113)}.$$

To działa jak zegar. Na zwykłej tarczy po dwunastej wracamy do pierwszej. Tutaj mamy 113 pozycji, oznaczonych od 0 do 112, i po ostatniej wracamy do zera.

Zadanie jest niewielkie, lecz ma bogatą strukturę. Dodanie jedynki zawsze przesuwa wynik o jedną pozycję. Dodanie trójki przesuwa go o trzy. Przesunięcie o dwa, a potem o trzy daje to samo co przesunięcie o pięć.

Matematycy opisują tę strukturę jako grupę cykliczną.

Model może dopasować się do konkretnych przykładów albo wykorzystać zależności wspólne dla całego zadania. Nas interesuje, czy w jego wnętrzu pojawia się ślad tych zależności.

## Jak liczby zamieniają się w obroty

Każdą pozycję na zegarze można opisać kątem. Liczbie przypisujemy wtedy punkt na okręgu, zapisany za pomocą sinusa i cosinusa.

Dodawanie staje się obrotem.

To perspektywa związana z analizą Fouriera. Pozwala ona opisywać cykliczne sygnały przez fale o różnych częstotliwościach. Możemy wyobrazić sobie kilka zegarów: jeden wykonuje pełny obrót podczas przejścia przez wszystkie liczby, inny obraca się w tym samym czasie kilka razy.

Związek grokkingu z takimi obliczeniami ma już solidny precedens. [Nanda i współautorzy](https://arxiv.org/abs/2301.05217) odtworzyli algorytm wyuczony przez badane przez nich transformatory dodające modulo. Wykorzystywał on strukturę Fouriera i tożsamości trygonometryczne.

Nasze pytanie dotyczy geometrii aktywacji: czy można wykryć w nich operacje zachowujące się jak cykliczne przesunięcia? Czy te operacje składają się zgodnie z regułą dodawania? I czy kolejne warstwy przekazują tę strukturę dalej?

## Szukamy reguły składania

Wyobraźmy sobie, że znaleźliśmy przekształcenie wewnętrznych aktywacji odpowiadające dodaniu dwójki do wyniku. Znaleźliśmy też przekształcenie odpowiadające dodaniu trójki.

Teraz wykonujemy je kolejno. Czy otrzymujemy podobny efekt jak przy jednym przekształceniu odpowiadającym dodaniu piątki?

To sedno naszego sprawdzianu.

Jeżeli zgodność zachodzi dla wszystkich przesunięć i jest dokładna, mówimy o reprezentacji grupy. Operacje na liczbach mają wtedy swój odpowiednik w operacjach na wektorach.

W sieci szukamy wersji przybliżonej. Dopasowujemy liniowe przekształcenia aktywacji, a następnie sprawdzamy ich działanie na danych odłożonych do testowania.

Ważne są dwa osobne pytania. Pierwsze: czy przekształcenia dobrze przewidują aktywacje dla przesuniętych wyników? Drugie: czy same przekształcenia spełniają prawo składania również jako macierze?

Dobra odpowiedź na pierwsze pytanie nie gwarantuje dobrej odpowiedzi na drugie.

## Nie chcę znaleźć zegara tylko dlatego, że go narysowałem

W badaniu takich struktur łatwo wpaść w pułapkę. Jeśli od początku szukamy sinusa i cosinusa, możemy dobrać sposób analizy tak, żeby zobaczyć właśnie sinus i cosinus.

Dlatego naszą główną analizę opieramy na współrzędnych wyznaczonych z samych aktywacji. Używamy PCA, metody wskazującej kierunki, w których dane najbardziej się zmieniają. Dopiero w tej przestrzeni sprawdzamy, czy da się odtworzyć cykliczne przesunięcia.

Osobno analizujemy współrzędne dopasowane do struktury Fouriera. Dają czystsze wyniki, ale traktujemy je jako dodatkowe świadectwo, ponieważ już przy ich konstruowaniu korzystamy z wiedzy o oczekiwanym wzorcu.

To dla mnie ważna zasada: narzędzie pomiarowe powinno pozwalać hipotezie przegrać.

## Co pokazują nasze eksperymenty?

W zgromadzonych przebiegach treningu badamy dwuwarstwowy transformer, jedno zadanie modulo 113 i trzy różne inicjalizacje losowe.

We wszystkich trzech przebiegach wystąpiło opóźnione uogólnianie. Końcowa trafność na zbiorach treningowym i testowym wyniosła 100%.

Na wykresie widać różnicę między opanowaniem przykładów treningowych a uogólnianiem. Model wcześnie osiąga pełną trafność na danych używanych do nauki. Na odłożonych przykładach poprawa przychodzi później, mimo kontynuowania treningu na tym samym zbiorze.

![Trafność treningowa i testowa w trzech przebiegach, kroki 0–6000](/figure/grokking "Trafność podczas treningu na dodawaniu modulo 113. Fioletowe linie przedstawiają wyniki na zbiorze testowym w trzech przebiegach, a szara pokazuje trafność treningową. Pomiary wykonano co 1000 kroków; linie łączą kolejne punkty pomiarowe.")

Wykres pokazuje zmianę zachowania modelu. Analiza aktywacji pozwala zapytać, co jej towarzyszy.

W początkowych etapach treningu dopasowane przekształcenia słabo odtwarzają cykliczną strukturę. W okolicy przejścia do dobrego uogólniania ich działanie staje się wyraźnie bardziej uporządkowane.

Najmocniejszy sygnał widzimy w drugim bloku transformera. Jego aktywacje pozwalają przewidywać skutki przesunięć, a składanie tych operacji często dobrze działa na odłożonych danych.

Ścisłe porównanie macierzy jest jednak mniej jednoznaczne. Wyniki zależą od przebiegu treningu, miejsca pomiaru i wymiaru wybranej przestrzeni. Dlatego obecny wniosek brzmi: **grokkingowi towarzyszy pojawianie się aktywacji wspierających cykliczną dynamikę**. Pełne prawo reprezentacji grupy pozostaje przedmiotem dalszych sprawdzianów.

Co ciekawe, ostatni zapisany stan modelu nie zawsze pokazuje tę strukturę najczyściej. Czasem lepiej widać ją blisko samego przejścia do uogólniania. Sam finał treningu nie opowiada więc całej historii.

## Czy następna warstwa zachowuje tę samą regułę?

Znalezienie struktury w jednym miejscu to dopiero połowa pracy. Chcemy jeszcze wiedzieć, czy model przekazuje ją dalej.

Porównujemy dwie drogi. W pierwszej przesuwamy reprezentację, a potem przechodzimy do kolejnej warstwy. W drugiej najpierw przechodzimy dalej, a następnie wykonujemy odpowiadające przesunięcie w nowej przestrzeni.

Jeśli wyniki są bliskie, oba etapy posługują się zgodną regułą.

W naszych pomiarach przejście z drugiego bloku do końcowej reprezentacji zachowuje tę zgodność znacznie lepiej niż przejście z pierwszego bloku do drugiego.

To wspiera roboczy obraz, w którym drugi blok porządkuje strukturę cykliczną, a końcowy etap ją zachowuje. Pomiar korzysta jednak z dopasowanego liniowego przybliżenia zależności między reprezentacjami. Nie opisuje dokładnie całego nieliniowego działania warstwy.

## Gdzie pomaga matematyka?

W notatkach pokazujemy, dlaczego zgodność przesunięć między warstwami powinna prowadzić do zachowywania składowych Fouriera.

Dla dokładnych reprezentacji grupy cyklicznej można oszacować błąd takiego transportu przez średni błąd zgodności z przesunięciami. Intuicja jest prosta: jeżeli mapa między przestrzeniami respektuje obroty, musi też respektować strukturę, którą te obroty wyznaczają.

To daje konkretną prognozę do sprawdzenia.

Pozostaje jednak most między twierdzeniem a siecią. Nasze dopasowane operacje są przybliżone, a pomiary dotyczą określonych danych. Musimy uwzględnić te błędy i wykonać bezpośredni test przewidywanego transportu.

## Co chciałbym sprawdzić dalej?

Najważniejsze pytanie dotyczy przyczyny. Czy model wykorzystuje wykrytą strukturę do obliczania odpowiedzi, czy tylko obserwujemy wzorzec towarzyszący skutecznemu rozwiązaniu?

Potrzebne będą kontrolowane ingerencje w aktywacje, porównania z odpowiednio dobranymi zaburzeniami oraz eksperymenty dla kolejnych modułów i inicjalizacji. Trzy przebiegi jednego zadania to początek historii.

Na razie mamy obiecującą obserwację: poprawie uogólniania towarzyszy wyłanianie się cyklicznej dynamiki, szczególnie czytelnej w późniejszym bloku modelu.

Właśnie takie badania najbardziej mnie fascynują. Łączą eksperyment, geometrię i algebrę, żeby zajrzeć do środka działającej maszyny.

Gdybym miał JARVIS-a, chciałbym, żeby pokazywał mi również ten etap: nie tylko gotową odpowiedź, ale ślady reguły, z której powstała. W naszym małym transformerze jednym z takich śladów może być zegar.
