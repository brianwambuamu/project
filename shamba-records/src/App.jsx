import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Sprout, Edit3, MessageSquare, PlusCircle, UserPlus, LayoutDashboard, AlertTriangle, CheckCircle2, LogOut } from 'lucide-react';
import './App.css';

const App = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [fields, setFields] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Modals
  const [selectedField, setSelectedField] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  
  // Forms
  const [updateData, setUpdateData] = useState({ stage: '', note: '' });
  const [newFieldData, setNewFieldData] = useState({ name: '', crop_type: '' });
  const [newAgentData, setNewAgentData] = useState({ name: '', email: '', password: '' });

  // --- 5. Field Status Logic ---
  const calculateStatus = useCallback((field) => {
    if (field.current_stage === 'Harvested') return 'Completed';
    
    const plantingDate = new Date(field.planting_date);
    const today = new Date();
    const daysSincePlanting = Math.floor((today - plantingDate) / (1000 * 60 * 60 * 24));

    // Logic: At Risk if stuck in a stage too long
    if (field.current_stage === 'Planted' && daysSincePlanting > 14) return 'At Risk';
    if (field.current_stage === 'Growing' && daysSincePlanting > 45) return 'At Risk';
    
    return 'Active';
  }, []);

  // --- 6. Dashboard Calculations ---
  const stats = useMemo(() => {
    const total = fields.length;
    let atRisk = 0, completed = 0, active = 0;

    fields.forEach(f => {
      const s = calculateStatus(f);
      if (s === 'At Risk') atRisk++;
      else if (s === 'Completed') completed++;
      else active++;
    });

    return { total, atRisk, completed, active };
  }, [fields, calculateStatus]);

  const fetchData = useCallback(async () => {
    if (!user?.token) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const fieldRes = await axios.get('http://localhost:5000/api/fields', config);
      setFields(fieldRes.data);
      
      if (user.role === 'ADMIN') {
        const obsRes = await axios.get('http://localhost:5000/api/observations', config);
        setObservations(obsRes.data);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', loginData);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) { alert('Login failed'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/agents', newAgentData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowAgentModal(false);
      setNewAgentData({ name: '', email: '', password: '' });
      alert("New Agent created!");
    } catch (err) { alert(err.response?.data?.error || "Failed"); }
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/fields', newFieldData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowAddModal(false);
      setNewFieldData({ name: '', crop_type: '' });
      fetchData();
    } catch (err) { alert("Failed to add field"); }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`http://localhost:5000/api/fields/${selectedField.id}`, 
        updateData, { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedField(null);
      fetchData();
    } catch (err) { alert("Update failed"); }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-lg w-96 border">
          <div className="flex flex-col items-center mb-6">
            <Sprout className="text-green-600 w-12 h-12 mb-2" />
            <h2 className="text-2xl font-bold text-gray-800 text-center text-green-800">Shamba Records</h2>
          </div>
          <div className="space-y-4">
            <input className="w-full p-3 border rounded-md" placeholder="Email" type="email" required onChange={e => setLoginData({...loginData, email: e.target.value})} />
            <input className="w-full p-3 border rounded-md" type="password" placeholder="Password" required onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition">Sign In</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black flex items-center gap-2 text-green-800"><Sprout size={32}/> SHAMBA RECORDS</h1>
          <div className="flex items-center gap-4">
            {user.role === 'ADMIN' && (
              <button onClick={() => setShowAgentModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-md"><UserPlus size={18}/> Add Agent</button>
            )}
            {user.role === 'AGENT' && (
              <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-md"><PlusCircle size={18}/> New Field</button>
            )}
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"><LogOut/></button>
          </div>
        </div>

        {/* DASHBOARD STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Fields" value={stats.total} icon={<LayoutDashboard className="text-gray-400" />} color="border-gray-300" />
          <StatCard title="Active" value={stats.active} icon={<Sprout className="text-green-500" />} color="border-green-500" />
          <StatCard title="At Risk" value={stats.atRisk} icon={<AlertTriangle className="text-red-500" />} color="border-red-500" />
          <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 className="text-blue-500" />} color="border-blue-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`bg-white rounded-xl shadow-md border ${user.role === 'ADMIN' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="p-4 border-b font-bold bg-gray-50 text-gray-700">Field Monitoring</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="p-4 text-left">Field</th>
                    <th className="p-4 text-left">Crop</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Stage</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {fields.map(f => {
                    const status = calculateStatus(f);
                    return (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold">{f.name}</td>
                        <td className="p-4">{f.crop_type}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            status === 'At Risk' ? 'bg-red-100 text-red-600' : 
                            status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4 capitalize">{f.current_stage}</td>
                        <td className="p-4">
                          {user.role === 'AGENT' && (
                            <button onClick={() => {setSelectedField(f); setUpdateData({stage: f.current_stage, note: ''});}} className="text-green-600 hover:underline flex items-center gap-1 font-bold"><Edit3 size={14}/> Update</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {user.role === 'ADMIN' && (
            <div className="bg-white rounded-xl shadow-md border overflow-hidden">
              <div className="p-4 border-b font-bold bg-gray-50 flex items-center gap-2"><MessageSquare size={18}/> Activity Insights</div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {observations.map(obs => (
                  <div key={obs.id} className="p-4 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-gray-800">{obs.field_name}</span>
                      <span className="text-gray-400">{new Date(obs.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="italic text-gray-600">"{obs.note}"</p>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">Agent: {obs.agent_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS (Agent/Field/Update) */}
      {showAgentModal && (
        <Modal title="Create New Agent" onClose={() => setShowAgentModal(false)}>
          <form onSubmit={handleAddAgent} className="space-y-4">
            <input required className="w-full p-2 border rounded" placeholder="Full Name" onChange={e => setNewAgentData({...newAgentData, name: e.target.value})}/>
            <input required className="w-full p-2 border rounded" type="email" placeholder="Email" onChange={e => setNewAgentData({...newAgentData, email: e.target.value})}/>
            <input required className="w-full p-2 border rounded" type="password" placeholder="Password" onChange={e => setNewAgentData({...newAgentData, password: e.target.value})}/>
            <button className="w-full py-2 bg-blue-600 text-white rounded font-bold">Create Agent</button>
          </form>
        </Modal>
      )}

      {showAddModal && (
        <Modal title="Register Field" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddField} className="space-y-4">
            <input required className="w-full p-2 border rounded" placeholder="Field Name" onChange={e => setNewFieldData({...newFieldData, name: e.target.value})}/>
            <input required className="w-full p-2 border rounded" placeholder="Crop Type" onChange={e => setNewFieldData({...newFieldData, crop_type: e.target.value})}/>
            <button className="w-full py-2 bg-green-600 text-white rounded font-bold">Create Field</button>
          </form>
        </Modal>
      )}

      {selectedField && (
        <Modal title={`Update ${selectedField.name}`} onClose={() => setSelectedField(null)}>
          <form onSubmit={submitUpdate} className="space-y-4">
            <select className="w-full p-2 border rounded" value={updateData.stage} onChange={e => setUpdateData({...updateData, stage: e.target.value})}>
              <option value="Planted">Planted</option>
              <option value="Growing">Growing</option>
              <option value="Ready">Ready</option>
              <option value="Harvested">Harvested</option>
            </select>
            <textarea className="w-full p-2 border rounded h-24" required placeholder="Observations..." onChange={e => setUpdateData({...updateData, note: e.target.value})}></textarea>
            <button className="w-full py-2 bg-green-600 text-white rounded font-bold">Submit</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Reusable Components
const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-4 rounded-xl shadow-sm border-t-4 ${color}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
      <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
      {children}
      <button onClick={onClose} className="w-full mt-2 py-2 text-gray-400 text-sm hover:underline">Cancel</button>
    </div>
  </div>
);

export default App;