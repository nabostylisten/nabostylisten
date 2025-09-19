"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  deleteServiceCategory,
  getAllServiceCategories,
} from "@/server/service-category.actions";
import type { Database } from "@/types/database.types";

type ServiceCategory =
  Database["public"]["Tables"]["service_categories"]["Row"];

type CategoryWithChildren = ServiceCategory & { children: ServiceCategory[] };

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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-0"
        style={{ marginLeft: `${indentLevel}px` }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 flex-shrink-0"
              onClick={() => onToggleExpanded(category.id)}
            >
              {isExpanded ? (
                <FolderOpenIcon className="h-4 w-4" />
              ) : (
                <FolderIcon className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium break-words">{category.name}</h3>
              {hasChildren && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {category.children.length} underkategorier
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-start flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category)}
            className="flex items-center gap-2 justify-center w-full sm:w-auto"
          >
            <Edit className="w-4 h-4" />
            <span>Rediger</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(category)}
            className="flex items-center gap-2 justify-center w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Slett</span>
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

export function ServiceCategoriesClient() {
  const queryClient = useQueryClient();
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

  // Fetch categories with TanStack Query
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const result = await getAllServiceCategories();
      if (result.error) {
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
      return result.data || [];
    },
  });

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
      // Invalidate the query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
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
    // Invalidate the query to refetch the updated data
    queryClient.invalidateQueries({ queryKey: ["service-categories"] });
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleCreateCategory}
              className="flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Ny kategori
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={expandAll}
                className="flex-1 sm:flex-initial"
              >
                Utvid alle
              </Button>
              <Button
                variant="outline"
                onClick={collapseAll}
                className="flex-1 sm:flex-initial"
              >
                Skjul alle
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-center sm:text-right">
            {categories.length} kategorier totalt
          </div>
        </div>

        {/* Categories display */}
        {error ? (
          // Error state with red card
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">
                Kunne ikke laste kategorier
              </h3>
              <p className="text-red-700 dark:text-red-300 text-center mb-4 max-w-md">
                Det oppstod en feil ved lasting av tjenestekategorier. Vennligst
                prøv på nytt.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["service-categories"],
                    })
                  }
                >
                  Prøv på nytt
                </Button>
                <Button
                  onClick={handleCreateCategory}
                  className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Opprett kategori likevel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          // Loading skeleton matching the category layout
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-6 w-6 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-5 w-32" />
                      {index % 2 === 0 && (
                        <Skeleton className="h-4 w-24 flex-shrink-0" />
                      )}
                    </div>
                    {index % 3 === 0 && <Skeleton className="h-4 w-48 mt-1" />}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-start flex-shrink-0">
                  <Skeleton className="h-8 w-full sm:w-20" />
                  <Skeleton className="h-8 w-full sm:w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : categoryTree.length > 0 ? (
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
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <p className="text-orange-800 dark:text-orange-200 font-medium flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="flex items-center gap-2 flex-shrink-0">
                            <AlertTriangle className="w-4 h-4" /> Advarsel:
                          </span>
                          <span className="break-words">
                            Denne handlingen vil slette{" "}
                            <span className="font-bold">
                              {totalCategories} kategorier
                            </span>{" "}
                            totalt:
                          </span>
                        </p>
                        <ul className="mt-2 text-sm text-orange-700 dark:text-orange-300 space-y-1">
                          <li className="break-words">
                            • 1 hovedkategori ({categoryToDelete.name})
                          </li>
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
