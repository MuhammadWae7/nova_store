"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TaxonomyService, Section, Category, SizeType } from "@/services/taxonomy-service";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronLeft,
  GripVertical,
  Pencil,
  Check,
  X,
  AlertCircle,
  Layers,
} from "lucide-react";

export default function TaxonomyPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategoryFor, setAddingCategoryFor] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategorySizeType, setNewCategorySizeType] = useState<SizeType>("TOPS");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "section" | "category"; id: string; name: string; productCount?: number } | null>(null);

  // Drag state
  const [dragType, setDragType] = useState<"section" | "category" | null>(null);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const loadSections = useCallback(async () => {
    try {
      const data = await TaxonomyService.getAllSections();
      setSections(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // ── Section CRUD ─────────────────────────────────

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;
    try {
      setError(null);
      await TaxonomyService.createSection(newSectionName.trim());
      setNewSectionName("");
      setShowAddSection(false);
      await loadSections();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateSection = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      setError(null);
      await TaxonomyService.updateSection(id, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      await loadSections();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggleSectionVisibility = async (id: string, currentlyActive: boolean) => {
    try {
      setError(null);
      await TaxonomyService.updateSection(id, { isActive: !currentlyActive });
      await loadSections();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteSection = async (id: string, force = false) => {
    try {
      setError(null);
      await TaxonomyService.deleteSection(id, force);
      setDeleteConfirm(null);
      await loadSections();
    } catch (e: any) {
      // Check if it's a product-count error (409)
      if (e.message.includes("منتج")) {
        const match = e.message.match(/(\d+)/);
        setDeleteConfirm({
          type: "section",
          id,
          name: sections.find((s) => s.id === id)?.name || "",
          productCount: match ? parseInt(match[1]) : undefined,
        });
      } else {
        setError(e.message);
      }
    }
  };

  // ── Category CRUD ────────────────────────────────

  const handleAddCategory = async (sectionId: string) => {
    if (!newCategoryName.trim()) return;
    try {
      setError(null);
      await TaxonomyService.createCategory(newCategoryName.trim(), sectionId, newCategorySizeType);
      setNewCategoryName("");
      setNewCategorySizeType("TOPS");
      setAddingCategoryFor(null);
      await loadSections();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      setError(null);
      await TaxonomyService.updateCategory(id, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      await loadSections();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggleCategoryVisibility = async (id: string, currentlyActive: boolean) => {
    try {
      setError(null);
      await TaxonomyService.updateCategory(id, { isActive: !currentlyActive });
      await loadSections();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteCategory = async (id: string, force = false) => {
    try {
      setError(null);
      await TaxonomyService.deleteCategory(id, force);
      setDeleteConfirm(null);
      await loadSections();
    } catch (e: any) {
      if (e.message.includes("منتج")) {
        const match = e.message.match(/(\d+)/);
        const cat = sections.flatMap((s) => s.categories || []).find((c) => c.id === id);
        setDeleteConfirm({
          type: "category",
          id,
          name: cat?.name || "",
          productCount: match ? parseInt(match[1]) : undefined,
        });
      } else {
        setError(e.message);
      }
    }
  };

  // ── Drag & Drop reorder ──────────────────────────

  const handleDragStart = (index: number, type: "section" | "category", parentSectionId?: string) => {
    dragItem.current = index;
    setDragType(type);
    if (parentSectionId) setDragSectionId(parentSectionId);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    if (dragType === "section") {
      const items = [...sections];
      const draggedItem = items.splice(dragItem.current, 1)[0];
      items.splice(dragOverItem.current, 0, draggedItem);

      const reorderItems = items.map((item, idx) => ({ id: item.id, orderIndex: idx }));
      setSections(items);

      try {
        await TaxonomyService.reorderSections(reorderItems);
        await loadSections();
      } catch (e: any) {
        setError(e.message);
        await loadSections();
      }
    } else if (dragType === "category" && dragSectionId) {
      const section = sections.find((s) => s.id === dragSectionId);
      if (!section?.categories) return;

      const items = [...section.categories];
      const draggedItem = items.splice(dragItem.current, 1)[0];
      items.splice(dragOverItem.current, 0, draggedItem);

      const reorderItems = items.map((item, idx) => ({ id: item.id, orderIndex: idx }));

      // Optimistic update
      setSections((prev) =>
        prev.map((s) => (s.id === dragSectionId ? { ...s, categories: items } : s))
      );

      try {
        await TaxonomyService.reorderCategories(reorderItems);
        await loadSections();
      } catch (e: any) {
        setError(e.message);
        await loadSections();
      }
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setDragType(null);
    setDragSectionId(null);
  };

  const toggleExpanded = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-neutral-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-accent" />
          <h1 className="text-3xl font-bold text-white">الأقسام والتصنيفات</h1>
        </div>
        <Button
          variant="luxury"
          className="gap-2"
          onClick={() => setShowAddSection(true)}
        >
          <Plus className="h-4 w-4" /> إضافة قسم جديد
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="mr-auto text-red-400 hover:text-red-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Section Form */}
      {showAddSection && (
        <div className="rounded-lg border border-accent/30 bg-neutral-900 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="اسم القسم الجديد..."
              className="flex-1 rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-white text-sm placeholder:text-neutral-500 outline-none focus:border-accent/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSection();
                if (e.key === "Escape") setShowAddSection(false);
              }}
            />
            <Button variant="luxury" size="sm" onClick={handleAddSection} disabled={!newSectionName.trim()}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowAddSection(false); setNewSectionName(""); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
          <p className="text-neutral-400">لا توجد أقسام حالياً</p>
          <p className="text-neutral-500 text-sm mt-2">ابدأ بإضافة قسم جديد لتنظيم المنتجات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, sectionIdx) => (
            <div
              key={section.id}
              className={`rounded-lg border bg-neutral-900 transition-colors ${
                section.isActive ? "border-white/10" : "border-yellow-500/20 opacity-70"
              }`}
              draggable
              onDragStart={() => handleDragStart(sectionIdx, "section")}
              onDragEnter={() => handleDragEnter(sectionIdx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 p-4">
                <GripVertical className="h-5 w-5 text-neutral-600 cursor-grab shrink-0" />

                <button
                  onClick={() => toggleExpanded(section.id)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                </button>

                {editingId === `section-${section.id}` ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 rounded-md border border-accent/30 bg-neutral-800 px-3 py-1.5 text-white text-sm outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateSection(section.id);
                        if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateSection(section.id)}>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(null); setEditingName(""); }}>
                      <X className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                ) : (
                  <span className="flex-1 font-medium text-white text-lg">{section.name}</span>
                )}

                {!section.isActive && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">مخفي</span>
                )}

                <span className="text-xs text-neutral-500">
                  {section.categories?.length || 0} تصنيف
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10"
                    onClick={() => {
                      setEditingId(`section-${section.id}`);
                      setEditingName(section.name);
                    }}
                    title="تعديل الاسم"
                  >
                    <Pencil className="h-3.5 w-3.5 text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-white/10"
                    onClick={() => handleToggleSectionVisibility(section.id, section.isActive)}
                    title={section.isActive ? "إخفاء" : "إظهار"}
                  >
                    {section.isActive ? (
                      <Eye className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-yellow-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-500/10"
                    onClick={() => handleDeleteSection(section.id)}
                    title="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </div>

              {/* Categories (expanded) */}
              {expandedSections.has(section.id) && (
                <div className="border-t border-white/5 px-4 pb-4">
                  <div className="mr-8 mt-3 space-y-2">
                    {(section.categories || []).map((cat, catIdx) => (
                      <div
                        key={cat.id}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                          cat.isActive
                            ? "border-white/5 bg-neutral-800/50"
                            : "border-yellow-500/10 bg-yellow-500/5 opacity-70"
                        }`}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(catIdx, "category", section.id);
                        }}
                        onDragEnter={(e) => {
                          e.stopPropagation();
                          handleDragEnter(catIdx);
                        }}
                        onDragEnd={(e) => {
                          e.stopPropagation();
                          handleDragEnd();
                        }}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <GripVertical className="h-4 w-4 text-neutral-600 cursor-grab shrink-0" />

                        {editingId === `category-${cat.id}` ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 rounded border border-accent/30 bg-neutral-800 px-2 py-1 text-sm text-white outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdateCategory(cat.id);
                                if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                              }}
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateCategory(cat.id)}>
                              <Check className="h-3 w-3 text-green-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingId(null); setEditingName(""); }}>
                              <X className="h-3 w-3 text-red-400" />
                            </Button>
                          </div>
                        ) : (
                          <span className="flex-1 text-sm text-neutral-200">{cat.name}</span>
                        )}

                        {!cat.isActive && (
                          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">مخفي</span>
                        )}

                        <span className="text-[11px] text-neutral-500">
                          {(cat as any)._count?.products ?? 0} منتج
                        </span>

                        {/* SizeType badge */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          cat.sizeType === "TOPS" ? "bg-blue-500/10 text-blue-400" :
                          cat.sizeType === "PANTS" ? "bg-purple-500/10 text-purple-400" :
                          cat.sizeType === "SHOES" ? "bg-orange-500/10 text-orange-400" :
                          "bg-neutral-500/10 text-neutral-400"
                        }`}>
                          {cat.sizeType === "TOPS" ? "ملابس علوية" :
                           cat.sizeType === "PANTS" ? "بنطلونات" :
                           cat.sizeType === "SHOES" ? "أحذية" : "مقاس واحد"}
                        </span>

                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(`category-${cat.id}`);
                              setEditingName(cat.name);
                            }}
                          >
                            <Pencil className="h-3 w-3 text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleCategoryVisibility(cat.id, cat.isActive)}
                          >
                            {cat.isActive ? (
                              <Eye className="h-3 w-3 text-green-400" />
                            ) : (
                              <EyeOff className="h-3 w-3 text-yellow-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-red-500/10"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add Category */}
                    {addingCategoryFor === section.id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="اسم التصنيف الجديد..."
                          className="flex-1 rounded border border-white/10 bg-neutral-800 px-3 py-1.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-accent/50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddCategory(section.id);
                            if (e.key === "Escape") { setAddingCategoryFor(null); setNewCategoryName(""); }
                          }}
                        />
                        <select
                          value={newCategorySizeType}
                          onChange={(e) => setNewCategorySizeType(e.target.value as SizeType)}
                          className="rounded border border-white/10 bg-neutral-800 px-2 py-1.5 text-xs text-white outline-none"
                        >
                          <option value="TOPS">ملابس علوية</option>
                          <option value="PANTS">بنطلونات</option>
                          <option value="SHOES">أحذية</option>
                          <option value="ONE_SIZE">مقاس واحد</option>
                        </select>
                        <Button variant="luxury" size="sm" onClick={() => handleAddCategory(section.id)} disabled={!newCategoryName.trim()}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setAddingCategoryFor(null); setNewCategoryName(""); }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingCategoryFor(section.id)}
                        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-accent transition-colors mt-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة تصنيف
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">تأكيد الحذف</h3>
            </div>

            <p className="text-neutral-300 mb-2">
              {deleteConfirm.type === "section" ? "القسم" : "التصنيف"}{" "}
              <strong className="text-white">&quot;{deleteConfirm.name}&quot;</strong>{" "}
              يحتوي على{" "}
              <strong className="text-accent">{deleteConfirm.productCount}</strong>{" "}
              منتج.
            </p>
            <p className="text-neutral-400 text-sm mb-6">
              لا يمكن حذفه نهائياً. يمكنك إخفاءه بدلاً من ذلك المنتجات ستبقى في قاعدة البيانات لكنها لن تظهر في المتجر.
            </p>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                إلغاء
              </Button>
              <Button
                variant="luxury"
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={() => {
                  if (deleteConfirm.type === "section") {
                    handleDeleteSection(deleteConfirm.id, true);
                  } else {
                    handleDeleteCategory(deleteConfirm.id, true);
                  }
                }}
              >
                <EyeOff className="h-4 w-4 ml-2" />
                إخفاء بدلاً من الحذف
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
