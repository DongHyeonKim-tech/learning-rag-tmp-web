import { UserStateType, UserType } from "@/app/Interface";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist<UserStateType>(
    (set) => ({
      user: {},
      isLoading: false,
      error: null,
      updateUser: (user: UserType) => set((prev) => ({ ...prev, user })),
    }),
    {
      name: "user",
    }
  )
);
