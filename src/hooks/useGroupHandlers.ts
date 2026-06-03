import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Group, User } from "../types";
import { apiFetch } from "../lib/api";

type UseGroupHandlersProps = {
  newGroupName: string;
  newGroupColor: string;
  newGroupDesc: string;
  currentUser: User | null;
  setGroups: Dispatch<SetStateAction<Group[]>>;
  setNewGroupName: Dispatch<SetStateAction<string>>;
  setNewGroupDesc: Dispatch<SetStateAction<string>>;
  setIsNewGroupOpen: Dispatch<SetStateAction<boolean>>;
  setActiveCategory: Dispatch<SetStateAction<string>>;
};

export default function useGroupHandlers({
  newGroupName,
  newGroupColor,
  newGroupDesc,
  currentUser,
  setGroups,
  setNewGroupName,
  setNewGroupDesc,
  setIsNewGroupOpen,
  setActiveCategory,
}: UseGroupHandlersProps) {
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGrp: Group = {
      id: `group_${Date.now()}`,
      name: newGroupName.trim(),
      color: newGroupColor,
      description: newGroupDesc.trim() || undefined,
      memberIds: [currentUser?.id || ""],
      ownerId: currentUser?.id || null,
      createdAt: new Date().toISOString(),
    };

    setGroups((prev) => [...prev, newGrp]);
    setNewGroupName("");
    setNewGroupDesc("");
    setIsNewGroupOpen(false);
    setActiveCategory(newGrp.id);

    try {
      await apiFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify(newGrp),
      });
    } catch (err) {
      console.error("Failed to persist new workspace group:", err);
    }
  };

  return {
    handleCreateGroup,
  };
}
