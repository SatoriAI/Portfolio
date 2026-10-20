---
title: Czy dyfuzja zachowuje swój charakter?
date: 2026-10-20
format: proof
summary: O stabilności, dyskretyzacji i kolejnym kroku od konstrukcji matematycznej do testowalnego algorytmu.
related: /research
tags: Matematyka, Nauka, AI
figure: averages
---

W Tonym Starku fascynuje mnie również to, czego filmy pokazują niewiele: rozumowanie poprzedzające eksperyment. Zanim pojawi się kolejny test, trzeba zdecydować, które zależności są istotne, jakie uproszczenia można przyjąć i gdzie model może zawieść.

W matematyce ten etap potrafi zająć całą pracę naukową.

Tak jest z drugą pracą z naszego cyklu poszukiwania inteligencji w cieple. W [poprzednim artykule](/workshop/intelligence-from-heat) opisywałem, jak z dyfuzji i mnożenia funkcji można zbudować konstrukcję przybliżającą rozwiązania równania fizyki. Teraz pytamy, jak zmienia się jej wynik, gdy zmieniamy regułę dyfuzji lub przechodzimy z przestrzeni ciągłej na siatkę.

To nadal badania teoretyczne. Ich celem jest ustalenie warunków i ograniczeń, które pozwolą później sensownie zaprojektować eksperyment obliczeniowy.

## Gdzie skończyła się pierwsza historia?

W poprzednim artykule opisywałem pomysł oparty na dwóch operacjach.

Pierwsza to dyfuzja, czyli rozprowadzanie informacji w przestrzeni, podobnie jak rozchodzi się ciepło. Druga to mnożenie funkcji punkt po punkcie, pozwalające łączyć różne informacje o problemie.

Pokazaliśmy, że odpowiednie złożenia tych operacji mogą przybliżać operator rozwiązania równania Darcy’ego. Równanie to opisuje między innymi przepływ przez ośrodek o zmiennej przepuszczalności. Podajemy opis materiału oraz źródeł, a szukamy wynikającego z nich rozkładu ciśnienia.

Ciekawy mechanizm pojawiał się przy porównaniu dwóch kolejności: mnożenia przed dyfuzją i mnożenia po dyfuzji. Różnica między wynikami pozwala odzyskać informację o współdziałaniu zmian przestrzennych obu funkcji.

Pierwsza praca dawała konstrukcję matematyczną oraz oszacowanie jej błędu. Parametry wynikały z dowodu, a nie z treningu na danych.

Pozostało jednak pytanie: jak silnie cała konstrukcja zależy od operatora, na którym ją oparto?

## Ten sam wzór, inna dyfuzja

Za dyfuzją stoi operator nazywany generatorem. Określa on regułę rozchodzenia się informacji.

W nowej pracy zachowujemy parametry konstrukcji, w tym czasy dyfuzji, współczynniki i liczbę iteracji. Zmieniamy generator i porównujemy wyniki dwóch tak określonych odwzorowań.

Rozpatrujemy dwa przypadki.

W pierwszym oba operatory działają w tej samej przestrzeni. Ich reguły dyfuzji są bliskie w precyzyjnie określonym sensie. Może to odpowiadać zmianie geometrii lub wag.

W drugim porównujemy przestrzeń ciągłą z regularną siatką. Funkcjom przypisujemy średnie w komórkach, a ciągły operator zastępujemy jego dyskretnym odpowiednikiem, łączącym sąsiednie węzły.

Na poziomie intuicji oba pytania brzmią podobnie: czy mała zmiana opisu daje małą zmianę wyniku?

Analiza pokazuje jednak, że wymagają różnych argumentów.

## Stabilność ma własne wymagania

Na tej samej przestrzeni wielkość zaburzenia mierzymy przez porównanie form energetycznych obu operatorów. Opisują one koszt przestrzennych zmian funkcji.

Dla pojedynczej operacji dyfuzji otrzymujemy oszacowanie stabilności jednolite względem czasu. Oznacza to, że przejście do bardzo krótkiego czasu nie pogarsza samego tego oszacowania.

Trudność pojawia się przy operacjach łączących dyfuzję i mnożenie. W naszej konstrukcji odejmujemy pewne wyniki, a następnie dzielimy różnicę przez mały czas. Oszacowanie każdego składnika osobno może zgubić zależność, dzięki której całe wyrażenie pozostaje kontrolowane.

Trzeba więc przeanalizować je jako całość.

Przy odpowiednich założeniach pokazujemy, że stabilność obejmuje również te operacje i pełną konstrukcję przybliżającą operator rozwiązania równania Darcy’ego. Zależność uzyskanego oszacowania od żądanej dokładności rośnie tylko logarytmicznie.

To wynik o wrażliwości matematycznego odwzorowania na zaburzenie generatora. Nie rozstrzyga jeszcze o zachowaniu obliczeń w skończonej precyzji.

## Co zmienia przejście na siatkę?

Siatka wprowadza ograniczenie, którego nie można usunąć samą zręcznością dowodu: nie rozróżnia wszystkich zmian obecnych w funkcji ciągłej.

Wyobraźmy sobie falę, która między sąsiednimi węzłami wykonuje więcej niż pół oscylacji. Po przejściu na siatkę część tych oscylacji może zniknąć, a inne mogą wyglądać jak wolniejsze zmiany. Jest to związane z aliasingiem.

Dodatkowo dyskretny operator inaczej oddziałuje na oscylacje bliskie granicy rozdzielczości niż operator ciągły.

![Fala o pięciu oscylacjach na okresowym odcinku i jej średnie w komórkach siatki; pod nią działanie operatora dyskretnego na oscylacje względem ciągłego; suwak zmienia odstęp siatki h](/figure/aliasing "Fala o pięciu oscylacjach na okresowym odcinku i jej średnie w komórkach o szerokości h. Gdy komórki zbliżają się do skali oscylacji, średnie słabną, a potem układają się w wolniejszą falę. Przy h = 1/5 każda komórka mieści jedną pełną oscylację i wszystkie średnie są równe zeru. Dolny wykres: siatka słabiej odczuwa szybkie oscylacje; przy granicy rozdzielczości dyskretny operator działa na nie z ok. 41% siły operatora ciągłego. Wartości są dokładne, nie z symulacji.")

Dlatego nie wystarczy wykazać, że oba operatory są bliskie dla każdej ustalonej, dostatecznie regularnej funkcji. Chcemy kontrolować błąd dla całej dopuszczalnej klasy wejść. W takiej klasie mogą występować funkcje o coraz drobniejszych szczegółach.

To właśnie one ujawniają granice możliwego oszacowania.

## Jedna pochodna robi różnicę

Niech $h$ oznacza odległość między węzłami siatki.

Błąd rzędu $h$ maleje w oszacowaniu dwukrotnie po zmniejszeniu tej odległości o połowę. Błąd rzędu $h^2$ maleje czterokrotnie.

W pracy pokazujemy, jak tempo to zależy od regularności wejścia do pierwszej warstwy konstrukcji.

Jeśli zakładamy tylko przynależność do $L^2$, czyli całkowalność kwadratu funkcji, uzyskujemy oszacowanie pierwszego rzędu w dyskretnej normie energetycznej. W określonym zakresie parametrów podajemy również przykłady osiągające ten rząd, już w jednym wymiarze.

Jeżeli wejście ma jedną słabą pochodną należącą do $L^2$, otrzymujemy drugi rząd. To warunek kontrolujący zmiany przestrzenne, znacznie słabszy niż żądanie idealnej gładkości.

Pomiędzy tymi przypadkami istnieje skala pośrednia. Dla regularności opisanej parametrem $s$, od zera do jedności, otrzymujemy tempo:

$$h^{1+s}.$$

Ten wynik dotyczy warstwy przybliżającej odwrotność operatora. Wyjaśnia, jak regularność danych ogranicza dokładność jej przeniesienia na siatkę.

## Skąd wziąć regularność dalej?

Dla całej konstrukcji trzeba jeszcze przeanalizować kolejne warstwy, w których mnożymy funkcje.

Tutaj pojawia się ważna własność badanego schematu: część potrzebnej regularności wynika z jego budowy.

Operacja przybliżająca odwrotność operatora wygładza dane. Dowodzimy następnie, że stany powstające podczas iteracji zachowują kontrolę dwóch pochodnych w sensie odpowiedniej normy Sobolewa. Oszacowanie nie pogarsza się wraz z liczbą iteracji.

Ta własność pozwala zastosować mocniejsze oszacowania dla warstw iloczynowych.

Zamiast zakładać dowolnie dużą gładkość wszystkich pośrednich funkcji, wyprowadzamy potrzebną regularność z samej konstrukcji. To jeden z elementów łączących analizę pojedynczych operacji z twierdzeniem o ich złożeniu.

## Dlaczego mnożenie wymaga osobnego dowodu?

Przy przejściu na średnie komórkowe nawet mnożenie przestaje zachowywać się dokładnie tak samo.

Średnia z iloczynu na ogół różni się od iloczynu średnich.

Weźmy dwa zestawy wartości: $1, 3$ oraz $3, 1$. Ich średnie wynoszą po $2$, więc iloczyn średnich to $4$. Tymczasem iloczyny odpowiadających sobie wartości wynoszą $3, 3$, a ich średnia to $3$.

![Wartości b równe 1 i 3 oraz u równe 3 i 1 na dwóch połówkach komórki, ich iloczyny i średnie; suwak zmienia u](/figure/covariance "Średnia iloczynu minus iloczyn średnich to dokładnie kowariancja, czyli średnią iloczynu odchyleń b i u od ich średnich. Gdy u rośnie tam, gdzie b maleje, różnica jest ujemna; gdy rosną razem, dodatnia; gdy u jest stałe, znika.")

Różnica opisuje informację o wspólnych zmianach obu funkcji, utraconą podczas uśredniania.

W pracy zapisujemy ten błąd dokładnie za pomocą kowariancji. Następnie łączymy jego oszacowanie z analizą operatorów dyfuzji.

Kontrola tej interakcji jest istotną częścią nowej pracy. Samo przeniesienie wyników dla warstw liniowych nie wystarczyłoby do uzasadnienia zachowania całego schematu.

## Co mówi główne twierdzenie?

Przy ustalonej dokładności konstrukcji $ε$, odpowiedniej regularności współczynnika materiałowego i wejściu z jedną pochodną dowodzimy drugiego rzędu zbieżności realizacji siatkowej do ciągłej.

Błąd mierzymy w dyskretnej normie energetycznej, uwzględniającej przestrzenne zmiany wyniku.

Główne oszacowanie zawiera czynnik:

$$\frac{h^2}{ε}.$$

Obowiązuje również jawny warunek wiążący rozmiar siatki ze skalami konstrukcji. Nie można zatem niezależnie zwiększać wymaganej dokładności i pozostawiać dowolnie rzadkiej siatki.

Porównujemy tutaj dwie realizacje tej samej konstrukcji matematycznej. Pierwsza praca kontrolowała jej odległość od operatora rozwiązania równania. Druga kontroluje dodatkową różnicę wynikającą z dyskretyzacji.

To dwa osobne składniki analizy, potrzebne do późniejszej oceny algorytmu.

## Co przybliża nas do eksperymentu?

Nie mamy jeszcze na tej podstawie odpowiedzi, czy konstrukcja będzie szybka, numerycznie stabilna i konkurencyjna wobec klasycznych metod. Teoretyczna stabilność względem zmiany operatora nie zastępuje analizy błędów zaokrągleń.

Wyniki dyskretne dotyczą też konkretnej regularnej siatki okresowej i operatora łączącego najbliższych sąsiadów. Dalszych badań wymagają bardziej ogólne geometrie oraz praktyczny dobór parametrów.

Mamy natomiast lepiej określone pytania do przyszłych testów. Wiemy, jaką rolę odgrywa regularność wejścia, dlaczego warstwy iloczynowe wymagają osobnej kontroli i jak rozdzielić błąd konstrukcji od błędu jej dyskretnej realizacji.

Dla mnie właśnie na tym polega wartość tego etapu. Zanim zaczniemy mierzyć czas obliczeń i oglądać wykresy, ustalamy, czego powinniśmy oczekiwać oraz w jakich warunkach te oczekiwania mają matematyczne uzasadnienie.

Do testowalnego algorytmu prowadzi jeszcze droga. Ta praca pomaga dokładniej ją wyznaczyć.
