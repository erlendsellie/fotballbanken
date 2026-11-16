import React, { useId, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme, Button, Badge, Dialog, Select, TextField, IconButton } from '@radix-ui/themes';
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Clock3, ClipboardList, Flag, Globe2, Heart, Plus, Printer, Search, ShieldCheck, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react';
import '@radix-ui/themes/styles.css';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './style.css';
import { exercises, categories, filterExercises } from './exercises.js';
import { defaultFilters, normalizeFilters, normalizeIds, storageKeys } from './storage.js';
import { useStoredState, useSystemDarkMode } from './hooks.js';
import InstallApp from './InstallApp.jsx';

const emptyIds = [];

function Pitch({ type = 'game', large = false }) {
  const id = useId().replaceAll(':', '');
  const dots = type === 'pass' ? [[70, 65], [220, 65], [145, 130], [145, 35]]
    : type === 'shot' ? [[60, 110], [115, 95], [165, 70]]
      : [[55, 55], [105, 115], [160, 65], [220, 120], [235, 45]];

  return <svg className={`pitch ${large ? 'large' : ''}`} viewBox="0 0 300 170" fill="none" aria-hidden="true">
    <defs><pattern id={id} width="60" height="170" patternUnits="userSpaceOnUse"><rect width="30" height="170" fill="currentColor" opacity=".035" /></pattern></defs>
    <rect width="300" height="170" fill={`url(#${id})`} />
    <g stroke="currentColor" opacity=".35" strokeWidth="1.2"><rect x="24" y="20" width="252" height="130" rx="2" /><path d="M150 20v130M24 55h35v60H24m252-60h-35v60h35" /><circle cx="150" cy="85" r="25" /></g>
    {type === 'gates' && [[80, 40], [180, 120], [220, 65]].map(([x, y], i) => <g key={i} fill="#ffb86b"><path d={`M${x} ${y}l-5 10h10Z`} /><path d={`M${x + 25} ${y}l-5 10h10Z`} /></g>)}
    <path d={type === 'shot' ? 'M70 110 Q140 125 229 85' : type === 'pass' ? 'M80 65H210M213 72l-58 48' : 'M65 57Q110 30 146 62T224 115'} stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" opacity=".75" />
    {dots.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="8" fill={i % 2 ? '#ffb86b' : '#fff'} /><circle cx={x} cy={y} r="3" fill={i % 2 ? '#c16a27' : '#234ccd'} /></g>)}
    {type === 'shot' && <path d="M248 65h20v40h-20" stroke="#ffb86b" strokeWidth="4" />}
    <circle cx="85" cy="79" r="4" fill="currentColor" />
  </svg>;
}

function FavoriteButton({ exercise, active, onClick }) {
  return <IconButton
    className={`favorite-button ${active ? 'is-favorite' : ''}`}
    variant="soft"
    color={active ? 'pink' : 'gray'}
    onClick={onClick}
    aria-pressed={active}
    aria-label={`${active ? 'Fjern' : 'Lagre'} ${exercise.title} ${active ? 'fra' : 'som'} favoritt`}
    title={active ? 'Fjern favoritt' : 'Lagre favoritt'}
  ><Heart size={17} fill={active ? 'currentColor' : 'none'} /></IconButton>;
}

function ExerciseCard({ exercise: e, inPlan, favorite, onTogglePlan, onToggleFavorite }) {
  return <article className="exercise-card">
    <div className={`card-pitch type-${e.type}`}>
      <Pitch type={e.type} />
      <Badge className="age-badge" color="gray" variant="solid">{e.age.join('–')} år</Badge>
      <FavoriteButton exercise={e} active={favorite} onClick={onToggleFavorite} />
    </div>
    <div className="card-body">
      <div className="card-category">{e.category}</div>
      <h3>{e.title}</h3><p>{e.description}</p>
      <div className="card-meta"><span><Clock3 size={15} />{e.minutes} min</span><span><Users size={15} />{e.players} spillere</span></div>
      <div className="card-actions">
        <Dialog.Root>
          <Dialog.Trigger><Button variant="ghost" color="gray">Se øvelsen <ArrowUpRight size={16} /></Button></Dialog.Trigger>
          <Dialog.Content maxWidth="580px">
            <Dialog.Title>{e.title}</Dialog.Title><Dialog.Description>{e.description}</Dialog.Description>
            <div className="detail-meta"><Badge>{e.age.join('–')} år</Badge><Badge color="gray">{e.minutes} min</Badge><Badge color="gray">{e.players} spillere</Badge></div>
            <div className={`detail-pitch type-${e.type}`}><Pitch type={e.type} /></div>
            <h4>Dette trenger du</h4><p>{e.equipment}</p>
            <h4>Slik gjør dere</h4><ol className="steps">{e.steps.map(step => <li key={step}>{step}</li>)}</ol>
            <aside className="coach-tip"><strong>Trenertips</strong><p>{e.tip}</p></aside>
            <p><strong>En liten vri: </strong>{e.variant}</p>
            <Button variant="soft" color={favorite ? 'pink' : 'gray'} onClick={onToggleFavorite} aria-pressed={favorite}>
              <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />{favorite ? 'Lagret som favoritt' : 'Lagre som favoritt'}
            </Button>
            <div className="dialog-actions">
              <Dialog.Close><Button variant="soft" color="gray">Lukk</Button></Dialog.Close>
              <Button onClick={onTogglePlan}>{inPlan ? <Check size={16} /> : <Plus size={16} />}{inPlan ? 'Fjern fra trening' : 'Legg til trening'}</Button>
            </div>
          </Dialog.Content>
        </Dialog.Root>
        <Button variant={inPlan ? 'soft' : 'outline'} size="2" onClick={onTogglePlan} aria-label={`${inPlan ? 'Fjern' : 'Legg til'} ${e.title} ${inPlan ? 'fra' : 'i'} trening`}>
          {inPlan ? <Check size={16} /> : <Plus size={16} />}{inPlan ? 'Lagt til' : 'Legg til'}
        </Button>
      </div>
    </div>
  </article>;
}

function App() {
  const dark = useSystemDarkMode();
  const [query, setQuery] = useState('');
  const [filters, setFilters, filtersError] = useStoredState(storageKeys.filters, defaultFilters, normalizeFilters);
  const [plan, setPlan, planError] = useStoredState(storageKeys.plan, emptyIds, normalizeIds);
  const [favorites, setFavorites, favoritesError] = useStoredState(storageKeys.favorites, emptyIds, normalizeIds);
  const [planOpen, setPlanOpen] = useState(false);
  const { age, category, favoritesOnly } = filters;
  const storageError = planError || favoritesError || filtersError;
  const selected = plan.map(id => exercises.find(e => e.id === id));
  const total = selected.reduce((sum, exercise) => sum + exercise.minutes, 0);
  const filtered = filterExercises(exercises, query.trim(), age, category).filter(e => !favoritesOnly || favorites.includes(e.id));

  function togglePlan(id) { setPlan(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]); }
  function toggleFavorite(id) { setFavorites(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]); }
  function updateFilter(name, value) { setFilters(old => ({ ...old, [name]: value })); }
  function reset() { setQuery(''); setFilters(defaultFilters); }

  return <Theme accentColor="iris" radius="large" scaling="100%" appearance={dark ? 'dark' : 'light'}>
    <a className="skip" href="#ovelser">Hopp til øvelsene</a>
    <header className="header">
      <a href="#" className="brand"><img src="/ball.svg" alt="" width="36" height="36" />fotballbanken<span className="demo-tag">DEMO</span></a>
      <nav aria-label="Hovedmeny"><a className="nav-active" href="#ovelser">Øvelsesbanken</a><Button variant="soft" size="3" onClick={() => setPlanOpen(true)}><ClipboardList size={17} />Min trening <span className="count">{plan.length}</span></Button></nav>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> FOR SMÅ SPILLERE. OG STORE ØYEBLIKK.</div>
          <h1>Mindre planlegging.<br />Mer <span>spilleglede.</span></h1>
          <p>Gode fotballtreninger trenger ikke være kompliserte.<br className="desktop-br" /> Finn en øvelse, samle laget og la barna spille.</p>
          <Button size="4" asChild><a href="#ovelser">Finn neste favorittøvelse <ArrowRight size={19} /></a></Button>
          <div className="hero-meta"><span><Check size={15} />6–12 år</span><span><Check size={15} />Lite utstyr</span><span><Check size={15} />Alle skal med</span></div>
        </div>
        <div className="hero-art">
          <div className="field-label"><span className="live-dot" /> DAGENS VIKTIGSTE TAKTIKK</div><Pitch large />
          <div className="field-caption"><span>La dem leke.<br /><strong>Resten kommer.</strong></span><span className="scribble">↗</span></div>
          <div className="floating-note"><Sparkles size={18} /><span>Flere ballberøringer.<br /><strong>Færre køer.</strong></span></div>
        </div>
      </section>

      <section className="bank" id="ovelser">
        <div className="section-heading">
          <div><div className="eyebrow muted">LITT INSPIRASJON TIL NESTE TRENING</div><h2>Hva skal vi spille i dag?<span>↙</span></h2></div>
          <span className="library-count">{exercises.length} øvelser · klare til bruk</span>
        </div>
        <div className="filter-bar">
          <TextField.Root size="3" placeholder="Søk etter en øvelse …" value={query} onChange={event => setQuery(event.target.value)} aria-label="Søk etter øvelser"><TextField.Slot><Search size={19} /></TextField.Slot></TextField.Root>
          <div className="age-select"><SlidersHorizontal size={17} /><Select.Root value={age} onValueChange={value => updateFilter('age', value)}>
            <Select.Trigger aria-label="Aldersgruppe" variant="ghost" />
            <Select.Content><Select.Item value="Alle aldre">Alle aldre</Select.Item><Select.Item value="6">6–8 år</Select.Item><Select.Item value="8">8–10 år</Select.Item><Select.Item value="10">10–12 år</Select.Item></Select.Content>
          </Select.Root></div>
        </div>
        <div className="categories" aria-label="Øvelseskategori">
          {categories.map(value => <button key={value} aria-pressed={category === value} onClick={() => updateFilter('category', value)}>{value}{value === 'Alle øvelser' && <span>{exercises.length}</span>}</button>)}
          <button className="favorites-filter" aria-pressed={favoritesOnly} onClick={() => updateFilter('favoritesOnly', !favoritesOnly)}><Heart size={13} fill={favoritesOnly ? 'currentColor' : 'none'} />Mine favoritter<span>{favorites.length}</span></button>
        </div>
        <p className="result-count" aria-live="polite">Viser {filtered.length} {favoritesOnly ? 'favorittøvelser' : 'øvelser'}{age !== 'Alle aldre' ? ` for ${age}–${Number(age) + 2} år` : ' for små og store fotballføtter'}</p>
        {storageError && <p className="storage-warning" role="status">Nettleseren tillater ikke lokal lagring. Favoritter, filtre og trening beholdes bare til du lukker siden.</p>}
        <div className="exercise-grid">{filtered.map(exercise => <ExerciseCard key={exercise.id} exercise={exercise} inPlan={plan.includes(exercise.id)} favorite={favorites.includes(exercise.id)} onTogglePlan={() => togglePlan(exercise.id)} onToggleFavorite={() => toggleFavorite(exercise.id)} />)}</div>
        {!filtered.length && <div className="empty">{favoritesOnly ? <Heart size={30} /> : <Search size={30} />}<h3>{favoritesOnly && favorites.length === 0 ? 'Samle dine favorittøvelser' : 'Ingen øvelser akkurat her'}</h3><p>{favoritesOnly && favorites.length === 0 ? 'Trykk på hjertet på et øvelseskort. Favorittene lagres på denne enheten.' : 'Prøv et annet søkeord, en annen aldersgruppe eller vis alle øvelser.'}</p><Button onClick={reset}>Vis alle øvelser</Button></div>}
      </section>

      <section className="bottom-note"><span className="note-icon"><Flag size={23} /></span><div><h3>Den beste treningen? Den der alle vil komme tilbake.</h3><p>Tilpass banen, ta drikkepauser og gi rom for at barn lærer i ulikt tempo.</p></div><ShieldCheck size={29} /></section>
      <InstallApp />
      <section className="hosting"><Globe2 size={21} /><p><strong>Liten app. Rett på GitHub Pages.</strong> En statisk SPA med ferdige UI-komponenter. Ingen backend, ingen database – bare fotball.</p><a href="https://github.com/erlendsellie/fotballbanken" target="_blank" rel="noreferrer">SE KODEN PÅ GITHUB <ArrowUpRight size={14} /></a></section>
    </main>
    <footer><a className="brand" href="#"><img src="/ball.svg" alt="" width="25" height="25" />fotballbanken</a><p>Et lite konsept. Mye spilleglede.</p><span>Øvelsene er veiledende, ikke et offisielt treningsprogram.</span></footer>

    <Dialog.Root open={planOpen} onOpenChange={setPlanOpen}><Dialog.Content maxWidth="600px" className="plan-dialog">
      <Dialog.Title>Min trening</Dialog.Title><Dialog.Description>Din lille kampplan for en god dag på banen.</Dialog.Description>
      {selected.length ? <>
        <div className="plan-summary"><strong>{total} min</strong><span>{selected.length} øvelser · legg til pauser etter behov</span></div>
        <div className="plan-items">{selected.map((exercise, index) => <div className="plan-item" key={exercise.id}>
          <span className="plan-number">{index + 1}</span><div><strong>{exercise.title}</strong><small>{exercise.category} · {exercise.minutes} min</small>
            <div className="print-instructions"><p>Utstyr: {exercise.equipment}</p><ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol><p>Tips: {exercise.tip}</p></div>
          </div><IconButton variant="ghost" color="gray" onClick={() => togglePlan(exercise.id)} aria-label={`Fjern ${exercise.title}`}><X size={18} /></IconButton>
        </div>)}</div>
        <p className="storage-note">{storageError ? 'Lokal lagring er ikke tilgjengelig. Planen beholdes bare til du lukker siden.' : 'Trening, favoritter og filtre lagres automatisk i denne nettleseren. Ingen konto nødvendig.'}</p>
      </> : <div className="empty"><ClipboardList size={36} /><h3>En god trening starter med én øvelse</h3><p>Trykk «Legg til» på øvelsene du vil ha med.</p></div>}
      <div className="dialog-actions"><Dialog.Close><Button color="gray" variant="soft">{selected.length ? 'Fortsett å utforske' : 'Finn øvelser'}<ChevronRight size={15} /></Button></Dialog.Close>{selected.length > 0 && <Button onClick={() => window.print()}><Printer size={16} />Skriv ut trening</Button>}</div>
    </Dialog.Content></Dialog.Root>
  </Theme>;
}

createRoot(document.getElementById('root')).render(<App />);
