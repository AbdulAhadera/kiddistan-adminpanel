// src/app/admin/(panel)/collections/create-collection-form.jsx
"use client";


import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { createCollection } from "./actions";


export function CreateCollectionForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function handleSubmit(formData) {
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await createCollection(formData);
      setResult(response);
      
      if (response.ok) {
        setIsOpen(false);
      }
    } catch (error) {
      setResult({
        ok: false,
        error: error.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <details 
      className="card-surface group mb-4 overflow-hidden shadow-soft"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.target.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </span>
          
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground">
              Create collection
            </h2>
            
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Create a group, then assign it to products from the product form.
            </p>
          </div>
        </div>
        
        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      
      <form action={handleSubmit} className="border-t border-border px-5 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-foreground"
            >
              Collection name *
            </label>
            
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              placeholder="Example: Summer Sale"
              className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Optional short description for this collection."
              className="flex w-full resize-y rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        </div>
        
        {/* Error message */}
        {result?.error && (
          <div
            role="alert"
            className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {result.error}
          </div>
        )}
        
        {/* Success message */}
        {result?.ok && (
          <div
            role="status"
            className="mt-4 rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          >
            Collection created successfully!
          </div>
        )}
        
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-border accent-primary"
            />
            
            Make collection active
          </label>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create collection"}
          </button>
        </div>
      </form>
    </details>
  );
}