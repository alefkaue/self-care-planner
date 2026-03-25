import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, Image as ImageIcon, ChevronDown, Plus, Bot, ArrowLeft, X, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const BUILTIN_PERSONAS = [
  { id: "personal_trainer", name: "Personal Trainer", icon: "💪", description: "Treinos e exercícios" },
  { id: "nutricionista", name: "Nutricionista", icon: "🥗", description: "Dieta e alimentação" },
];

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [persona, setPersona] = useState("personal_trainer");
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showCreatePersona, setShowCreatePersona] = useState(false);
  const [newPersona, setNewPersona] = useState({ name: "", description: "", system_prompt: "", icon: "🤖" });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load chat history
  const { data: chatHistory } = useQuery({
    queryKey: ["chat-messages", user?.id, persona],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .eq("persona", persona)
        .order("created_at", { ascending: true })
        .limit(50);
      return (data || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    },
    enabled: !!user,
  });

  // Load custom personas
  const { data: customPersonas } = useQuery({
    queryKey: ["ai-personas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("ai_personas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (chatHistory) setMessages(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const saveMessage = useCallback(async (role: string, content: string) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({ user_id: user.id, role, content, persona });
  }, [user, persona]);

  const createPersonaMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("ai_personas").insert({
        user_id: user.id,
        name: newPersona.name,
        description: newPersona.description,
        system_prompt: newPersona.system_prompt,
        icon: newPersona.icon,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-personas"] });
      setShowCreatePersona(false);
      setNewPersona({ name: "", description: "", system_prompt: "", icon: "🤖" });
      toast.success("Persona criada!");
    },
  });

  const handleSend = async () => {
    if (!input.trim() && !attachmentFile) return;
    const userContent = input.trim();
    setInput("");

    let attachmentUrl: string | undefined;
    if (attachmentFile && user) {
      const ext = attachmentFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat-attachments").upload(path, attachmentFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
        attachmentUrl = urlData.publicUrl;
      }
      setAttachmentFile(null);
    }

    const userMsg: Msg = { role: "user", content: attachmentUrl ? `${userContent}\n[Anexo: ${attachmentUrl}]` : userContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    await saveMessage("user", userMsg.content);

    setIsStreaming(true);

    // Find custom persona prompt if needed
    const customP = customPersonas?.find((p) => p.id === persona);
    const chatUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

    try {
      const resp = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.slice(-20),
          persona,
          customPrompt: customP?.system_prompt,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        toast.error(errData.error || "Erro ao enviar mensagem");
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) await saveMessage("assistant", assistantSoFar);
    } catch (err) {
      toast.error("Erro de conexão");
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id).eq("persona", persona);
    setMessages([]);
    queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    toast.success("Chat limpo!");
  };

  const currentPersona = BUILTIN_PERSONAS.find((p) => p.id === persona) || customPersonas?.find((p) => p.id === persona);
  const allPersonas = [...BUILTIN_PERSONAS, ...(customPersonas || []).map((p) => ({ id: p.id, name: p.name, icon: p.icon, description: p.description || "" }))];

  return (
    <div className="min-h-screen bg-background flex flex-col safe-bottom">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-lg">
              {currentPersona?.icon || "🤖"}
            </div>
            <div>
              <button onClick={() => setShowPersonaMenu(true)} className="flex items-center gap-1">
                <h1 className="text-base font-bold text-foreground">{currentPersona?.name || "Assistente"}</h1>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              <p className="text-xs text-muted-foreground">{currentPersona?.description || "IA"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat}>
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <Bot className="w-12 h-12 text-primary/40 mb-3" />
            <p className="text-muted-foreground text-sm">Comece uma conversa com seu assistente de fitness!</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "gradient-primary text-primary-foreground rounded-br-md"
                    : "glass-card text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attachment preview */}
      {attachmentFile && (
        <div className="px-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            <span className="truncate flex-1 text-foreground">{attachmentFile.name}</span>
            <button onClick={() => setAttachmentFile(null)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-20 pt-3 border-t border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && setAttachmentFile(e.target.files[0])} />
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setAttachmentFile(e.target.files[0])} />
          
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => imageInputRef.current?.click()}>
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1 h-11 bg-secondary border-border rounded-xl"
            disabled={isStreaming}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isStreaming || (!input.trim() && !attachmentFile)}
            className="shrink-0 gradient-primary text-primary-foreground rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Persona Selector Dialog */}
      <Dialog open={showPersonaMenu} onOpenChange={setShowPersonaMenu}>
        <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Escolher Assistente</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {allPersonas.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPersona(p.id); setShowPersonaMenu(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  persona === p.id ? "bg-primary/15 border border-primary/30" : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <span className="text-2xl">{p.icon}</span>
                <div className="text-left">
                  <p className="font-semibold text-sm text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() => { setShowPersonaMenu(false); setShowCreatePersona(true); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-6 h-6 text-primary" />
              <p className="font-semibold text-sm text-primary">Criar Persona Customizada</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Persona Dialog */}
      <Dialog open={showCreatePersona} onOpenChange={setShowCreatePersona}>
        <DialogContent className="bg-card border-border max-w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nova Persona</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Nome (ex: Coach de Corrida)" value={newPersona.name} onChange={(e) => setNewPersona({ ...newPersona, name: e.target.value })} className="bg-secondary border-border" />
            <Input placeholder="Descrição curta" value={newPersona.description} onChange={(e) => setNewPersona({ ...newPersona, description: e.target.value })} className="bg-secondary border-border" />
            <Input placeholder="Emoji ícone" value={newPersona.icon} onChange={(e) => setNewPersona({ ...newPersona, icon: e.target.value })} className="bg-secondary border-border w-20" />
            <textarea
              placeholder="Instruções do sistema (como a IA deve se comportar)"
              value={newPersona.system_prompt}
              onChange={(e) => setNewPersona({ ...newPersona, system_prompt: e.target.value })}
              className="w-full h-24 rounded-md bg-secondary border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none"
            />
            <Button onClick={() => createPersonaMutation.mutate()} disabled={!newPersona.name || !newPersona.system_prompt} className="w-full gradient-primary text-primary-foreground">
              Criar Persona
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
