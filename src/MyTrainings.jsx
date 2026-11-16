import React, { useEffect, useState } from 'react';
import { AlertDialog, Badge, Button, Dialog, IconButton, TextField } from '@radix-ui/themes';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ClipboardList, Plus, Printer, Save, Trash2, Users, X } from 'lucide-react';
import { exercises } from './exercises.js';

function exerciseDetails(exercise) {
  return <div className="print-instructions">
    <p>Utstyr: {exercise.equipment}</p>
    <ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p>Trenertips: {exercise.tip}</p>
  </div>;
}

function TrainingPrintout({ name, items }) {
  return <section className="training-printout">
    <h2>{name}</h2>
    <p>{items.length} øvelser · {items.reduce((sum, e) => sum + e.minutes, 0)} minutter</p>
    {items.map((exercise, index) => <article key={exercise.id} className="training-print-exercise">
      <h3>{index + 1}. {exercise.title}</h3>
      <p>{exercise.minutes} min · {exercise.category}</p>
      <p>{exercise.description}</p>
      <p>Utstyr: {exercise.equipment}</p>
      <ol>{exercise.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <p><strong>Trenertips:</strong> {exercise.tip}</p>
    </article>)}
  </section>;
}

export default function MyTrainings({ open, onOpenChange, plan, setPlan, trainings, setTrainings, storageError, Pitch }) {
  const [view, setView] = useState('saved');
  const [name, setName] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) {
      setView(trainings.length ? 'saved' : 'builder');
      setActiveId(null);
      setStep(0);
    }
  }, [open]);

  const draftExercises = plan.map(id => exercises.find(e => e.id === id)).filter(Boolean);
  const draftMinutes = draftExercises.reduce((total, e) => total + e.minutes, 0);
  const active = trainings.find(t => t.id === activeId);
  const activeExercises = active ? active.exerciseIds.map(id => exercises.find(e => e.id === id)).filter(Boolean) : [];
  const current = activeExercises[step];
  const completed = active?.completedIds ?? [];

  function moveExercise(from, direction) {
    setPlan(old => {
      const to = from + direction;
      if (to < 0 || to >= old.length) return old;
      const next = [...old];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  function saveTraining() {
    if (!draftExercises.length) return;
    const title = name.trim() || 'Trening ' + new Date().toLocaleDateString('nb-NO');
    const newTraining = {
      id: window.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random().toString(36).slice(2),
      name: title.slice(0, 80),
      exerciseIds: [...plan],
      completedIds: [],
      createdAt: new Date().toISOString(),
    };
    setTrainings(old => [newTraining, ...old]);
    setName('');
    setView('saved');
  }

  function openTraining(training) {
    setActiveId(training.id);
    const firstIncomplete = training.exerciseIds.findIndex(id => !training.completedIds.includes(id));
    setStep(firstIncomplete === -1 ? 0 : firstIncomplete);
    setView('player');
  }

  function toggleCompleted(id) {
    if (!active) return;
    setTrainings(old => old.map(training => training.id !== active.id ? training : {
      ...training,
      completedIds: training.completedIds.includes(id)
        ? training.completedIds.filter(value => value !== id)
        : [...training.completedIds, id],
    }));
  }

  function loadAsDraft(training) {
    setPlan([...training.exerciseIds]);
    setName(training.name + ' (kopi)');
    setView('builder');
  }

  const prettyDate = value => value ? new Date(value).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lagret trening';

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Content maxWidth="700px" className="plan-dialog training-dialog">
      <Dialog.Title>Mine treninger</Dialog.Title>
      <Dialog.Description>Sett sammen, lagre og gjennomfør treningene dine.</Dialog.Description>

      {view !== 'player' && <div className="training-tabs" role="tablist" aria-label="Treningsoversikt">
        <button role="tab" aria-selected={view === 'saved'} onClick={() => setView('saved')}>
          Lagrede treninger <span>{trainings.length}</span>
        </button>
        <button role="tab" aria-selected={view === 'builder'} onClick={() => setView('builder')}>
          Min treningsplan <span>{plan.length}</span>
        </button>
      </div>}

      {view === 'saved' && <section className="training-library">
        {trainings.length ? trainings.map(training => {
          const items = training.exerciseIds.map(id => exercises.find(e => e.id === id)).filter(Boolean);
          const minutes = items.reduce((sum, e) => sum + e.minutes, 0);
          const done = training.completedIds.length;
          return <article className="saved-training" key={training.id}>
            <div className="saved-training-main">
              <div className="saved-training-heading">
                <h3>{training.name}</h3>
                {done === items.length && <Badge color="green" variant="soft">Fullført</Badge>}
              </div>
              <p className="saved-training-date">{prettyDate(training.createdAt)} · {items.length} øvelser · {minutes} min</p>
              <div className="training-preview">{items.map(item => <span key={item.id}>{item.title}</span>)}</div>
              <div className="saved-training-progress" aria-label={done + ' av ' + items.length + ' øvelser fullført'}>
                <span style={{ width: (done / items.length * 100) + '%' }} />
              </div>
              <small>{done} av {items.length} fullført</small>
            </div>
            <div className="saved-training-actions">
              <Button onClick={() => openTraining(training)}>Åpne <ArrowRight size={16} /></Button>
              <Button variant="soft" color="gray" onClick={() => loadAsDraft(training)}>Bruk som mal</Button>
              <AlertDialog.Root>
                <AlertDialog.Trigger><IconButton variant="ghost" color="red" aria-label={'Slett ' + training.name}><Trash2 size={17} /></IconButton></AlertDialog.Trigger>
                <AlertDialog.Content maxWidth="390px">
                  <AlertDialog.Title>Slette treningen?</AlertDialog.Title>
                  <AlertDialog.Description>«{training.name}» blir fjernet fra denne nettleseren. Dette kan ikke angres.</AlertDialog.Description>
                  <div className="dialog-actions">
                    <AlertDialog.Cancel><Button variant="soft" color="gray">Avbryt</Button></AlertDialog.Cancel>
                    <AlertDialog.Action><Button color="red" onClick={() => setTrainings(old => old.filter(t => t.id !== training.id))}>Slett trening</Button></AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </div>
          </article>;
        }) : <div className="empty"><ClipboardList size={35} /><h3>Ingen lagrede treninger ennå</h3><p>Legg til noen øvelser i planen og lagre den. Da kan du hente den fram igjen når laget står klart på banen.</p><Button onClick={() => setView('builder')}>Lag en trening <Plus size={16} /></Button></div>}
      </section>}

      {view === 'builder' && <section className="training-builder">
        {draftExercises.length ? <>
          <div className="plan-summary"><strong>{draftMinutes} min</strong><span>{draftExercises.length} øvelser · bruk pilene for å endre rekkefølge</span></div>
          <div className="plan-items">{draftExercises.map((exercise, index) => <div className="plan-item" key={exercise.id}>
            <span className="plan-number">{index + 1}</span>
            <div><strong>{exercise.title}</strong><small>{exercise.category} · {exercise.minutes} min</small>{exerciseDetails(exercise)}</div>
            <div className="plan-reorder">
              <IconButton variant="ghost" size="1" color="gray" disabled={index === 0} aria-label={'Flytt ' + exercise.title + ' opp'} onClick={() => moveExercise(index, -1)}><ArrowUp size={17} /></IconButton>
              <IconButton variant="ghost" size="1" color="gray" disabled={index === draftExercises.length - 1} aria-label={'Flytt ' + exercise.title + ' ned'} onClick={() => moveExercise(index, 1)}><ArrowDown size={17} /></IconButton>
              <IconButton variant="ghost" size="1" color="red" aria-label={'Fjern ' + exercise.title} onClick={() => setPlan(old => old.filter(id => id !== exercise.id))}><X size={17} /></IconButton>
            </div>
          </div>)}</div>
          <div className="save-training-form">
            <label htmlFor="training-name">Navn på treningen</label>
            <div className="save-training-row">
              <TextField.Root id="training-name" placeholder={'Trening ' + new Date().toLocaleDateString('nb-NO')} maxLength={80} value={name} onChange={event => setName(event.target.value)} />
              <Button onClick={saveTraining}><Save size={16} />Lagre trening</Button>
            </div>
            <p>Du lagrer en kopi av planen. Den kan åpnes igjen fra «Lagrede treninger».</p>
          </div>
        </> : <div className="empty"><ClipboardList size={35} /><h3>Planen er tom</h3><p>Finn øvelser i banken og trykk «Legg til». Kom tilbake hit når du vil lagre.</p><Dialog.Close><Button>Finn øvelser <ArrowRight size={16} /></Button></Dialog.Close></div>}
        {draftExercises.length > 0 && <div className="dialog-actions"><Dialog.Close><Button variant="soft" color="gray">Finn flere øvelser</Button></Dialog.Close><Button variant="outline" color="gray" onClick={() => window.print()}><Printer size={16} />Skriv ut planen</Button></div>}
      </section>}

      {view === 'player' && active && current && <section className="training-player">
        <div className="training-player-top">
          <Button variant="ghost" color="gray" onClick={() => setView('saved')}><ArrowLeft size={17} />Alle treninger</Button>
          <Badge color="gray" variant="soft">{completed.length} av {activeExercises.length} fullført</Badge>
        </div>
        <h3>{active.name}</h3>
        <div className="training-step-strip" aria-label="Velg øvelse">
          {activeExercises.map((exercise, index) => <button key={exercise.id} aria-current={step === index ? 'step' : undefined} className={['training-step-dot', step === index ? 'is-current' : '', completed.includes(exercise.id) ? 'is-done' : ''].filter(Boolean).join(' ')} onClick={() => setStep(index)} aria-label={'Gå til øvelse ' + (index + 1) + ': ' + exercise.title}>
            {completed.includes(exercise.id) ? <Check size={16} /> : index + 1}
          </button>)}
        </div>
        <p className="training-step-label">ØVELSE {step + 1} AV {activeExercises.length}</p>
        <div className="training-current">
          <div className={'training-current-pitch type-' + current.type}><Pitch type={current.type} /></div>
          <div className="training-current-body">
            <h4>{current.title}</h4>
            <p>{current.description}</p>
            <div className="training-current-meta"><span><Clock3 size={15} />{current.minutes} min</span><span><Users size={15} />{current.players} spillere</span><span>{current.age.join('–')} år</span></div>
            <h5>Utstyr</h5><p>{current.equipment}</p>
            <h5>Slik gjør dere</h5><ol className="steps">{current.steps.map(item => <li key={item}>{item}</li>)}</ol>
            <aside className="coach-tip"><strong>Trenertips</strong><p>{current.tip}</p></aside>
            <p className="training-variant"><strong>En liten vri:</strong> {current.variant}</p>
          </div>
        </div>
        <div className="training-player-controls">
          <Button variant="soft" color={completed.includes(current.id) ? 'green' : 'gray'} aria-pressed={completed.includes(current.id)} onClick={() => toggleCompleted(current.id)}>
            <CheckCircle2 size={17} />{completed.includes(current.id) ? 'Fullført' : 'Marker som fullført'}
          </Button>
          <div>
            <Button variant="outline" color="gray" disabled={step === 0} onClick={() => setStep(old => Math.max(0, old - 1))}><ChevronLeft size={17} />Forrige</Button>
            <Button disabled={step === activeExercises.length - 1} onClick={() => setStep(old => Math.min(activeExercises.length - 1, old + 1))}>Neste <ChevronRight size={17} /></Button>
          </div>
        </div>
        <div className="training-player-footer"><span>Fremdriften lagres automatisk på denne enheten.</span><Button variant="ghost" color="gray" onClick={() => window.print()}><Printer size={16} />Skriv ut hele treningen</Button></div>
        <TrainingPrintout name={active.name} items={activeExercises} />
      </section>}

      {view === 'player' && (!active || !current) && <div className="empty"><p>Fant ikke denne treningen lenger.</p><Button onClick={() => setView('saved')}>Til lagrede treninger</Button></div>}
      <p className="storage-note">{storageError ? 'Nettleseren blokkerer lokal lagring. Endringene kan gå tapt når du lukker siden.' : 'Treningene lagres lokalt i denne nettleseren. Ingen konto eller synkronisering mellom enheter.'}</p>
    </Dialog.Content>
  </Dialog.Root>;
}
