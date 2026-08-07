// frontend/src/components/CollectivesIntelligence.jsx

import React, { useState, useEffect } from "react";
import {
  Brain,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  Settings,
  Play,
  Pause,
  Clock,
  Target,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Moon,
  Sun,
  BarChart3,
  RefreshCw,
  Info,
} from "lucide-react";
import { useApi } from "../lib/api";

export default function CollectivesIntelligence({ groupId }) {
  const api = useApi();

  const [activeTab, setActiveTab] = useState("health");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [availableGroups, setAvailableGroups] = useState([]);

  // Data cache for performance
  const [dataCache, setDataCache] = useState({});
  const [lastFetch, setLastFetch] = useState({});

  // Health data
  const [healthData, setHealthData] = useState(null);

  // Autopilot data
  const [autopilotStatus, setAutopilotStatus] = useState(null);
  const [autopilotSettings, setAutopilotSettings] = useState({
    max_daily_shares: 10,
    max_hourly_shares: 3,
    quiet_hours: {
      enabled: false,
      start: 22,
      end: 6,
    },
    preferred_topics: [],
    excluded_topics: [],
  });

  // Predictions data
  const [predictions, setPredictions] = useState([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Alt + 1,2,3 to switch tabs
      if (e.altKey) {
        if (e.key === "1") setActiveTab("health");
        if (e.key === "2") setActiveTab("autopilot");
        if (e.key === "3") setActiveTab("predictions");
      }
      // Alt + R to refresh
      if (e.altKey && e.key === "r") {
        e.preventDefault();
        loadData();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedGroupId, activeTab]);

  useEffect(() => {
    if (!selectedGroupId) {
      loadAvailableGroups();
    }
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadData();
    }
  }, [selectedGroupId, activeTab]);

  // Helper functions
  const safeJsonParse = async (response) => {
    try {
      return await response.json();
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return null;
    }
  };

  const shouldRefetch = (key) => {
    const lastFetchTime = lastFetch[key];
    if (!lastFetchTime) return true;

    const cacheTimeout = 60000; // 1 minute
    return Date.now() - lastFetchTime > cacheTimeout;
  };

  const updateCache = (key, data) => {
    setDataCache((prev) => ({ ...prev, [key]: data }));
    setLastFetch((prev) => ({ ...prev, [key]: Date.now() }));
  };

  const loadAvailableGroups = async () => {
    try {
      const response = await api.apiFetch("/collectives/dashboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await safeJsonParse(response);
      if (data) {
        setAvailableGroups(data.my_groups || []);

        // Auto-select first group if available
        if (data.my_groups && data.my_groups.length > 0) {
          setSelectedGroupId(data.my_groups[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
      setError("Failed to load available groups");
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "health") {
        await loadHealthData();
      } else if (activeTab === "autopilot") {
        await loadAutopilotData();
      } else if (activeTab === "predictions") {
        await loadPredictions();
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadHealthData = async () => {
    if (!selectedGroupId) return;

    const cacheKey = `health-${selectedGroupId}`;
    if (!shouldRefetch(cacheKey) && dataCache[cacheKey]) {
      setHealthData(dataCache[cacheKey]);
      return;
    }

    try {
      const response = await api.apiFetch(
        `/collectives/intelligence/groups/${selectedGroupId}/health`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await safeJsonParse(response);
      if (data) {
        setHealthData(data);
        updateCache(cacheKey, data);
      }
    } catch (error) {
      console.error("Failed to load health data:", error);
      throw error;
    }
  };

  const loadAutopilotData = async () => {
    const cacheKey = "autopilot";
    if (!shouldRefetch(cacheKey) && dataCache[cacheKey]) {
      setAutopilotStatus(dataCache[cacheKey].status);
      if (dataCache[cacheKey].settings) {
        setAutopilotSettings((prev) => ({
          ...prev,
          ...dataCache[cacheKey].settings,
        }));
      }
      return;
    }

    try {
      const [statusResponse, settingsResponse] = await Promise.all([
        api.apiFetch("/autopilot/status", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        api.getReciprocalAutopilotSettings(),
      ]);

      if (!statusResponse.ok) {
        throw new Error(`HTTP error! status: ${statusResponse.status}`);
      }

      const status = await safeJsonParse(statusResponse);
      if (status) {
        setAutopilotStatus(status);

        const cacheData = { status };
        if (settingsResponse.settings) {
          setAutopilotSettings((prev) => ({
            ...prev,
            ...settingsResponse.settings,
          }));
          cacheData.settings = settingsResponse.settings;
        }

        updateCache(cacheKey, cacheData);
      }
    } catch (error) {
      console.error("Failed to load autopilot data:", error);
      throw error;
    }
  };

  const loadPredictions = async () => {
    if (!selectedGroupId) return;

    const cacheKey = `predictions-${selectedGroupId}`;
    if (!shouldRefetch(cacheKey) && dataCache[cacheKey]) {
      setPredictions(dataCache[cacheKey]);
      return;
    }

    try {
      const healthResponse = await api.apiFetch(
        `/collectives/intelligence/groups/${selectedGroupId}/health`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!healthResponse.ok) {
        throw new Error(`HTTP error! status: ${healthResponse.status}`);
      }

      const healthData = await safeJsonParse(healthResponse);

      if (healthData && healthData.members) {
        const predictionPromises = healthData.members.map(async (member) => {
          try {
            const response = await api.apiFetch(
              `/collectives/intelligence/groups/${selectedGroupId}/users/${member.user_id}/predict`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              },
            );

            if (!response.ok) return null;

            const data = await safeJsonParse(response);
            return data ? { ...data, member } : null;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(predictionPromises);
        const validPredictions = results.filter((r) => r !== null);
        setPredictions(validPredictions);
        updateCache(cacheKey, validPredictions);
      }
    } catch (error) {
      console.error("Failed to load predictions:", error);
      throw error;
    }
  };

  const toggleAutopilot = async () => {
    try {
      await api.toggleReciprocalAutopilot(!autopilotStatus?.enabled);
      // Clear cache to force refresh
      setDataCache((prev) => {
        const newCache = { ...prev };
        delete newCache.autopilot;
        return newCache;
      });
      await loadAutopilotData();
    } catch (error) {
      console.error("Failed to toggle autopilot:", error);
      setError(error.message || "Failed to toggle autopilot");
    }
  };

  const updateAutopilotSettings = async (newSettings) => {
    try {
      await api.updateReciprocalAutopilotSettings(newSettings);
      setAutopilotSettings((prev) => ({ ...prev, ...newSettings }));
      // Clear cache to force refresh
      setDataCache((prev) => {
        const newCache = { ...prev };
        delete newCache.autopilot;
        return newCache;
      });
      await loadAutopilotData();
    } catch (error) {
      console.error("Failed to update settings:", error);
      setError("Failed to update settings");
    }
  };

  const testAutopilot = async () => {
    try {
      const response = await api.triggerAutoReciprocalShare(3);
      alert(`Test completed: ${response.shares_executed || 0} shares executed`);
      // Clear cache to force refresh
      setDataCache((prev) => {
        const newCache = { ...prev };
        delete newCache.autopilot;
        return newCache;
      });
      await loadAutopilotData();
    } catch (error) {
      console.error("Test failed:", error);
      setError(error.message || "Test failed");
    }
  };

  // Show message if no groups available
  if (!selectedGroupId && availableGroups.length === 0 && !loading) {
    return (
      <EmptyState
        icon={Brain}
        title="No Groups Available"
        description="Join a collective to access intelligence features."
      />
    );
  }

  // Show group selector if no group selected
  if (!selectedGroupId && availableGroups.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Select a Group</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className="text-left p-6 rounded-lg border-2 border-gray-200 hover:border-purple-600 hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
            >
              <h3 className="font-bold text-lg mb-2">{group.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{group.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>👥 {group.current_member_count} members</span>
                <span>📅 {group.shares_per_week}x/week</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Collective Intelligence
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh data (Alt+R)"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            {/* Group Switcher */}
            {availableGroups.length > 1 && (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          <TabButton
            active={activeTab === "health"}
            onClick={() => setActiveTab("health")}
            icon={Activity}
            label="Group Health"
            shortcut="Alt+1"
          />

          <TabButton
            active={activeTab === "autopilot"}
            onClick={() => setActiveTab("autopilot")}
            icon={Zap}
            label="Autopilot"
            shortcut="Alt+2"
          />

          <TabButton
            active={activeTab === "predictions"}
            onClick={() => setActiveTab("predictions")}
            icon={TrendingUp}
            label="Predictions"
            shortcut="Alt+3"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tab Content with Animation */}
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            opacity: loading ? 0.6 : 1,
            transform: loading ? "scale(0.98)" : "scale(1)",
          }}
        >
          {loading ? (
            <LoadingSkeleton tab={activeTab} />
          ) : (
            <>
              {activeTab === "health" && <HealthTab data={healthData} />}
              {activeTab === "autopilot" && (
                <AutopilotTab
                  status={autopilotStatus}
                  settings={autopilotSettings}
                  onToggle={toggleAutopilot}
                  onUpdateSettings={updateAutopilotSettings}
                  onTest={testAutopilot}
                />
              )}
              {activeTab === "predictions" && (
                <PredictionsTab predictions={predictions} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function TabButton({ active, onClick, icon: Icon, label, shortcut }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors relative group ${
        active
          ? "bg-white text-purple-600 border-t-2 border-x-2 border-purple-600"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
      title={shortcut}
    >
      <Icon className="w-4 h-4" />
      {label}

      {/* Keyboard shortcut tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {shortcut}
      </div>
    </button>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action && action}
    </div>
  );
}

function LoadingSkeleton({ tab }) {
  if (tab === "health") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (tab === "autopilot") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-gray-200 rounded-lg"></div>
      <div className="h-32 bg-gray-200 rounded-lg"></div>
      <div className="h-32 bg-gray-200 rounded-lg"></div>
      <div className="h-32 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

function Tooltip({ text }) {
  return (
    <div className="group relative inline-block">
      <Info className="w-4 h-4 text-gray-400 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {text}
      </div>
    </div>
  );
}

// ============================================================================
// Tab Components
// ============================================================================

function HealthTab({ data }) {
  if (!data) {
    return (
      <EmptyState
        icon={Activity}
        title="No Health Data"
        description="Health data is not available for this group yet."
      />
    );
  }

  const getHealthColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getHealthBadge = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Overall Health
            </h3>
            <Tooltip text="Group health is calculated based on member activity, completion rates, and engagement levels" />
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(data.health_score)}`}
          >
            {data.health_score}/100 • {getHealthBadge(data.health_score)}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${data.health_score}%` }}
          ></div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={Users}
          label="Active Members"
          value={data.total_members}
          subtitle={`${data.active_members} active in last 30 days`}
          tooltip="Total members vs. members who have completed shares recently"
        />

        <MetricCard
          icon={Calendar}
          label="Completion Rate"
          value={`${data.completion_rate?.toFixed(1)}%`}
          subtitle="Last 30 days"
          tooltip="Percentage of scheduled shares that were completed on time"
        />

        <MetricCard
          icon={TrendingUp}
          label="Avg Engagement"
          value={data.avg_engagement?.toFixed(1)}
          subtitle="Likes + shares per post"
          tooltip="Average engagement (likes and shares) per member post"
        />
      </div>

      {/* Member Performance */}
      {data.members && data.members.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Member Performance
            </h3>
            <Tooltip text="Individual member reliability and activity metrics" />
          </div>
          <div className="space-y-3">
            {data.members.map((member) => (
              <MemberCard
                key={member.user_id}
                member={member}
                getHealthColor={getHealthColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">Attention Needed</h3>
          </div>
          <ul className="space-y-2">
            {data.warnings.map((warning, idx) => (
              <li
                key={idx}
                className="text-sm text-yellow-800 flex items-start gap-2"
              >
                <span className="text-yellow-600 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {data.health_score >= 80 &&
        (!data.warnings || data.warnings.length === 0) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                Your group is performing excellently! Keep up the great work.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, subtitle, tooltip }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-600">{label}</span>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function MemberCard({ member, getHealthColor }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-gray-900">
          {member.username || `User ${member.user_id}`}
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${getHealthColor(member.reliability_score)}`}
        >
          {member.reliability_score}/100
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Completed</div>
          <div className="font-medium text-green-600">
            {member.shares_completed}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Missed</div>
          <div className="font-medium text-red-600">{member.shares_missed}</div>
        </div>
        <div>
          <div className="text-gray-500">Rate</div>
          <div className="font-medium text-gray-900">
            {member.completion_rate?.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

function AutopilotTab({
  status,
  settings,
  onToggle,
  onUpdateSettings,
  onTest,
}) {
  const [editingSettings, setEditingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    setEditingSettings(false);
  };

  const isEligible = status?.eligibility?.eligible ?? false;
  const canEnable = isEligible && !status?.enabled;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div
        className={`rounded-lg p-6 transition-all duration-300 ${status?.enabled ? "bg-green-50 border-2 border-green-200" : "bg-gray-50 border-2 border-gray-200"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full transition-colors ${status?.enabled ? "bg-green-600" : "bg-gray-400"}`}
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Autopilot {status?.enabled ? "Active" : "Inactive"}
              </h3>
              <p className="text-sm text-gray-600">
                {status?.enabled
                  ? "Automatically sharing content on schedule"
                  : "Enable to automate your content sharing"}
              </p>
            </div>
          </div>

          <button
            onClick={onToggle}
            disabled={!canEnable && !status?.enabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              status?.enabled
                ? "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
                : canEnable
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {status?.enabled ? (
              <>
                <Pause className="w-4 h-4" />
                Disable
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Enable
              </>
            )}
          </button>
        </div>

        {/* Eligibility Check */}
        {!isEligible && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">
                  Requirements Not Met
                </h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {status?.eligibility?.reasons?.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Current State */}
        {status?.enabled && status?.current_state && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium text-gray-900">
                  {status.current_state.in_quiet_hours
                    ? "🌙 Quiet Hours"
                    : "⚡ Active"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-gray-500">Today's Shares</div>
                <div className="font-medium text-gray-900">
                  {status.today?.shares_completed || 0} /{" "}
                  {localSettings.max_daily_shares || "∞"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            <Tooltip text="Configure autopilot behavior and limits" />
          </div>
          {!editingSettings ? (
            <button
              onClick={() => setEditingSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLocalSettings(settings);
                  setEditingSettings(false);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Rate Limits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Share Limit
            </label>
            {editingSettings ? (
              <input
                type="number"
                min="1"
                max="20"
                value={localSettings.max_daily_shares || ""}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    max_daily_shares: parseInt(e.target.value) || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="No limit"
              />
            ) : (
              <div className="text-gray-900 font-medium">
                {localSettings.max_daily_shares || "No limit"}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Maximum shares per day (1-20)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Share Limit
            </label>
            {editingSettings ? (
              <input
                type="number"
                min="1"
                max="5"
                value={localSettings.max_hourly_shares || ""}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    max_hourly_shares: parseInt(e.target.value) || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="No limit"
              />
            ) : (
              <div className="text-gray-900 font-medium">
                {localSettings.max_hourly_shares || "No limit"}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Maximum shares per hour (1-5)
            </p>
          </div>

          {/* Quiet Hours */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Quiet Hours
                </label>
                <Tooltip text="Disable sharing during specific hours (e.g., nighttime)" />
              </div>
              {editingSettings && (
                <button
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      quiet_hours: {
                        ...localSettings.quiet_hours,
                        enabled: !localSettings.quiet_hours?.enabled,
                      },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localSettings.quiet_hours?.enabled
                      ? "bg-purple-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.quiet_hours?.enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              )}
              {!editingSettings && (
                <span
                  className={`text-sm font-medium ${localSettings.quiet_hours?.enabled ? "text-purple-600" : "text-gray-500"}`}
                >
                  {localSettings.quiet_hours?.enabled ? "Enabled" : "Disabled"}
                </span>
              )}
            </div>

            {localSettings.quiet_hours?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Start Time
                  </label>
                  {editingSettings ? (
                    <select
                      value={localSettings.quiet_hours?.start || 22}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          quiet_hours: {
                            ...localSettings.quiet_hours,
                            start: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Moon className="w-4 h-4" />
                      {String(localSettings.quiet_hours?.start || 22).padStart(
                        2,
                        "0",
                      )}
                      :00
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    End Time
                  </label>
                  {editingSettings ? (
                    <select
                      value={localSettings.quiet_hours?.end || 6}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          quiet_hours: {
                            ...localSettings.quiet_hours,
                            end: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                      <Sun className="w-4 h-4" />
                      {String(localSettings.quiet_hours?.end || 6).padStart(
                        2,
                        "0",
                      )}
                      :00
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Autopilot won't share during these hours
            </p>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      {status?.performance_stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              30-Day Performance
            </h3>
            <Tooltip text="Your autopilot performance over the last 30 days" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {status.performance_stats.total_scheduled || 0}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {status.performance_stats.completed || 0}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {status.performance_stats.pending || 0}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {status.performance_stats.missed || 0}
              </div>
              <div className="text-sm text-gray-600">Missed</div>
            </div>
          </div>

          {status.performance_stats.completion_rate !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {status.performance_stats.completion_rate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${status.performance_stats.completion_rate}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Button */}
      {status?.enabled && (
        <div className="flex justify-center">
          <button
            onClick={onTest}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Play className="w-5 h-5" />
            Test Autopilot Now
          </button>
        </div>
      )}
    </div>
  );
}

function PredictionsTab({ predictions }) {
  if (!predictions || predictions.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No Predictions Available"
        description="Prediction data will appear once members have sufficient sharing history."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              AI Engagement Predictions
            </h4>
            <p className="text-sm text-blue-800">
              Using exponential smoothing to forecast next share performance
              based on historical data and recent trends.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {predictions.map((pred, idx) => (
          <PredictionCard key={idx} prediction={pred} />
        ))}
      </div>
    </div>
  );
}

function PredictionCard({ prediction: pred }) {
  const getTrendColor = (trend) => {
    if (trend === "increasing") return "text-green-600";
    if (trend === "decreasing") return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = (trend) => {
    if (trend === "increasing") return "📈";
    if (trend === "decreasing") return "📉";
    return "➡️";
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-gray-900">
          {pred.member?.username || `User ${pred.member?.user_id}`}
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-600">
            {pred.predicted_engagement?.toFixed(1)} engagements
          </span>
        </div>
      </div>

      {pred.confidence !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Confidence</span>
            <span className="font-medium text-gray-900">
              {(pred.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pred.confidence * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        {pred.trend && (
          <div className="flex items-center gap-2">
            <span className={getTrendColor(pred.trend)}>
              {getTrendIcon(pred.trend)}
            </span>
            <span className="text-gray-600">
              Trend:{" "}
              <span className={`font-medium ${getTrendColor(pred.trend)}`}>
                {pred.trend}
              </span>
            </span>
          </div>
        )}

        {pred.historical_avg !== undefined && (
          <div className="text-xs text-gray-500">
            Avg: {pred.historical_avg.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}
