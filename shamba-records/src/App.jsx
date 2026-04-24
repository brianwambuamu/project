import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sprout, Edit3, MessageSquare, PlusCircle, UserPlus } from 'lucide-react';
import './App.css';

const App = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [fields, setFields] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Modals
  const [selectedField, setSelectedField] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  
  // Forms
  const [updateData, setUpdateData] = useState({ stage: '', note: '' });
  const [newFieldData, setNewFieldData] = useState({ name: '', crop_type: '' });
  const [newAgentData, setNewAgentData] = useState({ name: '', email: '', password: '' });

  const fetchData = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
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
    } finally { setLoading(false); }
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
      alert("New Agent created successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create agent");
    }
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
      alert("Field registered!");
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
      alert("Update Success!");
    } catch (err) { alert("Failed to update"); }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-lg w-96 border">
          <div className="flex flex-col items-center mb-6">
            <Sprout className="text-green-600 w-12 h-12 mb-2" />
            <h2 className="text-2xl font-bold text-gray-800 text-center">CropTracker</h2>
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-green-800"><Sprout /> CropTracker</h1>
          <div className="flex items-center gap-4">
            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
              >
                <UserPlus size={20}/> Add Agent
              </button>
            )}
            {user.role === 'AGENT' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-md"
              >
                <PlusCircle size={20}/> New Field
              </button>
            )}
            <div className="bg-white p-2 px-4 rounded-full shadow-sm border">
              <span className="text-gray-600 font-medium mr-4">{user.name} ({user.role})</span>
              <button onClick={handleLogout} className="text-red-500 font-bold text-sm">Logout</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`bg-white rounded-xl shadow-md border ${user.role === 'ADMIN' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="p-4 border-b font-bold bg-gray-50 text-gray-700">Managed Fields</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                  <tr>
                    <th className="p-4 text-left">Field</th>
                    <th className="p-4 text-left">Crop</th>
                    {user.role === 'ADMIN' && <th className="p-4 text-left">Agent</th>}
                    <th className="p-4 text-left">Stage</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {fields.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold">{f.name}</td>
                      <td className="p-4">{f.crop_type}</td>
                      {user.role === 'ADMIN' && <td className="p-4 text-blue-600 font-medium">{f.agent_name}</td>}
                      <td className="p-4 capitalize">{f.current_stage}</td>
                      <td className="p-4">
                        {user.role === 'AGENT' && (
                          <button onClick={() => {setSelectedField(f); setUpdateData({stage: f.current_stage, note: ''});}} className="text-green-600 hover:underline flex items-center gap-1"><Edit3 size={14}/> Update</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {user.role === 'ADMIN' && (
            <div className="bg-white rounded-xl shadow-md border overflow-hidden">
              <div className="p-4 border-b font-bold bg-gray-50 flex items-center gap-2"><MessageSquare size={18}/> Activity Log</div>
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

      {/* MODAL: ADD AGENT (ADMIN ONLY) */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-blue-800">Create New Agent Account</h3>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <input required className="w-full p-2 border rounded" placeholder="Agent Full Name" onChange={e => setNewAgentData({...newAgentData, name: e.target.value})}/>
              <input required className="w-full p-2 border rounded" type="email" placeholder="Email Address" onChange={e => setNewAgentData({...newAgentData, email: e.target.value})}/>
              <input required className="w-full p-2 border rounded" type="password" placeholder="Temporary Password" onChange={e => setNewAgentData({...newAgentData, password: e.target.value})}/>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAgentModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded font-bold">Create Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FIELD (AGENT ONLY) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-green-800">Register New Field</h3>
            <form onSubmit={handleAddField} className="space-y-4">
              <input required className="w-full p-2 border rounded" placeholder="Field Name" onChange={e => setNewFieldData({...newFieldData, name: e.target.value})}/>
              <input required className="w-full p-2 border rounded" placeholder="Crop Type" onChange={e => setNewFieldData({...newFieldData, crop_type: e.target.value})}/>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded font-bold">Create Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE FIELD */}
      {selectedField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Update {selectedField.name}</h3>
            <form onSubmit={submitUpdate} className="space-y-4">
              <select className="w-full p-2 border rounded" value={updateData.stage} onChange={e => setUpdateData({...updateData, stage: e.target.value})}>
                <option value="Planted">Planted</option>
                <option value="Growing">Growing</option>
                <option value="Ready">Ready</option>
                <option value="Harvested">Harvested</option>
              </select>
              <textarea className="w-full p-2 border rounded h-24" required placeholder="Observations..." onChange={e => setUpdateData({...updateData, note: e.target.value})}></textarea>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedField(null)} className="flex-1 py-2 border rounded">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded font-bold">Submit Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;