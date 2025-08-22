const { BrowserRouter, Routes, Route, Link } = ReactRouterDOM;

function Sidebar() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    document.body.className = dark ? 'dark' : '';
  }, [dark]);

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/ingestion">Ingestion</Link></li>
        <li><Link to="/documents">Processed Documents</Link></li>
        <li><Link to="/schema">Schema Configuration</Link></li>
        <li><Link to="/review">Review Queue</Link></li>
        <li><Link to="/users">Users</Link></li>
        <li><Link to="/analytics">Analytics</Link></li>
        <li><Link to="/config">Configuration</Link></li>
      </ul>
      <hr />
      <button onClick={() => setDark(d => !d)} aria-label="Toggle color mode">
        {dark ? 'Light' : 'Dark'} Mode
      </button>
    </nav>
  );
}

function Dashboard() {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(setData);
  }, []);
  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Total files: {data.totalFiles}</p>
      <p>% DG: {data.percentDG}</p>
    </div>
  );
}

function Users() {
  const [users, setUsers] = React.useState([]);
  const [form, setForm] = React.useState({ name: '', email: '', role: 'Viewer', status: 'active' });
  const [editing, setEditing] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  const handleSubmit = e => {
    e.preventDefault();
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        lastActivity: new Date().toISOString().slice(0, 10)
      })
    })
      .then(r => r.json())
      .then(u => {
        setUsers([...users, u]);
        setForm({ name: '', email: '', role: 'Viewer', status: 'active' });
      });
  };

  const handleDelete = id => {
    fetch(`/api/users/${id}`, { method: 'DELETE' }).then(() =>
      setUsers(users.filter(u => u.id !== id))
    );
  };

  const startEdit = user => setEditing({ ...user });
  const cancelEdit = () => setEditing(null);
  const handleEditChange = (field, value) => setEditing({ ...editing, [field]: value });
  const saveEdit = e => {
    e.preventDefault();
    fetch(`/api/users/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing)
    })
      .then(r => r.json())
      .then(u => {
        setUsers(users.map(user => (user.id === u.id ? u : user)));
        setEditing(null);
      });
  };

  return (
    <div>
      <h2>Users</h2>
      <form onSubmit={handleSubmit} className="user-form">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" required />
        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" required />
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option>Admin</option>
          <option>Analyst</option>
          <option>Viewer</option>
          <option>DG Certified Operator</option>
          <option>Compliance Manager</option>
          <option>Regional Compliance Manager</option>
          <option>Global Compliance Director</option>
        </select>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit">Add</button>
      </form>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Activity</th><th></th><th></th></tr></thead>
        <tbody>
          {users.map(u => (
            editing && editing.id === u.id ? (
              <tr key={u.id}>
                <td><input value={editing.name} onChange={e => handleEditChange('name', e.target.value)} /></td>
                <td><input value={editing.email} onChange={e => handleEditChange('email', e.target.value)} /></td>
                <td>
                  <select value={editing.role} onChange={e => handleEditChange('role', e.target.value)}>
                    <option>Admin</option>
                    <option>Analyst</option>
                    <option>Viewer</option>
                    <option>DG Certified Operator</option>
                    <option>Compliance Manager</option>
                    <option>Regional Compliance Manager</option>
                    <option>Global Compliance Director</option>
                  </select>
                </td>
                <td>
                  <select value={editing.status} onChange={e => handleEditChange('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td>{u.lastActivity}</td>
                <td><button onClick={saveEdit}>Save</button></td>
                <td><button onClick={cancelEdit}>Cancel</button></td>
              </tr>
            ) : (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.status}</td>
                <td>{u.lastActivity}</td>
                <td><button onClick={() => startEdit(u)}>Edit</button></td>
                <td><button onClick={() => handleDelete(u.id)}>Delete</button></td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Documents() {
  const [docs, setDocs] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('');
  const [dg, setDg] = React.useState('all');
  const [minConf, setMinConf] = React.useState(0);
  const [selected, setSelected] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(setDocs);
  }, []);

  const types = Array.from(new Set(docs.map(d => d.type)));

  const filtered = docs.filter(d => {
    const matchesSearch = d.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesType = type ? d.type === type : true;
    const matchesDg = dg === 'all' ? true : d.dg === (dg === 'true');
    const matchesConf = d.confidence * 100 >= minConf;
    return matchesSearch && matchesType && matchesDg && matchesConf;
  });

  return (
    <div className="documents">
      <h2>Processed Documents</h2>
      <div className="doc-filters">
        <input
          aria-label="Search file name"
          placeholder="Search file name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select aria-label="Filter by type" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="Filter by DG" value={dg} onChange={e => setDg(e.target.value)}>
          <option value="all">DG: All</option>
          <option value="true">DG: Yes</option>
          <option value="false">DG: No</option>
        </select>
        <label className="confidence">
          Min confidence: {minConf}%
          <input
            type="range"
            min="0"
            max="100"
            value={minConf}
            onChange={e => setMinConf(parseInt(e.target.value))}
          />
        </label>
        <button
          onClick={() => {
            setSearch('');
            setType('');
            setDg('all');
            setMinConf(0);
          }}
          aria-label="Clear document filters"
        >
          Clear Filters
        </button>
      </div>
      <div className="doc-table">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Page</th>
              <th>Type</th>
              <th>DG</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr
                key={d.id}
                tabIndex="0"
                onClick={() => setSelected(d)}
                onKeyDown={e => {
                  if (e.key === 'Enter') setSelected(d);
                }}
                className={selected && selected.id === d.id ? 'selected' : ''}
              >
                <td>{d.fileName}</td>
                <td>{d.page}</td>
                <td>{d.type}</td>
                <td>{d.dg ? 'Yes' : 'No'}</td>
                <td>{(d.confidence * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {selected && (
          <div className="doc-detail">
            <h3>
              {selected.fileName} - page {selected.page}
            </h3>
            <div className="preview">
              {selected.preview ? (
                <img src={selected.preview} alt="preview" />
              ) : (
                <div className="placeholder">No preview</div>
              )}
            </div>
            <h4>Extracted Fields</h4>
            <ul>
              {Object.entries(selected.fields || {}).map(([k, v]) => (
                <li key={k}>
                  <strong>{k}:</strong> {v.value} ({(v.confidence * 100).toFixed(1)}%)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Ingestion() {
  const [file, setFile] = React.useState(null);
  const [uploadStatus, setUploadStatus] = React.useState('');
  const [config, setConfig] = React.useState({ brokers: '', topic: '', username: '', password: '' });
  const [status, setStatus] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/ingestion/config').then(r => r.json()).then(setConfig);
    fetch('/api/ingestion/status').then(r => r.json()).then(setStatus);
  }, []);

  const handleUpload = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fetch('/api/ingest', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(r => {
        setUploadStatus(r.status);
        fetch('/api/ingestion/status').then(r => r.json()).then(setStatus);
      });
  };

  const handleConfigChange = e => setConfig({ ...config, [e.target.name]: e.target.value });
  const saveConfig = e => {
    e.preventDefault();
    fetch('/api/ingestion/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).then(r => r.json()).then(setConfig);
  };

  return (
    <div>
      <h2>Ingestion</h2>
      <section>
        <h3>Manual Upload</h3>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={handleUpload}>Upload</button>
        {uploadStatus && <p>Status: {uploadStatus}</p>}
      </section>
      <section>
        <h3>Kafka Configuration</h3>
        <form onSubmit={saveConfig} className="kafka-form">
          <input name="brokers" value={config.brokers} onChange={handleConfigChange} placeholder="Brokers" />
          <input name="topic" value={config.topic} onChange={handleConfigChange} placeholder="Topic" />
          <input name="username" value={config.username} onChange={handleConfigChange} placeholder="Username" />
          <input name="password" type="password" value={config.password} onChange={handleConfigChange} placeholder="Password" />
          <button type="submit">Save</button>
        </form>
      </section>
      {status && (
        <section>
          <h3>Connection Status</h3>
          <p>Connected: {status.connected ? 'Yes' : 'No'}</p>
          <p>Messages: {status.messages}</p>
          <p>Lag: {status.lag}</p>
          <p>Errors: {status.errors}</p>
        </section>
      )}
    </div>
  );
}

function Review() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    fetch('/api/review').then(r => r.json()).then(setItems);
  }, []);
  return (
    <div>
      <h2>Review Queue</h2>
      {items.map(i => (
        <div key={i.id} style={{border:'1px solid #ccc', margin:'8px', padding:'8px'}}>
          <strong>{i.file}</strong> page {i.page} - {i.reason} ({i.indicator})
          <div>Severity: {i.severity} | Confidence: {i.confidence}</div>
        </div>
      ))}
    </div>
  );
}

const Placeholder = ({title}) => <div><h2>{title}</h2><p>Coming soon...</p></div>;

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingestion" element={<Ingestion />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/schema" element={<Placeholder title="Schema Configuration" />} />
            <Route path="/review" element={<Review />} />
            <Route path="/users" element={<Users />} />
            <Route path="/analytics" element={<Placeholder title="Analytics" />} />
            <Route path="/config" element={<Placeholder title="Configuration" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
