import { useMemo, useState } from 'react';
import { Bot, MessageSquare, Send, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

type Language = 'en' | 'sq';

const prompts: Record<Language, string[]> = {
  en: ['How do I apply?', 'How do opportunities work?', 'Where are my applications?', 'How do notifications work?'],
  sq: ['Si aplikoj?', 'Si funksionojnë opportunities?', 'Ku janë aplikimet e mia?', 'Si funksionojnë njoftimet?'],
};

const responseSets: Record<Language, Array<{ match: RegExp[]; answer: string }>> = {
  en: [
    {
      match: [/apply/i],
      answer:
        'To apply, open a published internship, fill in the application form, add your CV or profile links if needed, and press Apply. After that, the button changes to Applied.',
    },
    {
      match: [/opportunit(y|ies)/i, /saved jobs?/i, /bookmark/i],
      answer:
        'Opportunities is your personal list of internships you bookmarked. You can open them later and apply whenever you are ready.',
    },
    {
      match: [/application/i, /applications/i, /status/i],
      answer:
        'You can see your applications from the Student dashboard. Each application has a status like Submitted, In Review, Interview, Accepted, or Rejected.',
    },
    {
      match: [/notification/i, /bell/i, /realtime/i, /real time/i],
      answer:
        'Notifications appear in real time when a recruiter publishes an internship or when your application status changes.',
    },
    {
      match: [/cv/i, /resume/i, /portfolio/i, /github/i],
      answer:
        'Your CV is taken from your profile when available. You can also add portfolio and GitHub links during the application process.',
    },
    {
      match: [/company/i],
      answer:
        'The company profile shows the recruiter’s company details. Recruiters can manage it from Company profile after they are linked or approved.',
    },
    {
      match: [/chat/i, /message/i, /conversation/i],
      answer:
        'The chat is used for recruiter and student communication. Open a conversation from the Chat page and continue the thread in real time.',
    },
  ],
  sq: [
    {
      match: [/aplik/i],
      answer:
        'Për të aplikuar, hap një internship të publikuar, plotëso formularin, shto CV-në ose linket e profilit nëse i ke, dhe shtyp Apply. Pastaj butoni ndryshon në Applied.',
    },
    {
      match: [/opportunit(y|ies)/i, /saved jobs?/i, /ruajt/i, /bookmark/i],
      answer:
        'Opportunities është lista jote personale e internship-eve që i ke ruajtur. Mund t’i hapësh më vonë dhe të aplikosh kur të jesh gati.',
    },
    {
      match: [/aplikim/i, /aplikimet/i, /status/i],
      answer:
        'Aplikimet e tua i sheh nga Student dashboard. Secili aplikim ka status si Submitted, In Review, Interview, Accepted, ose Rejected.',
    },
    {
      match: [/njoft/i, /bell/i, /realtime/i, /real time/i],
      answer:
        'Njoftimet vijnë në kohë reale kur recruiter publikon një internship ose kur ndryshon statusi i aplikimit tënd.',
    },
    {
      match: [/cv/i, /resume/i, /portfolio/i, /github/i],
      answer:
        'CV-ja merret nga profili yt kur është e disponueshme. Mund të shtosh edhe portfolio dhe GitHub gjatë aplikimit.',
    },
    {
      match: [/kompan/i],
      answer:
        'Company profile tregon të dhënat e kompanisë së recruiter-it. Recruiter-i e menaxhon pasi të jetë lidhur ose aprovuar.',
    },
    {
      match: [/chat/i, /mesazh/i, /conversation/i],
      answer:
        'Chat-i përdoret për komunikim mes recruiter-it dhe studentit. Hap një conversation nga faqja Chat dhe vazhdo bisedën në kohë reale.',
    },
  ],
};

const defaultAnswer = (language: Language, input: string) => {
  if (!input.trim()) {
    return language === 'en'
      ? 'Ask me anything about internships, applications, opportunities, notifications, or the student dashboard.'
      : 'Më pyet për internship-et, aplikimet, opportunities, njoftimet, ose student dashboard-in.';
  }

  return language === 'en'
    ? 'I can help with internships, applications, opportunities, notifications, and how to use the dashboard. Try asking in English.'
    : 'Mund të të ndihmoj me internship-et, aplikimet, opportunities, njoftimet, dhe si përdoret dashboard-i. Pyet në shqip.';
};

const detectReply = (language: Language, input: string) => {
  const normalized = input.trim();
  if (!normalized) return defaultAnswer(language, normalized);

  const match = responseSets[language].find((item) => item.match.some((pattern) => pattern.test(normalized)));
  return match?.answer ?? defaultAnswer(language, normalized);
};

export function StudentHelperBot() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'Hi! Choose a language and ask me anything about the student flow.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const sendMessage = (text?: string) => {
    const current = (text ?? input).trim();
    if (!current) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: current };
    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', text: detectReply(language, current) };

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
    setInput('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-sky-400/20 bg-sky-500 text-white shadow-[0_18px_50px_-18px_rgba(14,165,233,0.75)] transition hover:scale-[1.03]"
        aria-label="Open student helper"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-[420px] transform border-l border-black/10 bg-[#0c1626] text-white shadow-[0_24px_80px_-30px_rgba(0,0,0,0.7)] transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-white/8 p-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                <Bot size={14} />
                Student helper
              </div>
              <h3 className="mt-2 text-lg font-semibold">
                {language === 'en' ? 'Ask me how the app works' : 'Pyet si funksionon aplikacioni'}
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/65">
                {language === 'en' ? 'English, step by step.' : 'Shqip, hap pas hapi.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10"
              aria-label="Close student helper"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6',
                    message.role === 'user'
                      ? 'bg-sky-500 text-white'
                      : 'border border-white/8 bg-white/6 text-white/90',
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 p-4">
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-semibold transition',
                  language === 'en'
                    ? 'border-sky-400/30 bg-sky-500/15 text-white'
                    : 'border-white/10 bg-white/6 text-white/70 hover:bg-white/10',
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('sq')}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-semibold transition',
                  language === 'sq'
                    ? 'border-sky-400/30 bg-sky-500/15 text-white'
                    : 'border-white/10 bg-white/6 text-white/70 hover:bg-white/10',
                )}
              >
                Shqip
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {prompts[language].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={language === 'en' ? 'Ask about internships, applications...' : 'Pyet për internship-et, aplikimet...'}
                className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-sky-400/40"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
