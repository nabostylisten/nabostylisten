"use client";

import * as React from "react";
import { ChevronsUpDown, FolderIcon, FolderOpenIcon } from "lucide-react";

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
  categories: ServiceCategory[];
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

interface CategoryItemProps {
  category: ServiceCategory & { depth?: number };
  isSelected: boolean;
  onToggle: (categoryId: string) => void;
  searchValue: string;
  expandedItems: Set<string>;
  onToggleExpanded: (categoryId: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isSelected,
  onToggle,
  searchValue,
  expandedItems,
  onToggleExpanded,
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
        className={cn("flex items-center gap-2 py-2", depth > 0 && "ml-4")}
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
              isSelected={isSelected}
              onToggle={onToggle}
              searchValue={searchValue}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
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
  categories,
  placeholder = "Velg kategorier...",
  disabled = false,
}: ServiceCategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );

  const categoryTree = React.useMemo(
    () => buildCategoryTree(categories),
    [categories]
  );
  const flatCategories = React.useMemo(
    () => flattenCategories(categoryTree),
    [categoryTree]
  );

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

  const displayText =
    selectedCategoryNames.length > 0
      ? selectedCategoryNames.length === 1
        ? selectedCategoryNames[0]
        : `${selectedCategoryNames.length} kategorier valgt`
      : placeholder;

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
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Søk kategorier..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
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
                className="flex items-center gap-1"
              >
                {name}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => handleToggleCategory(categoryId)}
                >
                  ×
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
