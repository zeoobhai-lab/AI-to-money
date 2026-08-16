import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Chapter, Lesson, StudyMaterial } from '../../types';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageSquare,
  ArrowLeft,
  Flame,
  Sparkles,
  VideoOff,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  X
} from 'lucide-react';

export const CourseLearningPage: React.FC = () => {
  const {
    flagship,
    currentUser,
    currentRole,
    updateCourse,
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    toggleLessonCompletion,
    isLessonCompleted,
    getCourseProgressPercentage,
    setActiveTab,
    showToast
  } = useApp();

  const chapters = flagship.chapters || [];
  const allLessons = chapters.flatMap((c) => c.lessons || []);

  const [activeLessonId, setActiveLessonId] = useState<string>(allLessons[0]?.id || '');

  React.useEffect(() => {
    if ((!activeLessonId || !allLessons.some(l => l.id === activeLessonId)) && allLessons.length > 0) {
      setActiveLessonId(allLessons[0].id);
    }
  }, [allLessons, activeLessonId]);
  const [activeBottomTab, setActiveBottomTab] = useState<'notes' | 'resources' | 'doubts'>('notes');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Admin Topic & Module Modal States
  const [addTopicModalOpen, setAddTopicModalOpen] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDuration, setTopicDuration] = useState<number>(15);
  const [topicVideoUrl, setTopicVideoUrl] = useState('');
  const [topicNotes, setTopicNotes] = useState('');

  const [addModuleModalOpen, setAddModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  // Admin PDF Management Modal States
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfDescription, setPdfDescription] = useState('');
  const [pdfFileUrl, setPdfFileUrl] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState<number>(8.4);

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
  const progressPercentage = getCourseProgressPercentage(flagship.id);
  const isCompleted = activeLesson ? isLessonCompleted(activeLesson.id) : false;

  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setActiveLessonId(allLessons[currentLessonIndex + 1].id);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setActiveLessonId(allLessons[currentLessonIndex - 1].id);
    }
  };

  // Admin Handlers for Adding & Removing Topics (Lessons) and Modules
  const openAddTopicModal = (chapterId: string) => {
    setTargetChapterId(chapterId);
    setTopicTitle('');
    setTopicDuration(15);
    setTopicVideoUrl('');
    setTopicNotes('');
    setAddTopicModalOpen(true);
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetChapterId || !topicTitle.trim()) {
      showToast('Please enter a topic title.');
      return;
    }

    const newLesson: Lesson = {
      id: `les_${Date.now()}`,
      chapterId: targetChapterId,
      courseId: flagship.id,
      title: topicTitle.trim(),
      description: topicNotes.trim() || 'Practical video lecture topic.',
      durationMinutes: Number(topicDuration) || 10,
      videoUrl: topicVideoUrl.trim() || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      isFreePreview: false,
      order: Date.now(),
      notesMarkdown: topicNotes.trim()
    };

    const updatedChapters = flagship.chapters.map((chap) => {
      if (chap.id === targetChapterId) {
        return {
          ...chap,
          lessons: [...(chap.lessons || []), newLesson]
        };
      }
      return chap;
    });

    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast(`Topic "${topicTitle}" added successfully! 🎉`);
    setActiveLessonId(newLesson.id);
    setAddTopicModalOpen(false);
  };

  const handleDeleteTopic = (chapterId: string, lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this topic?')) return;

    const updatedChapters = flagship.chapters.map((chap) => {
      if (chap.id === chapterId) {
        return {
          ...chap,
          lessons: (chap.lessons || []).filter((l) => l.id !== lessonId)
        };
      }
      return chap;
    });

    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast('Topic removed! 🗑️');

    if (activeLessonId === lessonId) {
      const remaining = updatedChapters.flatMap((c) => c.lessons || []);
      if (remaining.length > 0) {
        setActiveLessonId(remaining[0].id);
      } else {
        setActiveLessonId('');
      }
    }
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) {
      showToast('Please enter a module title.');
      return;
    }

    const newChapter: Chapter = {
      id: `mod_${Date.now()}`,
      courseId: flagship.id,
      title: moduleTitle.trim(),
      description: moduleDesc.trim() || 'Curriculum module section.',
      order: (flagship.chapters?.length || 0) + 1,
      lessons: []
    };

    const updatedChapters = [...(flagship.chapters || []), newChapter];
    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast(`Module "${moduleTitle}" added successfully! 🚀`);
    setModuleTitle('');
    setModuleDesc('');
    setAddModuleModalOpen(false);
  };

  const handleDeleteModule = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this whole module and its topics?')) return;

    const updatedChapters = flagship.chapters.filter((c) => c.id !== chapterId);
    updateCourse(flagship.id, { chapters: updatedChapters });
    showToast('Module removed! 🗑️');
  };

  // Admin Handlers for PDF Files & Descriptions
  const handleOpenAddPdf = () => {
    setEditingPdfId(null);
    setPdfTitle('');
    setPdfDescription('');
    setPdfFileUrl('');
    setPdfFileSize(8.4);
    setPdfModalOpen(true);
  };

  const handleOpenEditPdf = (mat: StudyMaterial) => {
    setEditingPdfId(mat.id);
    setPdfTitle(mat.title);
    setPdfDescription(mat.description || '');
    setPdfFileUrl(mat.fileUrl);
    setPdfFileSize(mat.fileSizeMB || 8.4);
    setPdfModalOpen(true);
  };

  const handleSavePdf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfTitle.trim()) {
      showToast('Please enter a file title.');
      return;
    }

    const finalUrl = pdfFileUrl.trim() || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

    if (editingPdfId) {
      updateMaterial(editingPdfId, {
        title: pdfTitle.trim(),
        description: pdfDescription.trim(),
        fileUrl: finalUrl,
        fileSizeMB: Number(pdfFileSize) || 8.4
      });
      showToast('PDF resource updated successfully! ✏️');
    } else {
      const newMat: StudyMaterial = {
        id: `mat_${Date.now()}`,
        title: pdfTitle.trim(),
        category: 'AI Prompts',
        fileUrl: finalUrl,
        fileSizeMB: Number(pdfFileSize) || 8.4,
        downloadsCount: 0,
        uploadedAt: new Date().toISOString().split('T')[0],
        isFree: true,
        description: pdfDescription.trim()
      };
      addMaterial(newMat);
      showToast('PDF resource added successfully! 📄');
    }

    setPdfModalOpen(false);
  };

  const handleDeletePdf = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this PDF resource file?')) return;
    deleteMaterial(id);
    showToast('PDF resource removed! 🗑️');
  };

  return (
    <div className="min-h-screen bg-[#030408] flex flex-col">
      
      {/* Top Bar */}
      <div className="glass-panel px-4 py-3 border-b border-purple-500/20 flex items-center justify-between gap-4 sticky top-0 z-30 bg-[#030408]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('student-dashboard')}
            className="p-2 rounded-xl glass-panel text-gray-300 hover:text-white border border-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {flagship.title}
            </h1>
            <p className="text-[11px] text-amber-400 font-mono">
              {activeLesson ? `Active Video: ${activeLesson.title}` : `${chapters.length} Curriculum Modules`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {currentRole === 'admin' && (
            <div className="hidden sm:flex items-center gap-2 bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-500/40 text-purple-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Control Mode</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-4">
            <div className="space-y-1 w-36">
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>Overall Progress</span>
                <span className="text-amber-400 font-bold">{progressPercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold glass-panel border border-purple-500/30 text-purple-300"
          >
            {sidebarOpen ? 'Hide Modules' : 'Show Modules'}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        {sidebarOpen && (
          <aside className="w-full lg:w-80 glass-panel border-r border-gray-800 overflow-y-auto max-h-[450px] lg:max-h-[calc(100vh-60px)] p-4 space-y-4 shrink-0">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Modules & Content
              </span>
              <span className="text-[10px] text-gray-400">{allLessons.length} Videos</span>
            </div>

            {/* Admin Add Module Button */}
            {currentRole === 'admin' && (
              <button
                onClick={() => setAddModuleModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow hover:scale-[1.02] transition-transform"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add New Module</span>
              </button>
            )}

            <div className="space-y-4">
              {chapters.map((chap, cIdx) => (
                <div key={chap.id} className="space-y-2 p-2 rounded-2xl bg-gray-900/40 border border-gray-800/80">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-mono shrink-0">
                        0{cIdx + 1}
                      </span>
                      <span className="truncate">{chap.title}</span>
                    </h4>

                    {/* Admin Module Actions */}
                    {currentRole === 'admin' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openAddTopicModal(chap.id)}
                          className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold flex items-center gap-0.5 border border-amber-500/40"
                          title="Add Topic to Module"
                        >
                          <Plus className="w-3 h-3 text-amber-400" />
                          <span>Topic</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteModule(chap.id, e)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                          title="Remove Module"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {chap.lessons && chap.lessons.length > 0 ? (
                    <div className="space-y-1 pl-1">
                      {chap.lessons.map((les) => {
                        const active = les.id === activeLessonId;
                        const completed = isLessonCompleted(les.id);
                        return (
                          <div
                            key={les.id}
                            onClick={() => setActiveLessonId(les.id)}
                            className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              active
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                                : 'hover:bg-gray-800/80 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <PlayCircle className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-gray-500'}`} />
                              )}
                              <span className="truncate">{les.title}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-gray-400 font-mono">
                                {les.durationMinutes}m
                              </span>

                              {/* Admin Delete Topic Button */}
                              {currentRole === 'admin' && (
                                <button
                                  onClick={(e) => handleDeleteTopic(chap.id, les.id, e)}
                                  className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/30 border border-red-500/20"
                                  title="Remove Topic"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pl-7 pr-2">
                      <p className="text-[10px] text-gray-500 italic">No topics uploaded yet</p>
                      {currentRole === 'admin' && (
                        <button
                          onClick={() => openAddTopicModal(chap.id)}
                          className="text-[10px] text-amber-400 underline font-bold"
                        >
                          + Add First Topic
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* CENTER: Player Canvas or Empty State Notice */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {allLessons.length > 0 && activeLesson ? (
            <>
              <div className="relative aspect-video w-full max-w-4xl mx-auto bg-black rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-500/10">
                <video
                  key={activeLesson.id}
                  src={activeLesson.videoUrl}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-cover"
                  poster={flagship.thumbnail}
                />
              </div>

              <div className="max-w-4xl mx-auto w-full glass-panel p-4 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">{activeLesson.title}</h2>
                  <p className="text-xs text-gray-400">{activeLesson.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLessonCompletion(activeLesson.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-400 text-black hover:bg-amber-300 font-extrabold'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCompleted ? 'Completed 🏆' : 'Mark Complete'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevLesson}
                      disabled={currentLessonIndex <= 0}
                      className="p-2 rounded-xl glass-panel border border-gray-800 text-gray-300 hover:text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextLesson}
                      disabled={currentLessonIndex >= allLessons.length - 1}
                      className="p-2 rounded-xl glass-panel border border-gray-800 text-gray-300 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-3xl mx-auto w-full glass-panel p-10 rounded-3xl border border-amber-500/30 text-center space-y-4 my-8">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <VideoOff className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">No Topics Available</h2>
              <p className="text-xs text-gray-300 max-w-md mx-auto">
                No video topics are currently uploaded for this module. {currentRole === 'admin' ? 'As Admin, you can add topics directly using the sidebar "+" buttons.' : 'Access your downloadable bonus toolkits below.'}
              </p>
              <button
                onClick={() => setActiveTab('study-material')}
                className="px-6 py-3 rounded-2xl text-xs font-black text-black bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg"
              >
                Go to Prompt & Template Resource Vault
              </button>
            </div>
          )}

          {/* Bottom Tabs */}
          <div className="max-w-4xl mx-auto w-full space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <button
                onClick={() => setActiveBottomTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeBottomTab === 'notes' ? 'bg-amber-400 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Module Summary & Notes
              </button>
              <button
                onClick={() => setActiveBottomTab('resources')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeBottomTab === 'resources' ? 'bg-amber-400 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Downloadable Prompt PDFs & Codes
              </button>
              <button
                onClick={() => setActiveBottomTab('doubts')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeBottomTab === 'doubts' ? 'bg-amber-400 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Ask Mentors & Community
              </button>
            </div>

            {activeBottomTab === 'notes' && (
              <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Key Takeaways & Implementation Guide
                </h4>
                <div className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-line bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                  {activeLesson?.notesMarkdown || '# Module Implementation Blueprints\n\n- Access 500+ ChatGPT & Claude Prompt Library\n- Deploy 3D WebGL HTML5 templates\n- Pitch international clients with cold email scripts'}
                </div>
              </div>
            )}

            {/* DYNAMIC PDF & TOOLKIT SECTION */}
            {activeBottomTab === 'resources' && (
              <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-gray-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" /> Downloadable Toolkit & PDF Files ({materials.length})
                    </h4>
                    <p className="text-[11px] text-gray-400">Access exclusive PDF guidebooks, code blueprints, and prompt templates.</p>
                  </div>

                  {currentRole === 'admin' && (
                    <button
                      onClick={handleOpenAddPdf}
                      className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 text-black hover:bg-amber-300 flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add PDF File</span>
                    </button>
                  )}
                </div>

                {materials.length > 0 ? (
                  <div className="space-y-3">
                    {materials.map((mat) => (
                      <div
                        key={mat.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gray-900/80 border border-gray-800 text-xs gap-4 hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-extrabold text-white text-sm">{mat.title}</p>
                            {mat.description && (
                              <p className="text-xs text-gray-300 leading-relaxed bg-black/30 px-2.5 py-1.5 rounded-lg border border-gray-800/80 font-mono">
                                {mat.description}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 font-mono">
                              PDF File • {mat.fileSizeMB} MB • Added {mat.uploadedAt || 'recently'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-amber-400 text-black text-xs font-black hover:bg-amber-300 flex items-center gap-1.5 shadow"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </a>

                          {currentRole === 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenEditPdf(mat)}
                                className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40 text-xs font-bold"
                                title="Edit PDF / Write Description"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeletePdf(mat.id, e)}
                                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                                title="Remove PDF"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-gray-800 text-center space-y-3">
                    <p className="text-xs text-gray-400">No PDF files or toolkits attached yet.</p>
                    {currentRole === 'admin' && (
                      <button
                        onClick={handleOpenAddPdf}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Upload First PDF File
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeBottomTab === 'doubts' && (
              <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" /> Ask AI & Mentor Q&A
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask any question regarding web dev, prompt engineering, or ads..."
                    className="flex-1 px-4 py-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                  />
                  <button className="px-4 py-2.5 bg-amber-400 text-black text-xs font-bold rounded-xl hover:bg-amber-300">
                    Ask Question
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Admin Add Topic Modal */}
      {addTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-amber-500/40 space-y-4 bg-[#070a14]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Add New Lecture Topic
              </h3>
              <button
                onClick={() => setAddTopicModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTopic} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01. Building 3D Canvas with Three.js"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={topicDuration}
                  onChange={(e) => setTopicDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Video Stream URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={topicVideoUrl}
                  onChange={(e) => setTopicVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">Leave empty to use high quality sample mp4 video stream.</p>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Topic Summary & Implementation Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter markdown notes or key steps for students..."
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTopicModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-extrabold hover:bg-amber-300 shadow-md shadow-amber-500/20"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add Module Modal */}
      {addModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-purple-500/40 space-y-4 bg-[#070a14]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Create New Module
              </h3>
              <button
                onClick={() => setAddModuleModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddModule} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 8: AI Agent Monetization"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Module Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief overview of what students will master in this module..."
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModuleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-extrabold hover:bg-purple-500 shadow-md shadow-purple-500/20"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add/Edit PDF Modal */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-amber-500/40 space-y-4 bg-[#070a14]">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                {editingPdfId ? 'Edit PDF File & Write Description' : 'Add New Downloadable PDF'}
              </h3>
              <button
                onClick={() => setPdfModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePdf} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">PDF File Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bonus Prompt & Code Blueprint.pdf"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Custom Notes / Description (Write Whatever You Want)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Complete 100+ prompt cheat-sheet, HTML5 WebGL starter templates, and cold pitch scripts..."
                  value={pdfDescription}
                  onChange={(e) => setPdfDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">PDF Direct Link / File URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/file.pdf"
                  value={pdfFileUrl}
                  onChange={(e) => setPdfFileUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">Leave empty to use sample downloadable PDF file.</p>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">File Size (MB)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pdfFileSize}
                  onChange={(e) => setPdfFileSize(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-900 rounded-xl border border-gray-800 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-800 text-gray-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-extrabold hover:bg-amber-300 shadow-md shadow-amber-500/20"
                >
                  Save PDF File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseLearningPage;

