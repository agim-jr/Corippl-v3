"use client";

import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function FlagContentModal({ isOpen, onClose, onSubmit }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (reason.trim()) {
      onSubmit(reason);
      setReason("");
    }
  };

  const handleTextareaKeyDown = (e) => {
    e.stopPropagation();

    if (e.key === " ") {
      return;
    }

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    e.stopPropagation();
    setReason(e.target.value);
  };

  const handleTextareaClick = (e) => {
    e.stopPropagation();
  };

  const handleFormClick = (e) => {
    e.stopPropagation();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-mono" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-70"
          leave="ease-in duration-200"
          leaveFrom="opacity-70"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        {/* Container */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="relative w-full max-w-lg transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all"
                onClick={handleFormClick}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                  <Dialog.Title className="text-lg font-bold uppercase">
                    Flag Content
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="p-2 rounded border border-black hover:bg-black hover:text-white transition"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} onClick={handleFormClick}>
                  <div className="px-6 py-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                        Reason for flagging this content
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <textarea
                          className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-black focus:border-black transition resize-none bg-white"
                          value={reason}
                          onChange={handleTextareaChange}
                          onKeyDown={handleTextareaKeyDown}
                          onClick={handleTextareaClick}
                          rows={4}
                          required
                          placeholder="Please describe why this content should be flagged..."
                          autoFocus
                          autoComplete="off"
                          spellCheck="true"
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to submit
                          quickly
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Reports are reviewed by our moderation team
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          onClick={(e) => e.stopPropagation()}
                          disabled={!reason.trim()}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          Flag Content
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

FlagContentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
