import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

/** State shared by the diagnostic screens (vehicle, tapped area, symptom, answers). Lives in app/diagnose/_layout.js. */
const Ctx = createContext(null);

export function DiagnoseProvider({ children }) {
  const [vehicleId, setVehicleId] = useState(null);
  const [view, setView] = useState('front');
  const [areaId, setAreaId] = useState(null);
  const [symptom, setSymptom] = useState(null); // { id, label }
  const [answers, setAnswers] = useState({});
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    api.get('/diagnostics/catalog').then((r) => setCatalog(r.data)).catch((e) => setCatalogError(e?.response?.data?.error || 'Could not load the diagnostic assistant'));
  }, []);

  const value = useMemo(
    () => ({
      vehicleId, setVehicleId, view, setView, areaId, setAreaId, symptom, answers, catalog, catalogError,
      pickSymptom: (s) => { setSymptom(s); setAnswers({}); },
      answer: (qid, oid) => setAnswers((a) => ({ ...a, [qid]: oid })),
    }),
    [vehicleId, view, areaId, symptom, answers, catalog, catalogError]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useDiagnose = () => useContext(Ctx);