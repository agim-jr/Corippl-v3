import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const DeleteContentModal = ({ isOpen, onClose, onConfirm, contentTitle }) => {
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
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                  <Dialog.Title className="text-lg font-bold uppercase">
                    Confirm Deletion
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded border border-black hover:bg-black hover:text-white transition"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-4">
                  {/* Warning Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                      Delete Confirmation
                    </label>
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm leading-relaxed">
                      <p className="text-red-800">
                        Are you sure you want to delete{" "}
                        <strong>"{contentTitle}"</strong>?
                      </p>
                    </div>
                  </div>

                  {/* Consequences Warning */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                      What Happens Next
                    </label>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm leading-relaxed">
                      <ul className="list-disc pl-4 space-y-1 text-yellow-800">
                        <li>This content will be permanently deleted</li>
                        <li>All associated analytics data will be lost</li>
                        <li>Any trackable links will stop working</li>
                        <li>This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onConfirm}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded hover:bg-red-700 transition"
                    >
                      Delete Content
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-center items-center">
                    <span className="text-xs text-gray-500">
                      Think twice - this action is permanent
                    </span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

DeleteContentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  contentTitle: PropTypes.string.isRequired,
};

export default DeleteContentModal;
