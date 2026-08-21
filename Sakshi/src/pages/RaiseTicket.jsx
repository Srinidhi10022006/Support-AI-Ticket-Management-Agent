import { useMemo, useState, useRef, useEffect } from 'react'
import { X, CheckCircle2, Sparkles, ChevronRight, Send, Bot, User } from 'lucide-react'
import { createTicket, escalateToJira } from '../api/ticketApi.js'
import { analyzeIssue } from '../api/aiApi.js'
import { getStoredUser } from '../auth/authStorage.js'

const aiUnavailableMessage = 'Unable to generate an AI suggestion at this time. Please try again later.'
const analysisLoadingMessages = [
  '🤖 AI is analyzing your issue...',
  'Analyzing ticket details...',
  'Checking possible root causes...',
  'Generating recommended solution...',
]

export default function RaiseTicket({ onBackToDashboard = () => {} }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [ticketCreatedForEscalation, setTicketCreatedForEscalation] = useState(null)
  const [jiraIssueUrl, setJiraIssueUrl] = useState('')
  const user = getStoredUser()

  const [employeeName, setEmployeeName] = useState('')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [issueType, setIssueType] = useState('Login Issue')
  const [priority, setPriority] = useState('Medium')
  const [issueDescription, setIssueDescription] = useState(
    'I am unable to login to SAP after changing my password this morning.',
  )

  const canGoNext = issueDescription.trim().length >= 10

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [analysisLoadingStep, setAnalysisLoadingStep] = useState(0)
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false)
  const [aiError, setAiError] = useState('')
  const chatEndRef = useRef(null)
  const conversationHistory = useRef([])

  const autoScroll = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    autoScroll()
  }, [chatMessages, isTyping])

  useEffect(() => {
    if (!isTyping) {
      setAnalysisLoadingStep(0)
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setAnalysisLoadingStep((current) => (current + 1) % analysisLoadingMessages.length)
    }, 900)

    return () => window.clearInterval(intervalId)
  }, [isTyping])

  const steps = useMemo(
    () => [
      { n: 1, label: 'Ticket Details' },
      { n: 2, label: 'AI Assistant' },
      { n: 3, label: 'Create Ticket' },
    ],
    [],
  )

  async function handleCreateTicket() {
    if (!user?.userId) {
      setSubmitError('User session not found. Please log in again.')
      return
    }

    if (ticketCreatedForEscalation) {
      setSubmitMessage(`Ticket already created successfully: ATK-${ticketCreatedForEscalation}`)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitMessage('')
    setJiraIssueUrl('')

    try {
      const createdTicket = await createTicket({
        userId: user.userId,
        subject: issueDescription.slice(0, 255),
        issueType,
        description: issueDescription,
        department: department.trim() || null,
        priority,
        employeeName,
      })

      setTicketCreatedForEscalation(createdTicket.ticketId)
      setSubmitMessage(`Ticket created successfully: ATK-${createdTicket.ticketId}`)
    } catch (err) {
      setSubmitError(err?.response?.data?.message ?? 'Unable to create ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEscalateToJira() {
    console.log('[JIRA DEBUG] handleEscalateToJira started')
    console.log('[JIRA DEBUG] current user:', user)
    console.log('[JIRA DEBUG] current ticketCreatedForEscalation:', ticketCreatedForEscalation)

    if (!user?.userId) {
      console.log('[JIRA DEBUG] returning early because user.userId is missing')
      setSubmitError('User session not found. Please log in again.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitMessage('')
    setJiraIssueUrl('')

    try {
      let ticketId = ticketCreatedForEscalation
      console.log('[JIRA DEBUG] initial ticketId:', ticketId)

      if (!ticketId) {
        console.log('[JIRA DEBUG] before createTicket()')
        const createdTicket = await createTicket({
          userId: user.userId,
          subject: issueDescription.slice(0, 255),
          issueType,
          description: issueDescription,
          department: department.trim() || null,
          priority,
          employeeName,
        })

        console.log('[JIRA DEBUG] after createTicket() returns:', createdTicket)
        ticketId = createdTicket.ticketId
        console.log('[JIRA DEBUG] ticketId received from createTicket():', ticketId)
        setTicketCreatedForEscalation(ticketId)
      }

      console.log('[JIRA DEBUG] before calling await escalateToJira(ticketId):', ticketId)
      const result = await escalateToJira(ticketId)
      console.log('[JIRA DEBUG] after escalateToJira() returns:', result)
      const jiraIssueKey =
        result?.jiraIssueKey ?? result?.jiraIssue?.key ?? result?.issueKey ?? 'KAN-XX'

      setSubmitMessage(`Ticket Escalated Successfully\nJira Issue: ${jiraIssueKey}`)
      setJiraIssueUrl(result?.jiraIssueUrl ?? '')
    } catch (err) {
      console.log('[JIRA DEBUG] caught exception err:', err)
      console.log('[JIRA DEBUG] caught exception err.response:', err?.response)
      setSubmitError(err?.response?.data?.message ?? err?.response?.data?.error ?? 'Unable to escalate ticket to Jira')
    } finally {
      console.log('[JIRA DEBUG] finally block executes')
      setIsSubmitting(false)
    }
  }

  async function handleStartAnalysis() {
    setAiError('')
    setIsTyping(true)

    try {
      const result = await analyzeIssue({
        employeeName,
        subject: issueDescription.slice(0, 255),
        issueType,
        priority,
        description: issueDescription,
      })

      if (!result) {
        setAiError(aiUnavailableMessage)
        setHasReceivedFirstResponse(true)
        return
      }

      const formatted = formatAiResponse(result)

      conversationHistory.current = [
        { role: 'user', content: issueDescription },
        { role: 'assistant', content: formatted },
      ]

      setChatMessages([{ role: 'assistant', content: formatted }])
      setHasReceivedFirstResponse(true)
    } catch (err) {
      setChatMessages([{ role: 'assistant', content: aiUnavailableMessage }])
      setHasReceivedFirstResponse(true)
    } finally {
      setIsTyping(false)
    }
  }

  async function handleSendMessage() {
    if (!chatInput.trim() || isTyping) return

    const userMsg = chatInput.trim()
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setChatInput('')
    setIsTyping(true)

    try {
      const updatedHistory = [
        ...conversationHistory.current,
        { role: 'user', content: userMsg },
      ]

      const result = await analyzeIssue({
        employeeName,
        subject: issueDescription.slice(0, 255),
        issueType,
        priority,
        description: issueDescription,
        messages: updatedHistory,
      })

      if (!result) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: aiUnavailableMessage,
          },
        ])
        return
      }

      const formatted = formatAiResponse(result)
      conversationHistory.current = [
        ...updatedHistory,
        { role: 'assistant', content: formatted },
      ]

      setChatMessages((prev) => [...prev, { role: 'assistant', content: formatted }])
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiUnavailableMessage,
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  function formatAiResponse(result) {
    if (result.summary === aiUnavailableMessage || result.solution === aiUnavailableMessage) {
      return aiUnavailableMessage
    }

    let text = ''
    if (result.summary) {
      text += '**\uD83D\uDD0D Problem Summary**\n' + result.summary + '\n\n'
    }
    if (result.rootCause) {
      text += '**\uD83D\uDCCB Root Cause**\n' + result.rootCause + '\n\n'
    }
    if (result.solution) {
      text += '**\uD83D\uDCA1 Suggested Solution**\n' + result.solution + '\n\n'
    }
    if (result.priority) {
      text += '**Priority**\n' + result.priority + '\n\n'
    }
    if (result.confidence) {
      text += '**Confidence**\n' + result.confidence + '\n\n'
    }
    if (result.preventiveRecommendation) {
      text += '**\uD83D\uDEE1\uFE0F Preventive Recommendation**\n' + result.preventiveRecommendation + '\n\n'
    }
    if (result.humanSupportRequired !== undefined) {
      text +=
        '**\uD83D\uDC64 Human Support ' +
        (result.humanSupportRequired ? 'Recommended' : 'Not Required Yet') +
        '**\n'
      text += result.humanSupportRequired
        ? 'This issue may require escalation to a human support team.'
        : 'The AI-assisted troubleshooting may resolve this issue.'
    }
    return text
  }

  return (
    <div className="relative px-6 pb-10 pt-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="bg-enterprise-grid absolute inset-0 opacity-20" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-sm shadow-soft backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#6D5DF6] shadow-[0_0_0_6px_rgba(109,93,246,0.12)]" />
              <span className="font-semibold text-[#0B1F4D]">Infosys Support AI Ticket Management Agent</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#0B1F4D] md:text-4xl">
              Raise a New Support Ticket
            </h1>
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              Fill in the details below. Our AI will analyze your issue, suggest possible solutions, and create a
              support ticket only if the issue remains unresolved.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 transition hover:bg-white/90 sm:inline-flex"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="mt-6">
          <div className="glass-card rounded-3xl border border-white/50 bg-white/55 p-4 shadow-soft backdrop-blur">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {steps.map((s) => {
                const active = s.n === step
                const done = s.n < step
                return (
                  <div
                    key={s.n}
                    className={
                      'rounded-2xl border p-3 transition ' +
                      (active
                        ? 'border-[#007CC3]/50 bg-[#007CC3]/10'
                        : done
                          ? 'border-[#22C55E]/40 bg-[#22C55E]/10'
                          : 'border-white/60 bg-white/40')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            'inline-flex h-8 w-8 items-center justify-center rounded-2xl font-extrabold ' +
                            (active
                              ? 'bg-gradient-to-br from-[#007CC3] to-[#6D5DF6] text-white'
                              : done
                                ? 'bg-[#2563EB]/15 text-[#2563EB]'
                                : 'border border-white/60 bg-white/70 text-slate-700')
                          }
                        >
                          {s.n}
                        </span>
                        <span className="text-sm font-extrabold text-[#0B1F4D]">{s.label}</span>
                      </div>
                      {done ? <CheckCircle2 className="h-4 w-4 text-[#22C55E]" /> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur">
            {step === 1 ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold text-[#0B1F4D]">Fill in the basics</p>
                    <p className="mt-1 text-sm text-slate-600">
                      The AI will not analyze until you click <span className="font-extrabold text-[#0B1F4D]">Next</span>.
                    </p>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 lg:flex">
                    <Sparkles className="h-5 w-5 text-[#007CC3]" />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                    <label className="text-xs font-bold text-slate-600">Employee Name</label>
                    <input
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-extrabold text-[#0B1F4D] outline-none placeholder:text-slate-400 focus:border-[#007CC3]/30 focus:ring-2 focus:ring-[#007CC3]/10"
                    />
                  </div>

                  <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                    <label className="text-xs font-bold text-slate-600">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-extrabold text-[#0B1F4D] outline-none"
                    >
                      <option value="" disabled className="bg-white">
                        Select department
                      </option>
                      {['IT', 'Finance', 'HR', 'Operations', 'Sales', 'Marketing', 'Other'].map((d) => (
                        <option key={d} value={d} className="bg-white">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                    <label className="text-xs font-bold text-slate-600">Issue Type</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-extrabold text-[#0B1F4D] outline-none"
                    >
                      {[
                        'Login Issue',
                        'SAP Issue',
                        'VPN Issue',
                        'Email Issue',
                        'Software Installation',
                        'Network Issue',
                        'Hardware Issue',
                        'Printer Issue',
                        'Other',
                      ].map((it) => (
                        <option key={it} value={it} className="bg-white">
                          {it}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                    <label className="text-xs font-bold text-slate-600">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      required
                      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-extrabold text-[#0B1F4D] outline-none"
                    >
                      {['High', 'Medium', 'Low'].map((p) => (
                        <option key={p} value={p} className="bg-white">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:col-span-2">
                    <label className="text-xs font-bold text-slate-600">Issue Description</label>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={7}
                      className="mt-2 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500"
                      placeholder="Describe your issue in detail."
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Example: I am unable to login to SAP after changing my password this morning.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={onBackToDashboard}
                    className="rounded-3xl border border-white/60 bg-white/70 px-6 py-3 font-extrabold text-[#0B1F4D] transition hover:bg-white/90"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => setStep(2)}
                    className="group inline-flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#007CC3] to-[#6D5DF6] px-8 py-4 font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_18px_50px_rgba(0,124,195,0.25)]"
                  >
                    Continue
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm font-extrabold text-[#0B1F4D]">AI Assistant</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Describe your issue to the AI Assistant.
                    </p>
                  </div>
                  <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/50 bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 lg:flex">
                    <Bot className="h-5 w-5 text-[#007CC3]" />
                  </div>
                </div>

                {aiError ? (
                  <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
                    {aiError}
                  </div>
                ) : null}

                {/* Chat Window */}
                <div className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-gradient-to-r from-[#007CC3]/5 to-[#6D5DF6]/5 px-5 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#007CC3] to-[#6D5DF6]">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-[#0B1F4D]">AI Assistant</p>
                      <p className="text-xs text-slate-500">Powered by Google Gemini</p>
                    </div>
                  </div>

                  <div className="flex h-[420px] flex-col overflow-y-auto px-5 py-4" style={{ scrollBehavior: 'smooth' }}>
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007CC3]/10 border border-[#007CC3]/20">
                            <Sparkles className="h-6 w-6 text-[#007CC3]" />
                          </div>
                          <p className="mt-4 text-sm font-extrabold text-[#0B1F4D]">Ready to analyze your issue</p>
                          <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                            Click "Analyze" below to let AI review your ticket details and provide insights.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                              msg.role === 'user'
                                ? 'bg-[#0B1F4D]'
                                : 'bg-gradient-to-br from-[#007CC3] to-[#6D5DF6]'
                            }`}
                          >
                            {msg.role === 'user' ? (
                              <User className="h-4 w-4 text-white" />
                            ) : (
                              <Bot className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div>
                            <div
                              className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                                msg.role === 'user'
                                  ? 'bg-[#007CC3] text-white rounded-tr-md'
                                  : 'bg-[#F1F5F9] text-slate-800 rounded-tl-md'
                              }`}
                            >
                              {msg.content}
                            </div>
                            <p className={`mt-1 text-[10px] text-slate-400 ${msg.role === 'user' ? 'text-right' : ''}`}>
                              {msg.role === 'user' ? 'You' : 'AI Assistant'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping ? (
                      <div className="mb-4 flex justify-start animate-fadeIn">
                        <div className="flex gap-3 max-w-[85%]">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#007CC3] to-[#6D5DF6]">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="rounded-2xl rounded-tl-md bg-[#F1F5F9] px-5 py-4">
                              <p className="mb-3 text-sm font-extrabold text-[#0B1F4D]">
                                {analysisLoadingMessages[analysisLoadingStep]}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#007CC3]" style={{ animationDelay: '0ms' }} />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#6D5DF6]" style={{ animationDelay: '150ms' }} />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-[#007CC3]" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">AI Assistant is typing...</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-[#E5E7EB] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && chatInput.trim() && !isTyping) {
                            handleSendMessage()
                          }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#007CC3]/30 focus:ring-2 focus:ring-[#007CC3]/10"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (chatInput.trim() && !isTyping) {
                            handleSendMessage()
                          }
                        }}
                        disabled={!chatInput.trim() || isTyping}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#007CC3] to-[#6D5DF6] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setChatMessages([])
                      setHasReceivedFirstResponse(false)
                      setAiError('')
                      setStep(1)
                    }}
                    className="rounded-3xl border border-white/60 bg-white/70 px-6 py-3 font-extrabold text-[#0B1F4D] transition hover:bg-white/90"
                  >
                    Back
                  </button>

                  <div className="flex items-center gap-3">
                    {!hasReceivedFirstResponse ? (
                      <button
                        type="button"
                        onClick={() => handleStartAnalysis()}
                        disabled={isTyping}
                        className="group inline-flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#007CC3] to-[#6D5DF6] px-8 py-4 font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_18px_50px_rgba(0,124,195,0.25)]"
                      >
                        <Sparkles className="h-5 w-5" />
                        Analyze
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={!hasReceivedFirstResponse}
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#007CC3] to-[#6D5DF6] px-8 py-4 font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_18px_50px_rgba(0,124,195,0.25)]"
                    >
                      Continue
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <p className="text-sm font-extrabold text-[#0B1F4D]">Create Ticket</p>
                <p className="mt-1 text-sm text-slate-600">
                  We will ask whether your issue is resolved before creating the ticket.
                </p>

                <div className="mt-5 rounded-3xl border border-white/60 bg-white/70 p-4">
                  <p className="text-sm font-extrabold text-[#0B1F4D]">Ticket creation</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Create and escalate the support ticket only if human help is still needed.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleEscalateToJira()}
                      disabled={isSubmitting}
                      className="rounded-3xl bg-gradient-to-r from-[#007CC3] to-[#6D5DF6] px-6 py-3 font-extrabold text-white transition hover:brightness-110 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Creating Ticket...' : 'Need Human Support'}
                    </button>
                    <button
                      type="button"
                      onClick={onBackToDashboard}
                      className="rounded-3xl border border-white/60 bg-white/70 px-6 py-3 font-extrabold text-[#0B1F4D] transition hover:bg-white/90"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                  {submitMessage ? (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-emerald-600 whitespace-pre-line">{submitMessage}</p>
                      {jiraIssueUrl ? (
                        <a
                          href={jiraIssueUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm font-semibold text-[#007CC3] underline"
                        >
                          Open in Jira
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  {submitError ? <p className="mt-3 text-sm font-semibold text-red-600">{submitError}</p> : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}
