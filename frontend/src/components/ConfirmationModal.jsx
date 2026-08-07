import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  onConfirm,
}) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-mono" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-75"
          leave="ease-in duration-150"
          leaveFrom="opacity-75"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>
        {/* Panel */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl border border-black bg-white shadow-2xl transition-all font-mono">
                {/* Close Button */}
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    className="p-2 rounded border border-black bg-white text-black hover:bg-black hover:text-white transition focus:outline-none focus:ring-2 focus:ring-black"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-col items-center justify-center px-8 pt-10 pb-6 text-center">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-black bg-white mb-4">
                    <svg
                      className="h-7 w-7 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  {/* Title */}
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-black mb-2 font-mono"
                  >
                    {title}
                  </Dialog.Title>
                  {/* Description */}
                  <p className="text-base text-gray-700 font-mono mb-2">
                    {description}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="px-8 pb-8 flex flex-col sm:flex-row-reverse gap-2">
                  <button
                    type="button"
                    className="inline-flex w-full sm:w-auto justify-center rounded border border-black bg-red-600 px-4 py-2 text-base font-bold text-white font-mono shadow-sm hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black transition"
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full sm:w-auto justify-center rounded border border-black bg-white px-4 py-2 text-base font-bold text-black font-mono shadow-sm hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black transition"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmationModal;
