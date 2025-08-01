"use client";

import { useQuery } from "@tanstack/react-query";

const TanstackDemo = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bears"],
    queryFn: () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ message: "Data resolved after 5 seconds" });
        }, 5000);
      }),
  });

  return (
    <div>
      <h1>TanstackDemo</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <p>{JSON.stringify(data)}</p>
    </div>
  );
};

export default TanstackDemo;
