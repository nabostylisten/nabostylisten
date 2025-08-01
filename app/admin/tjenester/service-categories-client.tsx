"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  FolderIcon,
  FolderOpenIcon,
  AlertTriangle,
} from "lucide-react";
import { ServiceCategoryForm } from "@/components/service-category-form";
import { deleteServiceCategory } from "@/server/service-category.actions";
import type { Database } from "@/types/database.types";

type ServiceCategory =
  Database["public"]["Tables"]["service_categories"]["Row"];

type CategoryWithChildren = ServiceCategory & { children: ServiceCategory[] };

interface ServiceCategoriesClientProps {
  categories: ServiceCategory[];
}

// Helper function to build nested category structure
function buildCategoryTree(
  categories: ServiceCategory[]
): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>();
  const rootCategories: CategoryWithChildren[] = [];

  // First pass: create map and initialize children arrays
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build the tree structure
  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id)!;

    if (category.parent_category_id) {
      const parent = categoryMap.get(category.parent_category_id);
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

// Helper function to count all descendants of a category
function countDescendants(category: CategoryWithChildren): number {
  let count = 0;
  if (category.children) {
    count += category.children.length;
    category.children.forEach((child) => {
      count += countDescendants(child as CategoryWithChildren);
    });
  }
  return count;
}

interface CategoryItemProps {
  category: CategoryWithChildren;
  depth: number;
  onEdit: (category: ServiceCategory) => void;
  onDelete: (category: ServiceCategory) => void;
  expandedItems: Set<string>;
  onToggleExpanded: (categoryId: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  depth,
  onEdit,
  onDelete,
  expandedItems,
  onToggleExpanded,
}) => {
  const hasChildren = category.children.length > 0;
  const isExpanded = expandedItems.has(category.id);
  const indentLevel = depth * 20;

  return (
    <div>
      <div
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${indentLevel}px` }}
      >
        <div className="flex items-center gap-3 flex-1">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6"
              onClick={() => onToggleExpanded(category.id)}
            >
              {isExpanded ? (
                <FolderOpenIcon className="h-4 w-4" />
              ) : (
                <FolderIcon className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{category.name}</h3>
              {hasChildren && (
                <Badge variant="secondary" className="text-xs">
                  {category.children.length} underkategorier
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(category)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {category.children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child as CategoryWithChildren}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function ServiceCategoriesClient({
  categories,
}: ServiceCategoriesClientProps) {
  const [categoryFormOpen, setCategoryFormOpen] = React.useState(false);
  const [categoryFormMode, setCategoryFormMode] = React.useState<
    "create" | "edit"
  >("create");
  const [selectedCategory, setSelectedCategory] = React.useState<
    ServiceCategory | undefined
  >();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<
    ServiceCategory | undefined
  >();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );

  const categoryTree = React.useMemo(
    () => buildCategoryTree(categories),
    [categories]
  );

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const result = await deleteServiceCategory(categoryId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      // Calculate how many categories were deleted for the success message
      const foundCategory = categoryToDelete
        ? categoryTree.find((c) => c.id === categoryToDelete.id)
        : null;
      const descendantCount = foundCategory
        ? countDescendants(foundCategory)
        : 0;
      const totalCategories = descendantCount + 1;

      const message =
        totalCategories > 1
          ? `${totalCategories} kategorier slettet!`
          : "Kategori slettet!";

      toast.success(message);
      setDeleteDialogOpen(false);
      setCategoryToDelete(undefined);
      // Refresh the page to show updated data
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`Feil ved sletting: ${error.message}`);
    },
  });

  const handleCreateCategory = () => {
    setCategoryFormMode("create");
    setSelectedCategory(undefined);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: ServiceCategory) => {
    setCategoryFormMode("edit");
    setSelectedCategory(category);
    setCategoryFormOpen(true);
  };

  const handleDeleteCategory = (category: ServiceCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleToggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedItems(newExpanded);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const handleFormSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (cats: CategoryWithChildren[]) => {
      cats.forEach((cat) => {
        allIds.add(cat.id);
        if (cat.children.length > 0) {
          collectIds(cat.children as CategoryWithChildren[]);
        }
      });
    };
    collectIds(categoryTree);
    setExpandedItems(allIds);
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={handleCreateCategory}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ny kategori
            </Button>
            <Button variant="outline" onClick={expandAll}>
              Utvid alle
            </Button>
            <Button variant="outline" onClick={collapseAll}>
              Skjul alle
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {categories.length} kategorier totalt
          </div>
        </div>

        {/* Categories display */}
        {categoryTree.length > 0 ? (
          <div className="space-y-2">
            {categoryTree.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                depth={0}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                expandedItems={expandedItems}
                onToggleExpanded={handleToggleExpanded}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderIcon className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Ingen kategorier ennå
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Opprett din første tjenestekategori for å komme i gang.
              </p>
              <Button
                onClick={handleCreateCategory}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Opprett første kategori
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category Form Modal */}
      <ServiceCategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        mode={categoryFormMode}
        category={selectedCategory}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett kategori</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (!categoryToDelete) return null;

                const foundCategory = categoryTree.find(
                  (c) => c.id === categoryToDelete.id
                );
                const descendantCount = foundCategory
                  ? countDescendants(foundCategory)
                  : 0;
                const totalCategories = descendantCount + 1;

                return (
                  <div className="space-y-3">
                    <p>
                      Er du sikker på at du vil slette kategorien{" "}
                      <span className="font-bold">{categoryToDelete.name}</span>
                      ?
                    </p>

                    {descendantCount > 0 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-orange-800 font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Advarsel: Denne
                          handlingen vil slette{" "}
                          <span className="font-bold">
                            {totalCategories} kategorier
                          </span>{" "}
                          totalt:
                        </p>
                        <ul className="mt-2 text-sm text-orange-700">
                          <li>• 1 hovedkategori ({categoryToDelete.name})</li>
                          <li>• {descendantCount} underkategorier</li>
                        </ul>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Denne handlingen kan ikke angres.
                    </p>
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? "Sletter..."
                : (() => {
                    if (!categoryToDelete) return "Slett";
                    const foundCategory = categoryTree.find(
                      (c) => c.id === categoryToDelete.id
                    );
                    const descendantCount = foundCategory
                      ? countDescendants(foundCategory)
                      : 0;
                    const totalCategories = descendantCount + 1;
                    return totalCategories > 1
                      ? `Slett ${totalCategories} kategorier`
                      : "Slett kategori";
                  })()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
