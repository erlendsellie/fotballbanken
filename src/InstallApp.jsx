import React, { useEffect, useState } from 'react';
import { Button, Dialog } from '@radix-ui/themes';
import { Check, Download, Smartphone, WifiOff } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

export default function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const [open, setOpen] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState('');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    function ready(event) {
      event.preventDefault();
      setPrompt(event);
    }
    function complete() {
      setInstalled(true);
      setPrompt(null);
      setOpen(false);
    }
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', complete);
    const standalone = window.matchMedia('(display-mode: standalone)');
    const displayChanged = () => setInstalled(standalone.matches || navigator.standalone === true);
    standalone.addEventListener('change', displayChanged);
    if ('serviceWorker' in navigator) {
      registerSW({
        immediate: true,
        onOfflineReady: () => setOfflineReady(true),
        onRegisterError: () => setMessage('Offline-støtten kunne ikke lastes. Prøv å laste siden på nytt når du er på nett.'),
      });
      navigator.serviceWorker.ready.then(() => setOfflineReady(true));
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', ready);
      window.removeEventListener('appinstalled', complete);
      standalone.removeEventListener('change', displayChanged);
    };
  }, []);

  async function install() {
    if (!prompt) { setOpen(true); return; }
    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === 'accepted' ? 'Installasjonen er startet. Se etter Fotballbanken blant appene dine.' : 'Installasjonen ble avbrutt. Du kan prøve igjen via nettlesermenyen.');
    } catch {
      setMessage('Nettleseren kunne ikke starte installasjonen. Bruk nettlesermenyen som beskrevet under.');
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  }

  return <section className="install-panel" aria-label="Installer appen">
    <div className="install-heading"><span className="note-icon"><Smartphone size={23} /></span><div><h3>Ta øvelsesbanken med på banen</h3><p>{installed ? 'Appen er åpnet eller installert som en egen app.' : 'Legg den på hjemskjermen. Øvelser, favoritter og treningsplan blir med.'}</p><span className="offline-status" role="status">{offlineReady ? <><Check size={13} /> Klar til bruk uten nett</> : <><WifiOff size={13} /> Åpne på nett først for å lagre øvelsene offline</>}</span></div></div>
    {!installed && <Button onClick={() => setOpen(true)} size="3"><Download size={17} />Installer appen</Button>}
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Content maxWidth="490px"><Dialog.Title>Fotballbanken som app</Dialog.Title><Dialog.Description>Samme øvelsesbank, ett trykk unna. Ingen konto, appbutikk eller betaling.</Dialog.Description>
      <div className="install-instructions">{prompt ? <><p>Nettleseren din støtter direkte installasjon. Trykk under og bekreft i nettleseren.</p><Button onClick={install} disabled={installing}><Download size={16} />{installing ? 'Åpner installasjon …' : 'Installer på denne enheten'}</Button></> : isIOS ? <><h4>På iPhone og iPad</h4><ol><li>Åpne siden i Safari.</li><li>Trykk på delingsknappen.</li><li>Velg «Legg til på Hjem-skjerm», slå på «Åpne som nettapp» hvis valget vises, og trykk «Legg til».</li></ol></> : <><h4>Fra nettlesermenyen</h4><p>Åpne denne siden i Chrome eller Edge. Velg «Installer Fotballbanken», «Installer side som app» eller «Legg til på startskjermen» i nettlesermenyen.</p><p>Ser du ikke valget? Nettleseren støtter kanskje ikke installasjon, eller appen er allerede installert. Du kan fortsatt bruke alt rett i nettleseren.</p></>}
      <p className="storage-note">Åpne siden på nett én gang og vent til «Klar til bruk uten nett» vises. Da er øvelsene tilgjengelige også på en bane uten dekning. Favoritter og trening lagres lokalt på denne enheten.</p><p role="status">{message}</p></div><div className="dialog-actions"><Dialog.Close><Button variant="soft" color="gray">Lukk</Button></Dialog.Close></div>
    </Dialog.Content></Dialog.Root>
  </section>;
}
