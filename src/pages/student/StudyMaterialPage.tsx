import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, FileText, Search, Sparkles, Filter, Eye, CheckCircle2 } from 'lucide-react';

export const StudyMaterialPage: React.FC = () => {
  const { materials, incrementDownloadCount, showToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  const categories = ['All', 'AI Prompts', 'Web Templates', 'Cold Pitch Scripts', 'Automation Blueprints', 'Meta Ads Cheat-sheet'];

  const filtered = materials.filter((m) => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDownload = (id: string, url: string, title: string) => {
    incrementDownloadCount(id);
    showToast(`Downloading toolkit: ${title}`);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-purple-500/30 relative overflow-hidden space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">
          <FileText className="w-3.5 h-3.5" />
          <span>AI & Web Developer Resource Vault</span>
        </div>
        <h1 className="text-3xl font-black text-white">
          Prompt Libraries, Templates & Toolkits
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
          Download 500+ ChatGPT prompt libraries, futuristic 3D website source code templates, cold outreach pitch scripts, and Make.com automation blueprints.
        </p>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search prompts, templates, scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-black shadow'
                  : 'glass-panel text-gray-300 hover:text-white border border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((mat) => (
          <div
            key={mat.id}
            className="glass-panel p-6 rounded-2xl border border-gray-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase font-mono">
                {mat.category}
              </span>

              <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors line-clamp-2">
                {mat.title}
              </h3>

              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>{mat.fileSizeMB} MB PDF Toolkit</span>
                <span>{mat.downloadsCount.toLocaleString()} Downloads</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center gap-2">
              <button
                onClick={() => setPreviewPdfUrl(mat.fileUrl)}
                className="flex-1 py-2 rounded-xl text-xs font-bold glass-panel border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Preview PDF
              </button>
              <button
                onClick={() => handleDownload(mat.id, mat.fileUrl, mat.title)}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 flex items-center gap-1 transition-colors shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PDF Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[85vh] glass-panel rounded-3xl border border-purple-500/30 overflow-hidden flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> PDF Document Preview
              </span>
              <button
                onClick={() => setPreviewPdfUrl(null)}
                className="text-xs font-bold text-gray-400 hover:text-white px-2.5 py-1 bg-gray-800 rounded-lg"
              >
                Close ✕
              </button>
            </div>
            <iframe src={previewPdfUrl} className="w-full flex-1 rounded-2xl bg-white" title="PDF Preview" />
          </div>
        </div>
      )}

    </div>
  );
};
