import React from 'react';
import { CheckCircle2, Award, Camera, Edit3, BarChart3, FileText, Printer, Clock } from 'lucide-react';
import { translations as t } from '../translations/i18n';

interface HeaderProps {
  currentTab: 'scanner' | 'review' | 'insights' | 'schemes' | 'print';
  setCurrentTab: (tab: 'scanner' | 'review' | 'insights' | 'schemes' | 'print') => void;
  onOpenHackathon: () => void;
  stats: {
    totalMarked: number;
    hoursSaved: number;
    classAverage: number;
    needsReviewCount: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenHackathon,
  stats,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      {/* Top Hackathon Announcement Bar */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              NYLP AI Hackathon 2026
            </span>
            <span className="hidden sm:inline text-slate-300">
              {t.hackathonBanner}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenHackathon}
              className="text-xs text-amber-300 hover:text-white underline underline-offset-2 font-medium transition-colors cursor-pointer"
            >
              {t.viewHackathonSubmission} →
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Saxe
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    AI Exam Marker
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {t.appTagline}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Ticker */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">{t.statPapersMarked}:</span>
              <span className="font-bold text-slate-900 text-sm">{stats.totalMarked}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">{t.statHoursSaved}:</span>
              <span className="font-bold text-emerald-700 text-sm">~{stats.hoursSaved.toFixed(1)} hrs</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500">{t.statClassAverage}:</span>
              <span className="font-bold text-slate-900 text-sm ml-1.5">
                {stats.classAverage.toFixed(1)}%
              </span>
            </div>
            {stats.needsReviewCount > 0 && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <div className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                  {stats.needsReviewCount} {t.statNeedsReview}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-100 pt-2 pb-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentTab('scanner')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              currentTab === 'scanner'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{t.navScanner}</span>
          </button>

          <button
            onClick={() => setCurrentTab('review')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              currentTab === 'review'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{t.navReview}</span>
            {stats.needsReviewCount > 0 && (
              <span className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                currentTab === 'review' ? 'bg-white text-emerald-800' : 'bg-amber-500 text-white'
              }`}>
                {stats.needsReviewCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('insights')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              currentTab === 'insights'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t.navInsights}</span>
          </button>

          <button
            onClick={() => setCurrentTab('schemes')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              currentTab === 'schemes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.navExams}</span>
          </button>

          <button
            onClick={() => setCurrentTab('print')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              currentTab === 'print'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{t.navPrintSlips}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
