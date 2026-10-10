import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk?version=4.0';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class IconPingPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Netzwerküberwachung',
            description: 'IconPing prüft regelmäßig, ob das gewählte Ziel erreichbar ist.',
        });

        const destinationRow = new Adw.EntryRow({title: 'Ping-Ziel'});
        destinationRow.text = settings.get_string('ping-destination');
        destinationRow.connect('changed', () => {
            settings.set_string('ping-destination', destinationRow.text.trim());
        });
        group.add(destinationRow);

        const intervalRow = new Adw.ActionRow({title: 'Prüfintervall'});
        intervalRow.subtitle = 'Sekunden zwischen den Prüfungen';
        const adjustment = new Gtk.Adjustment({
            lower: 1,
            upper: 3600,
            step_increment: 1,
            page_increment: 10,
            value: settings.get_int('refresh-interval'),
        });
        const intervalSpin = new Gtk.SpinButton({adjustment, numeric: true, valign: Gtk.Align.CENTER});
        intervalSpin.connect('value-changed', () => {
            settings.set_int('refresh-interval', intervalSpin.get_value_as_int());
        });
        intervalRow.add_suffix(intervalSpin);
        intervalRow.set_activatable_widget(intervalSpin);
        group.add(intervalRow);

        page.add(group);
        window.add(page);
    }
}
