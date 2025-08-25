"use client";

import { ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

const GoToCartToastAction = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/handlekurv")}
    >
      Til handlekurv <ChevronRight className="w-4 h-4" />
    </Button>
  );
};

export default GoToCartToastAction;
