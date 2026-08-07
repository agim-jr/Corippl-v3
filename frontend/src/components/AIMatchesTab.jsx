import React, { useState, useEffect } from "react";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import {
  Sparkles,
  Zap,
  Star,
  Clock,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Loader2,
  RefreshCw,
  Brain,
  X,
  AlertCircle,
} from "lucide-react";

const AIMatchesTab = () => {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [selectedHelper, setSelectedHelper] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Safety checks
  const safeAvailableRequests = Array.isArray(availableRequests)
    ? availableRequests
    : [];
  const safeAiSuggestions = Array.isArray(aiSuggestions) ? aiSuggestions : [];

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        const [userData, requestsData] = await Promise.all([
          api.getCurrentUser(),
          fetchAvailableRequests(),
        ]);

        if (isMounted) {
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Failed to initialize AI Matches:", error);
        toast.error("Failed to load data");
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchAvailableRequests = async () => {
    setLoading(true);
    try {
      const response = await api.getQuickConnectBoard();

      // ✅ FIX: Backend returns { results: [...], tier_info: {...} }
      const requests = Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response)
          ? response
          : [];

      setAvailableRequests(requests);
      return requests;
    } catch (error) {
      console.error("❌ Failed to fetch requests:", error);
      toast.error(error.message || "Failed to load requests");
      setAvailableRequests([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAISuggestions = async (requestId) => {
    // Check if current user owns this request
    const request = safeAvailableRequests.find((r) => r.id === requestId);
    if (!request) {
      toast.error("Request not found");
      return;
    }

    if (!currentUser) {
      toast.error("User data not loaded");
      return;
    }

    if (request.requester?.id !== currentUser.id) {
      toast.error("❌ Only the requester can see AI-suggested helpers");
      return;
    }

    setLoading(true);
    setSelectedRequestId(requestId);

    try {
      // ✅ FIX: Use API method instead of hardcoded fetch
      const response = await api.suggestQuickConnectHelpers(requestId, 5);

      const suggestions = Array.isArray(response.suggestions)
        ? response.suggestions
        : [];

      setAiSuggestions(suggestions);

      if (suggestions.length > 0) {
        toast.success(`🤖 Found ${suggestions.length} AI-matched helpers!`);
      } else {
        toast.info("No AI matches found for this request");
      }
    } catch (error) {
      console.error("❌ AI Matching Error:", error);

      if (error.status === 402) {
        toast.error(
          "⚠️ AI helper suggestions require Pro tier. Upgrade to unlock!",
        );
      } else {
        toast.error(error.message || "Failed to get AI suggestions");
      }

      setAiSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactHelper = async () => {
    if (!contactMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!selectedHelper) {
      toast.error("No helper selected");
      return;
    }

    setSendingMessage(true);

    try {
      // Send direct message to the helper
      await api.sendMessage(selectedHelper.id, contactMessage.trim());

      toast.success(
        `✨ Message sent to ${selectedHelper.username}! They'll receive a notification.`,
      );

      setShowContactModal(false);
      setContactMessage("");
      setSelectedHelper(null);
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600 bg-green-50 border-green-300";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-300";
    return "text-gray-600 bg-gray-50 border-gray-300";
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return "🎯";
    if (score >= 60) return "✨";
    if (score >= 40) return "👍";
    return "🤔";
  };

  if (loading && safeAvailableRequests.length === 0) {
    return (
      <div className="w-full px-6 py-20 text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gray-400" />
        <p className="text-lg font-bold text-gray-600">
          Loading AI Matching...
        </p>
      </div>
    );
  }

  // Filter to show only current user's requests
  const myRequests = safeAvailableRequests.filter(
    (request) => currentUser && request.requester?.id === currentUser.id,
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="rounded-none border-y-2 border-gray-300 bg-gradient-to-br from-purple-50 to-blue-50 p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="emoji-3d shrink-0 text-5xl">🤖</div>
            <div className="min-w-0">
              <h3 className="mb-1 flex items-center gap-2 text-2xl font-bold">
                <Sparkles className="h-6 w-6 text-purple-600" />
                AI Helper Suggestions
              </h3>
              <p className="text-gray-600">
                Machine learning finds the best helpers for your requests
              </p>
            </div>
          </div>

          <button
            onClick={fetchAvailableRequests}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-gray-800 disabled:bg-gray-300"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border-2 border-purple-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-purple-600">
              <Brain className="h-5 w-5" />
              <span className="text-sm font-bold">Smart Matching</span>
            </div>
            <p className="text-xs text-gray-600">
              AI analyzes skills, experience, and success rates
            </p>
          </div>

          <div className="rounded-xl border-2 border-blue-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-bold">Score Breakdown</span>
            </div>
            <p className="text-xs text-gray-600">
              See detailed match scores for each helper
            </p>
          </div>

          <div className="rounded-xl border-2 border-green-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-green-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-bold">Response Time</span>
            </div>
            <p className="text-xs text-gray-600">
              Estimated time to get help from each person
            </p>
          </div>
        </div>
      </div>

      {/* Request Selection */}
      {!selectedRequestId && (
        <div className="px-6 sm:px-8 lg:px-10">
          <div className="mb-4 flex items-start gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <AlertCircle className="h-6 w-6 shrink-0 text-blue-600" />
            <div>
              <h4 className="font-bold text-blue-900">Your Requests Only</h4>
              <p className="text-sm text-blue-700">
                AI helper suggestions are available only for requests YOU
                posted. Select one of your requests below to see AI-matched
                helpers.
              </p>
            </div>
          </div>

          {myRequests.length === 0 ? (
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-12 text-center">
              <p className="mb-2 text-xl text-gray-500">
                You haven't posted any requests yet
              </p>
              <p className="text-gray-400">
                Post a request to get AI-powered helper suggestions!
              </p>
            </div>
          ) : (
            <>
              <h4 className="mb-4 text-xl font-bold">
                Your Requests ({myRequests.length})
              </h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {myRequests.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => fetchAISuggestions(request.id)}
                    disabled={loading}
                    className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-purple-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <h5 className="flex-1 text-lg font-bold">
                        {request.title}
                      </h5>
                      <div className="flex items-center gap-1 text-xl font-bold">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        {request.token_reward}
                      </div>
                    </div>

                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                      {request.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium">
                        {request.category}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{request.help_count || 0} offers</span>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* AI Suggestions */}
      {selectedRequestId && (
        <div className="px-6 sm:px-8 lg:px-10">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-xl font-bold">
              🤖 AI-Recommended Helpers ({safeAiSuggestions.length})
            </h4>
            <button
              onClick={() => {
                setSelectedRequestId(null);
                setAiSuggestions([]);
              }}
              className="rounded-xl border-2 border-gray-300 px-4 py-2 font-bold transition hover:border-black"
            >
              ← Back to Your Requests
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" />
              <p className="text-lg font-bold">AI is analyzing helpers...</p>
            </div>
          ) : safeAiSuggestions.length === 0 ? (
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-xl text-gray-500">
                No AI suggestions available for this request
              </p>
              <p className="mt-2 text-gray-400">
                Try adjusting your request details or check back later
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {safeAiSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.helper.id}
                  className={`rounded-2xl border-2 bg-white p-6 transition-all ${
                    index === 0
                      ? "border-purple-400 shadow-xl"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  {/* Helper Header */}
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {index < 3 && (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 text-2xl">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>
                      )}

                      <div>
                        <h5 className="mb-1 text-xl font-bold">
                          {suggestion.helper.username}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {suggestion.relevant_experience}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`mb-1 rounded-full border-2 px-4 py-2 text-2xl font-bold ${getScoreColor(suggestion.match_score)}`}
                      >
                        {getScoreEmoji(suggestion.match_score)}{" "}
                        {suggestion.match_score}%
                      </div>
                      <span className="text-xs text-gray-500">Match Score</span>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="mb-4 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-purple-700">
                      <Sparkles className="h-5 w-5" />
                      <span className="text-sm font-bold">AI Analysis</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {suggestion.reasoning}
                    </p>
                  </div>

                  {/* Score Breakdown */}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {Object.entries(suggestion.score_breakdown).map(
                      ([key, value]) => {
                        if (key === "total_score") return null;
                        return (
                          <div
                            key={key}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center"
                          >
                            <div className="mb-1 text-lg font-bold">
                              {Math.round(value)}
                            </div>
                            <div className="text-xs text-gray-600">
                              {key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Response Time */}
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Estimated response: {suggestion.estimated_response_time}
                    </span>
                  </div>

                  {/* Contact Button */}
                  <button
                    onClick={() => {
                      setSelectedHelper(suggestion.helper);
                      setShowContactModal(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 font-bold text-white shadow-lg transition hover:from-purple-700 hover:to-blue-700"
                  >
                    <MessageSquare className="h-5 w-5" />
                    Contact {suggestion.helper.username}
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedHelper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border-4 border-gray-900 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b-4 border-gray-900 bg-gradient-to-r from-purple-500 to-blue-500 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-2xl font-bold text-white">
                    ✉️ Contact {selectedHelper.username}
                  </h3>
                  <p className="text-purple-100">
                    Reach out to discuss your request
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setContactMessage("");
                    setSelectedHelper(null);
                  }}
                  className="rounded-xl bg-white/20 p-2 text-white transition hover:bg-white/30"
                  disabled={sendingMessage}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Your Message
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Hi! I saw your profile matches my request. Would you be interested in helping with..."
                className="mb-4 w-full rounded-xl border-2 border-gray-300 p-4 focus:border-purple-500 focus:outline-none"
                rows={6}
                disabled={sendingMessage}
              />

              <div className="mb-4 rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-gray-700">
                  💡 <strong>Tip:</strong> Introduce yourself, mention why this
                  helper is a great match, and explain what you need!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setContactMessage("");
                    setSelectedHelper(null);
                  }}
                  className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold transition hover:border-black"
                  disabled={sendingMessage}
                >
                  Cancel
                </button>
                <button
                  onClick={handleContactHelper}
                  disabled={sendingMessage || !contactMessage.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-3 font-bold text-white transition hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-5 w-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMatchesTab;
