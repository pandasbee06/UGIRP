import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Globe, AlertCircle, Sparkles } from "lucide-react";
import { apiJson } from "../lib/api";

const SUGGESTED_QUESTIONS = {
  en: [
    "What is my Trust Score?",
    "How to file a new complaint?",
    "Where do I track my ticket status?",
    "What does an Officer do?"
  ],
  hi: [
    "मेरा ट्रस्ट स्कोर क्या है?",
    "नई शिकायत कैसे दर्ज करें?",
    "मैं अपना टिकट स्टेटस कहां ट्रैक करूं?",
    "एक अधिकारी क्या करता है?"
  ]
};

const INITIAL_MESSAGE = {
  en: "Hello! I am the UGIRP AI Assistant. How can I help you regarding the platform today?",
  hi: "नमस्ते! मैं UGIRP एआई सहायक हूं। मैं प्लेटफॉर्म के बारे में आपकी कैसे मदद कर सकता हूं?"
};

export default function Chatbot() {
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([{ id: 1, sender: "bot", text: INITIAL_MESSAGE["en"] }]);
  const [inputTitle, setInputTitle] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle language switch
  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    // Reset chat with new language greeting
    setMessages([{ id: Date.now(), sender: "bot", text: INITIAL_MESSAGE[newLang] }]);
  };

  const sendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const newMsg = { id: Date.now(), sender: "user", text: textToSend };
    setMessages(prev => [...prev, newMsg]);
    setInputTitle("");
    setIsTyping(true);

    try {
      const token = window.localStorage.getItem("ugirp.token") || "";
      const res = await apiJson("/api/ai/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { message: textToSend, lang }
      });
      
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: res.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: "bot", text: lang === "hi" ? "त्रुटि: सर्वर से कनेक्ट नहीं हो सका।" : "Error: Could not connect to the server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputTitle);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-4xl flex-col px-4 py-8 sm:px-6">
      
      {/* Header Container */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/20">
            <Bot className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
              Civic AI Assistant <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Offline NLP Query Engine (API-Free)</p>
          </div>
        </div>
        
        {/* Language Translator Mock */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 dark:bg-slate-950 dark:border-white/10">
          <Globe className="w-4 h-4 text-slate-500" />
          <select 
            value={lang}
            onChange={handleLangChange}
            className="bg-transparent text-sm font-semibold outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-slate-950">
        
        {/* Messages Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[85%] sm:max-w-[70%] gap-3 items-end ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm mb-1 ${msg.sender === "user" ? "bg-slate-900 dark:bg-white" : "bg-indigo-600"}`}>
                    {msg.sender === "user" ? (
                       <User className="h-4 w-4 text-white dark:text-slate-900" />
                    ) : (
                       <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div 
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                      msg.sender === "user" 
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-br-none" 
                        : "bg-white text-slate-800 border border-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:border-white/5 rounded-bl-none"
                    }`}
                  >
                     {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full justify-start"
              >
                <div className="flex gap-3 items-end">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 shadow-sm mb-1">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-none bg-white px-5 py-4 border border-slate-100 dark:bg-slate-900 dark:border-white/5 flex items-center gap-1 shadow-sm">
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Region */}
        <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          
          {/* Suggested Pills */}
          <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
             {SUGGESTED_QUESTIONS[lang].map((q, i) => (
                <button 
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {q}
                </button>
             ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-3 relative">
            <input
              type="text"
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              placeholder={lang === "hi" ? "अपना प्रश्न यहां लिखें..." : "Message the UGIRP assistant..."}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-5 pr-14 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputTitle.trim() || isTyping}
              className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <AlertCircle className="w-3 h-3" />
            UGIRP Automated Query System
          </div>
        </div>

      </div>
    </div>
  );
}
