import React, { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { useApi } from "../lib/api";

const FeedbackForm = ({ onSuccess, standalone = false }) => {
  const { apiFetch } = useApi();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    feedback_type: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  const feedbackTypes = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Support Request" },
    { value: "bug", label: "Report a Bug" },
    { value: "feature", label: "Feature Request" },
    { value: "business", label: "Business Inquiry" },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiFetch("/feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      await response.json();
      setSubmitSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          feedback_type: "general",
        });
        setSubmitSuccess(false);
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div
        className={`text-center ${standalone ? "py-16" : "py-12"} font-mono`}
      >
        <CheckCircle className="w-16 h-16 mx-auto text-black mb-4" />
        <h3 className="text-2xl font-bold text-black mb-2 uppercase">
          Message Sent!
        </h3>
        <p className="text-gray-700">
          Thanks for reaching out. We'll get back to you soon!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-mono">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-600 rounded text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Name & Email Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-black rounded bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-black rounded bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition"
            placeholder="john@example.com"
          />
        </div>
      </div>

      {/* Feedback Type */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
          Type of Inquiry <span className="text-red-600">*</span>
        </label>
        <select
          name="feedback_type"
          value={formData.feedback_type}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-black rounded bg-white text-black focus:ring-2 focus:ring-black focus:border-black outline-none transition"
        >
          {feedbackTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
          Subject <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border-2 border-black rounded bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition"
          placeholder="How can we help you?"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
          Message <span className="text-red-600">*</span>
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows="5"
          className="w-full px-4 py-3 border-2 border-black rounded bg-white text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:border-black outline-none transition resize-none"
          placeholder="Tell us more about your inquiry..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-black text-white rounded border-2 border-black font-bold uppercase text-sm hover:bg-white hover:text-black disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 disabled:hover:text-white transition-all flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default FeedbackForm;
