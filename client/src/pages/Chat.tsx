import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Brain, TrendingUp, Moon, Heart, Apple, ShieldAlert, RotateCcw, User, MessageSquare } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSendMessage, useConversation } from "@/hooks/use-parent-academy";
type AgentMode = "chat" | "roleplay-parent" | "roleplay-child";

const ICON_MAP: Record<string, React.ElementType> = {
  behavior: Brain, milestones: TrendingUp, sleep: Moon,
  emotions: Heart, nutrition: Apple, safety: ShieldAlert,
};

const AGENT_NAMES: Record<string, string> = {
  behavior: "Behavior Expert",
  milestones: "Development Expert",
  sleep: "Sleep Expert",
  emotions: "Emotions Expert",
  nutrition: "Nutrition Expert",
  safety: "Safety Advisor",
};

interface ChatMessage {
  role: "parent" | "agent";
  content: string;
  safetyFlag?: boolean;
  suggestedActions?: string[];
  escalation?: any;
}

export default function Chat() {
  const [, params] = useRoute("/chat/:agentType");
  const agentType = params?.agentType || "behavior";
  const Icon = ICON_MAP[agentType] || Brain;
  const agentName = AGENT_NAMES[agentType] || "Expert";

  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AgentMode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useSendMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sendMessage.isPending) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "parent", content: userMsg }]);

    try {
      const result = await sendMessage.mutateAsync({
        conversationId,
        agentType,
        message: userMsg,
        mode,
      });

      setConversationId(result.conversationId);
      setMessages(prev => [...prev, {
        role: "agent",
        content: result.message.content,
        safetyFlag: result.message.safetyFlag,
        suggestedActions: result.suggestedActions,
        escalation: result.escalation,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "agent",
        content: "I'm sorry, something went wrong. Please try again.",
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-60px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/experts")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold">{agentName}</h2>
            <p className="text-xs text-muted-foreground">Child development specialist</p>
          </div>
        </div>
        {/* Mode selector */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as AgentMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="chat" className="text-xs px-2 h-6">
              <MessageSquare className="w-3 h-3 mr-1" />Chat
            </TabsTrigger>
            <TabsTrigger value="roleplay-parent" className="text-xs px-2 h-6">
              <User className="w-3 h-3 mr-1" />Practice
            </TabsTrigger>
            <TabsTrigger value="roleplay-child" className="text-xs px-2 h-6">
              <RotateCcw className="w-3 h-3 mr-1" />Child View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Hi, I'm your {agentName}</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                {mode === "chat" && "Tell me what's going on and I'll help with specific, actionable guidance."}
                {mode === "roleplay-parent" && "Let's practice your response. Describe a situation and I'll help you rehearse what to say."}
                {mode === "roleplay-child" && "I'll help you see the situation from your child's perspective. Describe what happened."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {agentType === "behavior" && ["My child keeps having tantrums", "How do I handle hitting?", "Transition struggles"].map(q => (
                <Button key={q} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setInput(q)}>
                  {q}
                </Button>
              ))}
              {agentType === "sleep" && ["Bedtime takes forever", "Night waking help", "Should I drop a nap?"].map(q => (
                <Button key={q} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setInput(q)}>
                  {q}
                </Button>
              ))}
              {agentType === "nutrition" && ["My child won't eat vegetables", "Mealtime is a battle", "Picky eating tips"].map(q => (
                <Button key={q} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setInput(q)}>
                  {q}
                </Button>
              ))}
              {agentType === "emotions" && ["My child gets anxious easily", "Sibling fighting constantly", "Emotional meltdowns"].map(q => (
                <Button key={q} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setInput(q)}>
                  {q}
                </Button>
              ))}
              {agentType === "milestones" && ["Is my child on track?", "Language delay concerns", "When should they be walking?"].map(q => (
                <Button key={q} variant="outline" size="sm" className="rounded-full text-xs" onClick={() => setInput(q)}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "parent" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] ${msg.role === "parent" ? "order-1" : "order-1"}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                msg.role === "parent"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : msg.safetyFlag
                    ? "bg-red-50 border border-red-200 text-foreground rounded-bl-md"
                    : "bg-secondary text-foreground rounded-bl-md"
              }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none [&_strong]:font-bold [&_p]:my-1">
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={line.startsWith("**") ? "font-semibold" : ""}>
                      {line.replace(/\*\*/g, "")}
                    </p>
                  ))}
                </div>
              </div>

              {/* Suggested actions */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.suggestedActions.map((action, j) => (
                    <Button
                      key={j}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs h-7"
                      onClick={() => handleSuggestionClick(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              )}

              {/* Safety escalation */}
              {msg.escalation && (
                <Card className="mt-2 p-3 border-red-200 bg-red-50">
                  <p className="text-xs font-bold text-red-700 mb-1">Important Resources:</p>
                  {msg.escalation.resources?.map((r: string, j: number) => (
                    <p key={j} className="text-xs text-red-600">{r}</p>
                  ))}
                </Card>
              )}
            </div>
          </motion.div>
        ))}

        {sendMessage.isPending && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4 pb-2">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "chat" ? "What's happening with your child?" :
              mode === "roleplay-parent" ? "Describe the situation to practice..." :
              "Describe what happened from the child's view..."
            }
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="rounded-xl h-[44px] w-[44px] shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
