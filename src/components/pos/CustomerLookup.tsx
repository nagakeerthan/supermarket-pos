import React, { useState } from 'react';
import { User, Phone, Sparkles, UserPlus, X, Check, Award } from 'lucide-react';
import { usePosStore } from '../../store/usePosStore';
import { Customer } from '../../types';

export const CustomerLookup: React.FC = () => {
  const { customers, activeCustomer, setActiveCustomer, addCustomer } = usePosStore();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [phoneQuery, setPhoneQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  const handleSearchCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneQuery.trim()) return;

    const match = customers.find(
      (c) => c.phone.includes(phoneQuery.trim()) || c.name.toLowerCase().includes(phoneQuery.toLowerCase().trim())
    );

    if (match) {
      setActiveCustomer(match);
      setIsOpen(false);
      setPhoneQuery('');
    } else {
      setShowAddForm(true);
    }
  };

  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !phoneQuery) return;

    const created = addCustomer({
      name: newName.trim(),
      phone: phoneQuery.trim(),
      email: newEmail.trim() || undefined,
    });

    setActiveCustomer(created);
    setShowAddForm(false);
    setIsOpen(false);
    setPhoneQuery('');
    setNewName('');
    setNewEmail('');
  };

  return (
    <div className="relative">
      {/* Trigger Pill */}
      {activeCustomer ? (
        <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {activeCustomer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-900">{activeCustomer.name}</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                  <Award className="w-2.5 h-2.5" />
                  {activeCustomer.tier || 'Silver'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {activeCustomer.phone} • {activeCustomer.points} loyalty pts
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveCustomer(null)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded"
            title="Detach customer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>Attach Customer / Loyalty (F9)</span>
          </span>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
            + Add
          </span>
        </button>
      )}

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Customer Loyalty Lookup
              </h4>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowAddForm(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {!showAddForm ? (
              <form onSubmit={handleSearchCustomer} className="py-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter Customer Phone or Name:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={phoneQuery}
                      onChange={(e) => setPhoneQuery(e.target.value)}
                      placeholder="e.g. 9820198201 or Sneha"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick results preview */}
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {customers
                    .filter((c) =>
                      phoneQuery ? c.phone.includes(phoneQuery) || c.name.toLowerCase().includes(phoneQuery.toLowerCase()) : true
                    )
                    .slice(0, 4)
                    .map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setActiveCustomer(c);
                          setIsOpen(false);
                          setPhoneQuery('');
                        }}
                        className="w-full p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-[10px] text-slate-500">{c.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {c.points} pts
                        </span>
                      </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    + New Customer
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Select
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddNewCustomer} className="py-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ramesh Kadam"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phoneQuery}
                    onChange={(e) => setPhoneQuery(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Save & Attach
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
