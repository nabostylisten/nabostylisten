"use client";

import { useBearStore } from "@/stores/demo.store";

import { Button } from "./ui/button";

const StoreDemo = () => {
  const bears = useBearStore((state) => state.bears);
  const addABear = useBearStore((state) => state.addABear);

  return (
    <div>
      <p>Bears: {bears}</p>
      <Button onClick={addABear}>Add a bear</Button>
    </div>
  );
};

export default StoreDemo;
