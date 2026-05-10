import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// 1. CHANGE THIS LINK when you get your public URL from Render
const BASE_URL = "https://toll-management-system-yr0y.onrender.com"; 

function App() {
  const [view, setView] = useState('landing');
  const [plazas, setPlazas] = useState([]);
  const [selectedPlaza, setSelectedPlaza] = useState(null);
  const [vehicleNum, setVehicleNum] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(null);

  // FETCH ALL PLAZAS FROM DB
  useEffect(() => {
    const loadPlazas = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/plazas`);
        setPlazas(res.data);
      } catch (err) { console.error("Error fetching plazas:", err); }
    };
    loadPlazas();
  }, [view]);

  // FETCH PLAZA-WIDE HISTORY
  useEffect(() => {
    if (view === 'toll-gate' && selectedPlaza) {
      const loadPlazaHistory = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/plaza-history/${selectedPlaza.name}`);
          setHistory(res.data);
        } catch (err) { console.error("Error fetching plaza history"); }
      };
      loadPlazaHistory();
    }
  }, [view, selectedPlaza]);

  // --- 1. TOLL OPERATOR LOGIC ---
  const handleGateEntry = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/toll-entry`, {
        vehicleNumber: vehicleNum.toUpperCase(),
        plazaName: selectedPlaza.name 
      });
      setMessage(`✅ ${res.data.message}`);
      setHistory(prev => [res.data.transaction, ...prev]);
      setSelectedPlaza(prev => ({
        ...prev, 
        accountBalance: prev.accountBalance + res.data.transaction.tollAmount
      }));
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.message || "Not Found"));
    }
  };

  // --- 2. PERSON/OWNER LOGIC: RECHARGE ---
  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount <= 0) return alert("Enter valid amount");
    try {
      const res = await axios.post(`${BASE_URL}/api/recharge`, {
        vehicleNumber: vehicleNum,
        amount: rechargeAmount
      });
      setBalance(res.data.newBalance);
      alert(`✅ Recharge Successful! New Balance: ₹${res.data.newBalance}`);
      setRechargeAmount('');
    } catch (err) { alert("Recharge Failed!"); }
  };

  // --- 3. PERSON/OWNER LOGIC: VIEW PROFILE ---
  const fetchOwnerDetails = async () => {
    if (!vehicleNum) return alert("Please enter a plate number");
    try {
      const acc = await axios.get(`${BASE_URL}/api/vehicle/${vehicleNum}`);
      setBalance(acc.data.balance);
      const logs = await axios.get(`${BASE_URL}/api/history/${vehicleNum}`);
      setHistory(logs.data);
      setView('person-dashboard');
    } catch (err) { alert("Vehicle not found!"); }
  };

  return (
    <div className="app-container">
      {/* 1. LANDING PAGE */}
      {view === 'landing' && (
        <div className="landing-page fade-in">
          <h1>🛣️ Smart Toll Hub</h1>
          <div className="choice-grid">
            {plazas.map(p => (
              <div key={p._id} className="card plaza-card" onClick={() => {
                setSelectedPlaza(p);
                setHistory([]);
                setView('toll-gate');
              }}>
                <div className="icon">📟</div>
                <h3>{p.name}</h3>
                <div className="toll-account-display">
                  <p>Toll Account Balance</p>
                  <span>₹{p.accountBalance}</span>
                </div>
                <button className="nav-btn">Manage Gate</button>
              </div>
            ))}
            
            <div className="card owner-card">
              <div className="icon">👤</div>
              <h2>Vehicle Owner</h2>
              <input 
                className="main-input" 
                placeholder="Enter Plate Number" 
                value={vehicleNum}
                onChange={e => setVehicleNum(e.target.value)} 
              />
              <button className="nav-btn" onClick={fetchOwnerDetails}>Check History</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOLL OPERATOR VIEW */}
      {view === 'toll-gate' && (
        <div className="page dashboard slide-up">
          <button className="back-btn" onClick={() => {setView('landing'); setVehicleNum('');}}>← Back to Hub</button>
          <div className="plaza-header">
            <h2>Monitoring: <span className="highlight">{selectedPlaza?.name}</span></h2>
            <div className="revenue-card">Toll Account: <span>₹{selectedPlaza?.accountBalance}</span></div>
          </div>

          <div className="toll-animation-track">
            <div className="toll-gate-bar"></div>
            <div className="moving-vehicle">🚗</div>
          </div>

          <div className="gate-input">
            <input 
              className="main-input" 
              placeholder="Scan Plate Number" 
              onChange={e => setVehicleNum(e.target.value)} 
            />
            <button onClick={handleGateEntry}>Process Entry</button>
          </div>
          <p className="status-text">{message}</p>

          <h3>Live Traffic Overview (Excel Style)</h3>
          <table>
            <thead>
              <tr><th>Date/Time</th><th>Plate Number</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {history.map((t, i) => (
                <tr key={i} className="row-animation">
                  <td>{new Date(t.timestamp).toLocaleString()}</td>
                  <td>{t.vehicleNumber}</td>
                  <td>₹{t.tollAmount}</td>
                  <td><span className="badge">Success</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. PERSON/USER VIEW */}
      {view === 'person-dashboard' && (
        <div className="page person-view slide-up">
          <button className="back-btn" onClick={() => {setView('landing'); setVehicleNum('');}}>← Back to Hub</button>
          <div className="user-header">
            <h2>Welcome, {vehicleNum.toUpperCase()}</h2>
            <div className="balance-card">
              <p>Account Balance</p>
              <span>₹{balance}</span>
            </div>
          </div>

          <div className="recharge-section card">
            <h3>Quick Wallet Recharge</h3>
            <input 
              className="main-input" 
              type="number" 
              placeholder="Amount in ₹" 
              value={rechargeAmount}
              onChange={e => setRechargeAmount(e.target.value)} 
            />
            <button onClick={handleRecharge}>Recharge Now</button>
          </div>

          <h3>Your Travel History</h3>
          <table>
            <thead>
              <tr><th>Date/Time</th><th>Plaza</th><th>Amount Cut</th><th>New Balance</th></tr>
            </thead>
            <tbody>
              {history.map((t, i) => (
                <tr key={i}>
                  <td>{new Date(t.timestamp).toLocaleString()}</td>
                  <td>{t.plazaName}</td>
                  <td className="minus">-₹{t.tollAmount}</td>
                  <td>₹{t.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
