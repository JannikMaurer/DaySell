// Sicherung als Datei: Browser bzw. Web-App auf dem Home-Bildschirm.

/**
 * Auf dem iPhone öffnet sich das Teilen-Menü („In Dateien sichern“), sonst wird die
 * Datei heruntergeladen. Muss direkt beim Tippen aufgerufen werden, sonst blockiert Safari.
 */
export async function exportFile(json: string, name: string): Promise<boolean> {
  const file = new File([json], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] }) && /iPhone|iPad|iPod|Android/.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title: name });
      return true;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false;
      // sonst unten herunterladen
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

/** Lässt eine Datei auswählen und gibt ihren Inhalt zurück, oder null bei Abbruch. */
export function pickFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.onchange = () => {
      const f = input.files?.[0];
      input.remove();
      if (!f) return resolve(null);
      f.text().then(resolve, () => resolve(null));
    };
    input.addEventListener('cancel', () => { input.remove(); resolve(null); });
    document.body.appendChild(input);
    input.click();
  });
}

export function confirm(title: string, message: string, _ok: string): Promise<boolean> {
  return Promise.resolve(window.confirm(`${title}\n\n${message}`));
}
