"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Edit, Trash2, FolderIcon, FolderOpenIcon } from "lucide-react";
import { ServiceCategoryForm } from "@/components/service-category-form";
import { deleteServiceCategory } from "@/server/service-category.actions";
import type { Database } from "@/types/database.types";

type ServiceCategory =
  Database["public"]["Tables"]["service_categories"]["Row"];

interface ServiceCategoriesClientProps {
  categories: ServiceCategory[];
}

// Helper function to build nested category structure
function buildCategoryTree(
  categories: ServiceCategory[]
): (ServiceCategory & { children: ServiceCategory[] })[] {
  const categoryMap = new Map<
    string,
    ServiceCategory & { children: ServiceCategory[] }
  >();
  const rootCategories: (ServiceCategory & { children: ServiceCategory[] })[] =
    [];

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

interface CategoryItemProps {
  category: ServiceCategory & { children: ServiceCategory[] };
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
              category={child}
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
        throw new Error(
          typeof result.error === "string" ? result.error : result.error.message
        );
      }
    },
    onSuccess: () => {
      toast.success("Kategori slettet!");
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
    const collectIds = (
      cats: (ServiceCategory & { children: ServiceCategory[] })[]
    ) => {
      cats.forEach((cat) => {
        allIds.add(cat.id);
        if (cat.children.length > 0) {
          collectIds(cat.children);
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
              Er du sikker på at du vil slette kategorien "
              {categoryToDelete?.name}"?
              {categoryToDelete &&
                categoryTree.find((c) => c.id === categoryToDelete.id)?.children
                  .length > 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    Denne kategorien har underkategorier som må slettes først.
                  </span>
                )}
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
