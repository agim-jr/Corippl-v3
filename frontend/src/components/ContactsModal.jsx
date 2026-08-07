// frontend/src/components/ContactsModal.jsx

import React, { Fragment, useState, useEffect, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { useApi } from "../lib/api";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const ContactsModal = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("add");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);

  const { createContact, bulkCreateContacts, fetchContacts, deleteContact } =
    useApi();

  const hasPremiumAccess = () =>
    user?.is_premium === true || user?.is_ai_tier === true;

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      const data = await fetchContacts();
      setContacts(data);
    } catch (err) {
      toast.error("Failed to load contacts");
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createContact({ name, email });
      setName("");
      setEmail("");
      toast.success("Contact added!");
      await loadContacts();

      // ✅ Notify other components that contacts were updated
      window.dispatchEvent(new Event("contactsUpdated"));
    } catch (err) {
      toast.error(err.message || "Failed to add contact");
    }

    setLoading(false);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();

    if (!hasPremiumAccess()) {
      toast.error("Bulk upload requires Premium or AI subscription");
      return;
    }

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);

    try {
      await bulkCreateContacts(file);
      setFile(null);
      toast.success("Contacts uploaded!");
      await loadContacts();

      // ✅ Notify other components that contacts were updated
      window.dispatchEvent(new Event("contactsUpdated"));
    } catch (err) {
      toast.error(err.message || "Upload failed");
    }

    setLoading(false);
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm("Delete this contact?")) return;

    try {
      await deleteContact(contactId);
      toast.success("Contact deleted");
      await loadContacts();

      // ✅ Notify other components that contacts were updated
      window.dispatchEvent(new Event("contactsUpdated"));
    } catch (err) {
      toast.error("Failed to delete contact");
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-mono" onClose={onClose}>
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
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded border-2 border-black bg-white text-black shadow-lg transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-gray-50">
                  <Dialog.Title className="text-lg font-bold uppercase">
                    Contacts
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded border border-black hover:bg-black hover:text-white transition"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("add")}
                      className={`px-4 py-2 text-sm font-medium rounded border transition ${
                        activeTab === "add"
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Add Contact
                    </button>
                    <button
                      onClick={() => setActiveTab("list")}
                      className={`px-4 py-2 text-sm font-medium rounded border transition ${
                        activeTab === "list"
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      View Contacts ({contacts.length})
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-4 max-h-96 overflow-y-auto">
                  {activeTab === "add" && (
                    <>
                      {/* Individual Add */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                          Add Individual Contact
                        </label>
                        <form
                          onSubmit={handleAddContact}
                          className="p-3 bg-gray-50 border border-gray-200 rounded space-y-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Name"
                              required
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
                            />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Email"
                              required
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 disabled:opacity-50 transition"
                          >
                            {loading ? "Adding..." : "Add Contact"}
                          </button>
                        </form>
                      </div>

                      {/* Bulk Upload */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                          Bulk Upload (Premium/AI)
                        </label>
                        <form
                          onSubmit={handleBulkUpload}
                          className="p-3 bg-gray-50 border border-gray-200 rounded space-y-3"
                        >
                          <input
                            type="file"
                            accept=".csv,.json"
                            onChange={(e) => setFile(e.target.files[0])}
                            disabled={!hasPremiumAccess()}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black transition disabled:opacity-50 file:mr-4 file:py-1 file:px-3 file:rounded file:border file:border-gray-300 file:bg-gray-50 file:text-sm hover:file:bg-gray-100"
                          />
                          <p className="text-xs text-gray-500">
                            CSV: name,email | JSON: [
                            {`{"name":"...", "email":"..."}`}]
                          </p>
                          <button
                            type="submit"
                            disabled={loading || !hasPremiumAccess()}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-black border border-black rounded hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
                          >
                            {!hasPremiumAccess() ? (
                              "🔒 Premium Required"
                            ) : loading ? (
                              "Uploading..."
                            ) : (
                              <>
                                <ArrowUpTrayIcon className="h-4 w-4" />
                                Upload Contacts
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </>
                  )}

                  {activeTab === "list" && (
                    <div>
                      {contacts.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500 mb-3">
                            No contacts yet
                          </p>
                          <button
                            onClick={() => setActiveTab("add")}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                          >
                            Add Your First Contact
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-600">
                                  Name
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-600">
                                  Email
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-bold uppercase text-gray-600">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {contacts.map((contact, idx) => (
                                <tr
                                  key={contact.id}
                                  className={
                                    idx % 2 ? "bg-white" : "bg-gray-50"
                                  }
                                >
                                  <td className="px-4 py-2 text-sm font-medium">
                                    {contact.name}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700">
                                    {contact.email}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button
                                      onClick={() => handleDelete(contact.id)}
                                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <span className="text-xs text-gray-500">
                    {contacts.length} contact{contacts.length !== 1 && "s"}{" "}
                    total
                  </span>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ContactsModal;
