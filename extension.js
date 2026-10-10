import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const PING_DESTINATION = 'ping-destination';
const REFRESH_INTERVAL = 'refresh-interval';
const SLOW_THRESHOLD_MS = 300;

export default class IconPingExtension extends Extension {
    enable() {
        this._enabled = true;
        this._paused = false;
        this._settings = this.getSettings();
        this._settingsSignals = [
            this._settings.connect(`changed::${PING_DESTINATION}`, () => this._runPing()),
            this._settings.connect(`changed::${REFRESH_INTERVAL}`, () => this._scheduleNextPing()),
        ];

        this._indicator = new PanelMenu.Button(0.0, 'IconPing Modern');
        this._icon = new St.Icon({style_class: 'system-status-icon'});
        this._indicator.add_child(this._icon);
        this._setStatus('unknown');
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');

        this._statusItem = new PopupMenu.PopupMenuItem('Warte auf erste Messung', {
            reactive: false,
            can_focus: false,
        });
        this._indicator.menu.addMenuItem(this._statusItem);
        this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._toggleItem = new PopupMenu.PopupMenuItem('Ping pausieren');
        this._toggleItem.connect('activate', () => this._toggleMonitoring());
        this._indicator.menu.addMenuItem(this._toggleItem);

        const prefsItem = new PopupMenu.PopupMenuItem('Einstellungen öffnen');
        prefsItem.connect('activate', () => this.openPreferences());
        this._indicator.menu.addMenuItem(prefsItem);

        this._runPing();
    }

    disable() {
        this._enabled = false;
        this._removeTimer();
        this._cancelPing();

        if (this._settings && this._settingsSignals) {
            for (const id of this._settingsSignals)
                this._settings.disconnect(id);
        }
        this._settingsSignals = null;
        this._settings = null;

        this._indicator?.destroy();
        this._indicator = null;
        this._icon = null;
    }

    _toggleMonitoring() {
        this._paused = !this._paused;
        this._toggleItem.label.set_text(this._paused ? 'Ping fortsetzen' : 'Ping pausieren');
        if (this._paused) {
            this._removeTimer();
            this._cancelPing();
            this._setStatus('paused');
        } else {
            this._runPing();
        }
    }

    _runPing() {
        if (!this._enabled || this._paused || !this._indicator)
            return;

        this._removeTimer();
        this._cancelPing();

        const destination = this._settings.get_string(PING_DESTINATION).trim();
        if (!this._isValidDestination(destination)) {
            this._setStatus('invalid', `Ungültiges Ping-Ziel: ${destination || '(leer)'}`);
            this._scheduleNextPing();
            return;
        }

        this._setStatus('checking', `Prüfe ${destination} …`);
        this._cancellable = new Gio.Cancellable();

        try {
            const process = Gio.Subprocess.new(
                ['ping', '-n', '-c', '1', '-W', '2', destination],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            this._process = process;
            process.communicate_utf8_async(null, this._cancellable, (proc, result) => {
                if (!this._enabled || !this._indicator)
                    return;
                // A settings change or pause may have cancelled this request and
                // already started another one. Ignore the stale completion.
                if (this._process !== proc)
                    return;

                try {
                    const [, stdout] = proc.communicate_utf8_finish(result);
                    if (proc.get_successful()) {
                        const match = stdout.match(/time[=<]([\d.]+)\s*ms/i);
                        const latency = match ? Number.parseFloat(match[1]) : null;
                        if (latency !== null && latency >= SLOW_THRESHOLD_MS) {
                            this._setStatus('slow', `${destination}: ${latency.toFixed(1)} ms`);
                        } else {
                            this._setStatus('ok', latency === null
                                ? `${destination}: erreichbar`
                                : `${destination}: ${latency.toFixed(1)} ms`);
                        }
                    } else {
                        this._setStatus('down', `${destination}: keine Antwort`);
                    }
                } catch (error) {
                    if (!this._isCancelled(error))
                        this._setStatus('down', `Ping fehlgeschlagen: ${error.message}`);
                } finally {
                    this._process = null;
                    this._cancellable = null;
                    this._scheduleNextPing();
                }
            });
        } catch (error) {
            this._process = null;
            this._cancellable = null;
            this._setStatus('down', `Ping konnte nicht gestartet werden: ${error.message}`);
            this._scheduleNextPing();
        }
    }

    _isValidDestination(value) {
        if (!value || value.length > 253 || value.startsWith('-'))
            return false;
        // A hostname, IPv4 address, or IPv6 address only; no shell syntax or whitespace.
        return /^[A-Za-z0-9.:-]+$/.test(value);
    }

    _setStatus(status, detail = null) {
        const assets = {
            unknown: 'icon.png',
            checking: 'icon.png',
            ok: 'iconok.png',
            slow: 'iconslow.png',
            down: 'iconko.png',
            invalid: 'iconko.png',
            paused: 'icon.png',
        };
        const iconPath = GLib.build_filenamev([this.path, 'icons', assets[status] ?? assets.unknown]);
        if (this._icon)
            this._icon.gicon = new Gio.FileIcon({file: Gio.File.new_for_path(iconPath)});
        const messages = {
            unknown: 'Noch keine Messung',
            checking: 'Ping läuft …',
            paused: 'Überwachung pausiert',
        };
        const message = detail ?? messages[status] ?? 'IconPing Modern';
        if (this._indicator)
            this._indicator.accessible_name = message;
        if (this._statusItem)
            this._statusItem.label.set_text(message);
    }

    _scheduleNextPing() {
        this._removeTimer();
        if (!this._enabled || this._paused)
            return;
        const interval = Math.max(1, this._settings.get_int(REFRESH_INTERVAL));
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, () => {
            this._timerId = 0;
            this._runPing();
            return GLib.SOURCE_REMOVE;
        });
    }

    _removeTimer() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }
    }

    _cancelPing() {
        if (this._cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
        if (this._process) {
            try {
                this._process.force_exit();
            } catch (_) {
                // The process may already have exited while its callback is queued.
            }
            this._process = null;
        }
    }

    _isCancelled(error) {
        return error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED) ?? false;
    }
}
