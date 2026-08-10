import React, { useEffect, useState } from "react";
import { Check, Pencil, RefreshCw, Save, ShieldCheck, Users } from "lucide-react";
import { getAdministratorUsers, updateUserApproval, UserApproval } from "../lib/auth";
import { getRecords, updateRecord } from "../lib/recordsStore";
import { ReceiptRecord } from "../types";

export const AdministratorPanel: React.FC = () => {
  const [users, setUsers] = useState<UserApproval[]>([]);
  const [records, setRecords] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedUsers, loadedRecords] = await Promise.all([getAdministratorUsers(), getRecords()]);
      setUsers(loadedUsers);
      setRecords(loadedRecords);
    } catch (loadError: any) {
      setError(loadError.message || "Could not load administrator data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const saveUser = async (user: UserApproval) => {
    try {
      await updateUserApproval(user.userId, user.approved, user.fullName, user.isAdmin);
      setEditingUser(null);
    } catch (saveError: any) {
      setError(saveError.message || "Could not update account.");
    }
  };

  const saveRecord = async (record: ReceiptRecord) => {
    try {
      const updated = await updateRecord(record.id, record);
      setRecords((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingRecord(null);
    } catch (saveError: any) {
      setError(saveError.message || "Could not update receipt.");
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-slate-500">Loading administrator workspace...</div>;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600" /> Administrator workspace</h2>
          <p className="text-xs text-slate-500 mt-1">Approve accounts and correct account or receipt data.</p>
        </div>
        <button type="button" onClick={() => void loadData()} className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" /><h3 className="text-sm font-bold">Accounts awaiting approval</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Email</th><th className="p-3">Full name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>
            {users.map((user) => <tr key={user.userId} className="border-t border-slate-100">
              <td className="p-3">{user.email}</td>
              <td className="p-3">{editingUser === user.userId ? <input value={user.fullName} onChange={(event) => setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, fullName: event.target.value } : item))} className="border rounded px-2 py-1" /> : user.fullName}</td>
              <td className="p-3">{editingUser === user.userId || !user.approved ? <select value={user.isAdmin ? "admin" : "user"} onChange={(event) => setUsers((current) => current.map((item) => item.userId === user.userId ? { ...item, isAdmin: event.target.value === "admin" } : item))} className="border rounded px-2 py-1"><option value="user">User</option><option value="admin">Administrator</option></select> : user.isAdmin ? "Administrator" : "User"}</td>
              <td className="p-3"><span className={user.approved ? "text-emerald-700" : "text-amber-700"}>{user.approved ? "Approved" : "Pending"}</span></td>
              <td className="p-3 flex gap-2">{editingUser === user.userId ? <button type="button" onClick={() => void saveUser(user)} className="text-emerald-700 font-semibold flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Save</button> : <button type="button" onClick={() => setEditingUser(user.userId)} className="text-indigo-700 font-semibold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>}{!user.approved && <button type="button" onClick={() => void saveUser({ ...user, approved: true })} className="text-emerald-700 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approve</button>}</td>
            </tr>)}
          </tbody></table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200"><h3 className="text-sm font-bold">Rewrite receipt data</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50 text-left"><tr><th className="p-3">Receipt</th><th className="p-3">Name</th><th className="p-3">Organization</th><th className="p-3">Amount</th><th className="p-3">Payment</th><th className="p-3">Remarks</th><th className="p-3">Action</th></tr></thead><tbody>
          {records.map((record) => <tr key={record.id} className="border-t border-slate-100">
            <td className="p-3 font-semibold">{record.id}</td>
            {(["name", "organization", "amount", "paymentMethod", "remarks"] as const).map((field) => <td className="p-3" key={field}>{editingRecord === record.id ? <input value={String(record[field] ?? "")} onChange={(event) => setRecords((current) => current.map((item) => item.id === record.id ? { ...item, [field]: field === "amount" ? Number(event.target.value) : event.target.value } : item))} className="w-28 border rounded px-2 py-1" /> : String(record[field] ?? "")}</td>)}
            <td className="p-3">{editingRecord === record.id ? <button type="button" onClick={() => void saveRecord(record)} className="text-emerald-700 font-semibold flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Save</button> : <button type="button" onClick={() => setEditingRecord(record.id)} className="text-indigo-700 font-semibold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>}</td>
          </tr>)}
        </tbody></table></div>
      </div>
    </section>
  );
};