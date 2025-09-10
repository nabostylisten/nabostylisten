"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  FolderIcon,
  FolderOpenIcon,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getServiceCategories } from "@/server/service.actions";

type ServiceCategory = {
  id: string;
  name: string;
  description?: string | null;
  parent_category_id?: string | null;
  children?: ServiceCategory[];
};

interface ServiceCategoryComboboxProps {
  selectedCategories: string[];
  onSelectedCategoriesChange: (categories: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Helper function to build nested category structure
function buildCategoryTree(categories: ServiceCategory[]): ServiceCategory[] {
  const categoryMap = new Map<string, ServiceCategory>();
  const rootCategories: ServiceCategory[] = [];

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
        parent.children!.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

// Helper function to flatten categories for search
function flattenCategories(categories: ServiceCategory[]): ServiceCategory[] {
  const flattened: ServiceCategory[] = [];

  function traverse(cats: ServiceCategory[], depth = 0) {
    cats.forEach((cat) => {
      flattened.push({ ...cat, depth } as ServiceCategory & { depth: number });
      if (cat.children && cat.children.length > 0) {
        traverse(cat.children, depth + 1);
      }
    });
  }

  traverse(categories);
  return flattened;
}

// Helper function to get all category IDs that have children
function getAllCategoryIdsWithChildren(
  categories: ServiceCategory[]
): string[] {
  const idsWithChildren: string[] = [];

  function traverse(cats: ServiceCategory[]) {
    cats.forEach((cat) => {
      if (cat.children && cat.children.length > 0) {
        idsWithChildren.push(cat.id);
        traverse(cat.children);
      }
    });
  }

  traverse(categories);
  return idsWithChildren;
}

interface CategoryItemProps {
  category: ServiceCategory & { depth?: number };
  isSelected: boolean;
  onToggle: (categoryId: string) => void;
  searchValue: string;
  expandedItems: Set<string>;
  onToggleExpanded: (categoryId: string) => void;
  selectedCategories: string[];
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isSelected,
  onToggle,
  searchValue,
  expandedItems,
  onToggleExpanded,
  selectedCategories,
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedItems.has(category.id);
  const depth = category.depth || 0;

  // If there's a search value, show flattened results
  if (searchValue) {
    return (
      <CommandItem
        key={category.id}
        value={`${category.name} ${category.description || ""}`}
        className="flex items-center gap-2 py-2"
        onSelect={() => onToggle(category.id)}
      >
        <Checkbox checked={isSelected} onChange={() => onToggle(category.id)} />
        <div className="flex-1">
          <div className="font-medium">{category.name}</div>
          {category.description && (
            <div className="text-xs text-muted-foreground">
              {category.description}
            </div>
          )}
        </div>
      </CommandItem>
    );
  }

  return (
    <div>
      <CommandItem
        key={category.id}
        value={`${category.name} ${category.description || ""}`}
        className={cn("flex items-center gap-2 py-2", depth > 0 && "ml-6")}
        onSelect={() => onToggle(category.id)}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-4 w-4"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(category.id);
            }}
          >
            {isExpanded ? (
              <FolderOpenIcon className="h-3 w-3" />
            ) : (
              <FolderIcon className="h-3 w-3" />
            )}
          </Button>
        )}
        <Checkbox checked={isSelected} onChange={() => onToggle(category.id)} />
        <div className="flex-1">
          <div className="font-medium">{category.name}</div>
          {category.description && (
            <div className="text-xs text-muted-foreground">
              {category.description}
            </div>
          )}
        </div>
      </CommandItem>

      {hasChildren && isExpanded && (
        <div className="ml-4">
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={{ ...child, depth: depth + 1 }}
              isSelected={selectedCategories.includes(child.id)}
              onToggle={onToggle}
              searchValue={searchValue}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              selectedCategories={selectedCategories}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function ServiceCategoryCombobox({
  selectedCategories,
  onSelectedCategoriesChange,
  placeholder = "Velg kategorier...",
  disabled = false,
}: ServiceCategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Fetch categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["service-categories"],
    queryFn: () => getServiceCategories(),
    select: (data) => data?.data || [],
  });

  const categoryTree = React.useMemo(
    () => buildCategoryTree(categories),
    [categories]
  );
  const flatCategories = React.useMemo(
    () => flattenCategories(categoryTree),
    [categoryTree]
  );

  // Auto-expand all categories by default
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    () => new Set(getAllCategoryIdsWithChildren(categoryTree))
  );

  // Update expanded items when categories change
  React.useEffect(() => {
    setExpandedItems(new Set(getAllCategoryIdsWithChildren(categoryTree)));
  }, [categoryTree]);

  const selectedCategoryNames = React.useMemo(() => {
    return categories
      .filter((cat) => selectedCategories.includes(cat.id))
      .map((cat) => cat.name);
  }, [categories, selectedCategories]);

  const handleToggleCategory = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    onSelectedCategoriesChange(newSelected);
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

  const handleExpandAll = () => {
    setExpandedItems(new Set(getAllCategoryIdsWithChildren(categoryTree)));
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  const displayText =
    selectedCategoryNames.length > 0
      ? selectedCategoryNames.length === 1
        ? selectedCategoryNames[0]
        : `${selectedCategoryNames.length} kategorier valgt`
      : placeholder;

  // Show loading skeleton if categories are still loading
  if (isCategoriesLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 sm:w-96 md:w-[500px] p-0" align="start">
          <Command>
            <div className="flex w-full items-center border-b">
              <CommandInput
                placeholder="Søk kategorier..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex-1 border-0 focus:ring-0 w-full"
              />
              <div className="flex gap-1 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandAll}
                  className="h-8 px-1 sm:px-2 text-xs"
                  type="button"
                >
                  <ChevronDown className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Utvid alle</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapseAll}
                  className="h-8 px-1 sm:px-2 text-xs"
                  type="button"
                >
                  <ChevronUp className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Lukk alle</span>
                </Button>
              </div>
            </div>
            <CommandList>
              <CommandEmpty>Ingen kategorier funnet.</CommandEmpty>
              <CommandGroup>
                {searchValue
                  ? // Show flattened search results
                    flatCategories
                      .filter(
                        (cat) =>
                          cat.name
                            .toLowerCase()
                            .includes(searchValue.toLowerCase()) ||
                          (cat.description &&
                            cat.description
                              .toLowerCase()
                              .includes(searchValue.toLowerCase()))
                      )
                      .map((category) => (
                        <CategoryItem
                          key={category.id}
                          category={category}
                          isSelected={selectedCategories.includes(category.id)}
                          onToggle={handleToggleCategory}
                          searchValue={searchValue}
                          expandedItems={expandedItems}
                          onToggleExpanded={handleToggleExpanded}
                          selectedCategories={selectedCategories}
                        />
                      ))
                  : // Show tree structure
                    categoryTree.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        isSelected={selectedCategories.includes(category.id)}
                        onToggle={handleToggleCategory}
                        searchValue={searchValue}
                        expandedItems={expandedItems}
                        onToggleExpanded={handleToggleExpanded}
                        selectedCategories={selectedCategories}
                      />
                    ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected categories as badges */}
      {selectedCategoryNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryNames.map((name, index) => {
            const categoryId = selectedCategories[index];
            return (
              <Badge
                key={categoryId}
                variant="secondary"
                className="flex items-center justify-between gap-1"
              >
                {name}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(categoryId)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
