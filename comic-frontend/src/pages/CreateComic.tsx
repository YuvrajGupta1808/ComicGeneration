import { Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import AppNavbar from '../components/AppNavbar';
import Footer from '../components/sections/Footer';
import { PlaceholdersAndVanishInput } from "../components/ui/placeholders-and-vanish-input";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type ChatRole = "user" | "assistant";

type ChatMessage =
  | { id: number; role: ChatRole; kind: "text"; content: string }
  | {
      id: number;
      role: "assistant";
      kind: "pages";
      pages: { page: number; url: string }[];
    };

// Frontend environment variables (CRA-style)
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const USE_FRONTEND_MOCK =
  process.env.REACT_APP_USE_MOCK === "true";

// Info message
const GENERATION_INFO = "Generation typically takes 30–60 seconds.";

const GENERATION_STEPS = [
  "Generating story structure…",
  "Generating characters…",
  "Generating panel descriptions and dialogue…",
  "Selecting layout and preparing pages…",
];

const CreateComic: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [artStyle] = useState<'manga' | 'western' | 'watercolor'>('manga');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const createId = () => Date.now() + Math.random();

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSendPrompt = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;

    pushMessage({
      id: createId(),
      role: "user",
      kind: "text",
      content: trimmed,
    });

    setPrompt('');
    setInputKey((k) => k + 1);

    if (USE_FRONTEND_MOCK) {
      startMockGeneration(trimmed);
    } else {
      startBackendGeneration(trimmed);
    }
  };

  // FRONTEND-ONLY MOCK MODE
  const startMockGeneration = (userPrompt: string) => {
    setIsGenerating(true);

    const mockPages: { page: number; url: string }[] = [
      { page: 1, url: 'https://via.placeholder.com/800x1200?text=Comic+Page+1' },
      { page: 2, url: 'https://via.placeholder.com/800x1200?text=Comic+Page+2' },
      { page: 3, url: 'https://via.placeholder.com/800x1200?text=Comic+Page+3' },
    ];

    pushMessage({
      id: createId(),
      role: "assistant",
      kind: "text",
      content: GENERATION_STEPS[0],
    });

    GENERATION_STEPS.slice(1).forEach((stepText, idx) => {
      setTimeout(() => {
        pushMessage({
          id: createId(),
          role: "assistant",
          kind: "text",
          content: stepText,
        });
      }, 1000 * (idx + 1));
    });

    const totalDelay = 1000 * GENERATION_STEPS.slice(1).length + 500;

    setTimeout(() => {
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "pages",
        pages: mockPages,
      });

      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "text",
        content:
          "Here are your comic pages! You can click any thumbnail to see it full size or download individual pages.",
      });

      setIsGenerating(false);

      console.log("Generated (mock) comic with:", {
        userPrompt,
        artStyle,
      });
    }, totalDelay);
  };

  // REAL BACKEND GENERATION
  const startBackendGeneration = async (userPrompt: string) => {
    // store timeout IDs so we can cancel any remaining ones
    const stepTimeouts: number[] = [];

    try {
      setIsGenerating(true);

      // First status message
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "text",
        content: GENERATION_STEPS[0],
      });

      // Schedule the remaining status messages while we wait
      GENERATION_STEPS.slice(1).forEach((step, idx) => {
        const timeoutId = window.setTimeout(() => {
          pushMessage({
            id: createId(),
            role: "assistant",
            kind: "text",
            content: step,
          });
        }, (idx + 1) * 1200);

        stepTimeouts.push(timeoutId);
      });

      const response = await fetch(`${API_BASE_URL}/api/generate-comic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          artStyle,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: { pages: { page: number; url: string }[] } =
        await response.json();

      // Intro line BEFORE pages
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "text",
        content:
          "Here are your comic pages! You can click any page to view or download it.",
      });

      // Then the pages
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "pages",
        pages: data.pages,
      });
    } catch (err) {
      console.error("Backend error:", err);
      pushMessage({
        id: createId(),
        role: "assistant",
        kind: "text",
        content:
          "Something went wrong while generating your comic. Please try again later.",
      });
    } finally {
      // cancel any step messages that haven't fired yet,
      // so they can't show up after the pages
      stepTimeouts.forEach((id) => window.clearTimeout(id));
      setIsGenerating(false);
    }
  };

  // Download all pages as a single ZIP
  const handleDownloadAllPages = async (pages: { page: number; url: string }[]) => {
    try {
      setIsDownloadingAll(true);

      const zip = new JSZip();

      for (const page of pages) {
        const response = await fetch(page.url);
        if (!response.ok) {
          console.warn(`Failed to fetch page ${page.page} from ${page.url}`);
          continue;
        }
        const blob = await response.blob();
        zip.file(`comic-page-${page.page}.png`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "comic-pages.zip");
    } catch (err) {
      console.error("Download-all error:", err);
      alert("Sorry, something went wrong preparing the ZIP file.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100/30 via-blue-100/40 to-indigo-100/50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 flex flex-col">
      <AppNavbar />

      <div className="flex-1 pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-white/90 dark:bg-neutral-900/60 backdrop-blur-sm text-gray-700 dark:text-white px-4 py-2 rounded-full text-sm font-medium border border-gray-200 dark:border-neutral-800 shadow-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Create Your Comic</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Bring your story to life
            </h1>
            <p className="text-lg text-gray-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Describe your comic scene and I’ll generate your comic pages.
            </p>
          </div>

          <div className="mb-10">
            <div className="bg-white/90 dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm">
              <div className="space-y-4 px-4 pt-4 pb-2">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-neutral-500">
                    Start by describing your comic scene. I’ll walk you through each step and then show your final pages.
                  </p>
                )}

                {messages.map((msg) => {
                  if (msg.kind === "text") {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isUser
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-neutral-100"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  // pages bubble
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="w-full rounded-2xl px-4 py-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-3">
                          Comic pages generated
                        </p>
                        <div className="flex flex-col gap-6">
                          {msg.pages.map((page) => (
                            <div
                              key={page.page}
                              className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 flex flex-col w-[220px]"
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedImage(page.url)}
                                className="bg-gray-100 dark:bg-neutral-900 rounded-xl overflow-hidden w-[200px] h-[280px] flex items-center justify-center hover:opacity-90 transition"
                              >
                                <img
                                  src={page.url}
                                  alt={`Comic page ${page.page}`}
                                  className="object-cover w-full h-full"
                                />
                              </button>

                              <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-neutral-400">
                                <span>Page {page.page}</span>
                                <a
                                  href={page.url}
                                  download={`comic-page-${page.page}.png`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>

                        {msg.pages.length > 0 && (
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-neutral-400">
                              Download all pages together as a single bundle.
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownloadAllPages(msg.pages)}
                              disabled={isDownloadingAll}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isDownloadingAll ? "Preparing ZIP…" : "Download all"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 dark:border-neutral-800 px-4 py-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Describe your comic scene
                </label>
                <div className="relative flex items-center">
                  <PlaceholdersAndVanishInput
                    key={inputKey}
                    placeholders={[
                      "A superhero saving the city from a giant robot",
                      "A quiet moment between friends on a rooftop",
                      "A detective solving a mystery in a neon city",
                    ]}
                    onChange={(e) => setPrompt(e.target.value)}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendPrompt();
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleSendPrompt}
                    disabled={!prompt.trim() || isGenerating}
                    className="absolute right-3 bg-black text-white dark:bg-white dark:text-black rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-gray-500 dark:text-neutral-500">
                  {GENERATION_INFO}
                </p>
              </div>

              <div ref={endOfMessagesRef} />
            </div>
          </div>

          {/* 
            Reference image upload UI (disabled for now).

            Previously allowed users to upload up to 4 reference images,
            but the current backend pipeline does not accept or use
            frontend-uploaded files. Leaving this block commented out
            so it can be restored or wired up in a future version if needed.
          
          <div className="mb-12">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 text-center">
              <Image className="w-4 h-4 inline-block mr-2" />
              Add character and background references (optional)
            </label>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-neutral-700 p-8">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {referenceImages.length === 0 ? (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 dark:text-neutral-600 mb-4" />
                  <p className="text-gray-600 dark:text-neutral-400 text-center mb-2">
                    Click to upload character and background reference images
                  </p>
                  <p className="text-sm text-gray-500 dark:text-neutral-500">
                    PNG, JPG up to 10MB (max 4 images)
                  </p>
                </label>
              ) : (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {referenceImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {referenceImages.length < 4 && (
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white rounded-full cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Add more images</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
          */}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-sm px-3 py-1 rounded-full bg-black/60 hover:bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            Close
          </button>
          <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3">
            <img
              src={selectedImage}
              alt="Comic page full size"
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-xl"
            />
            <a
              href={selectedImage}
              download="comic-page.png"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-indigo-200 hover:text-white underline"
            >
              Download this page
            </a>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CreateComic;
