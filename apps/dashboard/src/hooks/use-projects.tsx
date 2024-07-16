import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UseDeleteProjectResult {
  deleteProject: (projectId: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

function getCookie(name: string): string | null {
  const nameLenPlus = name.length + 1;
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .filter((cookie) => cookie.substring(0, nameLenPlus) === `${name}=`)
      .map((cookie) => decodeURIComponent(cookie.substring(nameLenPlus)))[0] ||
    null
  );
}

export function useDeleteProject(): UseDeleteProjectResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter(); // Assuming useToast is a custom hook provided by your application

  const deleteProject = async (projectId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const cookieValue = getCookie("stack-access");
      if (!cookieValue) {
        throw new Error("Access token not found");
      }

      // Parse the cookie value
      const parsedCookie = JSON.parse(cookieValue);
      const accessToken = parsedCookie[1]; // The token is the second item in the array

      const response = await fetch("/api/v1/projects", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete project");
      }
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      router.replace("/projects")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteProject, isDeleting, error };
}
