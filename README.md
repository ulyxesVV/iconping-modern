# IconPing Modern

A modernized fork of Simone Bisi's IconPing GNOME Shell extension, adapted for current GNOME Shell versions. The extension uses the original colored globe status icons.

- Green: destination replies in less than 300 ms
- Yellow: destination replies in 300 ms or more
- Red: destination does not reply or the input is invalid
- Gray: check is running, paused, or has no result yet

Use the panel menu to pause or resume monitoring. Preferences allow setting the ping destination and check interval. The ping process is launched as an argument list without shell evaluation; destinations are restricted to hostnames and IP addresses, and each ping has a timeout.

Tested locally with GNOME Shell 48.7. Metadata lists GNOME Shell 45–51 as supported major versions.

## Build

```sh
./build.sh
```

The script creates `iconping-modern@ulyxesvv.github.io.shell-extension.zip`. It uses Python 3 and compiles the GSettings schema when `glib-compile-schemas` is installed. Install locally with `gnome-extensions install` or submit the ZIP for review at [extensions.gnome.org](https://extensions.gnome.org/).

## Credits and license

The JavaScript port and GNOME 45+ adaptation build on Simone Bisi's original extension. The status images are the original PNGs from [SimonItaly/iconping_gnome](https://github.com/SimonItaly/iconping_gnome). Source is licensed under GPL-3.0-or-later; see `COPYING`.
