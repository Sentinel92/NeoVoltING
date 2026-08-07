import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Database } from 'lucide-react';

interface TabSkeletonScreenProps {
  activeTabName?: string;
  isFirebaseSync?: boolean;
}

export const TabSkeletonScreen: React.FC<TabSkeletonScreenProps> = ({
  activeTabName = 'Módulo Eléctrico',
  isFirebaseSync = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 animate-pulse"
    >
      {/* Header Banner Skeleton */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Shimmer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-slate-800" />
              <div className="h-3.5 w-32 bg-slate-800 rounded-md" />
            </div>
            <div className="h-7 w-64 sm:w-80 bg-slate-800 rounded-xl" />
            <div className="h-3.5 w-48 sm:w-96 bg-slate-800/60 rounded-md" />
          </div>

          {isFirebaseSync && (
            <div className="flex items-center gap-2 bg-fuchsia-950/40 border border-fuchsia-500/30 px-3 py-2 rounded-xl text-xs text-fuchsia-300 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-fuchsia-400" />
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Sincronizando con Firebase...</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-slate-800 rounded" />
              <div className="w-8 h-8 rounded-xl bg-slate-800" />
            </div>
            <div className="h-8 w-36 bg-slate-800 rounded-lg" />
            <div className="h-3 w-24 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card Skeleton */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
            <div className="h-5 w-48 bg-slate-800 rounded-lg" />
            <div className="h-8 w-28 bg-slate-800 rounded-xl" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="h-12 bg-slate-950/80 rounded-xl border border-slate-800/50 p-3 flex items-center justify-between">
                <div className="h-4 w-1/3 bg-slate-800 rounded" />
                <div className="h-4 w-1/6 bg-slate-800 rounded" />
                <div className="h-4 w-1/4 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="h-5 w-36 bg-slate-800 rounded-lg" />
          <div className="h-48 bg-slate-950/80 rounded-2xl border border-slate-800/50 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-fuchsia-500 animate-spin" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full bg-slate-800/60 rounded" />
            <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
