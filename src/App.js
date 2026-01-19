import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';

const NOTION_TOKEN = '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';
const PAGE_ID = '2ed48680577d8069a2d2da77a2677168';

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! Ask me anything about the professional experience and expertise. I can only answer questions based on the provided information.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState(null);
  const scrollRef = useRef(null);

  // Fetch Notion page content on mount
  useEffect(() => {
    const fetchNotionContent = async () => {
      try {
        console.log('Fetching Notion content...');
        
        // First, get the page blocks
        const blocksResponse = await fetch(
          `https://api.notion.com/v1/blocks/${PAGE_ID}/children`,
          {
            headers: {
              'Authorization': `Bearer ${NOTION_TOKEN}`,
              'Notion-Version': '2022-06-28',
            }
          }
        );
        
        if (!blocksResponse.ok) {
          const error = await blocksResponse.json();
          console.error('Notion API Error:', error);
          throw new Error(error.message || 'Failed to fetch from Notion');
        }
        
        const blocksData = await blocksResponse.json();
        console.log('Blocks data:', blocksData);
        
        // Extract text from all blocks
        let text = '';
        blocksData.results.forEach(block => {
          // Handle different block types
          if (block.type === 'paragraph' && block.paragraph.rich_text) {
            const paragraphText = block.paragraph.rich_text
              .map(t => t.plain_text)
              .join('');
            text += paragraphText + '\n\n';
          } else if (block.type === 'heading_1' && block.heading_1.rich_text) {
            const headingText = block.heading_1.rich_text
              .map(t => t.plain_text)
              .join('');
            text += headingText + '\n\n';
          } else if (block.type === 'heading_2' && block.heading_2.rich_text) {
            const headingText = block.heading_2.rich_text
              .map(t => t.plain_text)
              .join('');
            text += headingText + '\n\n';
          } else if (block.type === 'heading_3' && block.heading_3.rich_text) {
            const headingText = block.heading_3.rich_text
              .map(t => t.plain_text)
              .join('');
            text += headingText + '\n\n';
          } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text) {
            const bulletText = block.bulleted_list_item.rich_text
              .map(t => t.plain_text)
              .join('');
            text += '• ' + bulletText + '\n';
          } else if (block.type === 'numbered_list_item' && block.numbered_list_item.rich_text) {
            const numberText = block.numbered_list_item.rich_text
              .map(t => t.plain_text)
              .join('');
            text += numberText + '\n';
          }
        });
        
        console.log('Extracted text:', text);
        setDocContent(text.trim());
        setDocLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setDocError(error.message);
        setDocLoading(false);
      }
    };

    fetchNotionContent();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || loading || !docContent) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an AI assistant that ONLY answers questions based on the following document content. This is critical:

DOCUMENT CONTENT:
${docContent}

STRICT RULES:
1. You can ONLY provide information that is explicitly stated in the document above
2. If asked about anything not in the document, politely say "I can only answer questions about the professional experience and information in the provided document"
3. Do not use any knowledge outside of this document
4. Do not make assumptions or inferences beyond what's written
5. If the document doesn't contain enough information to answer, say so clearly
6. Be conversational but stay strictly within the document's scope`,
          messages: [
            ...messages.filter(m => m.role !== 'assistant' || m.content !== messages[0].content),
            { role: 'user', content: userMessage }
          ]
        })
      });

      const data = await response.json();
      const assistantMessage = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (docLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading professional information...</p>
        </div>
      </div>
    );
  }

  if (docError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-md bg-slate-950 border border-red-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <p className="text-slate-300">{docError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-3xl h-[700px] flex flex-col bg-slate-950 border border-slate-700 shadow-2xl rounded-lg">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-1">Professional Experience Chat</h1>
          <p className="text-sm text-slate-400">Ask about experience, skills, and background</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <div className="p-6 border-t border-slate-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button 
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
