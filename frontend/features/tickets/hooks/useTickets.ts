
"use client";

import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";

import { getTickets } from "../api";

export function useTickets(page: number) {
  return useQuery({
    queryKey: ["tickets", page],

    queryFn: () => getTickets(page),

    placeholderData: keepPreviousData,
  });
}
