"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  MapPinIcon,
  BriefcaseIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Combobox } from "@headlessui/react";
import { MultiLocationAutocomplete } from "@/components/ui/multi-location-autocomplete";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { PROFESSIONAL_ROLES } from "@/lib/constants";

function MultiSelect({ options, value, onChange, placeholder }: { 
  options: string[], 
  value: string[], 
  onChange: (value: string[]) => void,
  placeholder: string 
}) {
  const [query, setQuery] = useState("");

  const filteredOptions = query === ""
    ? options
    : options.filter((option) =>
        option.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (selectedOption: string) => {
    if (!value.includes(selectedOption)) {
      onChange([...value, selectedOption]);
    }
    setQuery("");
  };

  const handleRemove = (optionToRemove: string) => {
    onChange(value.filter(v => v !== optionToRemove));
  };

  return (
    <div className="relative">
      <Combobox as="div" value={query} onChange={handleSelect}>
        <div 
          className="flex flex-wrap gap-2 p-1 border rounded-md border-gray-300 bg-white min-h-[38px]"
          onClick={() => {
            const input = document.querySelector('[role="combobox"]') as HTMLElement;
            input?.focus();
          }}
        >
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800"
            >
              {item}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          ))}
          <Combobox.Input
            className="border-0 p-1 text-sm focus:ring-0 flex-1 min-w-[100px]"
            placeholder={value.length === 0 ? placeholder : "Add more..."}
            onChange={(event) => setQuery(event.target.value)}
            displayValue={(val: string) => val}
          />
          <Combobox.Button className="hidden">
            <span>Toggle</span>
          </Combobox.Button>
        </div>
        
        <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg shadow-gray-200/60 max-h-60 overflow-auto">
          {filteredOptions.length === 0 && query !== "" ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              Nothing found.
            </div>
          ) : (
            filteredOptions
              .filter(option => !value.includes(option))
              .map((option) => (
                <Combobox.Option
                  key={option}
                  value={option}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-4 pr-4 ${
                      active ? 'bg-blue-600 text-white' : 'text-gray-900'
                    }`
                  }
                >
                  {option}
                </Combobox.Option>
              ))
          )}
        </Combobox.Options>
      </Combobox>
    </div>
  );
}

const jobAlertSchema = z.object({
  name: z.string().min(1, "Alert name is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  locations: z.array(z.string()).min(1, "At least one location is required"),
  frequency: z.enum(["DAILY", "WEEKLY"]),
});

type JobAlertFormData = z.infer<typeof jobAlertSchema>;

interface JobAlert {
  id: string;
  name: string;
  roles: string[];
  locations: string[];
  frequency: "DAILY" | "WEEKLY";
  isActive: boolean;
  lastSent: string | null;
  createdAt: string;
}

export default function JobAlertsPage() {
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);

  const form = useForm<JobAlertFormData>({
    resolver: zodResolver(jobAlertSchema),
    defaultValues: {
      name: "",
      roles: [],
      locations: [],
      frequency: "WEEKLY",
    },
  });

  useEffect(() => {
    fetchJobAlerts();
  }, []);

  const fetchJobAlerts = async () => {
    try {
      const response = await fetch("/api/job-alerts");
      if (!response.ok) throw new Error("Failed to fetch job alerts");
      const alerts = await response.json();
      setJobAlerts(alerts);
    } catch (error) {
      console.error("Error fetching job alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: JobAlertFormData) => {
    try {
      const url = editingAlert ? `/api/job-alerts/${editingAlert.id}` : "/api/job-alerts";
      const method = editingAlert ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save job alert");

      await fetchJobAlerts();
      setShowForm(false);
      setEditingAlert(null);
      form.reset();
    } catch (error) {
      console.error("Error saving job alert:", error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this job alert?")) return;

    try {
      const response = await fetch(`/api/job-alerts/${alertId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete job alert");

      await fetchJobAlerts();
    } catch (error) {
      console.error("Error deleting job alert:", error);
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/job-alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error("Failed to toggle job alert");

      await fetchJobAlerts();
    } catch (error) {
      console.error("Error toggling job alert:", error);
    }
  };

  const startEdit = (alert: JobAlert) => {
    setEditingAlert(alert);
    form.reset({
      name: alert.name,
      roles: alert.roles,
      locations: alert.locations,
      frequency: alert.frequency,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingAlert(null);
    setShowForm(false);
    form.reset();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Job Alerts
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Get notified when new jobs match your criteria
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Alert
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAlert ? "Edit Job Alert" : "Create New Job Alert"}
              </h3>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Alert Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Alert Name
                  </label>
                  <input
                    {...form.register("name")}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Executive Housekeeper in NYC"
                  />
                  {form.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roles <span className="text-red-500">*</span>
                  </label>
                  <MultiSelect
                    options={PROFESSIONAL_ROLES}
                    value={form.watch("roles") || []}
                    onChange={(value) => form.setValue("roles", value)}
                                              placeholder="Select roles you&apos;re interested in..."
                  />
                  {form.formState.errors.roles && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.roles.message}</p>
                  )}
                </div>

                {/* Locations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Locations <span className="text-red-500">*</span>
                  </label>
                  <GoogleMapsLoader>
                    <MultiLocationAutocomplete
                      value={form.watch("locations") || []}
                      onChange={(value) => form.setValue("locations", value)}
                      placeholder="Enter cities and states..."
                    />
                  </GoogleMapsLoader>
                  {form.formState.errors.locations && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.locations.message}</p>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    {...form.register("frequency")}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingAlert ? "Update Alert" : "Create Alert"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Job Alerts List */}
        {jobAlerts.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No job alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first job alert.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Alert
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {jobAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white shadow rounded-lg border-l-4 ${
                  alert.isActive ? "border-green-400" : "border-gray-300"
                }`}
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{alert.name}</h3>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            alert.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {alert.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {alert.frequency.toLowerCase()}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <BriefcaseIcon className="h-4 w-4 mr-1" />
                          <span>{alert.roles.join(", ")}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          <span>{alert.locations.join(", ")}</span>
                        </div>
                      </div>

                      {alert.lastSent && (
                        <p className="mt-2 text-xs text-gray-400">
                          Last sent: {new Date(alert.lastSent).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAlert(alert.id, alert.isActive)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          alert.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {alert.isActive ? "Pause" : "Activate"}
                      </button>
                      <button
                        onClick={() => startEdit(alert)}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 