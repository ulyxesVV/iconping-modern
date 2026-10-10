# IconPing Modern

Eine modernisierte Fork der GNOME-Shell-Erweiterung **IconPing** von Simone Bisi, angepasst für aktuelle GNOME-Shell-Versionen. Die Erweiterung zeigt den Netzwerkstatus mit den ursprünglichen farbigen Weltkugel-Symbolen des Projekts an.

- Grün: Ziel antwortet unterhalb der gewählten Schwelle
- Gelb: Ziel erreicht die gewählte Schwelle (Standard: 300 ms)
- Rot: Ziel antwortet nicht oder die Eingabe ist ungültig
- Grau: Prüfung läuft, wurde pausiert oder hat noch kein Ergebnis

Im Panelmenü lässt sich die Überwachung pausieren oder fortsetzen. Die Einstellungen erlauben ein Ping-Ziel, ein Prüfintervall und eine gelbe Warnschwelle von 1 bis 2000 ms. Der Ping-Prozess wird mit Argumenten gestartet, ohne Shell-Auswertung; Ziele werden auf Hostnamen und IP-Adressen begrenzt und jeder Ping hat ein Zeitlimit.

Lokal getestet mit GNOME Shell 48.7. Die Metadaten führen GNOME Shell 45–51 als unterstützte Hauptversionen.

## Paket bauen

```sh
./build.sh
```

Das Skript erzeugt `iconping-modern@ulyxesvv.github.io.shell-extension.zip`. Es benötigt Python 3; `glib-compile-schemas` wird verwendet, wenn installiert ist. Das Paket lässt sich lokal mit `gnome-extensions install` installieren und zur Prüfung bei [extensions.gnome.org](https://extensions.gnome.org/) einreichen.

## Herkunft und Lizenz

Der JavaScript-Port und die GNOME-45+-Anpassungen bauen auf der ursprünglichen Erweiterung von Simone Bisi auf. Die Statusgrafiken sind die Original-PNGs aus [SimonItaly/iconping_gnome](https://github.com/SimonItaly/iconping_gnome). Der Quellcode steht unter GPL-3.0-or-later; der Lizenztext ist in `COPYING` enthalten.
