import { useEffect, useMemo, useRef, useState } from 'react';
import { Wallet } from 'lucide-react';
import CurrencyTabs from './components/CurrencyTabs';
import SummaryCards from './components/SummaryCards';
import InvoiceTable from './components/InvoiceTable';
import InvoiceModal from './components/InvoiceModal';
import {
  computeCurrencyTotals,
  createInvoice,
  deleteInvoice,
  loadInvoices,
  updateInvoice,
} from './utils/store';

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [activeCurrency, setActiveCurrency] = useState('USD');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('payremind_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('payremind_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [undoState, setUndoState] = useState(null);
  const undoTimerRef = useRef(null);
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const data = await loadInvoices();
        setInvoices(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load invoices.');
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchInvoices();
  }, [isAuthenticated]);

  useEffect(() => {
    const onErr = (event) => {
      const message = event?.message || String(event);
      console.error('window.error', event);
      setError(message);
    };

    const onRejection = (event) => {
      const reason = event?.reason || 'Unhandled promise rejection';
      console.error('unhandledrejection', event);
      setError(String(reason));
    };

    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      localStorage.setItem('payremind_token', data.token);
      localStorage.setItem('payremind_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('payremind_token');
    localStorage.removeItem('payremind_user');
    setToken(null);
    setUser(null);
    setInvoices([]);
    setError(null);
  };

  const currencyTotals = useMemo(
    () => computeCurrencyTotals(invoices, activeCurrency),
    [invoices, activeCurrency],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        Loading invoices...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-6 text-slate-700">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">PayRemind Login</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to manage invoices and reminders.</p>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                required
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleTogglePaid = async (id, paid) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return;

    try {
      const updatedInvoice = await updateInvoice(id, {
        ...invoice,
        status: paid ? 'Paid' : 'Pending',
      });
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updatedInvoice : inv)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPaid = (id) => {
    handleTogglePaid(id, true);
  };

  const handleReminderSent = async (id, sentAt) => {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return;

    try {
      const updatedInvoice = await updateInvoice(id, {
        ...invoice,
        reminderHistory: [...(invoice.reminderHistory || []), sentAt],
      });
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updatedInvoice : inv)));
    } catch (err) {
      console.error(err);
    }
  };

  

  const handleDelete = async (id) => {
    const snapshot = invoices;
    const deleted = invoices.find((inv) => inv.id === id);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoState({ deleted, snapshot });
    undoTimerRef.current = setTimeout(() => setUndoState(null), 5000);

    try {
      await deleteInvoice(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setInvoices(undoState.snapshot);
    setUndoState(null);
  };

  const handleSave = async (data) => {
    try {
      if (editing) {
        const updatedInvoice = await updateInvoice(editing.id, {
          ...editing,
          ...data,
        });
        setInvoices((prev) => prev.map((inv) => (inv.id === editing.id ? updatedInvoice : inv)));
      } else {
        const newInvoice = await createInvoice({
          ...data,
          reminderHistory: [],
        });
        setInvoices((prev) => [...prev, newInvoice]);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    console.log("THE BUTTON WORKS! Opening modal...");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (invoice) => {
    setEditing(invoice);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">PayRemind</h1>
              <p className="text-sm text-slate-500">Payment Reminder System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-slate-600">Signed in as {user.name || user.email}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <CurrencyTabs activeCurrency={activeCurrency} onChange={setActiveCurrency} />
        <SummaryCards currency={activeCurrency} totals={currencyTotals} />
        <InvoiceTable
          invoices={invoices}
          currency={activeCurrency}
          onTogglePaid={handleTogglePaid}
          onMarkPaid={handleMarkPaid}
          onEdit={openEdit}
          onDelete={handleDelete} 
          onReminderSent={handleReminderSent}
          onCreateClick={openCreate}
        />
      </main>

      <InvoiceModal
        open={modalOpen}
        invoice={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
      {undoState && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <span>Deleted <strong>{undoState.deleted?.clientName}</strong>'s invoice</span>
          <button
            type="button"
            onClick={handleUndo}
            className="ml-1 rounded-md bg-white px-2.5 py-1 text-xs font-bold text-slate-900 hover:bg-slate-100"
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  );
}