import { useState } from "react";
import { CheckCircle2, Database, RefreshCw, AlertCircle } from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase";

interface DatabaseSyncBarProps {
  onRefresh?: () => void;
}

export const DatabaseSyncBar: React.FC<DatabaseSyncBarProps> = ({ onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const configured = isSupabaseConfigured();

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="no-print bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-slate-200">Database:</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[11px] ${
            configured
              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
              : "bg-rose-950 text-rose-300 border-rose-800"
          }`}>
            {configured ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {configured ? "Supabase connected" : "Supabase configuration missing"}
          </span>
        </div>

        {configured && onRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
            title="Refresh records from Supabase"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Database"}
          </button>
        )}
      </div>
    </div>
  );
};