// frontend/src/components/SocialProof.jsx

import React, { useEffect, useState } from "react";
import { useApi } from "../lib/api";

const SocialProof = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_content_shares: 0,
    average_shares_per_user: 0,
    successful_cross_promotions: 0,
  });
  const [loading, setLoading] = useState(true);
  const { apiFetch } = useApi();

  const fetchStats = async () => {
    try {
      const response = await apiFetch("/analytics/stats", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex py-20 items-center justify-center">
        <span className="text-gray-400 text-lg font-medium animate-pulse">
          Loading statistics...
        </span>
      </div>
    );
  }

  const statsData = [
    {
      id: 1,
      name: "Total Users",
      value: `${stats.total_users}+`,
      icon: "👥",
    },
    {
      id: 2,
      name: "Content Shares",
      value: stats.total_content_shares,
      icon: "📤",
    },
    {
      id: 3,
      name: "Avg. Shares per User",
      value: stats.average_shares_per_user.toFixed(2),
      icon: "📊",
    },
    {
      id: 4,
      name: "Cross-Promotions",
      value: stats.successful_cross_promotions,
      icon: "🤝",
    },
  ];

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            Trusted by creators worldwide
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Join a thriving community of content creators amplifying their reach
            through Corippl.
          </p>
        </div>
        {/* Stats Grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0.5 bg-gray-100 rounded-t-3xl overflow-hidden">
          {statsData.map((stat, i) => (
            <div
              key={stat.id}
              className="flex flex-col items-center justify-center bg-white p-8 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="text-5xl mb-3">{stat.icon}</div>
              <dd className="text-4xl font-extrabold text-gray-900 mb-2">
                {stat.value}
              </dd>
              <dt className="text-base font-medium text-gray-600">
                {stat.name}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default SocialProof;
