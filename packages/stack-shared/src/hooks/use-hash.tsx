import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const getHash = () => typeof window === "undefined" ? undefined : window.location.hash.substring(1);
export const useHash = () => {
  const params = useParams();
  const [hash, setHash] = useState(getHash());
  useEffect(() => setHash(getHash()), [params]);
  return hash;
};
