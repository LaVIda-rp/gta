"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

export function AdminClient({ initialQuestions, initialApplications }: { initialQuestions: any[], initialApplications: any[] }) {
  const [activeTab, setActiveTab] = useState<"questions" | "applications" | "admins">("questions");
  const [questions, setQuestions] = useState(initialQuestions);
  
  // New Question Form State
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] = useState("TEXT");
  const [newOptions, setNewOptions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const optionsArray = newType === "SELECT" ? newOptions.split(',').map(o => o.trim()) : null;
      
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newQuestion,
          type: newType,
          options: optionsArray,
          required: true,
          order: questions.length
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQuestions([...questions, data.question]);
        setNewQuestion("");
        setNewOptions("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-dark-main/50">
        <button 
          onClick={() => setActiveTab("questions")}
          className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${activeTab === "questions" ? "text-primary-red border-b-2 border-primary-red bg-dark-card" : "text-text-muted hover:text-white"}`}
        >
          إدارة الأسئلة
        </button>
        <button 
          onClick={() => setActiveTab("applications")}
          className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${activeTab === "applications" ? "text-primary-red border-b-2 border-primary-red bg-dark-card" : "text-text-muted hover:text-white"}`}
        >
          طلبات التقديم ({initialApplications.length})
        </button>
        <button 
          onClick={() => setActiveTab("admins")}
          className={`flex-1 py-4 text-center font-bold text-lg transition-colors ${activeTab === "admins" ? "text-primary-red border-b-2 border-primary-red bg-dark-card" : "text-text-muted hover:text-white"}`}
        >
          إدارة المدراء
        </button>
      </div>

      <div className="p-8">
        {activeTab === "questions" ? (
          <div className="space-y-12">
            {/* Form Builder */}
            <div className="bg-dark-main rounded-xl p-6 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="text-primary-red" />
                إضافة سؤال جديد
              </h3>
              
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">نص السؤال</label>
                  <input 
                    type="text" 
                    required
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="w-full bg-dark-card border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-red transition-colors"
                    placeholder="مثال: ما هو عمرك الحقيقي؟"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">نوع الإجابة</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full bg-dark-card border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-red transition-colors appearance-none"
                    >
                      <option value="TEXT">نص قصير</option>
                      <option value="TEXTAREA">نص طويل (قصة/سيناريو)</option>
                      <option value="SELECT">خيارات متعددة</option>
                    </select>
                  </div>
                  
                  {newType === "SELECT" && (
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-2">الخيارات (افصل بينها بفاصلة)</label>
                      <input 
                        type="text" 
                        required
                        value={newOptions}
                        onChange={(e) => setNewOptions(e.target.value)}
                        className="w-full bg-dark-card border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-red transition-colors"
                        placeholder="خيار 1, خيار 2, خيار 3"
                      />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="mt-4 bg-primary-red hover:bg-primary-red-hover text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "جاري الإضافة..." : "حفظ السؤال"}
                </button>
              </form>
            </div>

            {/* Questions List */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">الأسئلة الحالية</h3>
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-text-muted">لا توجد أسئلة حالياً.</p>
                ) : (
                  questions.map((q, i) => (
                    <div key={q.id} className="bg-dark-main border border-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <span className="text-primary-red font-bold mr-2">{i + 1}.</span>
                        <span className="text-white font-medium">{q.question}</span>
                        <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded ml-3">
                          {q.type}
                        </span>
                      </div>
                      <button className="text-text-muted hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "applications" ? (
          <div className="space-y-6">
            {initialApplications.length === 0 ? (
              <p className="text-text-muted text-center py-12">لا توجد طلبات تقديم حالياً.</p>
            ) : (
              initialApplications.map(app => (
                <div key={app.id} className="bg-dark-main border border-white/5 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-4">
                      {app.user.image && <img src={app.user.image} className="w-12 h-12 rounded-full border-2 border-primary-red" />}
                      <div>
                        <h4 className="text-lg font-bold text-white">{app.user.name}</h4>
                        <p className="text-sm text-text-muted">{new Date(app.createdAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 px-4 py-2 rounded-lg font-bold transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        قبول
                      </button>
                      <button className="flex items-center gap-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 px-4 py-2 rounded-lg font-bold transition-colors">
                        <XCircle className="w-4 h-4" />
                        رفض
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {app.answers.map((ans: any) => (
                      <div key={ans.id} className="bg-dark-card rounded-lg p-4">
                        <p className="text-text-muted text-sm mb-2">{ans.question.question}</p>
                        <p className="text-white font-medium">{ans.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-dark-main rounded-xl p-6 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6">ترقية عضو للإدارة</h3>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as typeof e.target & { email: { value: string } };
                  const email = target.email.value;
                  const res = await fetch("/api/admin/roles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert("تمت الترقية بنجاح!");
                    target.email.value = "";
                  } else {
                    alert(data.error);
                  }
                }} 
                className="flex gap-4"
              >
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="أدخل إيميل العضو هنا..."
                  className="flex-1 bg-dark-card border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary-red transition-colors"
                />
                <button type="submit" className="bg-primary-red hover:bg-primary-red-hover text-white px-8 py-3 rounded-lg font-bold transition-all">
                  منح رتبة إداري
                </button>
              </form>
              <p className="text-text-muted text-sm mt-4">
                ملاحظة: يجب أن يقوم العضو بتسجيل الدخول للموقع مرة واحدة على الأقل قبل أن تتمكن من ترقيته.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
