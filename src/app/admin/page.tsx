"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import {
  Plus, Trash2, CheckCircle, XCircle, FileText, Shield,
  Users, Settings, ChevronDown, ChevronUp, Tag, Video, Search
} from "lucide-react";

interface Question { id: string; question: string; type: string; options: string | null; required: boolean; order: number; }
interface Application {
  id: string;
  status: string;
  createdAt: string;
  user: { name: string; image: string | null; discordId: string | null };
  answers: { id: string; answer: string; question: { question: string; } }[];
}
interface Category { id: string; name: string; }
interface Streamer { id: string; name: string; platform: string; avatar: string; link: string; isLive: boolean; viewers: number; createdAt: string; }
interface AdminUser { id: string; name: string | null; email: string; role: string; image: string | null; }

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"applications" | "questions" | "categories" | "streamers" | "admins">("applications");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appFilter, setAppFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");

  // New forms
  const [newQ, setNewQ] = useState({ question: "", type: "TEXT", options: "", required: true });
  const [newCat, setNewCat] = useState("");
  const [newStreamer, setNewStreamer] = useState({ name: "", platform: "Twitch", avatar: "", link: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !["ADMIN", "SUPPORT"].includes((session.user as any).role)) {
      router.push("/");
      return;
    }
    loadData();
  }, [session, status]);

  const loadData = async () => {
    const isAdmin = (session?.user as any)?.role === "ADMIN";
    
    // Fetch basic data (applications)
    const appRes = await fetch("/api/admin/applications").then((r) => r.json());
    setApplications(appRes ?? []);

    // Only fetch settings if ADMIN
    if (isAdmin) {
      const [qRes, catRes, streamRes] = await Promise.all([
        fetch("/api/questions").then((r) => r.json()),
        fetch("/api/rules").then((r) => r.json()),
        fetch("/api/streamers").then((r) => r.json()),
      ]);
      setQuestions(Array.isArray(qRes?.questions) ? qRes.questions : []);
      setCategories(Array.isArray(catRes) ? catRes.map((c: any) => ({ id: c.id, name: c.name })) : []);
      setStreamers(Array.isArray(streamRes) ? streamRes : []);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: newQ.question,
        type: newQ.type,
        options: newQ.type === "SELECT" ? newQ.options.split(",").map((o) => o.trim()) : null,
        required: newQ.required,
        order: questions.length,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setQuestions([...questions, data.question]);
      setNewQ({ question: "", type: "TEXT", options: "", required: true });
      setMsg("تم إضافة السؤال ✓");
      setTimeout(() => setMsg(""), 3000);
    }
    setSaving(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("حذف السؤال؟")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories([...categories, data.category]);
      setNewCat("");
    }
  };

  const handleAddStreamer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamer.name.trim() || !newStreamer.link.trim() || !newStreamer.avatar.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/streamers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStreamer),
    });
    if (res.ok) {
      const data = await res.json();
      setStreamers([data.streamer, ...streamers]);
      setNewStreamer({ name: "", platform: "Twitch", avatar: "", link: "" });
      setMsg("تم إضافة صانع المحتوى ✓");
      setTimeout(() => setMsg(""), 3000);
    }
    setSaving(false);
  };

  const handleDeleteStreamer = async (id: string) => {
    if (!confirm("حذف صانع المحتوى؟")) return;
    await fetch(`/api/admin/streamers/${id}`, { method: "DELETE" });
    setStreamers(streamers.filter((s) => s.id !== id));
  };

  const handleApplicationStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApplications(applications.map((a) => a.id === id ? { ...a, status } : a));
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-[#E50914] rounded-full animate-spin" /></div>;
  }

  if (!session || !["ADMIN", "SUPPORT"].includes((session.user as any).role)) {
    return <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">غير مصرح لك بالدخول</div>;
  }

  const isAdmin = (session.user as any).role === "ADMIN";

  const allTabs = [
    { key: "applications", label: "التقديمات", icon: <FileText className="w-5 h-5" />, count: applications.filter(a => a.status === "PENDING").length },
    { key: "questions", label: "أسئلة التقديم", icon: <Settings className="w-5 h-5" />, count: questions.length, adminOnly: true },
    { key: "categories", label: "فئات القوانين", icon: <Tag className="w-5 h-5" />, count: categories.length, adminOnly: true },
    { key: "streamers", label: "صناع المحتوى", icon: <Video className="w-5 h-5" />, count: streamers.length, adminOnly: true },
  ];

  const tabs = allTabs.filter(t => !t.adminOnly || isAdmin);

  const filteredApplications = applications.filter(app => {
    if (appFilter !== "ALL" && app.status !== appFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.user.name.toLowerCase().includes(q) ||
      (app.user.discordId && app.user.discordId.includes(q))
    );
  });

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "rgba(234,179,8,0.1)", text: "#eab308", label: "قيد المراجعة" },
    APPROVED: { bg: "rgba(34,197,94,0.1)", text: "#22c55e", label: "مقبول ✓" },
    REJECTED: { bg: "rgba(229,9,20,0.1)", text: "#E50914", label: "مرفوض ✗" },
  };

  return (
    <main className="min-h-screen pt-24 pb-16" style={{ background: "#09090b", color: "#FAFAFA" }}>
      <Navbar />

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(229,9,20,0.15)" }}>
              <Shield className="w-5 h-5" style={{ color: "#E50914" }} />
            </div>
            <h1 className="text-4xl font-black text-white">لوحة الإدارة</h1>
          </div>
          <p className="text-[#A1A1AA] mr-[52px]">مرحباً {session.user?.name} — La Vida Admin Panel</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "طلبات معلقة", value: applications.filter(a => a.status === "PENDING").length, color: "#eab308" },
            { label: "إجمالي التقديمات", value: applications.length, color: "#E50914" },
            { label: "أسئلة النموذج", value: questions.length, color: "#5865F2" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-5 text-center" style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-sm text-[#A1A1AA]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-8" style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all"
              style={{
                background: activeTab === tab.key ? "#E50914" : "transparent",
                color: activeTab === tab.key ? "#fff" : "#A1A1AA",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{
                  background: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "rgba(229,9,20,0.2)",
                  color: activeTab === tab.key ? "#fff" : "#E50914",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder="ابحث باسم الحساب أو أيدي الديسكورد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none transition-all"
                  style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {[
                  { id: "PENDING", label: "الجديدة" },
                  { id: "APPROVED", label: "المقبولة" },
                  { id: "REJECTED", label: "المرفوضة" },
                  { id: "ALL", label: "الكل" }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setAppFilter(f.id as any)}
                    className={`px-4 py-2 whitespace-nowrap rounded-lg font-bold text-sm transition-all ${
                      appFilter === f.id 
                        ? (f.id === 'APPROVED' ? 'bg-[#22c55e]/20 text-[#22c55e]' : f.id === 'REJECTED' ? 'bg-[#E50914]/20 text-[#E50914]' : f.id === 'PENDING' ? 'bg-[#eab308]/20 text-[#eab308]' : 'bg-white/20 text-white')
                        : 'bg-[#18181b] text-[#A1A1AA] hover:bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="text-center py-20 text-[#A1A1AA]">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>لا توجد تقديمات بعد.</p>
              </div>
            ) : (
              filteredApplications.map((app) => {
                const sc = statusColors[app.status] ?? statusColors.PENDING;
                return (
                  <motion.div
                    key={app.id}
                    layout
                    className="rounded-xl overflow-hidden"
                    style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div 
                      className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between"
                      onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    >
                      <div className="flex items-center gap-4">
                        {app.user.image ? (
                          <img src={app.user.image} alt="avatar" className="w-12 h-12 rounded-full border-2" style={{ borderColor: sc.bg }} />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#09090b] border-2" style={{ borderColor: sc.bg }}>
                            <Users className="w-6 h-6 text-[#A1A1AA]" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-white text-lg flex items-center gap-2">
                            {app.user.name}
                            {app.user.discordId && (
                              <span className="text-xs bg-[#5865F2]/20 text-[#5865F2] px-2 py-0.5 rounded-full">
                                Discord: {app.user.discordId}
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-[#A1A1AA]">{new Date(app.createdAt).toLocaleString("ar-SA")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                          {sc.label}
                        </span>
                        {expandedApp === app.id ? <ChevronUp className="w-5 h-5 text-[#A1A1AA]" /> : <ChevronDown className="w-5 h-5 text-[#A1A1AA]" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedApp === app.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="pt-4 space-y-3">
                              {app.answers.map((ans) => (
                                <div key={ans.id} className="rounded-lg p-4" style={{ background: "#09090b" }}>
                                  <p className="text-sm font-bold mb-2" style={{ color: "#E50914" }}>{ans.question.question}</p>
                                  <p className="text-white leading-relaxed">{ans.answer}</p>
                                </div>
                              ))}
                            </div>

                            {app.status === "PENDING" && (
                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={() => handleApplicationStatus(app.id, "APPROVED")}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all"
                                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
                                >
                                  <CheckCircle className="w-4 h-4" /> قبول
                                </button>
                                <button
                                  onClick={() => handleApplicationStatus(app.id, "REJECTED")}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all"
                                  style={{ background: "rgba(229,9,20,0.15)", color: "#E50914", border: "1px solid rgba(229,9,20,0.3)" }}
                                >
                                  <XCircle className="w-4 h-4" /> رفض
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {/* Add Question Form */}
            <div className="rounded-xl p-6" style={{ background: "#18181b", border: "1px solid rgba(229,9,20,0.2)" }}>
              <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                <Plus style={{ color: "#E50914" }} />إضافة سؤال جديد
              </h3>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#A1A1AA] mb-2">نص السؤال</label>
                  <input
                    required
                    value={newQ.question}
                    onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
                    placeholder="مثال: ما هو عمرك؟"
                    className="w-full rounded-lg px-4 py-3 text-white focus:outline-none"
                    style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">نوع الإجابة</label>
                    <select
                      value={newQ.type}
                      onChange={(e) => setNewQ({ ...newQ, type: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 text-white focus:outline-none appearance-none"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <option value="TEXT">نص قصير</option>
                      <option value="TEXTAREA">نص طويل</option>
                      <option value="SELECT">خيارات</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-8">
                    <input
                      type="checkbox"
                      id="req"
                      checked={newQ.required}
                      onChange={(e) => setNewQ({ ...newQ, required: e.target.checked })}
                      className="w-4 h-4 accent-[#E50914]"
                    />
                    <label htmlFor="req" className="font-bold text-white">سؤال إلزامي</label>
                  </div>
                </div>
                {newQ.type === "SELECT" && (
                  <div>
                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">الخيارات (افصل بفاصلة)</label>
                    <input
                      value={newQ.options}
                      onChange={(e) => setNewQ({ ...newQ, options: e.target.value })}
                      placeholder="نعم, لا, ربما"
                      className="w-full rounded-lg px-4 py-3 text-white focus:outline-none"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl font-bold text-white transition-all"
                    style={{ background: "#E50914" }}
                  >
                    {saving ? "جاري الحفظ..." : "حفظ السؤال"}
                  </button>
                  {msg && <p className="text-green-400 font-semibold">{msg}</p>}
                </div>
              </form>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: "rgba(229,9,20,0.1)", color: "#E50914" }}>{i + 1}</span>
                    <div>
                      <p className="font-bold text-white">{q.question}</p>
                      <span className="text-xs text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded-full">{q.type}</span>
                      {q.required && <span className="text-xs text-[#E50914] mr-2">إلزامي</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-[#A1A1AA] hover:text-[#E50914] transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-center text-[#A1A1AA] py-8">لا توجد أسئلة حالياً.</p>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ background: "#18181b", border: "1px solid rgba(229,9,20,0.2)" }}>
              <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                <Plus style={{ color: "#E50914" }} />إضافة فئة قوانين
              </h3>
              <form onSubmit={handleAddCategory} className="flex gap-4">
                <input
                  required
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="مثال: قوانين الشرطة"
                  className="flex-1 rounded-xl px-4 py-3 text-white focus:outline-none"
                  style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <button type="submit" className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: "#E50914" }}>
                  إضافة
                </button>
              </form>
            </div>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 rounded-xl p-4" style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Tag className="w-5 h-5 shrink-0" style={{ color: "#E50914" }} />
                  <span className="font-bold text-white">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streamers Tab */}
        {activeTab === "streamers" && (
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ background: "#18181b", border: "1px solid rgba(229,9,20,0.2)" }}>
              <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                <Plus style={{ color: "#E50914" }} />إضافة صانع محتوى جديد
              </h3>
              <form onSubmit={handleAddStreamer} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">اسم صانع المحتوى</label>
                    <input
                      required
                      value={newStreamer.name}
                      onChange={(e) => setNewStreamer({ ...newStreamer, name: e.target.value })}
                      placeholder="مثال: Vexon"
                      className="w-full rounded-lg px-4 py-3 text-white focus:outline-none"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">المنصة</label>
                    <select
                      value={newStreamer.platform}
                      onChange={(e) => setNewStreamer({ ...newStreamer, platform: e.target.value })}
                      className="w-full rounded-lg px-4 py-3 text-white focus:outline-none appearance-none"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <option value="Twitch">Twitch</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Kick">Kick</option>
                      <option value="Facebook">Facebook Gaming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">رابط الصورة (Avatar URL)</label>
                    <input
                      required
                      value={newStreamer.avatar}
                      onChange={(e) => setNewStreamer({ ...newStreamer, avatar: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-lg px-4 py-3 text-white focus:outline-none"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#A1A1AA] mb-2">رابط القناة (Channel Link)</label>
                    <input
                      required
                      value={newStreamer.link}
                      onChange={(e) => setNewStreamer({ ...newStreamer, link: e.target.value })}
                      placeholder="https://twitch.tv/vexon"
                      className="w-full rounded-lg px-4 py-3 text-white focus:outline-none"
                      style={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl font-bold text-white transition-all"
                    style={{ background: "#E50914" }}
                  >
                    {saving ? "جاري الإضافة..." : "إضافة صانع المحتوى"}
                  </button>
                  {msg && <p className="text-green-400 font-semibold">{msg}</p>}
                </div>
              </form>
            </div>

            {/* Streamers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {streamers.map((streamer) => (
                <div key={streamer.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-4">
                    <img src={streamer.avatar} alt={streamer.name} className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid #E50914" }} />
                    <div>
                      <p className="font-bold text-white">{streamer.name}</p>
                      <a href={streamer.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                        {streamer.platform}
                      </a>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteStreamer(streamer.id)} className="p-2 text-[#A1A1AA] hover:text-[#E50914] transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {streamers.length === 0 && (
                <p className="text-[#A1A1AA] col-span-2 text-center py-8">لا يوجد صناع محتوى مضافين.</p>
              )}
            </div>
          </div>
        )}


      </div>

      {/* Toaster for messages */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-white flex items-center gap-3"
            style={{ 
              background: msg.includes("✗") ? "#E50914" : "#22c55e",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
